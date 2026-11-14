import { customerLtv } from "./customerLtv.ts";
import { commitmentAsOf, latestInstalledType } from "./ltvTimeline.ts";
import type { LifecycleRental, LifecycleTerm } from "./lifecycleModel.ts";
import type { RentalWorkspace } from "./rentalModel.ts";

export interface RateCommitmentPoint {
  customerId: string;
  name: string;
  saunaType: string;
  status: "current" | "historical";
  monthlyRate: number;
  committedValue: number;
  installedOn: string;
  unverified: boolean;
}
export interface RateCommitmentGap {
  customerId: string;
  name: string;
  reason: string;
}
const validDay = (value: string | null | undefined): value is string =>
  !!value &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

/** One installed customer per point. Dollars at the chart boundary; source terms stay in cents. */
export function rateCommitment(
  state: RentalWorkspace,
  asOf: string,
  scope: "latest" | "all" = "latest",
) {
  if (!validDay(asOf)) throw Error("Choose a valid date.");
  const data = state.lifecycle;
  const points: RateCommitmentPoint[] = [],
    gaps: RateCommitmentGap[] = [];
  const rentals = (data?.rentals || []).filter(
    (r) =>
      r.purpose !== "purchase" &&
      r.lifecycle_state !== "canceled" &&
      !r.owner_review?.neverInstalled &&
      validDay(r.actual_start) &&
      r.actual_start <= asOf,
  );
  const ids = [...new Set(rentals.map((r) => r.customer_id))];
  for (const customerId of ids) {
    const name =
      state.customers.find((c) => c.id === customerId)?.name ||
      "Unknown customer";
    const exclude = (reason: string) => gaps.push({ customerId, name, reason });
    const customerRentals = rentals.filter((r) => r.customer_id === customerId);
    const current = customerRentals.filter(
      (r) => r.lifecycle_state === "active" && !r.actual_end,
    );
    const historical = customerRentals.every(
      (r) =>
        r.lifecycle_state === "ended" &&
        validDay(r.actual_end) &&
        r.actual_end >= r.actual_start! &&
        r.actual_end <= asOf,
    );
    if (!current.length && !historical) {
      exclude("Current or historical rental status needs review.");
      continue;
    }
    const rentalById = new Map(customerRentals.map((r) => [r.id, r]));
    const agreementDate = (term: LifecycleTerm, rental: LifecycleRental) => {
      const a = data!.agreements.find((a) => a.id === term.agreement_id);
      return (
        a?.signed_on ||
        a?.agreement_date ||
        term.effective_from ||
        rental.actual_start!
      );
    };
    const knownTerms = data!.terms.filter((t) => {
      const rental = rentalById.get(t.rental_id);
      return (
        rental &&
        !["superseded", "voided", "canceled"].includes(t.state) &&
        !data!.agreements.some(
          (a) =>
            a.id === t.agreement_id &&
            ["voided", "superseded"].includes(a.signing_state),
        ) &&
        validDay(agreementDate(t, rental)) &&
        agreementDate(t, rental) <= asOf
      );
    });
    const groups = new Map<string, LifecycleTerm[]>();
    for (const term of knownTerms) {
      const key = term.agreement_id || `unlinked-term:${term.id}`;
      groups.set(key, [...(groups.get(key) || []), term]);
    }
    const datedGroups = [...groups.values()]
      .map((terms) => ({
        terms,
        date: terms
          .map((t) => agreementDate(t, rentalById.get(t.rental_id)!))
          .sort()
          .at(-1)!,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    if (
      !datedGroups.length ||
      datedGroups.filter((g) => g.date === datedGroups[0].date).length !== 1
    ) {
      exclude("The latest agreement is missing or ambiguous.");
      continue;
    }
    const latestTerms = datedGroups[0].terms;
    const originalDate = (t: LifecycleTerm) =>
      t.effective_from ||
      t.commitment_start ||
      agreementDate(t, rentalById.get(t.rental_id)!);
    const first = latestTerms.map(originalDate).sort()[0];
    const originals = latestTerms.filter((t) => originalDate(t) === first);
    const rates = [...new Set(originals.map((t) => t.base_monthly_cents))];
    if (
      originals.some(
        (t) =>
          t.currency !== "USD" ||
          !Number.isSafeInteger(t.base_monthly_cents) ||
          t.base_monthly_cents! < 0,
      ) ||
      rates.length !== 1
    ) {
      exclude(
        "The latest agreement’s original monthly base rate is missing or ambiguous.",
      );
      continue;
    }
    const latestRental = rentalById.get(latestTerms[0].rental_id)!;
    const latestLtv = customerLtv(
      {
        ...state,
        lifecycle: { ...data!, rentals: [latestRental], terms: latestTerms },
      },
      customerId,
    );
    const commitment =
      scope === "all"
        ? commitmentAsOf(state, customerId, asOf)
        : {
            value: latestLtv.committed,
            reasons: latestLtv.commitmentNotes.filter(
              (n) => !n.includes("signature confirmation"),
            ),
            unverified: latestLtv.commitmentNotes.some((n) =>
              n.includes("signature confirmation"),
            ),
          };
    if (
      commitment.value === null ||
      !Number.isSafeInteger(commitment.value) ||
      commitment.value < 0
    ) {
      exclude(
        commitment.reasons.join(" ") || "Original commitment needs review.",
      );
      continue;
    }
    points.push({
      customerId,
      name,
      saunaType: latestInstalledType(state, customerId),
      status: current.length ? "current" : "historical",
      monthlyRate: rates[0]! / 100,
      committedValue: commitment.value / 100,
      installedOn: latestRental.actual_start!,
      unverified: commitment.unverified,
    });
  }
  points.sort(
    (a, b) =>
      a.name.localeCompare(b.name) || a.customerId.localeCompare(b.customerId),
  );
  return { points, gaps, eligible: ids.length };
}
