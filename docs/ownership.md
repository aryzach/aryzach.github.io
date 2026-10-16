# Schema and deployment ownership record

Status: repository evidence reviewed; production control-plane ownership is **unconfirmed**. This is an ownership checklist, not a declaration that a particular person or account owns production.

| Area | Repository evidence | Required authority / open verification |
| --- | --- | --- |
| Visual editing and Git sync | README Lovable project; generated Supabase client and preview auth broker | Existing Lovable project administrator: confirm sync branch, publication behavior and editor permissions |
| Frontend production origin | `.github/workflows/static.yml` builds/deploys GitHub Pages from `main`; README also describes Lovable publish | GitHub/Lovable hosting administrators: identify actual serving origin and deployed commit |
| Cloudflare | `wrangler.toml`, `cloudflare-workers/link-headers.js`, Worker deployment action | Cloudflare zone/account administrator: verify DNS, Worker routes, origin override and any dashboard-managed Pages project |
| Backend | Supabase project in `supabase/config.toml`; PostgreSQL migrations and `LOVABLE_DB_MIGRATION_URL` | Lovable backend administrator: confirm Lovable Cloud versus independent Supabase account ownership, backups and function deployment process |
| Schema changes | 43 SQL files in `supabase/migrations`; seven later files in `drizzle/migrations` | Backend schema owner must reconcile both live ledgers and approve one future migration process |
| Storage | Code references lead-uploads, reservation-ids, agreement-versions and signed-contracts | Backend administrator: inventory live bucket privacy, policies, limits and retention; bucket creation is not fully represented in migrations |
| Payments/email/CRM/scheduling | Stripe, Resend, GoHighLevel and Cal.com integrations | Respective service administrators: confirm live/test configuration, webhook secrets and production destinations |

Do not infer ownership from a `supabase.co` hostname. No Cloudflare D1 binding or D1 data access exists in the audited application. Keep the current provider and hosting until this checklist is resolved.

## Schema source of truth

Production truth is the live database catalog plus its applied migration ledgers. The repository's reconstruction inputs are the combined SQL migration histories. `drizzle/schema.ts` is intentionally blank and all Drizzle snapshots contain zero tables; neither is a usable full schema definition. Generated `src/integrations/supabase/types.ts` is a client representation, not a migration authority.

The separate historical `customers` table was dropped. `reservations` stores customer/onboarding identity; inventory `current_customer_id` and `future_customer_id` reference reservations. Installation and accounting are modeled as fields and derived views, not separate installation/ledger systems. Preserve these meanings when writing tests or migrations.

Before any migration work:

1. Have the backend owner compare a read-only schema export and migration ledgers with both histories.
2. Record the supported migration runner and which system (Lovable or another approved runner) applies it. Do not introduce two automatic writers.
3. Reconstruct on a disposable database; separate production-specific repairs from structural migrations and synthetic seeds.
4. Include triggers, RLS, grants, functions, storage and backend deployment settings in reproducibility checks.
5. Gate production changes explicitly. Never run `drizzle push`, replay old migrations or copy production data merely to initialize a Codex environment.

Codex is a development tool, not a production schema or deployment owner. Routine tasks need no production migration URL, service-role key, admin password or deployment credentials.
