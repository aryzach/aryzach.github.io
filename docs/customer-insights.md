# Customer insights prototype

Open `/admin` in the safe development/preview build, sign in with the demo password `preview`, and select **Customer insights**. The tab is available only in fixture mode, behind the existing admin login. It is not added to the live production admin. No production data is queried, no schema changes are required, and no Stripe/Xero connection is configured.

## Metric decisions for review

- Customer: first installed rental customer, counted once across renewals. Leads do not count. Historic customers remain in LTV after cancellation or purchase. Household deduplication and actual identity mapping are still undecided.
- Realized revenue LTV: cumulative earned rental, delivery and sale charges less credit notes, divided by installed customers through the as-of date. This is historical revenue, not future value or profit. Refundable deposits and taxes are excluded.
- Contribution: earned revenue less illustrative servicing/payment costs, installation costs and remaining unit cost on sale. Acquisition, overhead and rental-unit depreciation are excluded. Real costs are needed before this can inform profitability decisions.
- CAC: all assumed acquisition spend in a period divided by first installations in that period. Months with no new installations have unavailable monthly CAC, while their spend remains in blended period CAC. Attribution is illustrative; acquisition lag, channel credit and spend completeness need agreement.
- Payback: first observed month cumulative cohort contribution recovers that cohort's acquisition spend. Installation month is month 1. Not recovered is not a forecast. Spend in months without acquisitions is visible in blended CAC and is not arbitrarily assigned to another cohort.
- Retention: share of a first-installation cohort still renting at month-end (as-of date for an incomplete month). Cancellation/purchase end rental retention. The purchase scenario remains in customer value. M0 is the first installation month; future periods are not zero-filled.
- Revenue and cash: invoice service periods drive earned revenue; credit notes reduce it. Receipts and refunds drive cash. Each cash record has illustrative Stripe and Xero IDs representing one transaction, not two revenue sources. The prototype is not an ingestion/deduplication engine.

## Data and views

`src/dev/customerHistory.ts` contains six invented profiles: active rental, cancellation, renewal, partial refund, purchase and a lead-only record. Fixed as-of date: September 30, 2026. Amounts are integer cents. Billing uses full months without proration. One unpaid invoice illustrates the distinction between earned revenue and collections. Deposit return and sales tax illustrate exclusions.

Customer metrics and timeline always include lifetime history through the as-of date. The period filter changes the monthly chart, acquisition denominator/spend, and displayed acquisition cohorts. LTV trend points recompute the cumulative installed-customer base and revenue at each month-end, without future leakage. Monthly CAC and cumulative LTV describe different populations; no LTV:CAC ratio or predictive LTV is claimed.

`src/lib/customerMetrics.ts` holds calculation functions; `tests/customer-metrics.test.ts` checks exclusion rules, cash reconciliation, credits/refunds, renewals, retention, payback, spend without acquisitions and historical snapshots. Browser tests exercise login, customer search/selection, timeline, cohort view, period changes and definitions, while blocking external services before network access.

The existing `RevenueDashboard` is unchanged: its signed-contract/CRM commitment projections serve a different purpose from historical customer analytics.

## Visual iteration with Lovable

The user believes Lovable syncs with `main`; repository documentation confirms Git sync but cannot establish the current Lovable dashboard setting. The user has authorized direct pushes to main after each coherent, tested frontend update. These pushes also trigger the existing production deployment workflows. No force pushes are authorized.

After a successful push, Lovable's connected editor preview can receive the changes through Git sync. Open `/admin`, use the demo password `preview`, then select Customer insights. The prototype tab is deliberately hidden on recognized production hosts; use the editor's development preview rather than the published site. Backend data, secrets and infrastructure remain outside this authorization.

For local visual iteration, run `npm run dev` in a browser-capable development environment, or review screenshots captured by `DASHBOARD_SCREENSHOT_PATH=/tmp/customer-insights.png npm run test:browser` after `npm run build:preview`. This onboarding chat does not expose a shared localhost preview. No separate Cloudflare branch preview has been configured.

## Next step after UI review

Review the definitions and representative histories. Then inspect representative Stripe/Xero records read-only and design explicit customer/source-ID mappings. Establish one authoritative migration owner before adding schema. Start with server-side historical imports into an isolated staging dataset and reconcile a few customers manually. Do not copy production credentials or customer data into fixtures.
