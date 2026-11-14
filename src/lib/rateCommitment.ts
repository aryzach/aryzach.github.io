import { customerLtv } from "./customerLtv.ts";
import {
  commitmentAsOf,
  latestInstalledType,
  normalizeSaunaType,
} from "./ltvTimeline.ts";
import type { LifecycleRental, LifecycleTerm } from "./lifecycleModel.ts";
import type { RentalWorkspace } from "./rentalModel.ts";

export interface RateCommitmentPoint {
  customerId: string;
  name: string;
  saunaType: string;
  status: "current" | "historical" | "future";
  monthlyRate: number;
  committedValue: number;
  installedOn: string | null;
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

/** One installed or signed-future customer per point. Dollars at the chart boundary; source terms stay in cents. */
export function rateCommitment(
  state: RentalWorkspace,
  asOf: string,
  scope: "latest" | "all" = "latest",
) {
  if (!validDay(asOf)) throw Error("Choose a valid date.");
  const data = state.lifecycle;
  const points: RateCommitmentPoint[] = [],
    gaps: RateCommitmentGap[] = [];
  const signedFutureTerms = (r: LifecycleRental) =>
    (data?.terms || []).filter((t) => {
      const agreement = data?.agreements.find(
        (a) => a.id === t.agreement_id && a.rental_id === r.id,
      );
      const signedDate = agreement?.signed_on || agreement?.agreement_date;
      return (
        t.rental_id === r.id &&
        !["superseded", "voided", "canceled"].includes(t.state) &&
        agreement?.signing_state === "signed" &&
        validDay(signedDate) &&
        signedDate <= asOf
      );
    });
  const isInstalled = (r: LifecycleRental) =>
    validDay(r.actual_start) && r.actual_start <= asOf;
  const isFuture = (r: LifecycleRental) =>
    !r.actual_start &&
    ["planned", "unconfirmed"].includes(r.lifecycle_state) &&
    signedFutureTerms(r).length > 0;
  const rentals = (data?.rentals || []).filter(
    (r) =>
      r.purpose !== "purchase" &&
      r.lifecycle_state !== "canceled" &&
      !r.owner_review?.neverInstalled &&
      (isInstalled(r) || isFuture(r)),
  );
  const ids = [...new Set(rentals.map((r) => r.customer_id))];
  for (const customerId of ids) {
    const name =
      state.customers.find((c) => c.id === customerId)?.name ||
      "Unknown customer";
    const exclude = (reason: string) => gaps.push({ customerId, name, reason });
    const customerRentals = rentals.filter((r) => r.customer_id === customerId);
    const installed = customerRentals.filter(isInstalled);
    const future = customerRentals.filter(isFuture);
    const current = installed.filter(
      (r) => r.lifecycle_state === "active" && !r.actual_end,
    );
    const historical = installed.every(
      (r) =>
        r.lifecycle_state === "ended" &&
        validDay(r.actual_end) &&
        r.actual_end >= r.actual_start! &&
        r.actual_end <= asOf,
    );
    if (
      !current.length &&
      (!historical || (!installed.length && !future.length))
    ) {
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
        (isInstalled(rental) ||
          signedFutureTerms(rental).some((signed) => signed.id === t.id)) &&
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
    const installedCommitment = installed.length
      ? commitmentAsOf(state, customerId, asOf)
      : { value: 0, reasons: [], unverified: false };
    const futureLtv = future.length
      ? customerLtv(
          {
            ...state,
            lifecycle: {
              ...data!,
              rentals: future,
              terms: future.flatMap(signedFutureTerms),
            },
          },
          customerId,
        )
      : null;
    const commitment =
      scope === "all"
        ? {
            value:
              installedCommitment.value === null ||
              futureLtv?.committed === null
                ? null
                : installedCommitment.value + (futureLtv?.committed || 0),
            reasons: [
              ...installedCommitment.reasons,
              ...(futureLtv?.commitmentNotes || []),
            ],
            unverified: installedCommitment.unverified,
          }
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
      saunaType: isFuture(latestRental)
        ? normalizeSaunaType(originals[0].sauna_type)
        : latestInstalledType(state, customerId),
      status: current.length
        ? "current"
        : future.length
          ? "future"
          : "historical",
      monthlyRate: rates[0]! / 100,
      committedValue: commitment.value / 100,
      installedOn: latestRental.actual_start,
      unverified: commitment.unverified,
    });
  }
  points.sort(
    (a, b) =>
      a.name.localeCompare(b.name) || a.customerId.localeCompare(b.customerId),
  );
  return { points, gaps, eligible: ids.length };
}
