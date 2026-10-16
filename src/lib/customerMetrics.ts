/** Money is stored as integer cents. All dates are ISO calendar dates (UTC). */
export interface HistoryCustomer {
  id: string;
  name: string;
  email: string;
  channel: string;
  installedAt: string | null;
  rentalEndedAt: string | null;
  scenario: string;
  events: { date: string; title: string; detail: string }[];
}
export interface RevenueEntry {
  id: string;
  customerId: string;
  date: string;
  category: "rental" | "delivery" | "sale";
  amount: number;
  description: string;
}
export interface CashEntry {
  id: string;
  customerId: string;
  date: string;
  category: RevenueEntry["category"] | "deposit" | "tax";
  kind: "payment" | "refund";
  amount: number;
  description: string;
  stripeId: string;
  xeroId: string;
}
export interface VariableCost {
  customerId: string;
  date: string;
  amount: number;
  description: string;
}
export interface AcquisitionSpend {
  month: string;
  channel: string;
  amount: number;
}
export interface CustomerHistory {
  asOf: string;
  customers: HistoryCustomer[];
  revenue: RevenueEntry[];
  cash: CashEntry[];
  costs: VariableCost[];
  spend: AcquisitionSpend[];
}
export const monthOf = (date: string) => date.slice(0, 7);
export function addMonth(month: string, offset: number): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 7);
}
const total = <T>(rows: T[], value: (row: T) => number) =>
  rows.reduce((sum, row) => sum + value(row), 0);
export function customerValue(data: CustomerHistory, id: string) {
  const revenue = total(
    data.revenue.filter((r) => r.customerId === id && r.date <= data.asOf),
    (r) => r.amount,
  );
  const costs = total(
    data.costs.filter((r) => r.customerId === id && r.date <= data.asOf),
    (r) => r.amount,
  );
  const cash = data.cash.filter(
    (r) => r.customerId === id && r.date <= data.asOf,
  );
  return {
    revenue,
    costs,
    contribution: revenue - costs,
    collected: total(
      cash.filter(
        (r) => r.kind === "payment" && !["deposit", "tax"].includes(r.category),
      ),
      (r) => r.amount,
    ),
    refunded: total(
      cash.filter(
        (r) => r.kind === "refund" && !["deposit", "tax"].includes(r.category),
      ),
      (r) => r.amount,
    ),
  };
}
export function monthlyActivity(data: CustomerHistory, months: string[]) {
  return months.map((month) => ({
    month,
    rentalRevenue: total(
      data.revenue.filter(
        (r) =>
          r.date <= data.asOf &&
          monthOf(r.date) === month &&
          r.category === "rental",
      ),
      (r) => r.amount,
    ),
    rentalCollections: total(
      data.cash.filter(
        (r) =>
          r.date <= data.asOf &&
          monthOf(r.date) === month &&
          r.category === "rental" &&
          r.kind === "payment",
      ),
      (r) => r.amount,
    ),
    rentalRefunds: total(
      data.cash.filter(
        (r) =>
          r.date <= data.asOf &&
          monthOf(r.date) === month &&
          r.category === "rental" &&
          r.kind === "refund",
      ),
      (r) => r.amount,
    ),
    spend: total(
      data.spend.filter(
        (r) => r.month === month && r.month <= monthOf(data.asOf),
      ),
      (r) => r.amount,
    ),
    acquired: data.customers.filter(
      (c) =>
        c.installedAt &&
        c.installedAt <= data.asOf &&
        monthOf(c.installedAt) === month,
    ).length,
  }));
}
export function acquisitionCohort(data: CustomerHistory, month: string) {
  const customers = data.customers.filter(
    (c) =>
      c.installedAt &&
      c.installedAt <= data.asOf &&
      monthOf(c.installedAt) === month,
  );
  const spend = total(
    data.spend.filter(
      (s) => s.month === month && s.month <= monthOf(data.asOf),
    ),
    (s) => s.amount,
  );
  let cumulative = 0;
  let payback: number | null = null;
  const retention: (number | null)[] = [];
  for (let age = 0; age < 9; age++) {
    const current = addMonth(month, age);
    if (current > monthOf(data.asOf)) {
      retention.push(null);
      continue;
    }
    const cutoff =
      current === monthOf(data.asOf) ? data.asOf : `${addMonth(current, 1)}-01`;
    const ids = new Set(customers.map((c) => c.id));
    cumulative +=
      total(
        data.revenue.filter(
          (r) =>
            ids.has(r.customerId) &&
            monthOf(r.date) === current &&
            r.date <= data.asOf,
        ),
        (r) => r.amount,
      ) -
      total(
        data.costs.filter(
          (r) =>
            ids.has(r.customerId) &&
            monthOf(r.date) === current &&
            r.date <= data.asOf,
        ),
        (r) => r.amount,
      );
    if (
      customers.length &&
      spend > 0 &&
      payback === null &&
      cumulative >= spend
    )
      payback = age + 1;
    const active = customers.filter(
      (c) =>
        !c.rentalEndedAt ||
        (current === monthOf(data.asOf)
          ? c.rentalEndedAt > cutoff
          : c.rentalEndedAt >= cutoff),
    ).length;
    retention.push(customers.length ? active / customers.length : null);
  }
  return {
    month,
    customers: customers.length,
    spend,
    cac: customers.length ? spend / customers.length : null,
    payback,
    retention,
  };
}

/** Each LTV point uses only information observed through that month's cutoff. */
export function valueTrend(data: CustomerHistory, months: string[]) {
  return monthlyActivity(data, months).map((row) => {
    const next = new Date(`${addMonth(row.month, 1)}-01T00:00:00Z`);
    next.setUTCDate(0);
    const cutoff =
      next.toISOString().slice(0, 10) < data.asOf
        ? next.toISOString().slice(0, 10)
        : data.asOf;
    const customers = data.customers.filter(
      (c) => c.installedAt && c.installedAt <= cutoff,
    );
    return {
      month: row.month,
      ltv:
        row.month > monthOf(data.asOf) || !customers.length
          ? null
          : total(
              customers,
              (c) => customerValue({ ...data, asOf: cutoff }, c.id).revenue,
            ) / customers.length,
      cac: row.acquired ? row.spend / row.acquired : null,
    };
  });
}
