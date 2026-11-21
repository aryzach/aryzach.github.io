import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  filterBillingRows,
  sortBillingRows,
  type BillingRow,
  type BillingSortValue,
} from "@/lib/billingHistory";

const money = (n: number | null | undefined) =>
  n == null
    ? "Unknown"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(n);
const date = (d: string | null) =>
  d
    ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
const amount = (n: number | null | undefined) =>
  n == null ? <span className="text-muted-foreground">Unknown</span> : money(n);
const optional = (selected: boolean | null, price: number | null) =>
  selected === false
    ? "Not selected"
    : selected === true
      ? `${money(price)}/mo`
      : "Unknown";
interface Column {
  key: string;
  label: string;
  value: (r: BillingRow) => BillingSortValue;
  cell?: (r: BillingRow) => ReactNode;
  initial?: boolean;
}
const columns: Column[] = [
  { key: "name", label: "Customer", value: (r) => r.name, initial: true },
  {
    key: "returned",
    label: "Returned on",
    value: (r) => r.return_date,
    initial: true,
    cell: (r) =>
      r.return_unknown ? (
        <span className="text-amber-800">Returned — date unknown</span>
      ) : (
        date(r.return_date)
      ),
  },
  {
    key: "status",
    label: "Status",
    value: (r) => r.status,
    initial: true,
    cell: (r) => (
      <span className="inline-block whitespace-nowrap rounded-full bg-muted px-2 py-1 text-xs font-medium">
        {r.status}
      </span>
    ),
  },
  { key: "unit", label: "Sauna #", value: (r) => r.unit_code, initial: true },
  {
    key: "type",
    label: "Sauna type",
    value: (r) => r.sauna_type,
    initial: true,
  },
  {
    key: "start",
    label: "Rental start",
    value: (r) => r.start_date,
    initial: true,
    cell: (r) => (
      <>
        {date(r.start_date)}
        {r.start_date && /xero|receipt/i.test(r.start_source || "") && (
          <span className="block text-xs text-amber-800">
            Historical payment proxy
          </span>
        )}
      </>
    ),
  },
  {
    key: "sold",
    label: "Sold on",
    value: (r) => r.sold_on,
    cell: (r) => date(r.sold_on),
  },
  {
    key: "saleprice",
    label: "Sale price",
    value: (r) => r.sale_price,
    cell: (r) => (r.is_sale ? amount(r.sale_price) : "—"),
  },
  {
    key: "term",
    label: "Commitment",
    value: (r) => r.commitment_months,
    initial: true,
    cell: (r) =>
      r.commitment_months == null
        ? r.is_sale
          ? "Sale"
          : "Unknown"
        : `${r.commitment_months} months`,
  },
  {
    key: "monthly",
    label: "Base rent / month",
    value: (r) => r.monthly_price,
    initial: true,
    cell: (r) =>
      r.is_sale && r.monthly_price == null ? "—" : amount(r.monthly_price),
  },
  {
    key: "payment",
    label: "Payment method",
    value: (r) => r.payment_method,
    initial: true,
  },
  {
    key: "security",
    label: "Security deposit",
    value: (r) => r.security_deposit,
    cell: (r) => amount(r.security_deposit),
  },
  {
    key: "deposit",
    label: "Reservation deposit",
    value: (r) => r.reservation_deposit,
    cell: (r) => amount(r.reservation_deposit),
  },
  {
    key: "installation",
    label: "Installation fee",
    value: (r) => r.install_fee,
    cell: (r) => amount(r.install_fee),
  },
  {
    key: "delivery",
    label: "Delivery fee",
    value: (r) =>
      r.commercial_terms?.discounted_delivery_cents != null
        ? r.commercial_terms.discounted_delivery_cents / 100
        : r.delivery_fee,
    cell: (r) =>
      amount(
        r.commercial_terms?.discounted_delivery_cents != null
          ? r.commercial_terms.discounted_delivery_cents / 100
          : r.delivery_fee,
      ),
  },
  {
    key: "insurance",
    label: "Damage protection / month",
    value: (r) =>
      r.insurance_selected === false ? 0 : r.insurance_monthly_price,
    cell: (r) => optional(r.insurance_selected, r.insurance_monthly_price),
  },
  {
    key: "heater",
    label: "Second heater / month",
    value: (r) =>
      r.second_heater_selected === false ? 0 : r.second_heater_monthly_price,
    cell: (r) =>
      optional(r.second_heater_selected, r.second_heater_monthly_price),
  },
  {
    key: "premium",
    label: "Premium / month",
    value: (r) =>
      r.commercial_terms
        ? r.commercial_terms.premium_monthly_cents / 100
        : null,
    cell: (r) =>
      r.commercial_terms
        ? optional(
            r.commercial_terms.choices.premium_selected,
            r.commercial_terms.premium_monthly_cents / 100,
          )
        : "Unknown",
  },
  {
    key: "arrangement",
    label: "Payment arrangement",
    value: (r) =>
      r.commercial_terms
        ? r.commercial_terms.choices.pay_upfront_selected
          ? "Upfront"
          : "Monthly"
        : null,
    cell: (r) =>
      r.commercial_terms
        ? r.commercial_terms.choices.pay_upfront_selected
          ? `${money((r.commercial_terms.initial_prepaid_recurring_cents ?? r.commercial_terms.initial_rental_cents) / 100)} prepaid initial rent and add-ons`
          : "Monthly"
        : "Unknown",
  },
  {
    key: "initial",
    label: "Initial monthly billing",
    value: (r) =>
      r.commercial_terms
        ? r.commercial_terms.initial_recurring_cents / 100
        : null,
    cell: (r) =>
      amount(
        r.commercial_terms
          ? r.commercial_terms.initial_recurring_cents / 100
          : null,
      ),
  },
  {
    key: "renewal",
    label: "Renewal / month",
    value: (r) =>
      r.commercial_terms
        ? r.commercial_terms.renewal_monthly_cents / 100
        : null,
    cell: (r) =>
      amount(
        r.commercial_terms
          ? r.commercial_terms.renewal_monthly_cents / 100
          : null,
      ),
  },
  {
    key: "stairs",
    label: "Stair / elevator fee",
    value: (r) =>
      r.commercial_terms?.discounted_stair_charge_cents != null
        ? r.commercial_terms.discounted_stair_charge_cents / 100
        : r.stair_elevator_charge,
    cell: (r) =>
      amount(
        r.commercial_terms?.discounted_stair_charge_cents != null
          ? r.commercial_terms.discounted_stair_charge_cents / 100
          : r.stair_elevator_charge,
      ),
  },
  { key: "email", label: "Email", value: (r) => r.email },
  { key: "phone", label: "Phone", value: (r) => r.phone },
  { key: "address", label: "Address", value: (r) => r.address },
  {
    key: "receipt",
    label: "Latest Xero receipt",
    value: (r) => r.last_receipt,
    cell: (r) => date(r.last_receipt),
  },
  { key: "source", label: "Terms source", value: (r) => r.source },
  {
    key: "review",
    label: "Review",
    value: (r) => r.issues.length,
    initial: true,
    cell: (r) =>
      r.issues.length ? (
        <span className="text-amber-800">{r.issues.length} to review</span>
      ) : (
        "No flagged issues"
      ),
  },
];

export default function BillingHistory({
  rows,
  onAgreement,
}: {
  rows: BillingRow[];
  onAgreement: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [sort, setSort] = useState({
    key: "name",
    direction: "asc" as "asc" | "desc",
  });
  const [visible, setVisible] = useState(
    columns.filter((c) => c.initial).map((c) => c.key),
  );
  const [selected, setSelected] = useState<BillingRow | null>(null);
  const [documentError, setDocumentError] = useState("");
  const [opening, setOpening] = useState<string | null>(null);
  const shown = useMemo(
    () =>
      sortBillingRows(
        filterBillingRows(rows, search, status, reviewOnly),
        columns.find((c) => c.key === sort.key)!.value,
        sort.direction,
      ),
    [rows, search, status, reviewOnly, sort],
  );
  const activeColumns = columns.filter((c) => visible.includes(c.key));
  const statuses = [...new Set(rows.map((r) => r.status))].sort();
  const customers = new Set(
    rows.map(
      (r) =>
        r.customer_id ||
        (r.status === "Xero only" ? r.id : r.reservation_id || r.id),
    ),
  ).size;
  const openAgreement = async (id: string) => {
    setOpening(id);
    setDocumentError("");
    try {
      await onAgreement(id);
    } catch (e) {
      setDocumentError(
        e instanceof Error ? e.message : "Could not open agreement",
      );
    } finally {
      setOpening(null);
    }
  };
  return (
    <section className="space-y-4" aria-label="Customer billing history">
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">
            All customer billing history
          </h2>
          <p className="text-sm text-muted-foreground">
            Current and former rentals, purchases, bookings, and records with
            missing history. Repeat rentals have separate rows. Dates and prices
            stay unknown when evidence is missing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search customer billing history"
              placeholder="Search name, email, address, or sauna…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Customer status"
            className="h-10 rounded-md border bg-background px-3"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={reviewOnly}
              onChange={(e) => setReviewOnly(e.target.checked)}
            />
            Needs review only
          </label>
          <details className="relative">
            <summary className="cursor-pointer rounded-md border px-3 py-2 text-sm">
              Columns
            </summary>
            <div className="absolute z-30 right-0 top-full w-72 max-h-80 overflow-y-auto rounded-lg border bg-background shadow-lg p-3 space-y-2">
              <div className="flex gap-3">
                <button
                  className="underline text-sm"
                  onClick={() => setVisible(columns.map((c) => c.key))}
                >
                  Show all
                </button>
                <button
                  className="underline text-sm"
                  onClick={() =>
                    setVisible(
                      columns.filter((c) => c.initial).map((c) => c.key),
                    )
                  }
                >
                  Reset
                </button>
              </div>
              {columns.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={c.key === "name"}
                    checked={visible.includes(c.key)}
                    onChange={(e) =>
                      setVisible(
                        e.target.checked
                          ? [...visible, c.key]
                          : visible.filter((k) => k !== c.key),
                      )
                    }
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </details>
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          Showing {shown.length} of {rows.length} records · {customers} customer
          identities. Click a customer for contact details, agreements, rental
          history, and questions to resolve.
        </p>
        <p className="text-xs text-muted-foreground">
          Rental start can be a documented historical payment proxy, as labeled.
          “Returned on” uses recorded actual pickup dates. Xero receipts
          describe customer-level payment history and do not establish return
          dates.
        </p>
      </div>
      <div
        className="overflow-auto max-h-[75vh] border rounded-lg bg-card"
        tabIndex={0}
        aria-label="Scrollable billing table"
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20 bg-muted">
            <tr>
              {activeColumns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    sort.key === c.key
                      ? sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className={`text-left p-0 ${c.key === "name" ? "sticky left-0 z-20 bg-muted" : ""}`}
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-3 whitespace-nowrap font-medium hover:bg-muted/70"
                    onClick={() =>
                      setSort({
                        key: c.key,
                        direction:
                          sort.key === c.key && sort.direction === "asc"
                            ? "desc"
                            : "asc",
                      })
                    }
                  >
                    {c.label}
                    {sort.key === c.key ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t align-top hover:bg-muted/30">
                {activeColumns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-3 ${c.key === "name" ? "sticky left-0 z-10 bg-card min-w-[180px]" : "min-w-[125px] max-w-[280px]"}`}
                  >
                    {c.key === "name" ? (
                      <button
                        className="font-medium text-left underline decoration-primary/40 underline-offset-4 hover:text-primary"
                        onClick={() => {
                          setSelected(r);
                          setDocumentError("");
                        }}
                      >
                        {r.name}
                      </button>
                    ) : c.cell ? (
                      c.cell(r)
                    ) : (
                      (c.value(r) ?? (
                        <span className="text-muted-foreground">Unknown</span>
                      ))
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  className="p-8 text-center text-muted-foreground"
                >
                  {rows.length
                    ? "No records match these filters."
                    : "No customer records available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              Billing details and recorded rental history
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 text-sm">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ["Status", selected.status],
                  ["Sauna", selected.unit_code || "Unknown"],
                  ["Sauna type", selected.sauna_type || "Unknown"],
                  ["Email", selected.email || "Unknown"],
                  ["Phone", selected.phone || "Unknown"],
                  ["Address", selected.address || "Unknown"],
                  ["Rental start", date(selected.start_date)],
                  ["Start source", selected.start_source || "Unknown"],
                  [
                    "Returned on",
                    selected.return_unknown
                      ? "Returned — date unknown"
                      : date(selected.return_date),
                  ],
                  ["Sold on", date(selected.sold_on)],
                  ["Terms source", selected.source],
                  [
                    "Deposit payment status",
                    selected.payment_status || "Unknown",
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium break-words">{value}</dd>
                  </div>
                ))}
              </dl>
              {selected.issues.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
                  <h3 className="font-semibold">
                    Questions / missing information
                  </h3>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    {selected.issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Billing amounts</h3>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {columns
                    .filter((c) =>
                      [
                        "saleprice",
                        "term",
                        "monthly",
                        "payment",
                        "security",
                        "deposit",
                        "installation",
                        "delivery",
                        "insurance",
                        "heater",
                        "premium",
                        "arrangement",
                        "initial",
                        "renewal",
                        "stairs",
                      ].includes(c.key),
                    )
                    .map((c) => (
                      <div key={c.key}>
                        <dt className="text-muted-foreground">{c.label}</dt>
                        <dd>
                          {c.cell
                            ? c.cell(selected)
                            : (c.value(selected) ?? "Unknown")}
                        </dd>
                      </div>
                    ))}
                </dl>
                {selected.extras.length > 0 && (
                  <p className="mt-3">
                    Recorded rental add-ons:{" "}
                    {selected.extras
                      .map((e) => `${e.name}: ${money(e.amountCents / 100)}/mo`)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Related bookings</h3>
                {selected.related_bookings?.length ? (
                  <ul className="space-y-1 mb-4">
                    {selected.related_bookings.map((b) => (
                      <li key={b.id}>
                        {b.type || "Type unknown"} · {b.status}
                        <span className="block text-xs text-muted-foreground">
                          Booking {b.id}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mb-4">
                    No booking is linked.
                  </p>
                )}
                <h3 className="font-semibold mb-2">Agreements</h3>
                {selected.agreements.length ? (
                  <ul className="space-y-2">
                    {selected.agreements.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                      >
                        <span>
                          {a.label}
                          <span className="block text-xs text-muted-foreground">
                            {a.state} · Signed: {date(a.signed_on)}
                          </span>
                        </span>
                        {a.downloadable && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={opening !== null}
                            onClick={() => openAgreement(a.id)}
                          >
                            {opening === a.id ? "Opening…" : "View agreement"}
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    No agreement is linked.
                  </p>
                )}
                {documentError && (
                  <p role="alert" className="text-destructive mt-2">
                    {documentError}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Term history</h3>
                {selected.term_history.length ? (
                  <div className="overflow-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          {[
                            "Effective dates",
                            "Monthly base",
                            "Commitment",
                            "State / source",
                          ].map((h) => (
                            <th key={h} className="p-2 border-b">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.term_history.map((t) => (
                          <tr key={t.id}>
                            <td className="p-2">
                              {date(t.from)} → {date(t.until)}
                            </td>
                            <td className="p-2">{money(t.monthly)}</td>
                            <td className="p-2">
                              {t.months == null
                                ? "Unknown"
                                : `${t.months} months`}
                            </td>
                            <td className="p-2">
                              {t.state} · {t.source}
                              {t.note && (
                                <p className="text-muted-foreground">
                                  {t.note}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No separate dated terms recorded.
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Physical sauna history</h3>
                {selected.placements.length ? (
                  <ul className="space-y-2">
                    {selected.placements.map((p, i) => (
                      <li key={i}>
                        {p.unit} · Installed {date(p.installed)} · Removed{" "}
                        {date(p.removed)}
                        {p.address && (
                          <p className="text-muted-foreground">{p.address}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    No numbered placement history recorded. A reservation shown
                    above may still identify a current or future unit.
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Xero history</h3>
                <p>
                  {selected.receipt_count} cached receipts · Latest:{" "}
                  {date(selected.last_receipt)} (customer-level; may span
                  several rentals)
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {selected.xero_contacts
                    .filter((c) => /^[a-f\d-]{36}$/i.test(c.id))
                    .map((c) => (
                      <a
                        key={c.id}
                        href={`https://go.xero.com/Contacts/View/${encodeURIComponent(c.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary"
                      >
                        {c.name} in Xero ↗
                      </a>
                    ))}
                </div>
              </div>
              {selected.notes && (
                <div>
                  <h3 className="font-semibold">Notes</h3>
                  <p className="whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
