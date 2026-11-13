import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { displayMoney } from "@/lib/lifecycleModel";
import {
  saunaRecovery,
  compareRecoveryRows,
  compareRecoveryDates,
  recoveryStatusLabel,
  type RecoverySortKey,
  type RecoveryEntry,
  type RecoverySources,
  type RecoveryRow,
} from "@/lib/saunaRecovery";
import type { RentalWorkspace } from "@/lib/rentalModel";
const money = (n: number | null) => displayMoney(n);
export function SaunaRecoveryDashboard({
  state,
  onRead,
}: {
  state: RentalWorkspace;
  onRead?: () => Promise<RecoverySources>;
}) {
  const [sources, setSources] = useState<RecoverySources | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [includeHeaters, setIncludeHeaters] = useState(false);
  const [includeSales, setIncludeSales] = useState(true);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [type, setType] = useState("all");
  const [sort, setSort] = useState<{ key: RecoverySortKey; desc: boolean }>({
    key: "code",
    desc: false,
  });
  useEffect(() => {
    let canceled = false;
    setError("");
    const load = onRead
      ? onRead()
      : Promise.resolve(state.saunaRecoverySources);
    load
      .then((s) => {
        if (!canceled) {
          if (s) setSources(s);
          else setError("No copied sauna cost data is available yet.");
        }
      })
      .catch(() => {
        if (!canceled)
          setError("Could not load imported sauna costs. Try again.");
      });
    return () => {
      canceled = true;
    };
  }, [state, onRead, attempt]);
  const result = useMemo(
    () =>
      sources
        ? saunaRecovery(state, sources, includeHeaters, includeSales)
        : null,
    [state, sources, includeHeaters, includeSales],
  );
  const types = [...new Set(result?.rows.map((r) => r.type))].sort();
  const rows = (result?.rows || [])
    .filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (type === "all" || r.type === type) &&
        `${r.code} ${r.type}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => compareRecoveryRows(a, b, sort.key, sort.desc));
  const changeSort = (key: typeof sort.key) =>
    setSort((s) => ({ key, desc: s.key === key ? !s.desc : false }));
  const columns: [string, RecoverySortKey][] = [
    ["Sauna", "code"],
    ["Type", "type"],
    ["Recorded cost", "cost"],
    ["Rental cash", "rent"],
    ["Sale proceeds", "sale"],
    ["Recovered", "recovered"],
    ["Remaining", "remaining"],
    ["Recovered %", "percentage"],
    ["Status / source details", "status"],
  ];
  const totals = rows.reduce(
    (a, r) => ({
      cost: a.cost + (r.cost ?? r.heaterShare),
      recovered: a.recovered + r.recovered,
      paid: a.paid + Number(r.status === "paid"),
      missing: a.missing + Number(r.status === "unknown"),
    }),
    { cost: 0, recovered: 0, paid: 0, missing: 0 },
  );
  return (
    <section
      className="space-y-5 rounded-xl border bg-card p-5 sm:p-7"
      aria-label="Sauna cost recovery"
    >
      <div>
        <h3 className="text-xl font-semibold">Sauna cost recovery</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {includeSales
            ? "Rental cash collected + sauna sale proceeds"
            : "Rental cash collected only"}
          , compared with each unit’s recorded purchase and inbound shipping
          costs.
        </p>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        Based on recorded costs, not net profit. The optional heater allocation
        is an estimate shared equally across units currently labeled
        Traditional, including sold units. Supplier bill lines count as purchase
        costs; payments against those bills are not counted again. Other missing
        costs remain unknown. Deposits, customer sales tax, delivery fees and
        card surcharges do not count as recovered revenue. Prepaid rent does
        count. Refunds reduce recovery.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p>
          {sources?.snapshotAt
            ? `Xero imported ${new Date(sources.snapshotAt).toLocaleString()}`
            : "Loading imported Xero data…"}
          {sources?.snapshotAt &&
          Date.now() - Date.parse(sources.snapshotAt) > 36 * 3600000
            ? " · Data is stale"
            : ""}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAttempt((n) => n + 1)}
        >
          Reload imported data
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {result && (
        <>
          <div className="rounded-lg border p-4">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={includeHeaters}
                onChange={(e) => setIncludeHeaters(e.target.checked)}
              />
              Include heater costs
            </label>
            <p className="mt-2 text-sm text-muted-foreground">
              {money(result.heaterTotal)} total heater cost, less refunds ·{" "}
              {result.traditionalCount} Traditional saunas.{" "}
              {includeHeaters
                ? "The total is divided equally across all those units, regardless of the table filters."
                : "Heater costs are counted only where Xero tags them to a unit."}{" "}
              Units without a recorded sauna purchase cost remain “Cost
              unknown.”
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={includeSales}
                onChange={(e) => setIncludeSales(e.target.checked)}
              />
              Include sauna sales
            </label>
            <p className="mt-2 text-sm text-muted-foreground">
              {includeSales
                ? "Sale proceeds, less refunds and customer sales tax, count toward recovered revenue."
                : "Only rental revenue counts toward recovered revenue and paid-off status. Sale proceeds are excluded."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Recorded costs", money(totals.cost)],
              ["Recovered revenue", money(totals.recovered)],
              ["Paid off · recorded costs", String(totals.paid)],
              ["Missing cost / needs review", String(totals.missing)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Input
              className="max-w-xs"
              aria-label="Search sauna cost recovery"
              placeholder="Search sauna number or type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Cost recovery status"
              className="rounded-md border bg-background p-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All saunas</option>
              <option value="paid">Paid off · recorded costs</option>
              <option value="unpaid">Not paid off · recorded costs</option>
              <option value="unknown">Missing cost / needs review</option>
            </select>
            <select
              aria-label="Cost recovery sauna type"
              className="rounded-md border bg-background p-2"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">All sauna types</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            {rows.length} saunas. Income follows Xero’s numbered-sauna tags
            across customers; untagged or ambiguous entries stay unassigned.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted">
                <tr>
                  {columns.map(([label, key]) => (
                    <th
                      key={key}
                      className="p-3 text-left"
                      aria-sort={
                        sort.key === key
                          ? sort.desc
                            ? "descending"
                            : "ascending"
                          : "none"
                      }
                    >
                      <button
                        className="whitespace-nowrap text-left font-semibold focus-visible:outline focus-visible:outline-2"
                        onClick={() => changeSort(key)}
                      >
                        {label}{" "}
                        <span aria-hidden="true">
                          {sort.key === key ? (sort.desc ? "↓" : "↑") : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <RecoveryTableRow key={r.id} row={r} />
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <p role="status">No saunas match these filters.</p>}
          {!!result.issues.length && (
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-medium">
                Unassigned Xero entries ({result.issues.length})
              </summary>
              <p className="my-3 text-sm text-muted-foreground">
                These entries do not affect any unit’s paid-off status. Match
                the numbered sauna in Xero to include them.
              </p>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Kind</th>
                      <th className="p-2 text-left">Amount</th>
                      <th className="p-2 text-left">Needs review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...result.issues]
                      .sort((a, b) => compareRecoveryDates(a.date, b.date))
                      .map((issue, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{issue.date}</td>
                          <td className="p-2">{issue.kind}</td>
                          <td className="p-2">{money(issue.amount)}</td>
                          <td className="p-2">
                            <a
                              className="underline"
                              target="_blank"
                              rel="noreferrer"
                              href={
                                issue.sourceUrl ||
                                `https://go.xero.com/Bank/ViewTransaction.aspx?bankTransactionID=${encodeURIComponent(issue.sourceId)}`
                              }
                            >
                              {issue.reason}
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
function RecoveryTableRow({ row: r }: { row: RecoveryRow }) {
  return (
    <tr className="border-b align-top">
      <td className="p-3 font-semibold">#{r.code}</td>
      <td className="p-3">{r.type}</td>
      <td className="p-3 whitespace-nowrap">
        {money(r.cost)}
        {!!r.heaterShare && (
          <p className="mt-1 text-xs text-muted-foreground">
            Heater estimate: {money(r.heaterShare)}
            {r.cost === null ? " · purchase cost missing" : " included"}
          </p>
        )}
      </td>
      <td className="p-3 whitespace-nowrap">{money(r.rent)}</td>
      <td className="p-3 whitespace-nowrap">{money(r.sale)}</td>
      <td className="p-3 whitespace-nowrap font-medium">
        {money(r.recovered)}
      </td>
      <td className="p-3 whitespace-nowrap">{money(r.remaining)}</td>
      <td className="p-3">
        {r.percentage === null ? "—" : `${r.percentage.toFixed(1)}%`}
      </td>
      <td className="p-3">
        <span
          className={`inline-block whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${r.status === "paid" ? "bg-green-100 text-green-800" : r.status === "unpaid" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}
        >
          {recoveryStatusLabel(r.status)}
        </span>
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="mt-2 block text-left text-xs underline"
              aria-label={`View ${r.entries.length} source entries for sauna #${r.code}`}
            >
              {r.entries.length} source entries
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sauna #{r.code} · Source entries</DialogTitle>
              <DialogDescription>
                {r.type} · {r.entries.length} entries · Newest first. Names come
                from the source Xero contact. Supplier bills record costs, not
                payments.
              </DialogDescription>
            </DialogHeader>
            {r.entries.length ? (
              <ul className="divide-y">
                {r.entries.map((entry, i) => (
                  <li key={`${entry.sourceId}:${i}`} className="space-y-1 py-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">
                        {entry.date || "Date unknown"} ·{" "}
                        {entry.kind === "cost"
                          ? "Purchase cost"
                          : entry.kind === "rent"
                            ? "Rental cash"
                            : "Sale proceeds"}
                      </span>
                      <span className="font-semibold">
                        {money(entry.amount)}
                      </span>
                    </div>
                    <p className="text-sm">
                      {entryPartyLabel(entry)}:{" "}
                      <span className="font-medium">
                        {entry.contactName ||
                          "Unknown — no name recorded in Xero"}
                      </span>
                    </p>
                    <p className="whitespace-pre-line break-words text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm underline"
                      href={
                        entry.sourceUrl ||
                        `https://go.xero.com/Bank/ViewTransaction.aspx?bankTransactionID=${encodeURIComponent(entry.sourceId)}`
                      }
                    >
                      View in Xero ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No source entries recorded.</p>
            )}
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
}
function entryPartyLabel(entry: RecoveryEntry) {
  return entry.sourceType === "bill"
    ? "Supplier (bill)"
    : entry.direction === "RECEIVE"
      ? "Paid by"
      : entry.direction === "SPEND"
        ? "Paid to"
        : "Xero contact";
}
