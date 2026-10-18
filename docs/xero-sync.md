# Xero payment refresh

The Customers tab shows **Sync now**, last successful sync, stale/error status, and a current **Needs review** list. Xero remains read-only. This process does not charge customers, change Xero, send messages, or update rental lifecycle records.

Manual refresh uses `If-Modified-Since` with a one-minute overlap. The nightly job performs a complete reconciliation at **3:00 AM America/Los_Angeles**, including older corrections and deleted transactions. Pagination follows Xero's response metadata, with an empty-page fallback for older responses. Requests use up to 1,000 records per page, stable IDs, bounded retries, and `Retry-After` handling. A failed read never publishes a partial import or advances the successful cursor.

The five current caches cover contacts, customer Receive/Spend Money transactions, sales invoices, customer invoice payments, and sales credit notes. Supplier cash and expense ledger rows are not stored. Unchanged resource caches are not rewritten on manual refresh. Invoices/credit notes themselves are not cash. Invoice payments and paid credit-note refunds contribute cash once. Non-USD, unsupported splits, or rounding mismatches require classification before inclusion in rental LTV. Tax-inclusive Xero lines have tax removed before calculating rent.

Xero supplies the current payment amount, date, status, contact, account categories and reference. The app overwrites current cached facts; it creates no prior-source versions or sync-run history. Existing owner-reviewed duplicate exclusions remain until corrected in Xero. New unmatched contacts are staged for review, without automatic profile creation or merging. Colin Stewart remains excluded from matching review by the owner's earlier decision.

Payment corrections cannot update customer profiles, bookings, signed agreements, agreed rates, installation/pickup dates, sauna assignments or sales agreements. Changed payment dates produce a review item; any operational correction remains an explicit admin action. Customer-level payment classifications avoid guessing which rental or sauna a payment covered.

Only one sync lease may run for the pinned SF Sauna tenant. Complete cache replacement, affected financial projections and current review items publish in one database transaction. A concurrent change to customer mapping or an affected payment classification aborts publication rather than overwriting the admin's work.

The scheduler uses hosted `pg_cron` and `pg_net`, with an hourly clock check to keep 3 AM Pacific stable across daylight-saving changes. A short-lived, single-use dispatch value can trigger only the sync action. It cannot read records or change OAuth settings. Cron stores no admin password or long-lived provider credential. Missing/expired dispatches and abandoned sync leases appear as errors.

Local preview reads a private copied status/cache. **Refresh local copy** reloads that copy; preview never calls production Xero. Review acknowledgements in preview affect only the local status file.

Primary guidance: [Xero caching](https://developer.xero.com/documentation/best-practices/api-call-efficiencies/caching-data/), [Xero requests and pagination](https://developer.xero.com/documentation/api/accounting/requests-and-responses/), [Supabase scheduled functions](https://supabase.com/docs/guides/functions/schedule-functions).
