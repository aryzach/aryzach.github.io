/** No sample records or assumed numbers are returned to the application. */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const blocked = () =>
  json({ error: "Preview only: this operation is disabled." }, 403);

export async function emptyPreviewResponse(
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  if (
    request.method === "GET" &&
    [
      "/rest/v1/sauna_types",
      "/rest/v1/public_sauna_availability",
      "/rest/v1/app_config",
      "/rest/v1/pricing_tiers",
      "/rest/v1/pricing_config",
    ].includes(url.pathname)
  )
    return json([]);
  if (request.method !== "POST") return blocked();
  const body = await request.json().catch(() => ({}));
  const fn = url.pathname.split("/").pop();
  if (fn === "admin-api" || fn === "accounting-api") {
    const header =
      fn === "admin-api" ? "x-admin-password" : "x-accounting-password";
    if (request.headers.get(header) !== "preview")
      return json({ error: "Use preview for local preview access." }, 401);
    const reads: Record<string, unknown> = {
      login: { ok: true },
      list_inventory: { inventory: [] },
      list_customers: { customers: [] },
      list_reservations: { reservations: [] },
      list_reservations_with_events: { reservations: [], events: [] },
      list_waitlist: { entries: [] },
      list_agreement_versions: { versions: [] },
      list_accounting: { rows: [] },
      list_current_customers: { rows: [] },
    };
    if (Object.prototype.hasOwnProperty.call(reads, body.action))
      return json(reads[body.action]);
  }
  return blocked();
}
