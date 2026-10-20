import type { RentalWorkspace } from './rentalModel.ts';

export interface CustomerLtv {
  committed: number | null;
  actual: number | null;
  commitmentNotes: string[];
  actualNote: string;
}
/** Original rental-only contract minima and classified cash; neither is a balance due or a forecast. */
export function customerLtv(state: RentalWorkspace, customerId: string): CustomerLtv {
  const data = state.lifecycle;
  const commitmentNotes: string[] = [];
  let committed: number | null = data ? 0 : null;
  const rentals = data?.rentals.filter(r => r.customer_id === customerId && r.purpose !== 'purchase') || [];
  if (!rentals.length) committed = null;
  for (const rental of rentals) {
    if (rental.lifecycle_state === 'canceled' || rental.owner_review?.neverInstalled === true) continue;
    const terms = data!.terms.filter(t => t.rental_id === rental.id && !['superseded', 'voided', 'canceled'].includes(t.state) && !data!.agreements.some(a => a.id === t.agreement_id && ['voided', 'superseded'].includes(a.signing_state)));
    if (!terms.length) { committed = null; commitmentNotes.push('A rental has no recorded minimum terms.'); }
    // Committed LTV retains each agreement's original minimum. Waivers, settlements,
    // and payments that fulfill that minimum are separate from this contract metric.
    if (rental.owner_review?.heaterChargeStatus === 'unknown') {
      committed = null;
      commitmentNotes.push('The monthly heater add-on needs confirmation.');
    }
    for (const term of terms) {
      const agreement = data!.agreements.find(a => a.id === term.agreement_id);
      if (term.currency !== 'USD' || term.minimum_months === null || term.base_monthly_cents === null || !Number.isSafeInteger(term.minimum_months) || term.minimum_months < 1 || !Number.isSafeInteger(term.base_monthly_cents) || term.base_monthly_cents < 0 || term.extras.some(e => !Number.isSafeInteger(e.amountCents) || e.amountCents < 0)) {
        committed = null;
        commitmentNotes.push('A minimum term, monthly rate, or supported currency is missing.');
      } else if (committed !== null) {
        const commercial = agreement?.source_terms?.commercialTerms as {version?: number;initial_commitment_cents?: number} | undefined;
        // Preserve the signed initial commitment, including an upfront base-rent discount.
        // Subsequent cash receipts/waivers do not change this original contract value.
        if (term.source === 'Signed in-app agreement' && commercial?.version === 2) {
          if (Number.isSafeInteger(commercial.initial_commitment_cents) && commercial.initial_commitment_cents! >= 0) committed += commercial.initial_commitment_cents!;
          else { committed = null; commitmentNotes.push('Signed commercial terms need review.'); }
        } else committed += term.minimum_months * (term.base_monthly_cents + term.extras.reduce((sum, e) => sum + e.amountCents, 0));
      }
      if (!agreement || agreement.signing_state !== 'signed') commitmentNotes.push('Based on recorded terms; signature confirmation is incomplete.');
    }
  }
  const allocations = data?.allocations.filter(a => a.customer_id === customerId && !a.voided_at &&
    !data.paymentReviews?.some(r => r.tenant_id === a.tenant_id && r.source_id === a.source_id && r.disposition === 'duplicate')) || [];
  const cash = allocations.filter(a => ['rental', 'addon'].includes(a.category));
  const unsupported = cash.some(a => a.currency !== 'USD' || !['receipt', 'payment_out'].includes(a.source_kind) || !Number.isSafeInteger(a.amount_cents));
  const actual = !allocations.length || unsupported ? null : cash.reduce((sum, a) => sum + (a.source_kind === 'payment_out' ? -a.amount_cents : a.amount_cents), 0);
  if (!rentals.length) commitmentNotes.push('No rental commitment is recorded.');
  if (!data) commitmentNotes.push('Rental history is not loaded.');
  return { committed, actual, commitmentNotes: [...new Set(commitmentNotes)], actualNote: actual === null ? 'No usable classified rental payment history. Unknown does not mean zero.' : 'Recorded rental receipts minus rental refunds. Excludes deposits, tax, sales, delivery, duplicate receipts, and unclassified cash. Based on the latest imported Xero history.' };
}
