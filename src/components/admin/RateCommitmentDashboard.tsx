import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { pacificToday } from "@/lib/ltvTimeline";
import { rateCommitment, type RateCommitmentPoint } from "@/lib/rateCommitment";
import {
  scatterDomains,
  scatterHeight,
  spreadScatter,
} from "@/lib/scatterLayout";
import type { RentalWorkspace } from "@/lib/rentalModel";

const colors: Record<string, string> = {
  "Indoor Traditional": "#2563a6",
  "Outdoor Traditional": "#bd5d19",
  "Indoor Infrared": "#7c3ea3",
  "Outdoor Infrared": "#18816a",
  "Unknown type": "#64748b",
  "Multiple latest types": "#a32958",
};
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const statuses = ["current", "historical", "future"] as const;
function PointTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RateCommitmentPoint }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="max-w-xs rounded-lg border bg-background p-4 text-sm shadow-lg">
      <p className="font-semibold">{point.name}</p>
      <p>
        {point.saunaType} ·{" "}
        {point.status === "current"
          ? "Current"
          : point.status === "future"
            ? "Future · signed"
            : "Historical"}
      </p>
      <dl className="mt-3 space-y-1">
        <div>
          <dt className="inline">Original monthly base rate: </dt>
          <dd className="inline font-medium">{money(point.monthlyRate)}/mo</dd>
        </div>
        <div>
          <dt className="inline">Total committed value: </dt>
          <dd className="inline font-medium">{money(point.committedValue)}</dd>
        </div>
      </dl>
      {point.unverified && (
        <p className="mt-2 text-xs text-muted-foreground">
          Recorded terms; signature confirmation incomplete.
        </p>
      )}
    </div>
  );
}
export function RateCommitmentDashboard({ state }: { state: RentalWorkspace }) {
  const today = pacificToday();
  const [scope, setScope] = useState<"latest" | "all">("latest");
  const result = useMemo(
    () => rateCommitment(state, today, scope),
    [state, today, scope],
  );
  const types = useMemo(
    () => [...new Set(result.points.map((p) => p.saunaType))].sort(),
    [result],
  );
  const [chosen, setChosen] = useState<string[] | undefined>();
  const [status, setStatus] = useState<
    "all" | "current" | "historical" | "future"
  >("all");
  const visible = result.points.filter(
    (p) =>
      (chosen === undefined || chosen.includes(p.saunaType)) &&
      (status === "all" || p.status === status),
  );
  const [chartWidth, setChartWidth] = useState(850);
  const domain = scatterDomains(visible);
  const plotted = spreadScatter(visible, chartWidth);
  const groups = types.flatMap((type) =>
    statuses.map((status) => ({
      type,
      status,
      points: plotted.filter(
        (p) => p.saunaType === type && p.status === status,
      ),
    })),
  );
  return (
    <section
      aria-label="Monthly rate versus committed value"
      className="space-y-5 rounded-xl border bg-card p-5 sm:p-7"
    >
      <div>
        <h3 className="text-xl font-semibold">
          Monthly rate vs. committed value
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          One dot per customer · current, historical and signed future rentals ·
          as of {today}
        </p>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Y: original monthly base rent from the customer’s latest recorded
        agreement. X: original minimum rent and rental add-ons{" "}
        {scope === "latest"
          ? "from that latest agreement"
          : "across all their recorded agreements"}
        , including prepaid discounts. Deposits, tax, installation, delivery and
        purchases are excluded from committed value.
      </p>
      <div
        role="group"
        aria-label="Committed value scope"
        className="inline-flex flex-wrap gap-1 rounded-lg border p-1"
      >
        {(
          [
            ["latest", "Latest agreement"],
            ["all", "All agreements combined"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={scope === value ? "default" : "ghost"}
            aria-pressed={scope === value}
            onClick={() => setScope(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Sauna type · installed or contracted
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {types.map((type) => (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm"
              key={type}
            >
              <input
                type="checkbox"
                checked={chosen === undefined || chosen.includes(type)}
                onChange={(e) =>
                  setChosen(
                    e.target.checked
                      ? [...new Set([...(chosen ?? types), type])]
                      : (chosen ?? types).filter((t) => t !== type),
                  )
                }
              />
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[type] || "#64748b" }}
              />
              {type}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Rental status"
          className="flex flex-wrap gap-1 rounded-lg border p-1"
        >
          {(["all", ...statuses] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "ghost"}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {s === "all"
                ? "All statuses"
                : s === "current"
                  ? "● Current"
                  : s === "future"
                    ? "▲ Future · signed"
                    : "◆ Historical"}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setChosen(undefined);
            setStatus("all");
          }}
        >
          Reset filters
        </Button>
      </div>
      <p role="status" className="text-sm">
        {visible.length} customers shown ·{" "}
        {visible.filter((p) => p.status === "current").length} current ·{" "}
        {visible.filter((p) => p.status === "historical").length} historical ·{" "}
        {visible.filter((p) => p.status === "future").length} future.{" "}
        {result.gaps.length} excluded for missing or ambiguous information.
      </p>
      {visible.length > 0 ? (
        <div
          className="min-w-0 w-full"
          style={{ height: scatterHeight }}
          role="img"
          aria-label="Scatter plot: total committed value on the horizontal axis and monthly base rate on the vertical axis. Circles are current customers; diamonds are historical customers; triangles are future customers with signed agreements."
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            onResize={(width) => setChartWidth(width)}
          >
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 40, left: 16 }}
              accessibilityLayer
            >
              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <XAxis
                type="number"
                dataKey="plotCommitment"
                name="Total committed value"
                unit=""
                domain={[0, domain.x]}
                tickFormatter={money}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Total committed value ($)",
                  position: "bottom",
                  offset: 22,
                }}
              />
              <YAxis
                type="number"
                dataKey="plotRate"
                name="Monthly base rate"
                domain={[0, domain.y]}
                tickFormatter={money}
                width={70}
                tick={{ fontSize: 11 }}
                label={{
                  value: "Monthly rate ($/mo)",
                  angle: -90,
                  position: "insideLeft",
                  offset: -6,
                  style: { textAnchor: "middle", fontSize: 12 },
                }}
              />
              <Tooltip
                content={<PointTooltip />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              {groups
                .filter((g) => g.points.length)
                .map((g) => (
                  <Scatter
                    key={`${g.type}-${g.status}`}
                    name={`${g.type} · ${g.status}`}
                    data={g.points}
                    fill={colors[g.type] || "#64748b"}
                    fillOpacity={0.75}
                    stroke="hsl(var(--background))"
                    strokeWidth={1}
                    shape={
                      g.status === "current"
                        ? "circle"
                        : g.status === "future"
                          ? "triangle"
                          : "diamond"
                    }
                    isAnimationActive={false}
                  />
                ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No customers with known rates and commitments match these filters.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        ● Circle = current · ◆ Diamond = historical · ▲ Triangle = signed
        future. Nearby dots are spread apart so every customer is visible and
        dense clusters stay visible. Hover for the customer’s exact amounts;
        displayed positions are approximate. The table also lists exact values.
      </p>
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Customer values · {visible.length}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Customer",
                  "Sauna type",
                  "Status",
                  "Original base rate",
                  "Total committed value",
                ].map((h) => (
                  <th className="p-2" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr className="border-t" key={p.customerId}>
                  <td className="p-2">
                    {p.name}
                    {p.unverified && (
                      <span className="block text-xs text-muted-foreground">
                        Signature unverified
                      </span>
                    )}
                  </td>
                  <td className="p-2">{p.saunaType}</td>
                  <td className="p-2 capitalize">{p.status}</td>
                  <td className="p-2 tabular-nums">
                    {money(p.monthlyRate)}/mo
                  </td>
                  <td className="p-2 tabular-nums">
                    {money(p.committedValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {!!result.gaps.length && (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Missing or ambiguous information · {result.gaps.length}
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {result.gaps.map((g) => (
              <li key={g.customerId}>
                <strong>{g.name}</strong> — {g.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-xs text-muted-foreground">
        Current means an active installed rental. Historical means all installed
        rentals have recorded returns. Future means a signed rental agreement
        awaiting installation; unsigned drafts, waitlist-only requests and
        purchases are excluded. Each customer appears once: active customers
        stay current, otherwise a signed upcoming rental is future. Future
        agreements use the contracted sauna type; this is not a confirmed
        indoor/outdoor installation. Installed rentals use confirmed
        installation locations; catalog conflicts and missing confirmations are
        listed in Rentals → Installation placement review; unknown types remain
        labeled. Later waivers, cash payments and post-minimum rate changes do
        not change original committed value.
      </p>
    </section>
  );
}
