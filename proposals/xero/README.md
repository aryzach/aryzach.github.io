# Xero OAuth: deployed read-only setup

## Deployment verified October 16, 2026

The reviewed storage proposal was applied as `drizzle/migrations/0007_provision_private_xero_oauth_storage.sql`, with grants before RLS and no business-data changes. Active copies are in `supabase/functions/xero-admin`, `supabase/functions/xero-callback` and `_shared`; both entrypoints have `verify_jwt = false` and retain the existing admin password/state validation. The original proposal below is retained for reference, not as current deployment status.

Production Check connection was exercised through the actual production admin UI and returned HTTP 200. A subsequent authenticated readiness check confirmed `configured: true`, `storageReady: true`, `authorized: false`. Canonical `www` production-origin CORS works even when the configured callback-return origin uses the bare production domain. Unauthorized admin requests return 401, attacker-origin requests return 403, and callbacks without valid state return 400. Four deployed-function security tests and 18 existing unit tests pass. Storage tables and helper functions deny anon/authenticated access and permit service-role access only.

Required secrets are present, including the unchanged admin password and a usable encryption binding; values were not displayed. No Xero authorization, accounting read/import, or accounting write was performed. Next: register/confirm the documented callback in the Xero Web app, then use production Admin → Customer insights → Connect Xero and authorize the intended organization. Select an organization explicitly if multiple are granted. Live provider credential validity and token refresh remain unverified until authorization.

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

- `XERO_TOKEN_ENCRYPTION_KEY`: already saved securely. Do not regenerate or replace during deployment. Loss/rotation requires reconnection or an explicit key migration; never paste it in chat, source code or a `VITE_*` variable.
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
