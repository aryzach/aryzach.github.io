import type { LifecycleRental } from "./lifecycleModel.ts";
import type { RentalWorkspace } from "./rentalModel.ts";
export type InstallationLocation = "indoor" | "outdoor";
export const locationFromType = (
  value: string | null | undefined,
): InstallationLocation | null => {
  const indoor = /(^|[^a-z])indoor([^a-z]|$)/i.test(value || ""),
    outdoor = /(^|[^a-z])outdoor([^a-z]|$)/i.test(value || "");
  return indoor === outdoor ? null : indoor ? "indoor" : "outdoor";
};
export function agreedLocation(
  state: RentalWorkspace,
  rentalId: string,
  day: string,
) {
  const terms = (state.lifecycle?.terms || []).filter((t) => {
    const a = state.lifecycle?.agreements.find((a) => a.id === t.agreement_id);
    const date = t.effective_from || a?.signed_on || a?.agreement_date || day;
    return (
      t.rental_id === rentalId &&
      !["superseded", "voided", "canceled"].includes(t.state) &&
      !["superseded", "voided"].includes(a?.signing_state || "") &&
      date <= day &&
      (!t.effective_until || t.effective_until > day)
    );
  });
  const date = (t: (typeof terms)[number]) => {
    const a = state.lifecycle?.agreements.find((a) => a.id === t.agreement_id);
    return t.effective_from || a?.signed_on || a?.agreement_date || day;
  };
  const latest = terms.map(date).sort().at(-1);
  const current = terms.filter((t) => date(t) === latest),
    locations = current.map(
      (t) => t.agreed_location ?? locationFromType(t.sauna_type),
    );
  return {
    location:
      locations.length && locations.every((l) => l && l === locations[0])
        ? locations[0]
        : null,
    terms: current,
  };
}
export function confirmedInstallation(
  state: RentalWorkspace,
  rental: LifecycleRental,
  day: string,
) {
  const placements = (state.lifecycle?.placements || [])
    .filter((p) => p.rental_id === rental.id && p.installed_on <= day)
    .sort((a, b) => b.installed_on.localeCompare(a.installed_on));
  const latestDay = placements[0]?.installed_on || rental.actual_start;
  const latest = placements.filter((p) => p.installed_on === latestDay);
  const records = (state.lifecycle?.installationLocations || []).filter(
    (l) =>
      l.rental_id === rental.id &&
      l.installed_on === latestDay &&
      (latest.length
        ? latest.some((p) => p.id === l.placement_id)
        : !l.placement_id),
  );
  const expected = latestDay
    ? agreedLocation(state, rental.id, latestDay).location
    : null;
  const location = records[0]?.location;
  const compatible = latest.every((p) => {
    const a = state.assets.find((a) => a.id === p.asset_id);
    return !a?.locations?.length || a.locations.includes(location);
  });
  const confirmed =
    !!location &&
    records.length === (latest.length || 1) &&
    records.every((l) => l.location === location) &&
    location === expected &&
    compatible;
  return {
    location: confirmed ? location : null,
    records,
    placement: latest[0],
    needsReview: !confirmed,
    catalogConflict: records.some((l) => l.catalog_conflict),
    reason: !expected
      ? "Agreement placement is missing or ambiguous."
      : !compatible
        ? "Confirmed placement conflicts with the sauna capability."
        : !confirmed
          ? "Installation location needs confirmation."
          : "",
  };
}
export function confirmedSaunaType(
  state: RentalWorkspace,
  rental: LifecycleRental,
  day: string,
) {
  const actual = confirmedInstallation(state, rental, day);
  if (!actual.location) return "Placement needs review";
  const terms = agreedLocation(
    state,
    rental.id,
    actual.records[0].installed_on,
  ).terms;
  const type =
    actual.placement?.type_at_install ||
    terms[0]?.sauna_type ||
    String(rental.owner_review?.saunaType || "");
  const heat = /infrared/i.test(type)
    ? "Infrared"
    : /traditional|steam|dry/i.test(type)
      ? "Traditional"
      : null;
  return heat
    ? `${actual.location === "indoor" ? "Indoor" : "Outdoor"} ${heat}`
    : "Unknown type";
}
