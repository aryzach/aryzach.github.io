import { useState } from "react";
import type { LifecycleRental } from "@/lib/lifecycleModel";
import type { RentalWorkspace, SaunaAsset } from "@/lib/rentalModel";

import { installationSelection } from "@/lib/installationSelection";

const label = (a: SaunaAsset) =>
  `#${a.code} · ${a.typeName || a.model || "Type unknown"} · ${a.sourceStatus || "Status not recorded"}`;

export default function InstallationSaunaSelect({
  state,
  rental,
}: {
  state: RentalWorkspace;
  rental: LifecycleRental;
}) {
  const selection = installationSelection(state, rental);
  const [value, setValue] = useState(selection.preset);
  const options = [...state.assets].sort(
    (a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }) ||
      a.id.localeCompare(b.id),
  );
  const selected = state.assets.find((a) => a.id === value);
  const different =
    !!value &&
    selection.reserved.length > 0 &&
    !selection.reserved.some((a) => a.id === value);
  return (
    <div className="space-y-3">
      <section
        aria-label="Reserved sauna for this booking"
        className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm"
      >
        <h3 className="font-semibold">Reserved for this booking</h3>
        {selection.reserved.length > 0 ? (
          <>
            {selection.reserved.map((a) => (
              <p key={a.id} className="mt-1 font-medium">
                {label(a)}
              </p>
            ))}
            <p className="mt-1 text-xs text-muted-foreground">
              Inventory → Future customer:{" "}
              {selection.booking?.customerName ||
                state.customers.find((c) => c.id === rental.customer_id)
                  ?.name ||
                "This customer"}
              .
            </p>
          </>
        ) : (
          <p className="mt-1">
            No future-customer sauna assignment is recorded for this rental.
          </p>
        )}
        {selection.booked &&
          !selection.reserved.some((a) => a.id === selection.booked!.id) && (
            <p className="mt-2 text-xs">
              Booking lists {label(selection.booked)}.{" "}
              {selection.reserved.length
                ? "This differs from the inventory assignment."
                : "It is not recorded as this rental’s future-customer assignment."}
            </p>
          )}
        {selection.booking?.installOn && (
          <p className="mt-2 text-xs">
            Agreed installation date: {selection.booking.installOn}. Use the
            actual date when confirming installation.
          </p>
        )}
        {(selection.conflict ||
          selection.canceled ||
          selection.missing ||
          selection.reserved.length > 1) && (
          <p role="status" className="mt-2 text-xs text-amber-800">
            {selection.canceled
              ? "This booking is cancelled. Review it before recording an installation."
              : selection.conflict
                ? "The booking and inventory allocations disagree. Review the allocation in Bookings before saving."
                : selection.missing
                  ? "An assigned sauna is missing from the loaded inventory. Refresh history before choosing."
                  : "More than one future sauna is assigned. Review the allocations and choose the actual installed sauna."}{" "}
            No sauna has been preselected.
          </p>
        )}
      </section>
      <label className="grid gap-1 text-sm font-normal">
        Sauna installed
        <select
          name="assetId"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="" disabled>
            Choose the sauna actually installed
          </option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>
              {label(a)}
              {selection.reserved.some((r) => r.id === a.id)
                ? " · Reserved for this booking"
                : ""}
            </option>
          ))}
        </select>
      </label>
      {different && (
        <p role="status" className="text-xs text-amber-800">
          You selected {selected ? `#${selected.code}` : "a different sauna"}{" "}
          instead of the reserved sauna. Confirm this is the unit actually
          installed; booking and availability checks still apply.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Confirm the unit actually installed before saving. Selecting a sauna
        does not record an installation.
      </p>
    </div>
  );
}
