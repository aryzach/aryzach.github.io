# Xero sauna tracking: read-only inspection handoff

Status: prepared 2026-10-16; live inspection NOT executed by Codex. The owner confirms sauna numbers are stored in Xero tracking categories and correspond to inventory unit codes. Findings below distinguish code inspection from live data.

## What was actually checked

- Active `supabase/functions/xero-admin/index.ts` inspection GETs page 1 of Contacts, Invoices, CreditNotes and Payments and returns structural summaries only.
- `supabase/functions/_shared/xero.ts` does not inspect nested LineItems/Tracking or fetch a tracking-category catalog.
- The active permission allowlist is offline_access, accounting.contacts.read, accounting.invoices.read and accounting.payments.read. Do not change scopes or request accounting settings access merely to inspect tracking already returned on authorized invoice lines.
- No authenticated Xero/backend connector is available in this Codex session. ADMIN_PASSWORD, Supabase service/access credentials and Xero credentials/tokens are not present in its process environment. Lovable holds the working backend connection. No credentials were printed or requested.
- Inventory `unit_code` is the expected label-side mapping target; actual uniqueness, completeness and matching rates remain unverified. Existing status values are Available, Reservation Hold, Reservation Confirmed, Installed, Returning, Maintenance, Incoming, Transfer Planned, Sold and Pre-sold in the latest tracked status constraint (`drizzle/migrations/0001_add_presold_status.sql`); live catalog validation remains necessary.

## Inspection to execute through the existing connection

Use the existing authorized SF Sauna tenant and active token helper. Keep customer/financial data server-side behind the admin password. Accounting requests are fixed GET-only routes. Do not import, persist source records, create customers, update inventory or apply SQL. Existing token refresh may rotate/persist OAuth tokens as required for a read; it must not mutate business data. Never log tokens or raw accounting payloads.

1. Read inventory id/unit_code/status through service-role access. Report counts of missing/duplicate unit codes and ambiguous matching groups; do not modify them.
2. Read a bounded, explicitly documented sample of customer sales invoices (ACCREC), ensuring line-item details are returned. If list responses omit line details, use documented invoice-detail GETs. Missing LineItems is unavailable detail, not zero lines. Inspect returned LineItems[].Tracking entries. Preserve category/option IDs when present and names/labels when IDs are absent. Do not assume a particular casing/shape without examining the real response safely.
3. Report observed category names/IDs, sauna option labels/IDs and proposed inventory unit-code matches. Category selection must be explicit; do not treat unrelated tracking categories as sauna tags. A sample can show only observed options, not the entire configured category catalog. If catalog discovery requires extra scope, report that separately and stop rather than broadening permissions.
4. Report sample denominators: invoices read, invoices with line details, eligible lines inspected, tagged/untagged lines, options with unique inventory matches, unmatched options and ambiguous options. Count lines, not only invoices. Draft/void/deleted/supplier documents are excluded or reported separately, never silently treated as rental revenue. Tagged sales/deposits are not automatically rental lines.
5. Include actual sample date coverage, page count, selection/filter method, inspect time and failures. If a bounded sample reaches its cap before page exhaustion, mark partial. Missing tags in this sample are observed gaps; missing categories in a sample do not prove none exist. A full coverage audit, if later authorized, must paginate all relevant records; a recent sample cannot validate older history.
6. Inspect credit-note line tracking and invoice linkage where available. Check whether payment applications identify invoices so tracking can follow invoice lines. Report whether service periods are explicit or only invoice/payment dates exist. Do not infer physical custody, idle periods or installation boundaries.
7. Return aggregate coverage and sauna-option/inventory mapping exceptions only to the authenticated admin/owner. No customer names, emails, addresses, financial amounts or full payloads in the handoff report or public repository. No real inspection result may be committed to Git. Missing/failed reads are unavailable, not zero.

Expected result: a reviewed summary of the sauna category, a proposed option-to-inventory mapping, coverage limits and exceptions. No table migration or new operational endpoint is required just to run a one-off backend inspection in an existing authorized execution context. If Lovable cannot run it without deploying new function code, prepare that read-only addition for review and report the blocker first; do not silently deploy or change permissions.

## Prompt for Lovable

> Perform the read-only inspection specified in docs/xero-tracking-inspection.md using the existing authorized SF Sauna Xero connection. The sauna number is stored in a tracking category and should match sauna_inventory.unit_code. Inspect actual customer invoice-line Tracking data, credit-line tracking where available, and payment-to-invoice links. Report observed category/option names and IDs, proposed unique inventory mappings, missing/ambiguous codes, sample line coverage and date/page limits. Do not assume the existing first-page structural inspection establishes historical completeness. Do not show customer PII, financial amounts, tokens or credentials. Do not change business records, create customers, import data, apply SQL, broaden scopes or deploy new code. If your execution tools cannot inspect without a deployment, report that limitation and prepare the smallest read-only change for review instead. Do not commit real inspection results or source payloads to Git. Token refresh through the existing helper is permitted only as needed for read access.

## Pending evidence

| Question | Current state |
| --- | --- |
| Which category and stable IDs identify saunas? | Owner confirms tracking; exact values not yet inspected |
| Are all inventory unit codes present and unique? | Not verified |
| Do historical labels map consistently to the same physical unit? | Not verified |
| What fraction of relevant invoice/credit lines is tagged? | Not measured |
| Can payments follow invoice links without ambiguous multi-unit allocation? | Not verified |
| Are rental service dates explicit? | Not verified |
| Are historical status transitions retained? | Current status updates overwrite fields; no dedicated complete asset-status timeline found in reviewed code |

Once actual findings are returned, revise the mapping and coverage requirements in the domain model. Do not mark this inspection complete based on a successful OAuth status check.
