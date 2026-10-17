/** Review-only server handler. No production registration, browser access or persistence. */
export interface Config {
  keyHash?: string;
  expiresAt?: string;
  tenantId?: string;
}
export type Action = "status" | "inventory" | "customers" | "xero_sample";
export const RESOURCES = [
  "Contacts",
  "Invoices",
  "CreditNotes",
  "Payments",
] as const;
export type Resource = typeof RESOURCES[number];
export interface Dependencies {
  config(): Config;
  now(): number;
  inventory(offset: number): Promise<unknown>;
  customers(offset: number): Promise<unknown>;
  xero(resource: Resource, page: number, tenantId: string): Promise<unknown>;
}
export async function hashCredential(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(bytes),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
function reply(body: unknown, status = 200): Response {
  const text = JSON.stringify(body);
  if (new TextEncoder().encode(text).length > 256 * 1024) {
    return new Response(
      '{"error":"Response exceeds inspection limit; no data returned"}',
      { status: 413, headers },
    );
  }
  return new Response(text, { status, headers });
}
async function readBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty request");
  let bytes = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.length;
      if (bytes > 2048) {
        await reader.cancel();
        throw new Error("Request limit");
      }
      parts.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const joined = new Uint8Array(bytes);
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(joined);
}
export function createHandler(deps: Dependencies) {
  // Best-effort per-isolate bounds, not a global distributed rate limiter.
  let windowStart = 0;
  let requests = 0;
  let inFlight = 0;
  return async (request: Request): Promise<Response> => {
    // Server-to-server only. CORS is not authentication; possession of the key is.
    if (request.headers.has("origin")) {
      return reply({ error: "Browser access disabled" }, 403);
    }
    if (request.method !== "POST") {
      return reply({ error: "Method not allowed" }, 405);
    }
    const url = new URL(request.url);
    if (url.search) return reply({ error: "Query parameters disabled" }, 400);
    const config = deps.config();
    const expires = Date.parse(config.expiresAt ?? "");
    if (
      !/^[a-f0-9]{64}$/.test(config.keyHash ?? "") ||
      !Number.isFinite(expires) ||
      expires <= deps.now() ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
        config.tenantId ?? "",
      )
    ) {
      return reply({ error: "Access disabled or expired" }, 503);
    }
    const match = /^Bearer (sfcr_[A-Za-z0-9_-]{43})$/.exec(
      request.headers.get("authorization") ?? "",
    );
    if (!match) return reply({ error: "Unauthorized" }, 401);
    const actual = await hashCredential(match[1]);
    let different = 0;
    for (let i = 0; i < 64; i++) {
      different |= actual.charCodeAt(i) ^ config.keyHash!.charCodeAt(i);
    }
    if (different) return reply({ error: "Unauthorized" }, 401);
    if (
      request.headers.get("content-type")?.split(";")[0].trim()
        .toLowerCase() !== "application/json"
    ) {
      return reply({ error: "JSON required" }, 415);
    }
    let input: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(await readBody(request));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid body");
      }
      input = parsed as Record<string, unknown>;
      const allowed = input.action === "xero_sample"
        ? ["action", "resource", "page"]
        : input.action === "inventory" || input.action === "customers"
        ? ["action", "offset"]
        : ["action"];
      if (Object.keys(input).some((key) => !allowed.includes(key))) {
        throw new Error("Unknown parameter");
      }
      if (
        !["status", "inventory", "customers", "xero_sample"].includes(
          String(input.action),
        )
      ) throw new Error("Unknown action");
      if (
        input.action === "xero_sample" &&
        (!RESOURCES.includes(input.resource as Resource) ||
          !Number.isInteger(input.page) || Number(input.page) < 1 ||
          Number(input.page) > 3)
      ) throw new Error("Invalid sample");
      if (
        (input.action === "inventory" || input.action === "customers") &&
        (!Number.isInteger(input.offset) || Number(input.offset) < 0 ||
          Number(input.offset) > 5000)
      ) throw new Error("Invalid offset");
    } catch {
      return reply({ error: "Invalid or oversized request" }, 400);
    }
    if (deps.now() - windowStart >= 60000) {
      windowStart = deps.now();
      requests = 0;
    }
    if (requests >= 20 || inFlight >= 2) {
      return new Response('{"error":"Inspection limit; retry later"}', {
        status: 429,
        headers: { ...headers, "Retry-After": "60" },
      });
    }
    requests++;
    inFlight++;
    try {
      let data: unknown;
      switch (input.action as Action) {
        case "status":
          data = {
            enabled: true,
            expiresAt: config.expiresAt,
            tenantId: config.tenantId,
            resources: RESOURCES,
            bankTransactionsSupported: false,
          };
          break;
        case "inventory":
          data = await deps.inventory(Number(input.offset));
          break;
        case "customers":
          data = await deps.customers(Number(input.offset));
          break;
        case "xero_sample":
          data = await deps.xero(
            input.resource as Resource,
            Number(input.page),
            config.tenantId!,
          );
          break;
      }
      return reply({
        data,
        inspectedAt: new Date(deps.now()).toISOString(),
        note:
          "Read-only inspection; no business records stored. Samples are not historical totals.",
      });
    } catch {
      // Provider bodies/exceptions may contain secrets or PII. Never return or log them.
      return reply({
        error:
          "Read unavailable; check backend configuration, consent or provider limits. No business records changed.",
      }, 502);
    } finally {
      inFlight--;
    }
  };
}
