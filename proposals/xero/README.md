# Xero OAuth: prepared for review, NOT deployed

This directory is deliberately outside `supabase/functions`, `supabase/migrations` and `drizzle/migrations`. Nothing here runs automatically. The frontend can check a deployed endpoint, but connection controls remain disabled until that endpoint reports ready. No Xero credentials are included here.

## Exact developer-portal setup

Create/use a **Web app** using the standard authorization-code flow (not a Custom Connection). Register this exact redirect URI:

```
https://vwpeuejdgyjcwcymzjxt.supabase.co/functions/v1/xero-callback
```

Suggested application/company URL: `https://www.sfsaunarental.com`. The redirect endpoint will not exist until the backend deployment below. Do not use a Lovable editor URL, `/admin`, or the frontend domain as the OAuth callback.

Requested scopes are `offline_access accounting.contacts.read accounting.transactions.read`. The accounting permissions are read-only. No write scopes, identity/profile/email scopes or reports scopes are requested. The broader read-only transactions scope is the documented scope for the required invoice/credit/payment endpoints in Xero's official API specification. Confirm consent shows these read permissions for the existing Xero app; unsupported scopes must fail, not be replaced with write scopes.

Authoritative references inspected during preparation:
- https://github.com/XeroAPI/Xero-OpenAPI/blob/master/xero_accounting.yaml (authorization/token URLs and read scopes)
- https://github.com/XeroAPI/xero-node (authorization-code flow and rotating refresh tokens)
- https://developer.xero.com/documentation/guides/oauth2/auth-flow/
- https://developer.xero.com/documentation/guides/oauth2/scopes/

The documentation website was blocked by the workspace proxy; the official GitHub sources were accessible. Recheck current app-specific scope availability during deployment/consent. There has been no live Xero authorization or integration test yet.

## Backend secrets

The user has already added `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` in Lovable. Their values are not visible in Codex and have not been verified. Functions also need:

- `XERO_TOKEN_ENCRYPTION_KEY`: a fresh base64 encoding of 32 cryptographically random bytes. Generate privately (for example, run `openssl rand -base64 32` locally) and put the result directly in Lovable's backend secret settings. Do not paste it in chat, source code or a `VITE_*` variable. Loss/rotation requires reconnection or an explicit key migration.
- `ADMIN_PASSWORD`: reuse the existing admin API's secret; do not invent a second shared password.
- `PUBLIC_APP_URL`: use the canonical production origin, `https://www.sfsaunarental.com` or `https://sfsaunarental.com`. The UI must be opened on that same origin. Defaults to `https://www.sfsaunarental.com` if absent.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: existing platform-injected backend bindings.

No frontend Xero secret/client ID is needed. Only read-only connection metadata is returned to authenticated admin requests.

## Proposed storage and security

`storage.sql` creates **two new integration-only tables** and two service-role-only helper functions. It does not modify existing customer, contract, inventory or financial tables. RLS is enabled with no anon/authenticated access. Access/refresh tokens and PKCE verifiers are AES-256-GCM encrypted with separate purpose bindings. State is cryptographically random, SHA-256 hashed in storage, expires after 10 minutes and is atomically consumed once.

Only the existing password-authenticated admin endpoint may start authorization, select an authorized organization or inspect source structure. Callback access is public but requires valid single-use state plus PKCE. Fixed app redirects prevent open redirects. Refresh rotation uses a database lease; tokens are stored before the lease is released. Provider redirects are rejected for token/accounting requests. Errors omit provider bodies, tokens and customer values. No application logs contain customer payloads or credentials.

OAuth necessarily POSTs to Xero's token endpoint. Accounting requests are GET-only and hardcoded to Contacts, Invoices, CreditNotes and Payments. No accounting writes, webhook registration, connection deletion or bulk imports are implemented.

If multiple organizations are authorized, the admin must select one explicitly. No arbitrary first tenant is used. Structural inspection reads page 1 from each resource and summarizes up to five returned records; it is not an organization-wide count and persists no customer/financial records. Some Xero endpoints return up to their default page size before the local five-record inspection cap. A failed resource read returns an error, not zero data.

Existing shared-password authentication is retained for compatibility; it does not introduce individual identity, MFA or new staff roles. Rate limiting and stronger staff identity remain separate production hardening work.

## Deployment sequence — requires explicit backend approval

1. Backend owner reviews `storage.sql`, selects the established migration mechanism and applies it once. SQL is prepared only; it has NOT been applied or exercised against a real database.
2. Add the encryption key and verify existing secret bindings in Lovable, without displaying values.
3. Copy `functions/_shared/xero.ts` and `server.ts` to the backend `_shared` directory; copy `xero-admin` and `xero-callback` to the function deployment directory.
4. Deploy both functions with JWT verification disabled. The admin function enforces its own password; Xero's callback cannot present a Supabase JWT. Add only these entries to `supabase/config.toml` at that separately approved deployment:

```toml
[functions.xero-admin]
verify_jwt = false
[functions.xero-callback]
verify_jwt = false
```

5. Ensure backend HTTPS egress reaches `login.xero.com` (browser consent), `identity.xero.com` (tokens) and `api.xero.com` (connections/accounting). This does not require giving Codex credentials.
6. In production `/admin` → Customer insights, check connection readiness, click Connect Xero and authorize the correct organization. A multi-organization grant requires explicit selection after returning.
7. Run Inspect read-only sample. Confirm structures, token refresh, expiry/replay denial, tenant selection and denied unauthenticated requests. No historical import or metric computation occurs here. Reconcile real records and implement imports separately.

Frontend pushes to main are authorized. Applying SQL, copying/deploying these functions and changing backend settings are separate actions and have NOT been executed by Codex.

## Local checks

`deno task check` and `deno task test` in this directory check backend types and rejection paths using pinned Supabase SDK 2.45.0 and the committed Deno lockfile. In this cloud workspace, use `DENO_DIR=/workspace/.deno-cache DENO_TLS_CA_STORE=system,mozilla` to select writable cache storage and the trusted system CA store; do not disable TLS verification. Node unit tests cover scope restrictions, PKCE, encryption/tampering, accounting route restrictions and summary redaction. Browser tests cover the disabled/unconfigured connection UI and keep financial metrics at Waiting for data. These are not a substitute for the post-deployment OAuth/SQL integration checks above.
