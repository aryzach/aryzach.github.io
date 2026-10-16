import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import {
  XERO_TOKEN,
  unseal,
  seal,
  validateTokenSet,
  type TokenSet,
} from "./xero.ts";
function requiredBinding(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Required backend binding unavailable");
  return value;
}
export const database = () => createClient(
  requiredBinding("SUPABASE_URL"), requiredBinding("SUPABASE_SERVICE_ROLE_KEY"),
);
export const callbackUri = () =>
  `${requiredBinding("SUPABASE_URL").replace(/\/$/, "")}/functions/v1/xero-callback`;
export function appOrigin() {
  const url = new URL(
    Deno.env.get("PUBLIC_APP_URL") || "https://www.sfsaunarental.com",
  );
  if (
    url.protocol !== "https:" ||
    !["sfsaunarental.com", "www.sfsaunarental.com"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error("Invalid app origin");
  return url.origin;
}
export const encryptionSecret = () => {
  const key = Deno.env.get("XERO_TOKEN_ENCRYPTION_KEY");
  if (!key) throw new Error("Integration encryption key missing");
  return key;
};
export async function exchangeToken(
  params: URLSearchParams,
): Promise<TokenSet> {
  const client = Deno.env.get("XERO_CLIENT_ID");
  const secret = Deno.env.get("XERO_CLIENT_SECRET");
  if (!client || !secret) throw new Error("Xero credentials missing");
  const response = await fetch(XERO_TOKEN, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      Authorization: `Basic ${btoa(`${client}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!response.ok)
    throw new Error("Xero authorization failed; reconnect required");
  return validateTokenSet(await response.json());
}
export async function activeToken(db: ReturnType<typeof database>) {
  const { data: row, error } = await db
    .from("xero_oauth_connection")
    .select("*")
    .eq("id", "primary")
    .maybeSingle();
  if (error || !row) throw new Error("Xero connection unavailable");
  if (!row.selected_tenant_id) throw new Error("Select an organization first");
  if (new Date(row.access_expires_at).getTime() > Date.now() + 60000)
    return {
      row,
      token: JSON.parse(
        await unseal(row.token_ciphertext, encryptionSecret(), "connection"),
      ) as TokenSet,
    };
  const nonce = crypto.randomUUID();
  const { data: locked, error: lockError } = await db
    .rpc("lock_xero_refresh", { p_nonce: nonce })
    .returns<
      {
        token_ciphertext: string;
        access_expires_at: string;
        selected_tenant_id: string | null;
      }[]
    >()
    .maybeSingle();
  if (lockError || !locked)
    throw new Error("Connection is refreshing; retry shortly");
  // A process may have refreshed between the first read and lock acquisition.
  try {
    let token = JSON.parse(
      await unseal(locked.token_ciphertext, encryptionSecret(), "connection"),
    ) as TokenSet;
    if (new Date(locked.access_expires_at).getTime() <= Date.now() + 60000) {
      token = await exchangeToken(
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: token.refresh_token,
        }),
      );
      const { data: saved, error: saveError } = await db
        .from("xero_oauth_connection")
        .update({
          token_ciphertext: await seal(
            JSON.stringify(token),
            encryptionSecret(),
            "connection",
          ),
          access_expires_at: new Date(
            Date.now() + token.expires_in * 1000,
          ).toISOString(),
          granted_scopes: token.scope.split(/\s+/),
          updated_at: new Date().toISOString(),
        })
        .eq("id", "primary")
        .eq("refresh_nonce", nonce)
        .select("id")
        .maybeSingle();
      if (saveError || !saved)
        throw new Error(
          "Refreshed token could not be stored; reconnect required",
        );
    }
    return { row: locked, token };
  } finally {
    await db
      .from("xero_oauth_connection")
      .update({ refresh_nonce: null, refresh_locked_until: null })
      .eq("id", "primary")
      .eq("refresh_nonce", nonce);
  }
}
