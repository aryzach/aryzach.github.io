import {
  database,
  callbackUri,
  appOrigin,
  encryptionSecret,
  exchangeToken,
} from "../_shared/server.ts";
import { XERO_CONNECTIONS, sha256, seal, unseal } from "../_shared/xero.ts";

Deno.serve(async (req) => {
  const headers = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Content-Type": "text/plain",
  };
  if (req.method !== "GET")
    return new Response("Method not allowed", { status: 405, headers });
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  if (!state || !/^[A-Za-z0-9_-]{43}$/.test(state))
    return new Response("Invalid authorization state", {
      status: 400,
      headers,
    });
  let origin: string;
  try {
    origin = appOrigin();
  } catch {
    return new Response("Integration configuration required", {
      status: 503,
      headers,
    });
  }
  const finish = (result: "returned" | "failed") =>
    new Response(null, {
      status: 303,
      headers: { ...headers, Location: `${origin}/admin?xero=${result}` },
    });
  try {
    const db = database();
    const { data: session, error } = await db
      .rpc("claim_xero_oauth_session", { p_hash: await sha256(state) })
      .returns<{ verifier_ciphertext: string }[]>()
      .maybeSingle();
    if (error || !session)
      return new Response(
        "Authorization expired or already used. Start again from Admin.",
        { status: 400, headers },
      );
    const code = url.searchParams.get("code");
    if (url.searchParams.has("error") || !code || code.length > 4096)
      return finish("failed");
    const verifier = await unseal(
      session.verifier_ciphertext,
      encryptionSecret(),
      "pkce",
    );
    const token = await exchangeToken(
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUri(),
        code_verifier: verifier,
      }),
    );
    const response = await fetch(XERO_CONNECTIONS, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) return finish("failed");
    const connections = await response.json();
    if (!Array.isArray(connections)) return finish("failed");
    const tenants = [
      ...new Map(
        connections
          .filter(
            (c) =>
              c.tenantType === "ORGANISATION" &&
              typeof c.tenantId === "string" &&
              /^[0-9a-f-]{36}$/i.test(c.tenantId) &&
              typeof c.tenantName === "string",
          )
          .map((c) => [c.tenantId, { id: c.tenantId, name: c.tenantName }]),
      ).values(),
    ];
    if (!tenants.length) return finish("failed");
    const { error: saveError } = await db.from("xero_oauth_connection").upsert({
      id: "primary",
      token_ciphertext: await seal(
        JSON.stringify(token),
        encryptionSecret(),
        "connection",
      ),
      access_expires_at: new Date(
        Date.now() + token.expires_in * 1000,
      ).toISOString(),
      granted_scopes: token.scope.split(/\s+/),
      tenants,
      selected_tenant_id: tenants.length === 1 ? tenants[0].id : null,
      refresh_nonce: null,
      refresh_locked_until: null,
      updated_at: new Date().toISOString(),
    });
    if (saveError) return finish("failed");
    return finish("returned");
  } catch {
    return finish("failed");
  }
});
