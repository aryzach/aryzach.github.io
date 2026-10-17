import {
  database,
  callbackUri,
  appOrigin,
  encryptionSecret,
  activeToken,
} from "../_shared/server.ts";
import {
  authorizationUrl,
  randomSecret,
  sha256,
  pkceChallenge,
  seal,
  encryptionKey,
  XERO_SCOPES,
  XERO_RESOURCES,
  allowedAccountingRead,
  summarizeRecords,
} from "../_shared/xero.ts";

Deno.serve(async (req) => {
  let origin: string;
  try {
    origin = appOrigin();
  } catch {
    return new Response("Integration configuration required", { status: 503 });
  }
  const requestOrigin = req.headers.get("origin");
  const allowedOrigins = new Set([origin, "https://www.sfsaunarental.com"]);
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : origin,
    "Access-Control-Allow-Headers": "content-type, apikey, x-admin-password",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (requestOrigin && !allowedOrigins.has(requestOrigin))
    return json({ error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const password = Deno.env.get("ADMIN_PASSWORD");
  if (!password || req.headers.get("x-admin-password") !== password)
    return json({ error: "Unauthorized" }, 401);
  if (Number(req.headers.get("content-length") || 0) > 4096)
    return json({ error: "Request too large" }, 413);
  let body: { action?: string; tenantId?: string };
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: "Request too large" }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return json({ error: "Invalid request" }, 400);
    body = parsed;
    if (!["status", "start", "select_tenant", "inspect", "tracking_sample"].includes(body.action ?? ""))
      return json({ error: "Unknown action" }, 400);
    if (body.tenantId !== undefined && typeof body.tenantId !== "string")
      return json({ error: "Invalid organization" }, 400);
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  try {
    const db = database();
    let configured =
      !!Deno.env.get("XERO_CLIENT_ID") &&
      !!Deno.env.get("XERO_CLIENT_SECRET") &&
      !!Deno.env.get("XERO_TOKEN_ENCRYPTION_KEY");
    if (configured) {
      try { await encryptionKey(encryptionSecret()); }
      catch { configured = false; }
    }
    if (body.action === "status") {
      const [{ data: row, error }, sessions] = await Promise.all([
        db
          .from("xero_oauth_connection")
          .select("tenants,selected_tenant_id,updated_at")
          .eq("id", "primary")
          .maybeSingle(),
        db.from("xero_oauth_sessions").select("state_hash").limit(0),
      ]);
      return json({
        configured,
        storageReady: !error && !sessions.error,
        authorized: !!row,
        tenants: row?.tenants ?? [],
        selectedTenantId: row?.selected_tenant_id ?? null,
        redirectUri: callbackUri(),
        scopes: XERO_SCOPES,
      });
    }
    if (!configured)
      return json(
        {
          error:
            "Backend credentials and encryption key must be configured first",
        },
        503,
      );
    if (body.action === "start") {
      const state = randomSecret();
      const verifier = randomSecret();
      const { error } = await db.from("xero_oauth_sessions").insert({
        state_hash: await sha256(state),
        verifier_ciphertext: await seal(verifier, encryptionSecret(), "pkce"),
        expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
      });
      if (error)
        return json(
          { error: "Private OAuth storage must be provisioned first" },
          503,
        );
      // Deletes expired OAuth metadata only, never business records.
      await db
        .from("xero_oauth_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString());
      return json({
        authorizationUrl: authorizationUrl(
          Deno.env.get("XERO_CLIENT_ID") || "",
          callbackUri(),
          state,
          await pkceChallenge(verifier),
        ),
      });
    }
    if (body.action === "select_tenant") {
      if (!body.tenantId || !/^[0-9a-f-]{36}$/i.test(body.tenantId))
        return json({ error: "Invalid organization" }, 400);
      const { data: row, error } = await db
        .from("xero_oauth_connection")
        .select("tenants")
        .eq("id", "primary")
        .maybeSingle();
      if (
        error ||
        !row ||
        !row.tenants.some(
          (tenant: { id: string }) => tenant.id === body.tenantId,
        )
      )
        return json({ error: "Organization was not authorized" }, 403);
      const { error: updateError } = await db
        .from("xero_oauth_connection")
        .update({
          selected_tenant_id: body.tenantId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "primary");
      if (updateError) throw new Error("Organization selection failed");
      return json({ ok: true });
    }
    if (body.action === "inspect") {
      const { row, token } = await activeToken(db);
      const summaries = [];
      // Four fixed GET routes only. No arbitrary URLs, mutation actions or bulk import.
      for (const resource of XERO_RESOURCES) {
        if (!allowedAccountingRead(resource, "GET"))
          throw new Error("Read not allowed");
        const response = await fetch(
          `https://api.xero.com/api.xro/2.0/${resource}?page=1`,
          {
            method: "GET",
            redirect: "error",
            signal: AbortSignal.timeout(15000),
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              "Xero-tenant-id": row.selected_tenant_id,
              Accept: "application/json",
            },
          },
        );
        if (!response.ok)
          return json(
            {
              error: `Xero ${resource} read failed (${response.status}); no history was imported`,
            },
            502,
          );
        const payload = await response.json();
        summaries.push({ resource, ...summarizeRecords(payload[resource]) });
      }
      return json({
        summaries,
        inspectedAt: new Date().toISOString(),
        note: "First page only; structural inspection of up to five records per resource. Not organization totals. No business records were stored.",
      });
    }
    return json({ error: "Unknown action" }, 400);
  } catch {
    // Never return provider bodies, exception strings, tokens or customer records.
    return json(
      {
        error:
          "Xero connection operation failed. Check configuration or reconnect; no accounting records were changed.",
      },
      502,
    );
  }
});
