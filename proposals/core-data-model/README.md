# Customer/rental foundation

This first live slice adds durable customer profiles, reviewed reservation links and rental records alongside the existing inventory and booking system. It retains the existing compact admin formatting. Reporting and an operational assignment rewrite are outside this slice.

## Core relationships

- A customer is separate from a booking. Existing reservations receive separate profiles, even when emails match; no automatic merging occurs.
- A customer can have multiple rentals and locations. A standalone customer or rental does not fabricate a reservation, contract, payment or installation.
- Existing current/future inventory references group their corresponding reservations into rental records marked as legacy links. These records do not assert verified rental intervals.
- Physical sauna IDs, status vocabulary, current/future pointers and signed agreements retain their existing meanings and values. Inventory remains the operational assignment screen and authority.
- Dated installation/return history remains unconfirmed for imported links. The earlier local draft's history editor is not activated for live operations in this phase.

## Private backend

The additive migration creates three private RLS tables: customer_profiles, reservation_customer_links and rentals. No public role can read or mutate them. The existing password-verified admin API provides core_workspace and core_command. Commands support profile creation/editing/archival/restoration and rental creation, with optimistic version checks on profile updates. New bookings receive their own profile transactionally, and inventory links create an idempotent legacy rental grouping. These triggers only organize identity/rental records; they do not send messages, invoke providers, alter payment behavior or change inventory assignments.

The migration compares complete-row fingerprints of existing business tables inside its transaction and aborts if it changes an original record. Backfill creates no historical installation intervals. Customer profiles and rentals survive a booking deletion: the reservation link cascades away and the rental's optional booking reference becomes null. This avoids adding a new foreign-key blocker to the existing delete flow. Inventory deletion does not delete customer or rental records. Original business records are not deleted or rewritten by the migration.

The existing reservation-based inventory customer picker is retained. Assigning a standalone customer directly to inventory, identity merges, multiple contacts, audited history corrections and verified assignment cutover remain later work. They require a separate coherent compatibility change rather than a second competing inventory writer.

## Local preview

Preview uses a private copied snapshot or empty tab-local drafts. It never connects to the live backend. The copied workspace is read only; local draft edits use sessionStorage and are not business records or backups. The original inventory spreadsheet is populated from explicitly filtered snapshot fields, retaining columns, widths, colors, filters, sort and resize controls. Editing/deletion controls stay disabled on the copied inventory. Customers and Rentals use the same compact bordered table style.

`scripts/prepare-local-records.mjs` accepts private snapshot/output paths and selects only fields needed for the preview. The full source export, tokens, payment credentials and documents are excluded from the repository and built artifacts. Basic contract/CRM monthly-rate fields are copied only for the original inventory rate column; no reporting is computed.

`SF_LOCAL_RECORDS_FILE` points the loopback-only dev server to the filtered owner-only JSON. A serve-only middleware requires the exact loopback host, local peer, same-origin request and custom header, sets no-store, and provides no CORS. Direct navigation, cross-origin/cross-site requests and raw private-file access are denied. No file path or business snapshot is bundled into the website. Without this environment setting, the endpoint returns 404.

## Checks

`verify.sql` is disposable-database-only. It checks unchanged legacy rows, separate shared-email identities, repeated backfill, private access, optimistic conflicts, archival/restoration, booking/assignment identity creation, no phantom reservations and compatible deletion. The release migration is also tested as one complete transaction on a disposable fixture schema. Unit tests cover model rules, import field selection, preserved IDs and server read shaping. Typecheck, targeted lint, preview safety lint, build and browser checks cover the application boundary.
