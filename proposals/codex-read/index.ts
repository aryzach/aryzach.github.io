/** INACTIVE proposal: do not copy/deploy until reviewed and authorized. */
// At deployment only, change this import to ../_shared/server.ts after copying this directory.
import {
  activeToken,
  database,
} from "../../supabase/functions/_shared/server.ts";
import { createHandler, type Resource } from "./handler.ts";
import { projectXero } from "./projection.ts";

async function appPage(
  table: "sauna_inventory" | "reservations",
  offset: number,
) {
  const columns = table === "sauna_inventory"
    ? "id,unit_code,status,sauna_type_id,install_date,available_date,current_customer_id,future_customer_id"
    : "id,first_name,last_name,email,phone,reservation_source";
  const { data, error } = await database().from(table).select(columns)
    .order("id", { ascending: true }).range(offset, offset + 100);
  if (error || !data) throw new Error("App read unavailable");
  return {
    records: data.slice(0, 100),
    offset,
    nextOffset: data.length > 100 ? offset + 100 : null,
    coverage:
      "Current app rows only; not historical assignments. Offset reads are not an immutable snapshot.",
  };
}
async function xeroSample(resource: Resource, page: number, tenantId: string) {
  const db = database();
  // Verify pinned organization before activeToken can rotate OAuth metadata.
  const { data: connection, error } = await db.from("xero_oauth_connection")
    .select("selected_tenant_id,tenants").eq("id", "primary").maybeSingle();
  if (
    error || !connection || connection.selected_tenant_id !== tenantId ||
    !Array.isArray(connection.tenants) ||
    !connection.tenants.some((tenant: { id: string }) => tenant.id === tenantId)
  ) {
    throw new Error("Organization mismatch");
  }
  const { row, token } = await activeToken(db);
  if (row.selected_tenant_id !== tenantId) {
    throw new Error("Organization changed");
  }
  const url = new URL(`https://api.xero.com/api.xro/2.0/${resource}`);
  url.searchParams.set("page", String(page));
  const response = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Xero-tenant-id": tenantId,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("Provider read failed");
  // Bound streamed provider response before parsing. Do not log or return provider bodies.
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 2 * 1024 * 1024) {
        await reader.cancel();
        throw new Error("Provider body limit");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  const records: unknown = payload[resource];
  if (!Array.isArray(records) || records.length > 1000) {
    throw new Error("Invalid source collection");
  }
  return {
    resource,
    page,
    providerPageRecords: records.length,
    returnedRecords: Math.min(records.length, 25),
    truncated: records.length > 25,
    records: records.slice(0, 25).map((record) =>
      projectXero(resource, record)
    ),
    coverage:
      "One provider page; first 25 records only. No completeness, rental-only or date-range claim. Missing LineItems means unavailable detail, not zero lines.",
  };
}
Deno.serve(createHandler({
  config: () => ({
    keyHash: Deno.env.get("CODEX_READ_KEY_SHA256"),
    expiresAt: Deno.env.get("CODEX_READ_EXPIRES_AT"),
    tenantId: Deno.env.get("CODEX_READ_TENANT_ID"),
  }),
  now: Date.now,
  inventory: (offset) => appPage("sauna_inventory", offset),
  customers: (offset) => appPage("reservations", offset),
  xero: xeroSample,
}));
