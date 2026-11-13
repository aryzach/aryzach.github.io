import type { RentalWorkspace } from "./rentalModel.ts";
export interface RecoveryLine {
  id: string;
  description: string;
  account: string;
  net: number;
  gross: number;
  saunaCodes: string[];
  attributionNote?: string;
}
export interface RecoveryCash {
  id: string;
  date: string;
  direction: "RECEIVE" | "SPEND";
  currency: string;
  lines: RecoveryLine[];
  contactId?: string;
  contactName?: string;
  sourceType?: "bill" | "bank";
  sourceUrl?: string;
}
export interface RecoverySources {
  snapshotAt: string | null;
  complete: boolean;
  transactions: RecoveryCash[];
}
export interface RecoveryEntry {
  attributionNote?: string;
  sourceId: string;
  date: string;
  description: string;
  kind: "cost" | "rent" | "sale";
  amount: number;
  contactId?: string;
  contactName?: string;
  direction?: "RECEIVE" | "SPEND";
  sourceType?: "bill" | "bank";
  sourceUrl?: string;
}
export interface RecoveryRow {
  heaterShare: number;
  id: string;
  code: string;
  type: string;
  cost: number | null;
  rent: number;
  sale: number;
  recovered: number;
  remaining: number | null;
  percentage: number | null;
  status: "paid" | "unpaid" | "unknown";
  entries: RecoveryEntry[];
}
const costAccounts = new Set(["540", "SH"]);
const rentAccounts = new Set(["102", "542"]);
const saleAccounts = new Set(["372", "788"]);
export function recoverySources(
  records: Record<string, unknown>[],
  snapshotAt: string | null,
  complete = true,
  bills: Record<string, unknown>[] = [],
): RecoverySources {
  const transactions: RecoveryCash[] = [];
  // Supplier bills carry numbered-unit cost allocations; their payments are not
  // separate costs. Keep the source bill URL and import its current lines once.
  const supplierBills: Record<string, unknown>[] = bills
    .filter(
      (b) =>
        b.Type === "ACCPAY" &&
        ["AUTHORISED", "PAID"].includes(String(b.Status)),
    )
    .map((b) => ({
      ...b,
      BankTransactionID: b.InvoiceID,
      Type: "SPEND",
      Status: "AUTHORISED",
      recoverySourceType: "bill",
      sourceUrl: `https://go.xero.com/AccountsPayable/View.aspx?InvoiceID=${encodeURIComponent(String(b.InvoiceID))}`,
      LineItems: ((b.LineItems || []) as Record<string, unknown>[]).map(
        (l) => ({
          ...l,
          AccountCode: String(l.AccountCode) === "1400" ? "540" : l.AccountCode,
        }),
      ),
    }));
  for (const record of [...records, ...supplierBills]) {
    if (
      record.Status !== "AUTHORISED" ||
      !["RECEIVE", "SPEND"].includes(String(record.Type))
    )
      continue;
    const lines = (
      Array.isArray(record.LineItems) ? record.LineItems : []
    ) as Record<string, unknown>[];
    const money = (v: unknown) => {
      const n = Number(v ?? 0);
      if (!Number.isFinite(n) || !Number.isSafeInteger(Math.round(n * 100)))
        throw Error("Invalid Xero amount");
      return Math.round(n * 100);
    };
    const rawDate = String(record.DateString || record.Date || "");
    const ms = /^\/Date\((-?\d+)/.exec(rawDate);
    const date = ms
      ? new Date(Number(ms[1])).toISOString().slice(0, 10)
      : rawDate.slice(0, 10);
    transactions.push({
      id: String(record.BankTransactionID),
      date,
      direction: record.Type as RecoveryCash["direction"],
      currency: String(record.CurrencyCode),
      contactId:
        typeof (record.Contact as { ContactID?: unknown } | undefined)
          ?.ContactID === "string"
          ? (record.Contact as { ContactID: string }).ContactID
          : undefined,
      contactName:
        typeof (record.Contact as { Name?: unknown } | undefined)?.Name ===
        "string"
          ? (record.Contact as { Name: string }).Name.trim()
          : undefined,
      sourceType: record.recoverySourceType === "bill" ? "bill" : "bank",
      ...(record.sourceUrl ? { sourceUrl: String(record.sourceUrl) } : {}),
      lines: lines.map((line, i) => {
        const amount = money(line.LineAmount),
          tax = money(line.TaxAmount);
        const inclusive = record.LineAmountTypes === "Inclusive";
        const tracking = Array.isArray(line.Tracking)
          ? (line.Tracking as Record<string, unknown>[])
          : [];
        return {
          id: String(line.LineItemID || i),
          description: String(line.Description || ""),
          account: String(line.AccountCode || ""),
          net: inclusive ? amount - tax : amount,
          gross: inclusive ? amount : amount + tax,
          saunaCodes: [
            ...new Set(
              tracking
                .filter((t) => t.Name === "Saunas")
                .flatMap((t) => {
                  const m = /^Sauna\s+(\d{1,3})(?:\D|$)/i.exec(
                    String(t.Option || ""),
                  );
                  return m ? [m[1].padStart(3, "0")] : [];
                }),
            ),
          ],
        };
      }),
    });
  }
  return { snapshotAt, complete, transactions };
}
export function saunaRecovery(
  state: RentalWorkspace,
  sources: RecoverySources,
  includeHeaters = false,
  includeSales = true,
) {
  const rows: RecoveryRow[] = state.assets.map((a) => ({
    heaterShare: 0,
    id: a.id,
    code: a.code.padStart(3, "0"),
    type: a.typeName || a.model || "Unknown type",
    cost: null,
    rent: 0,
    sale: 0,
    recovered: 0,
    remaining: null,
    percentage: null,
    status: "unknown",
    entries: [],
  }));
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const issues: {
    sourceId: string;
    date: string;
    kind: string;
    amount: number;
    reason: string;
    sourceUrl?: string;
  }[] = [];
  const excluded = new Set(
    (state.lifecycle?.paymentReviews || []).map((r) => r.source_id),
  );
  let heaterTotal = 0;
  const seen = new Set<string>();
  for (const t of correctedRecoverySources(state, sources).transactions) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    const add = (
      codes: string[],
      kind: RecoveryEntry["kind"],
      amount: number,
      description: string,
      attributionNote?: string,
    ) => {
      if (!amount) return;
      const row = codes.length === 1 ? byCode.get(codes[0]) : undefined;
      if (!row || t.currency !== "USD") {
        issues.push({
          sourceId: t.id,
          date: t.date,
          kind,
          amount,
          ...(t.sourceUrl ? { sourceUrl: t.sourceUrl } : {}),
          reason:
            t.currency !== "USD"
              ? "Currency needs review"
              : !codes.length
                ? "No numbered sauna tag"
                : codes.length > 1
                  ? "Multiple sauna tags"
                  : "Sauna number not in inventory",
        });
        return;
      }
      row.entries.push({
        sourceId: t.id,
        date: t.date,
        kind,
        amount,
        description,
        attributionNote,
        contactName: t.contactName,
        direction: t.direction,
        sourceType: t.sourceType,
        ...(t.sourceUrl ? { sourceUrl: t.sourceUrl } : {}),
      });
      if (kind === "cost") row.cost = (row.cost ?? 0) + amount;
      else if (kind === "rent") row.rent += amount;
      else row.sale += amount;
    };
    heaterTotal +=
      t.currency === "USD"
        ? t.lines
            .filter((l) => l.account === "SH")
            .reduce(
              (n, l) => n + l.gross * (t.direction === "SPEND" ? 1 : -1),
              0,
            )
        : 0;
    for (const line of t.lines.filter(
      (l) =>
        costAccounts.has(l.account) && !(includeHeaters && l.account === "SH"),
    ))
      add(
        line.saunaCodes,
        "cost",
        line.gross * (t.direction === "SPEND" ? 1 : -1),
        line.description || "Sauna / heater purchase",
      );
    if (excluded.has(t.id)) continue;
    const allocations = (state.lifecycle?.allocations || []).filter(
      (a) => a.source_id === t.id && !a.voided_at && a.currency === "USD",
    );
    for (const [kind, accounts, category] of [
      ["rent", rentAccounts, "rental"],
      ["sale", saleAccounts, "sale"],
    ] as const) {
      if (kind === "sale" && !includeSales) continue;
      const lines = t.lines.filter((l) => accounts.has(l.account));
      const sourceTotal = lines.reduce((n, l) => n + l.net, 0);
      const amount = allocations.length
        ? allocations
            .filter((a) => a.category === category)
            .reduce((n, a) => n + a.amount_cents, 0)
        : sourceTotal;
      const sign = t.direction === "SPEND" ? -1 : 1;
      if (amount === sourceTotal) {
        for (const line of lines)
          add(
            line.saunaCodes,
            kind,
            line.net * sign,
            line.description ||
              `${kind === "rent" ? "Rental" : "Sauna sale"} cash`,
            line.attributionNote,
          );
      } else if (amount) {
        // A reviewed mixed receipt can follow one explicit Xero unit; never guess
        // from today's customer assignment or spread cash across several units.
        const codes = [...new Set(t.lines.flatMap((l) => l.saunaCodes))];
        add(
          codes,
          kind,
          amount * sign,
          "Reviewed payment classification",
          [
            ...new Set(t.lines.map((l) => l.attributionNote).filter(Boolean)),
          ].join(" ") || undefined,
        );
      }
    }
  }
  const traditional = rows
    .filter((r) => /traditional/i.test(r.type))
    .sort((a, b) => a.code.localeCompare(b.code));
  if (includeHeaters && traditional.length) {
    const share = Math.trunc(heaterTotal / traditional.length),
      remainder = heaterTotal - share * traditional.length;
    traditional.forEach((row, i) => {
      row.heaterShare =
        share + (i < Math.abs(remainder) ? Math.sign(remainder) : 0);
      if (row.cost !== null) row.cost += row.heaterShare;
    });
  }
  for (const row of rows) {
    row.entries.sort(
      (a, b) =>
        compareRecoveryDates(a.date, b.date) ||
        a.sourceId.localeCompare(b.sourceId),
    );
    row.recovered = row.rent + row.sale;
    if (row.cost !== null && row.cost > 0) {
      row.remaining = Math.max(0, row.cost - row.recovered);
      row.percentage = (row.recovered / row.cost) * 100;
      row.status = row.remaining === 0 ? "paid" : "unpaid";
    }
  }
  return {
    heaterTotal,
    traditionalCount: traditional.length,
    rows: rows.sort((a, b) => a.code.localeCompare(b.code)),
    issues,
  };
}

// ISO dates sort newest first, with missing or invalid dates last.
export function compareRecoveryDates(a: string, b: string): number {
  const valid = (d: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d));
  return valid(a) ? (valid(b) ? b.localeCompare(a) : -1) : valid(b) ? 1 : 0;
}
export type RecoverySortKey =
  | "code"
  | "type"
  | "cost"
  | "rent"
  | "sale"
  | "recovered"
  | "remaining"
  | "percentage"
  | "status";
export const recoveryStatusLabel = (status: RecoveryRow["status"]) =>
  status === "paid"
    ? "Paid off"
    : status === "unpaid"
      ? "Not paid off"
      : "Cost unknown";
export function compareRecoveryRows(
  a: RecoveryRow,
  b: RecoveryRow,
  key: RecoverySortKey,
  desc: boolean,
): number {
  const av = key === "status" ? recoveryStatusLabel(a.status) : a[key],
    bv = key === "status" ? recoveryStatusLabel(b.status) : b[key];
  if (av === null)
    return bv === null
      ? a.code.localeCompare(b.code, undefined, { numeric: true })
      : 1;
  if (bv === null) return -1;
  const order =
    typeof av === "string"
      ? av.localeCompare(String(bv), undefined, { numeric: true })
      : av - Number(bv);
  return (
    (desc ? -1 : 1) * order ||
    a.code.localeCompare(b.code, undefined, { numeric: true })
  );
}

/** Search associations only; never reattribute cash or infer a placement from a payer. */
export function recoverySearchIndex(
  state: RentalWorkspace,
  sources: RecoverySources,
) {
  const names = new Map(
    state.assets.map((a) => [
      a.id,
      new Set<string>([a.currentCustomerName || ""]),
    ]),
  );
  const addCustomer = (assetId: string, customerId: string | undefined) => {
    if (!customerId) return;
    const customer = state.customers.find((c) => c.id === customerId);
    for (const name of [
      customer?.name,
      customer?.primaryContact,
      ...(state.xeroLinks || [])
        .filter((l) => l.customerId === customerId)
        .map((l) => l.name),
    ]) {
      if (name) names.get(assetId)?.add(name);
    }
  };
  const rentalCustomer = (id: string) =>
    state.lifecycle?.rentals.find((r) => r.id === id)?.customer_id ||
    state.rentals.find((r) => r.id === id)?.customerId;
  for (const link of [...state.assignments, ...(state.legacyLinks || [])])
    addCustomer(link.assetId, rentalCustomer(link.rentalId));
  for (const placement of state.lifecycle?.placements || [])
    addCustomer(placement.asset_id, rentalCustomer(placement.rental_id));
  for (const sale of state.lifecycle?.sales || [])
    addCustomer(sale.asset_id, sale.customer_id);
  const byCode = new Map(
    state.assets.map((a) => [a.code.padStart(3, "0"), a.id]),
  );
  const excluded = new Set(
    (state.lifecycle?.paymentReviews || []).map((r) => r.source_id),
  );
  for (const transaction of correctedRecoverySources(state, sources)
    .transactions) {
    if (
      !transaction.contactName ||
      transaction.currency !== "USD" ||
      excluded.has(transaction.id)
    )
      continue;
    const addName = (codes: string[]) => {
      if (codes.length === 1)
        names.get(byCode.get(codes[0]) || "")?.add(transaction.contactName!);
    };
    for (const line of transaction.lines) {
      if (
        (rentAccounts.has(line.account) || saleAccounts.has(line.account)) &&
        line.net
      )
        addName(line.saunaCodes);
    }
    if (
      state.lifecycle?.allocations.some(
        (a) =>
          a.source_id === transaction.id &&
          !a.voided_at &&
          a.currency === "USD" &&
          ["rental", "sale"].includes(a.category) &&
          a.amount_cents,
      )
    ) {
      addName([...new Set(transaction.lines.flatMap((l) => l.saunaCodes))]);
    }
  }
  return new Map(
    state.assets.map((a) => [
      a.id,
      [
        a.code,
        `#${a.code.padStart(3, "0")}`,
        a.typeName || a.model,
        ...names.get(a.id)!,
      ]
        .join(" ")
        .toLocaleLowerCase(),
    ]),
  );
}

/** Owner corrections overlay imported facts; the original Xero cache is never rewritten. */
export function correctedRecoverySources(
  state: RentalWorkspace,
  sources: RecoverySources,
): RecoverySources {
  const rules = (state.lifecycle?.events || [])
    .filter(
      (e) =>
        e.event_type === "payment_sauna_attribution_corrected" &&
        e.detail.version === 1,
    )
    .flatMap((e) => {
      const from = state.assets.find((a) => a.id === e.detail.fromAssetId),
        to = state.assets.find((a) => a.id === e.asset_id);
      if (
        !from ||
        !to ||
        from.id === to.id ||
        typeof e.detail.contactId !== "string" ||
        (!e.occurred_on && !e.detail.untilExclusive) ||
        (e.occurred_on !== null &&
          !/^\d{4}-\d{2}-\d{2}$/.test(e.occurred_on)) ||
        (e.detail.untilExclusive !== undefined &&
          (typeof e.detail.untilExclusive !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(e.detail.untilExclusive)))
      )
        return [];
      return [
        {
          from: from.code.padStart(3, "0"),
          to: to.code.padStart(3, "0"),
          contactId: e.detail.contactId,
          fromDate: e.occurred_on,
          untilExclusive:
            typeof e.detail.untilExclusive === "string"
              ? e.detail.untilExclusive
              : null,
        },
      ];
    });
  if (!rules.length) return sources;
  return {
    ...sources,
    transactions: sources.transactions.map((t) => {
      if (
        t.direction !== "RECEIVE" ||
        t.currency !== "USD" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(t.date)
      )
        return t;
      const matches = rules.filter(
        (r) =>
          r.contactId === t.contactId &&
          (!r.fromDate || t.date >= r.fromDate) &&
          (!r.untilExclusive || t.date < r.untilExclusive),
      );
      return {
        ...t,
        lines: t.lines.map((l) => {
          if (costAccounts.has(l.account) || l.saunaCodes.length !== 1)
            return l;
          const matching = matches.filter((r) => r.from === l.saunaCodes[0]);
          if (matching.length !== 1) return l;
          const r = matching[0];
          return {
            ...l,
            saunaCodes: [r.to],
            attributionNote: `Owner-corrected attribution: #${r.from} → #${r.to}. Original Xero entry preserved.`,
          };
        }),
      };
    }),
  };
}
