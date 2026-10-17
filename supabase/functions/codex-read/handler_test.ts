import {
  type Config,
  createHandler,
  type Dependencies,
  hashCredential,
} from "./handler.ts";
import { projectXero } from "./projection.ts";
function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}
const key = `sfcr_${"a".repeat(43)}`; // Test-only credential; never installed.
const tenant = "00000000-0000-0000-0000-000000000001";
const clock = Date.parse("2026-10-17T00:00:00Z");
async function setup(overrides: Partial<Dependencies> = {}) {
  let calls = 0;
  const config: Config = {
    keyHash: await hashCredential(key),
    expiresAt: "2026-10-18T00:00:00Z",
    tenantId: tenant,
  };
  const deps: Dependencies = {
    config: () => config,
    now: () => clock,
    inventory: async (offset) => {
      calls++;
      return { offset };
    },
    customers: async (offset) => {
      calls++;
      return { offset };
    },
    xero: async (resource, page, tenantId) => {
      calls++;
      return { resource, page, tenantId };
    },
    ...overrides,
  };
  return { handler: createHandler(deps), config, calls: () => calls };
}
function req(
  body: unknown = { action: "status" },
  extra: Record<string, string> = {},
  url = "https://backend.invalid",
) {
  return new Request(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...extra,
    },
    body: JSON.stringify(body),
  });
}
Deno.test("missing, malformed and incorrect credentials cannot reach dependencies", async () => {
  const s = await setup();
  for (
    const authorization of ["", "Bearer bad", `Bearer sfcr_${"b".repeat(43)}`]
  ) {
    equal(
      (await s.handler(
        req({ action: "inventory", offset: 0 }, { authorization }),
      )).status,
      401,
    );
  }
  equal(s.calls(), 0);
});
Deno.test("missing, invalid or expired configuration fails closed", async () => {
  const s = await setup();
  for (
    const expiresAt of [undefined, "invalid", new Date(clock).toISOString()]
  ) {
    s.config.expiresAt = expiresAt;
    equal((await s.handler(req())).status, 503);
  }
  s.config.expiresAt = "2026-10-18T00:00:00Z";
  s.config.tenantId = "";
  equal((await s.handler(req())).status, 503);
  equal(s.calls(), 0);
});
Deno.test("browser origins, preflight, GET and query credentials are denied", async () => {
  const s = await setup();
  equal(
    (await s.handler(req({}, { origin: "https://sfsaunarental.com" }))).status,
    403,
  );
  equal(
    (await s.handler(
      new Request("https://backend.invalid", { method: "OPTIONS" }),
    )).status,
    405,
  );
  equal((await s.handler(new Request("https://backend.invalid"))).status, 405);
  equal(
    (await s.handler(req({}, {}, "https://backend.invalid?key=bad"))).status,
    400,
  );
  equal(s.calls(), 0);
});
Deno.test("write actions, arbitrary resources, URLs, SQL and tenant overrides are rejected", async () => {
  const s = await setup();
  for (
    const body of [
      { action: "import" },
      { action: "create_customer" },
      { action: "start" },
      { action: "select_tenant" },
      { action: "inventory", offset: 0, sql: "select *" },
      { action: "xero_sample", resource: "BankTransactions", page: 1 },
      { action: "xero_sample", resource: "https://attacker.invalid", page: 1 },
      {
        action: "xero_sample",
        resource: "Invoices",
        page: 1,
        tenantId: "other",
      },
      { action: "xero_sample", resource: "Invoices", page: 4 },
      { action: "customers", offset: -1 },
      { action: "customers", offset: 5001 },
    ]
  ) equal((await s.handler(req(body))).status, 400);
  equal(s.calls(), 0);
});
Deno.test("bounded actions use pinned organization and fixed parameter types", async () => {
  const s = await setup();
  for (const action of ["inventory", "customers"]) {
    equal((await s.handler(req({ action, offset: 0 }))).status, 200);
  }
  const response = await s.handler(
    req({ action: "xero_sample", resource: "Invoices", page: 2 }),
  );
  equal(response.status, 200);
  equal((await response.json()).data, {
    resource: "Invoices",
    page: 2,
    tenantId: tenant,
  });
  equal(response.headers.get("cache-control"), "no-store");
  equal(response.headers.get("access-control-allow-origin"), null);
  equal(s.calls(), 3);
});
Deno.test("oversized or invalid bodies are rejected before reads", async () => {
  const s = await setup();
  for (
    const body of [null, [], "bad", {
      action: "status",
      extra: "x".repeat(3000),
    }]
  ) {
    equal((await s.handler(req(body))).status, 400);
  }
  equal(
    (await s.handler(req({}, { "content-type": "text/plain" }))).status,
    415,
  );
  equal(s.calls(), 0);
});
Deno.test("upstream errors and excessive responses never expose payloads or exception strings", async () => {
  const s = await setup({
    inventory: async () => {
      throw new Error("private-token-and-customer");
    },
  });
  const response = await s.handler(req({ action: "inventory", offset: 0 }));
  equal(response.status, 502);
  equal((await response.text()).includes("private-token"), false);
  const big = await setup({ inventory: async () => "x".repeat(300000) });
  equal(
    (await big.handler(req({ action: "inventory", offset: 0 }))).status,
    413,
  );
});
Deno.test("Xero projection preserves tracking codes and source links without raw secrets or free-text details", () => {
  const result = projectXero("Invoices", {
    InvoiceID: "source",
    Type: "ACCREC",
    Contact: { ContactID: "contact", Name: "PRIVATE" },
    access_token: "PRIVATE",
    Total: 999,
    Reference: "PRIVATE",
    LineItems: [{
      LineItemID: "line",
      Description: "PRIVATE",
      LineAmount: 999,
      Tracking: [{
        TrackingCategoryID: "cat",
        TrackingOptionID: "option",
        Name: "Sauna",
        Option: "001",
        secret: "PRIVATE",
      }],
    }],
  });
  equal(result, {
    InvoiceID: "source",
    Type: "ACCREC",
    Contact: { ContactID: "contact" },
    LineItems: [{
      LineItemID: "line",
      Tracking: [{
        TrackingCategoryID: "cat",
        TrackingOptionID: "option",
        Name: "Sauna",
        Option: "001",
      }],
    }],
  });
  equal(JSON.stringify(result).includes("PRIVATE"), false);
});
Deno.test("malformed tracking and oversized source fields fail instead of fabricating empty coverage", () => {
  for (
    const source of [{ InvoiceID: { secret: true } }, {
      LineItems: [{ Tracking: "bad" }],
    }, { InvoiceID: "x".repeat(3000) }]
  ) {
    let rejected = false;
    try {
      projectXero("Invoices", source);
    } catch {
      rejected = true;
    }
    equal(rejected, true);
  }
});
Deno.test("per-isolate authenticated request cap returns 429 without further reads", async () => {
  const s = await setup();
  for (let i = 0; i < 20; i++) {
    equal(
      (await s.handler(req({ action: "inventory", offset: 0 }))).status,
      200,
    );
  }
  const blocked = await s.handler(req({ action: "inventory", offset: 0 }));
  equal(blocked.status, 429);
  equal(blocked.headers.get("retry-after"), "60");
  equal(s.calls(), 20);
});
