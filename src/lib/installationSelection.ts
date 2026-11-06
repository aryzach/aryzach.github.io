import type { LifecycleRental } from "./lifecycleModel.ts";
import type { RentalWorkspace, SaunaAsset } from "./rentalModel.ts";

/** Inventory's future links belong to this rental, not every booking by the same customer. */
export function installationSelection(
  state: RentalWorkspace,
  rental: LifecycleRental,
) {
  const booking = state.bookings?.find((b) =>
    rental.originating_reservation_id
      ? b.id === rental.originating_reservation_id
      : b.rentalId === rental.id && b.customerId === rental.customer_id,
  );
  const ids = [
    ...new Set(
      state.legacyLinks
        ?.filter((l) => l.rentalId === rental.id && l.kind === "future")
        .map((l) => l.assetId) || [],
    ),
  ];
  const reserved = ids
    .map((id) => state.assets.find((a) => a.id === id))
    .filter((a): a is SaunaAsset => !!a);
  const booked = state.assets.find((a) => a.id === booking?.saunaId);
  const conflict =
    !!booking?.saunaId && ids.length > 0 && !ids.includes(booking.saunaId);
  const canceled = booking?.state === "cancelled";
  const single = reserved.length === 1 && ids.length === 1 ? reserved[0] : null;
  const preset =
    single &&
    !single.retired &&
    !["Sold", "Retired"].includes(single.sourceStatus || "") &&
    !conflict &&
    !canceled
      ? single.id
      : "";
  return {
    reserved,
    booked,
    booking,
    conflict,
    canceled,
    preset,
    missing: reserved.length !== ids.length,
  };
}
