import { useState } from "react";
import { agreedLocation } from "@/lib/installationLocation";
import type { RentalWorkspace } from "@/lib/rentalModel";
import type { LifecycleRental } from "@/lib/lifecycleModel";
export default function InstallationPlacementFields({
  state,
  rental,
  day,
  review = false,
}: {
  state: RentalWorkspace;
  rental: LifecycleRental;
  day: string;
  review?: boolean;
}) {
  const placements = (state.lifecycle?.placements || [])
    .filter((p) => p.rental_id === rental.id)
    .sort((a, b) => b.installed_on.localeCompare(a.installed_on));
  const [record, setRecord] = useState(placements[0]?.id || "");
  const selectedDay = review
    ? placements.find((p) => p.id === record)?.installed_on ||
      rental.actual_start ||
      day
    : day;
  const expected = agreedLocation(state, rental.id, selectedDay).location;
  return (
    <section
      className="space-y-3 rounded-lg border p-3 text-sm"
      aria-label="Installation placement confirmation"
    >
      {review && (
        <label className="grid gap-1">
          Installation record
          <select
            className="h-9 rounded-md border bg-background px-2"
            name="placementId"
            value={record}
            onChange={(e) => setRecord(e.target.value)}
          >
            {!placements.some(
              (p) => p.installed_on === rental.actual_start,
            ) && (
              <option value="">
                First installation · {rental.actual_start || "Date unknown"} ·
                numbered unit not recorded
              </option>
            )}
            {placements.map((p) => (
              <option key={p.id} value={p.id}>
                #
                {state.assets.find((a) => a.id === p.asset_id)?.code ||
                  "Unknown unit"}{" "}
                · {p.installed_on}
              </option>
            ))}
          </select>
        </label>
      )}
      <p>
        <strong>Agreement placement:</strong>{" "}
        {expected === null
          ? "Needs review"
          : expected === "indoor"
            ? "Indoor"
            : "Outdoor"}{" "}
        · {selectedDay}
      </p>
      <label className="grid gap-1">
        Actual installation placement
        <select
          name="installationLocation"
          required
          defaultValue=""
          className="h-9 rounded-md border bg-background px-2"
        >
          <option value="" disabled>
            Explicitly confirm indoor or outdoor
          </option>
          <option value="indoor" disabled={expected !== "indoor"}>
            Indoor
          </option>
          <option value="outdoor" disabled={expected !== "outdoor"}>
            Outdoor
          </option>
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        Confirm where this rental was actually installed. It must match the
        agreement. A sauna’s indoor/outdoor capability does not determine its
        actual placement.
      </p>
      {!expected && (
        <p role="alert" className="text-amber-800">
          Record or resolve the agreement placement before saving. No location
          will be guessed from the sauna catalog.
        </p>
      )}
    </section>
  );
}
