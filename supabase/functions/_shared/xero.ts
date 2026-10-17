/** OAuth helpers. No customer data, credentials or tokens belong in logs. */
export const XERO_SCOPES = [
  "offline_access",
  "accounting.contacts.read",
  "accounting.invoices.read",
  "accounting.payments.read",
  "accounting.banktransactions.read",
];
// Existing four-scope connections can refresh until bank-read consent is granted.
const REQUIRED_XERO_SCOPES = XERO_SCOPES.filter(scope => scope !== "accounting.banktransactions.read");
export const XERO_AUTHORIZE =
  "https://login.xero.com/identity/connect/authorize";
export const XERO_TOKEN = "https://identity.xero.com/connect/token";
export const XERO_CONNECTIONS = "https://api.xero.com/connections";
export const XERO_RESOURCES = [
  "Contacts",
  "Invoices",
  "CreditNotes",
  "Payments",
] as const;
export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export function validateTokenSet(value: unknown): TokenSet {
  const token = value as Partial<TokenSet>;
  if (
    !token ||
    typeof token.access_token !== "string" ||
    !token.access_token ||
    typeof token.refresh_token !== "string" ||
    !token.refresh_token ||
    typeof token.expires_in !== "number" ||
    token.expires_in <= 0 ||
    typeof token.scope !== "string"
  )
    throw new Error("Invalid token response");
  const granted = token.scope.trim().split(/\s+/);
  if (
    granted.some((scope) => !XERO_SCOPES.includes(scope)) ||
    REQUIRED_XERO_SCOPES.some((scope) => !granted.includes(scope))
  )
    throw new Error("Unexpected Xero permissions; read-only consent required");
  return token as TokenSet;
}
const bytes64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const from64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
export const randomSecret = () =>
  bytes64(crypto.getRandomValues(new Uint8Array(32)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
export async function pkceChallenge(verifier: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return bytes64(new Uint8Array(hash))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export async function encryptionKey(secret: string) {
  const bytes = from64(secret);
  if (bytes.length !== 32)
    throw new Error("XERO_TOKEN_ENCRYPTION_KEY must encode 32 bytes");
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function seal(value: string, secret: string, purpose: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(purpose) },
    await encryptionKey(secret),
    new TextEncoder().encode(value),
  );
  return `v1.${bytes64(iv)}.${bytes64(new Uint8Array(cipher))}`;
}
export async function unseal(value: string, secret: string, purpose: string) {
  const [version, iv, cipher, extra] = value.split(".");
  if (version !== "v1" || !iv || !cipher || extra)
    throw new Error("Invalid encrypted token");
  const clear = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: from64(iv),
      additionalData: new TextEncoder().encode(purpose),
    },
    await encryptionKey(secret),
    from64(cipher),
  );
  return new TextDecoder().decode(clear);
}
export function authorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  challenge: string,
) {
  const url = new URL(XERO_AUTHORIZE);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: XERO_SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}
export function allowedAccountingRead(resource: string, method: string) {
  return (
    method === "GET" &&
    XERO_RESOURCES.includes(resource as (typeof XERO_RESOURCES)[number])
  );
}
export function summarizeRecords(records: unknown) {
  if (!Array.isArray(records))
    throw new Error("Unexpected accounting response");
  const sample = records.slice(0, 5);
  const fields = [
    "ContactID",
    "InvoiceID",
    "CreditNoteID",
    "PaymentID",
    "Date",
    "Status",
    "Type",
    "Total",
    "Amount",
    "CurrencyCode",
    "LineItems",
    "Contact",
    "Invoice",
    "CreditNote",
  ];
  return {
    pageReturnedRecords: records.length,
    sampledRecords: sample.length,
    fieldsPresent: fields.filter((field) =>
      sample.some(
        (row) => row && typeof row === "object" && Object.hasOwn(row, field),
      ),
    ),
  };
}
