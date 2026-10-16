# Customer insights

Open `/admin`, authenticate, and select Customer insights. This dashboard shows **Waiting for data** until verified records are connected. It displays no sample customers, assumed costs, fabricated metrics, default zero metrics or simulated charts. The empty dashboard is available behind the existing admin gate in production as well as preview.

Existing production customer, inventory, contract and payment records are unchanged. No source imports, database migrations or credential changes have been performed. Existing operational screens retain their actual production data sources. The new dashboard has not yet loaded that data or imported Stripe/Xero histories.

## Definitions

- Customer: first installed rental customer, counted once across renewals. Leads excluded; household identity matching still requires agreement.
- Realized revenue LTV: verified earned rental/delivery/sale revenue less credits, divided by installed customers. Excludes refundable deposits and taxes. Historical revenue, not forecast profit.
- Contribution: verified revenue less verified variable costs. Missing costs are not assumed.
- CAC: verified acquisition spend divided by first installations for an agreed period and attribution window. Missing acquisition spend does not mean zero CAC.
- Revenue versus cash: invoices and credits establish earned revenue; receipts and refunds establish cash. Stripe and Xero references to the same payment must be reconciled, not added together.
- Retention and payback: require actual lifecycle dates, contribution and acquisition costs. Until available, show Waiting for data.

## Development and review

The preview transport returns empty lists, not sample records. Preview password `preview` permits local UI access only; it is not production authentication. It does not grant production access or fabricate customer identities. Browser tests verify no sample amounts/customers/charts appear and that external writes remain blocked.

Financial calculation inputs used by unit tests live under `tests/fixtures` only. They are not imported by application code or shipped as dashboard data.

The user authorizes tested frontend updates to main so Lovable can sync changes. Main pushes trigger existing production workflows. No database, credential or infrastructure changes are authorized by this workflow.

Next: connect verified read-only operational histories and financial sources through authorized server APIs, agree identity/reconciliation rules, and render each metric only after its required inputs are complete.

## Xero connection preparation

The admin panel includes readiness/authorization controls. The backend implementation and exact redirect URI are documented in [the review-only Xero proposal](../proposals/xero/README.md). It remains undeployed; metrics still wait for verified data. Storing client credentials in Lovable alone does not authorize a Xero organization.
