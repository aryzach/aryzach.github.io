import test from "node:test";
import assert from "node:assert/strict";
import {
  XERO_SCOPES,
  authorizationUrl,
  pkceChallenge,
  seal,
  unseal,
  randomSecret,
  sha256,
  validateTokenSet,
  allowedAccountingRead,
  summarizeRecords,
} from "../supabase/functions/_shared/xero.ts";
import * as proposal from "../proposals/xero/functions/_shared/xero.ts";

const expectedScopes = [
  "offline_access",
  "accounting.contacts.read",
  "accounting.invoices.read",
  "accounting.payments.read",
];

test("active and prepared authorization use the exact supported granular read permissions", () => {
  for (const helpers of [{ XERO_SCOPES, authorizationUrl }, proposal]) {
    assert.deepEqual(helpers.XERO_SCOPES, expectedScopes);
    const url = new URL(helpers.authorizationUrl("test-client", "https://backend.invalid/callback", "test-state", "test-challenge"));
    assert.equal(url.searchParams.get("scope"), expectedScopes.join(" "));
  }
});

for (const required of expectedScopes) {
  test(`token validation requires ${required}`, () => {
    for (const validate of [validateTokenSet, proposal.validateTokenSet]) {
      assert.throws(() => validate({
        access_token: "test-access", refresh_token: "test-refresh", expires_in: 1800,
        scope: expectedScopes.filter((scope) => scope !== required).join(" "),
      }), /read-only consent required/);
    }
  });
}

for (const forbidden of ["accounting.transactions.read", "accounting.transactions", "accounting.contacts", "accounting.invoices", "accounting.payments", "accounting.creditnotes.read"]) {
  test(`token validation rejects unsupported or excessive permission ${forbidden}`, () => {
    for (const validate of [validateTokenSet, proposal.validateTokenSet]) {
      assert.throws(() => validate({
        access_token: "test-access", refresh_token: "test-refresh", expires_in: 1800,
        scope: [...expectedScopes, forbidden].join(" "),
      }), /read-only consent required/);
    }
  });
}

test("authorization requests only read scopes and offline access with PKCE and single-use state", async () => {
  const state = randomSecret();
  const challenge = await pkceChallenge(randomSecret());
  const url = new URL(
    authorizationUrl(
      "public-client-id",
      "https://backend.invalid/functions/v1/xero-callback",
      state,
      challenge,
    ),
  );
  assert.equal(url.origin, "https://login.xero.com");
  assert.deepEqual(url.searchParams.get("scope")?.split(" "), XERO_SCOPES);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), state);
  assert.equal(url.searchParams.has("client_secret"), false);
  assert.match(state, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(randomSecret(), state);
  assert.match(await sha256(state), /^[0-9a-f]{64}$/);
});

test("PKCE uses the RFC 7636 S256 calculation", async () => {
  assert.equal(
    await pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
    "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  );
});

test("AES-GCM ciphertext is randomized, authenticated and bound to token purpose", async () => {
  const key = btoa("a".repeat(32));
  const cipher = await seal("sensitive-test-value", key, "connection");
  assert.equal(await unseal(cipher, key, "connection"), "sensitive-test-value");
  assert.equal(cipher.includes("sensitive-test-value"), false);
  assert.notEqual(
    cipher,
    await seal("sensitive-test-value", key, "connection"),
  );
  await assert.rejects(unseal(cipher, key, "pkce"));
  await assert.rejects(unseal(cipher, btoa("b".repeat(32)), "connection"));
  await assert.rejects(seal("value", btoa("short"), "connection"));
  const pieces = cipher.split(".");
  pieces[2] = btoa("tampered");
  await assert.rejects(unseal(pieces.join("."), key, "connection"));
});

test("token responses cannot silently grant write permissions or omit required scopes", () => {
  const token = {
    access_token: "test-access",
    refresh_token: "test-refresh",
    expires_in: 1800,
    scope: XERO_SCOPES.join(" "),
  };
  assert.equal(validateTokenSet(token).expires_in, 1800);
  assert.equal(validateTokenSet({ ...token, scope: `  ${expectedScopes.slice().reverse().join("  ")}  ` }).expires_in, 1800);
  assert.throws(() =>
    validateTokenSet({
      ...token,
      scope: `${token.scope} accounting.transactions`,
    }),
  );
  assert.throws(() =>
    validateTokenSet({ ...token, scope: "accounting.contacts.read" }),
  );
  assert.throws(() => validateTokenSet({ ...token, refresh_token: "" }));
});

test("accounting requests are limited to four exact GET resources", () => {
  for (const name of ["Contacts", "Invoices", "CreditNotes", "Payments"]) {
    assert.equal(allowedAccountingRead(name, "GET"), true);
    for (const method of ["POST", "PUT", "DELETE", "PATCH"])
      assert.equal(allowedAccountingRead(name, method), false);
  }
  assert.equal(allowedAccountingRead("Invoices/../../Payments", "GET"), false);
  assert.equal(allowedAccountingRead("BankTransactions", "GET"), false);
});

test("inspection returns actual structural counts without customer or financial values", () => {
  const records = Array.from({ length: 7 }, () => ({
    ContactID: "private-id",
    Name: "private-name",
    EmailAddress: "private-email",
    Total: 987654,
  }));
  const summary = summarizeRecords(records);
  assert.equal(summary.sampledRecords, 5);
  assert.equal(summary.pageReturnedRecords, 7);
  assert.deepEqual(summary.fieldsPresent, ["ContactID", "Total"]);
  for (const value of ["private-id", "private-name", "private-email", "987654"])
    assert.equal(JSON.stringify(summary).includes(value), false);
  assert.deepEqual(summarizeRecords([]), {
    pageReturnedRecords: 0,
    sampledRecords: 0,
    fieldsPresent: [],
  });
});
