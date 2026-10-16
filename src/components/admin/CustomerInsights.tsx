import { useMemo, useState } from "react";
import {
  Search,
  ArrowUpRight,
  Clock3,
  Users,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { customerHistory as data } from "@/dev/customerHistory";
import {
  acquisitionCohort,
  addMonth,
  customerValue,
  monthlyActivity,
  valueTrend,
} from "@/lib/customerMetrics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { previewEnabled } from "@/lib/runtime";

const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const monthLabel = (month: string) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
const months = Array.from({ length: 9 }, (_, i) => addMonth("2026-01", i));
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function CustomerInsights() {
  const [range, setRange] = useState("9");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("avery");
  const [view, setView] = useState<"customers" | "cohorts" | "definitions">(
    "customers",
  );
  const selected = data.customers.find((c) => c.id === selectedId)!;
  const rows = useMemo(
    () =>
      data.customers.filter((c) =>
        `${c.name} ${c.email} ${c.channel} ${c.scenario}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const activity = monthlyActivity(data, months.slice(-Number(range)));
  const acquired = sum(activity.map((m) => m.acquired));
  const spend = sum(activity.map((m) => m.spend));
  const values = data.customers
    .filter((c) => c.installedAt && c.installedAt <= data.asOf)
    .map((c) => customerValue(data, c.id));
  const selectedValue = customerValue(data, selected.id);
  const timeline = [
    ...selected.events.map((e, i) => ({
      ...e,
      key: `event-${i}`,
      source: "Operations · demo",
    })),
    ...data.revenue
      .filter((r) => r.customerId === selected.id)
      .map((r) => ({
        key: r.id,
        date: r.date,
        title: r.description,
        detail: money(r.amount),
        source: "Invoice / credit · Xero demo",
      })),
    ...data.cash
      .filter((r) => r.customerId === selected.id)
      .map((r) => ({
        key: r.id,
        date: r.date,
        title: r.description,
        detail: `${r.kind === "refund" ? "−" : ""}${money(r.amount)} · ${r.category}`,
        source: `One cash record · Stripe ${r.stripeId} ↔ Xero ${r.xeroId}`,
      })),
  ]
    .filter((e) => e.date <= data.asOf)
    .sort((a, b) => b.date.localeCompare(a.date));
  const cards = [
    {
      title: "Realized revenue LTV",
      value: money(sum(values.map((v) => v.revenue)) / values.length),
      detail: "Lifetime earned revenue per installed customer",
      icon: Users,
    },
    {
      title: "Illustrative contribution",
      value: money(sum(values.map((v) => v.contribution))),
      detail: "Lifetime revenue less assumed variable costs",
      icon: TrendingUp,
    },
    {
      title: "Blended CAC",
      value: acquired ? money(spend / acquired) : "Not available",
      detail: `${money(spend)} spend / ${acquired} first installations · selected period`,
      icon: ArrowUpRight,
    },
    {
      title: "Rental collections",
      value: money(sum(activity.map((m) => m.rentalCollections))),
      detail: "Gross rental cash received · selected period",
      icon: Receipt,
    },
  ];
  // This prototype never becomes a public or production financial data source.
  if (!previewEnabled) return null;
  return (
    <section className="space-y-6 py-4" aria-label="Customer insights">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Customer intelligence
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            The story behind every rental
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Follow customer relationships, understand retention, and see how
            acquisition turns into value.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
            Synthetic data · Sep 30, 2026
          </span>
          <label className="text-sm">
            <span className="sr-only">Reporting period</span>
            <select
              aria-label="Reporting period"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-md border bg-background p-2"
            >
              <option value="9">Jan–Sep 2026</option>
              <option value="6">Apr–Sep 2026</option>
              <option value="3">Jul–Sep 2026</option>
            </select>
          </label>
        </div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
        Prototype only. Stripe and Xero are not connected. All customers,
        amounts, costs and acquisition attribution are invented. LTV is
        historical revenue, not predicted profit.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <div className="flex justify-between text-sm text-muted-foreground">
              {title}
              <Icon size={17} />
            </div>
            <div className="my-3 text-3xl font-semibold tracking-tight tabular-nums">
              {value}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {detail}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <h3 className="font-semibold">Rental revenue and cash</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Earned rental revenue is net of credits. Collections are gross;
              refunds are shown separately. Deposits, tax, delivery and sales
              are excluded here.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {money(sum(activity.map((m) => m.rentalRefunds)))} rental refunds
          </span>
        </div>
        <div
          className="mt-5 h-64"
          role="img"
          aria-label="Monthly earned rental revenue, rental collections and refunds"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={monthLabel}
                tick={{ fontSize: 11 }}
              />
              <YAxis tickFormatter={money} width={65} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={monthLabel}
                formatter={(value: number) => money(value)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                isAnimationActive={false}
                dataKey="rentalRevenue"
                name="Earned rental revenue"
                fill="#254f46"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                isAnimationActive={false}
                dataKey="rentalCollections"
                name="Rental collections"
                fill="#a2b9ad"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                isAnimationActive={false}
                dataKey="rentalRefunds"
                name="Rental refunds"
                fill="#ce795d"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="flex gap-2 border-b pb-3">
        {(["customers", "cohorts", "definitions"] as const).map((key) => (
          <Button
            key={key}
            variant={view === key ? "default" : "ghost"}
            onClick={() => setView(key)}
          >
            {key === "customers"
              ? "Customer histories"
              : key === "cohorts"
                ? "Retention & payback"
                : "Metric definitions"}
          </Button>
        ))}
      </div>
      {view === "customers" && (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-xl border bg-card p-4">
            <label className="relative block">
              <Search
                className="absolute left-3 top-3 text-muted-foreground"
                size={16}
              />
              <Input
                aria-label="Search customer histories"
                placeholder="Search name, source or history…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <p className="my-3 text-xs text-muted-foreground">
              {rows.length} profiles · includes leads
            </p>
            <div className="space-y-2">
              {rows.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedId === c.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs tabular-nums">
                      {c.installedAt
                        ? money(customerValue(data, c.id).revenue)
                        : "Lead"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.scenario} · {c.channel}
                  </div>
                </button>
              ))}
              {!rows.length && (
                <p className="p-4 text-sm text-muted-foreground">
                  No matching customer histories.
                </p>
              )}
            </div>
          </div>
          <div
            className="min-w-0 rounded-xl border bg-card p-5"
            aria-label="Selected customer history"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{selected.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.email} · {selected.channel}
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {selected.scenario}
              </span>
            </div>
            <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Revenue to date", selectedValue.revenue],
                ["Gross collections", selectedValue.collected],
                ["Revenue refunds", selectedValue.refunded],
                ["Assumed contribution", selectedValue.contribution],
              ].map(([label, amount]) => (
                <div key={String(label)} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {money(Number(amount))}
                  </p>
                </div>
              ))}
            </div>
            <p className="mb-5 text-xs text-muted-foreground">
              Lifetime totals through Sep 30. Revenue includes rental, delivery
              and sale charges, net of credits. Collections exclude
              deposits/taxes and are shown before refunds. Costs exclude
              acquisition, overhead and rental-unit depreciation.
            </p>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Clock3 size={16} />
              Relationship timeline
            </h4>
            <ol className="max-h-[460px] space-y-4 overflow-y-auto pr-2">
              {timeline.map((event) => (
                <li
                  key={event.key}
                  className="border-l-2 border-primary/20 pl-4"
                >
                  <div className="flex flex-wrap justify-between gap-1 text-sm">
                    <span className="font-medium">{event.title}</span>
                    <time className="text-xs text-muted-foreground">
                      {event.date}
                    </time>
                  </div>
                  <p className="mt-1 text-sm">{event.detail}</p>
                  <p className="mt-1 break-words text-[11px] text-muted-foreground">
                    {event.source}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {view === "cohorts" && (
        <div className="space-y-5">
          <div className="overflow-x-auto rounded-xl border bg-card p-5">
            <h3 className="font-semibold">
              Rental retention by first installation
            </h3>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              Share still renting at each month-end. Purchases end rental
              retention. M0 is the installation month; — means no customers or
              not yet observed. Period filter selects acquisition cohorts.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-2">Cohort</th>
                  <th className="p-2">Customers</th>
                  {months.map((_, age) => (
                    <th className="p-2" key={age}>
                      M{age}
                    </th>
                  ))}
                  <th className="p-2">Assumed CAC</th>
                  <th className="p-2">Payback</th>
                </tr>
              </thead>
              <tbody>
                {activity
                  .map(({ month }) => acquisitionCohort(data, month))
                  .map((row) => (
                    <tr key={row.month} className="border-t">
                      <th className="whitespace-nowrap p-2 text-left font-medium">
                        {monthLabel(row.month)}
                      </th>
                      <td className="p-2">{row.customers}</td>
                      {row.retention.map((rate, age) => (
                        <td key={age} className="p-1">
                          <div
                            className="rounded px-2 py-3 text-center text-xs tabular-nums"
                            style={{
                              background:
                                rate === null
                                  ? "transparent"
                                  : `rgba(37,79,70,${0.08 + rate * 0.2})`,
                            }}
                          >
                            {rate === null ? "—" : `${Math.round(rate * 100)}%`}
                          </div>
                        </td>
                      ))}
                      <td className="whitespace-nowrap p-2">
                        {row.cac === null ? "—" : money(row.cac)}
                      </td>
                      <td className="whitespace-nowrap p-2 text-xs">
                        {!row.customers
                          ? "No customers"
                          : row.spend === 0
                            ? "No spend"
                            : row.payback === null
                              ? "Not recovered"
                              : `Month ${row.payback}`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">LTV and CAC over time</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              LTV is cumulative revenue per installed customer at each
              month-end; CAC is acquisition spend per new installation in that
              month. These describe different populations. Gaps mean no new
              customers, not zero CAC.
            </p>
            <div
              className="my-4 h-56"
              role="img"
              aria-label="Historical realized revenue LTV and monthly acquisition cost"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={valueTrend(
                    data,
                    activity.map((row) => row.month),
                  )}
                  margin={{ left: 10, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={monthLabel}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={money}
                    width={65}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    labelFormatter={monthLabel}
                    formatter={(value: number) => money(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    isAnimationActive={false}
                    dataKey="ltv"
                    name="Realized revenue LTV to date"
                    stroke="#254f46"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                  <Line
                    isAnimationActive={false}
                    dataKey="cac"
                    name="Monthly assumed CAC"
                    stroke="#ce795d"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <h4 className="font-semibold">Acquisition efficiency</h4>
            <p className="my-2 text-sm text-muted-foreground">
              Assumed spend includes every channel, including months without
              installations. CAC is unavailable when no customers were acquired;
              that spend is still included in the period’s blended CAC. Payback
              is the first month cumulative cohort contribution reaches cohort
              acquisition spend, with installation month counted as month 1. It
              is observed, not forecast.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {activity.map((row) => (
                <div
                  className="rounded-lg bg-muted/50 p-3 text-sm"
                  key={row.month}
                >
                  <div className="font-medium">{monthLabel(row.month)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {money(row.spend)} spend · {row.acquired} acquired
                  </div>
                  <div className="mt-1">
                    CAC{" "}
                    {row.acquired
                      ? money(row.spend / row.acquired)
                      : "unavailable"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {view === "definitions" && (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [
              "Customer",
              "First installed rental customer, counted once. Leads are excluded; cancelled renters and buyers remain in historical customer value.",
            ],
            [
              "Realized revenue LTV",
              "Total earned rental, delivery and sale revenue less credit notes / installed customers, through the fixed as-of date. Excludes refundable deposits and tax. Lifetime cards do not change with the reporting-period filter.",
            ],
            [
              "Contribution",
              "Earned revenue less illustrative delivery, servicing, payment fees and sale-unit costs. Acquisition spend, overhead and rental-unit depreciation are excluded. This is not net profit.",
            ],
            [
              "CAC and attribution",
              "Illustrative acquisition spend / first installations in the selected months. Channel labels are invented. Real spend, attribution window, household identity and channel allocation still need agreement.",
            ],
            [
              "Revenue vs cash",
              "Invoice service periods drive earned revenue; Stripe receipts drive collections. Credit notes reduce revenue; cash refunds reduce cash. One payment can carry both Stripe and Xero IDs and must never be counted twice. Demo billing assumes full months, without proration.",
            ],
            [
              "Missing before live metrics",
              "Verified identity mapping, historical invoices/credit notes, payment reconciliation, variable costs, unit costs/depreciation, ad spend and acquisition dates. No predictive LTV or extrapolated renewals are shown.",
            ],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
