import { confirmedInstallation } from "@/lib/installationLocation";
import { pacificToday } from "@/lib/ltvTimeline";
import { Button } from "@/components/ui/button";
import type { RentalWorkspace } from "@/lib/rentalModel";
import type { LifecycleRental } from "@/lib/lifecycleModel";
export default function InstallationLocationReview({
  state,
  onReview,
}: {
  state: RentalWorkspace;
  onReview?: (rental: LifecycleRental) => void;
}) {
  const rows = (state.lifecycle?.rentals || [])
    .filter(
      (r) =>
        r.actual_start &&
        r.purpose !== "purchase" &&
        r.lifecycle_state !== "canceled" &&
        !r.owner_review?.neverInstalled,
    )
    .map((r) => ({ r, ...confirmedInstallation(state, r, pacificToday()) }));
  const flagged = rows.filter((r) => r.needsReview || r.catalogConflict);
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Installation placement review ·{" "}
        {rows.filter((r) => r.needsReview).length} need review ·{" "}
        {rows.filter((r) => r.catalogConflict && !r.needsReview).length}{" "}
        corrected catalog conflicts
      </summary>
      <p className="my-3 text-sm text-muted-foreground">
        Capability, agreement and actual installation are separate. Corrected
        conflicts retain the old catalog label as evidence; confirmed placement
        follows the owner’s agreement-matching rule.
      </p>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Customer / sauna",
                "Actual installation",
                "Review details",
                "Action",
              ].map((h) => (
                <th key={h} className="p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flagged.map((x) => (
              <tr key={x.r.id} className="border-t">
                <td className="p-2">
                  {state.customers.find((c) => c.id === x.r.customer_id)
                    ?.name || "Unknown customer"}
                  {x.placement && (
                    <span className="block">
                      #
                      {state.assets.find((a) => a.id === x.placement?.asset_id)
                        ?.code || "Unknown unit"}
                    </span>
                  )}
                </td>
                <td className="p-2">
                  {x.location
                    ? x.location === "indoor"
                      ? "Indoor"
                      : "Outdoor"
                    : "Needs review"}
                </td>
                <td className="p-2">
                  {x.needsReview
                    ? x.reason
                    : `Corrected catalog conflict: original label “${x.placement?.type_at_install}”; confirmed ${x.location} from agreement.`}
                </td>
                <td className="p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!onReview}
                    onClick={() => onReview?.(x.r)}
                  >
                    Review placement
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!flagged.length && (
          <p className="p-3 text-sm text-muted-foreground">
            No placement conflicts in the loaded records.
          </p>
        )}
      </div>
    </details>
  );
}
