const assertEquals = (actual: unknown, expected: unknown) => {
  if (actual !== expected)
    throw new Error(
      `Expected ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`,
    );
};
const handlers: ((request: Request) => Response | Promise<Response>)[] = [];
const originalServe = Deno.serve;
Deno.serve = ((handler: (request: Request) => Response | Promise<Response>) => {
  handlers.push(handler);
  return {};
}) as unknown as typeof Deno.serve;
try {
  await import("./index.ts");
  await import("../xero-callback/index.ts");
} finally {
  Deno.serve = originalServe;
}
const [admin, callback] = handlers;
Deno.test(
  "admin rejects unauthenticated and cross-origin requests without database or external access",
  async () => {
    const password = Deno.env.get("ADMIN_PASSWORD");
    const origin = Deno.env.get("PUBLIC_APP_URL");
    const nativeFetch = globalThis.fetch;
    let outbound = 0;
    globalThis.fetch = () => {
      outbound++;
      return Promise.reject(new Error("External requests forbidden"));
    };
    Deno.env.set("ADMIN_PASSWORD", "local-test-only");
    Deno.env.set("PUBLIC_APP_URL", "https://www.sfsaunarental.com");
    try {
      assertEquals(
        (
          await admin(
            new Request("https://backend.invalid", {
              method: "POST",
              body: "{}",
            }),
          )
        ).status,
        401,
      );
      assertEquals(
        (
          await admin(
            new Request("https://backend.invalid", {
              method: "POST",
              headers: {
                Origin: "https://attacker.invalid",
                "x-admin-password": "local-test-only",
              },
              body: "{}",
            }),
          )
        ).status,
        403,
      );
      assertEquals(
        (await admin(new Request("https://backend.invalid"))).status,
        405,
      );
      Deno.env.delete("ADMIN_PASSWORD");
      assertEquals(
        (
          await admin(
            new Request("https://backend.invalid", {
              method: "POST",
              headers: { "x-admin-password": "local-test-only" },
              body: "{}",
            }),
          )
        ).status,
        401,
      );
      assertEquals(outbound, 0);
    } finally {
      globalThis.fetch = nativeFetch;
      if (password === undefined) Deno.env.delete("ADMIN_PASSWORD");
      else Deno.env.set("ADMIN_PASSWORD", password);
      if (origin === undefined) Deno.env.delete("PUBLIC_APP_URL");
      else Deno.env.set("PUBLIC_APP_URL", origin);
    }
  },
);
Deno.test(
  "callback refuses malformed state and unsupported methods before any token exchange",
  async () => {
    for (const url of [
      "https://backend.invalid",
      "https://backend.invalid?state=bad&code=code",
    ]) {
      const response = await callback(new Request(url));
      assertEquals(response.status, 400);
      assertEquals(response.headers.get("Location"), null);
      assertEquals(response.headers.get("Cache-Control"), "no-store");
      assertEquals(response.headers.get("Referrer-Policy"), "no-referrer");
    }
    assertEquals(
      (
        await callback(
          new Request("https://backend.invalid", { method: "POST" }),
        )
      ).status,
      405,
    );
  },
);

Deno.test("canonical production origin is permitted and alternate origins are rejected", async () => {
  const previous = Deno.env.get("PUBLIC_APP_URL");
  Deno.env.set("PUBLIC_APP_URL", "https://www.sfsaunarental.com");
  try {
    const allowed = await admin(new Request("https://backend.invalid", {
      method: "OPTIONS", headers: { Origin: "https://www.sfsaunarental.com" },
    }));
    assertEquals(allowed.status, 200);
    assertEquals(allowed.headers.get("Access-Control-Allow-Origin"), "https://www.sfsaunarental.com");
    for (const origin of ["https://sfsaunarental.com", "https://attacker.invalid"]) {
      assertEquals((await admin(new Request("https://backend.invalid", {
        method: "OPTIONS", headers: { Origin: origin },
      }))).status, 403);
    }
    Deno.env.set("PUBLIC_APP_URL", "https://sfsaunarental.com");
    const canonical = await admin(new Request("https://backend.invalid", {
      method: "OPTIONS", headers: { Origin: "https://www.sfsaunarental.com" },
    }));
    assertEquals(canonical.status, 200);
    assertEquals(canonical.headers.get("Access-Control-Allow-Origin"), "https://www.sfsaunarental.com");
  } finally {
    if (previous === undefined) Deno.env.delete("PUBLIC_APP_URL");
    else Deno.env.set("PUBLIC_APP_URL", previous);
  }
});
Deno.test("authenticated malformed JSON shapes return 400 without database access", async () => {
  const previous = Deno.env.get("ADMIN_PASSWORD");
  Deno.env.set("ADMIN_PASSWORD", "local-test-only");
  try {
    for (const body of ["null", "[]", "123", '{"action":"write"}', '{"action":"select_tenant","tenantId":3}']) {
      assertEquals((await admin(new Request("https://backend.invalid", {
        method: "POST", headers: { "x-admin-password": "local-test-only" }, body,
      }))).status, 400);
    }
  } finally {
    if (previous === undefined) Deno.env.delete("ADMIN_PASSWORD");
    else Deno.env.set("ADMIN_PASSWORD", previous);
  }
});

// tracking_sample is a recognized action: it passes input validation and fails
// safely (503 without credentials, 502 when the backend/token read is unavailable).
// External requests are mocked out so the test can never reach Xero or the database.
// Sanitizers off: the database client starts long-lived internals on the failure path.
Deno.test({ name: "tracking_sample passes validation and fails safely without external access", sanitizeOps: false, sanitizeResources: false, fn: async () => {
  const previous = Deno.env.get("ADMIN_PASSWORD");
  Deno.env.set("ADMIN_PASSWORD", "local-test-only");
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error("External requests forbidden"));
  try {
    const response = await admin(new Request("https://backend.invalid", {
      method: "POST",
      headers: { "x-admin-password": "local-test-only" },
      body: '{"action":"tracking_sample"}',
    }));
    if (![502, 503].includes(response.status))
      throw new Error(`tracking_sample did not fail safely: ${response.status}`);
    const body = await response.json();
    if (typeof body?.error !== "string") throw new Error("Expected a safe error body");
  } finally {
    globalThis.fetch = nativeFetch;
    if (previous === undefined) Deno.env.delete("ADMIN_PASSWORD");
    else Deno.env.set("ADMIN_PASSWORD", previous);
  }
} });
