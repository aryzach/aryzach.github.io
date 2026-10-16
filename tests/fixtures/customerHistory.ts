import type {
  CustomerHistory,
  HistoryCustomer,
} from "../../src/lib/customerMetrics.ts";
import { addMonth } from "../../src/lib/customerMetrics.ts";

const customer = (
  id: string,
  name: string,
  channel: string,
  installedAt: string | null,
  rentalEndedAt: string | null,
  scenario: string,
  events: HistoryCustomer["events"] = [],
): HistoryCustomer => ({
  id,
  name,
  email: `${id}@example.invalid`,
  channel,
  installedAt,
  rentalEndedAt,
  scenario,
  events: [
    {
      date: installedAt ?? "2026-09-20",
      title: installedAt ? "Installed" : "Consultation requested",
      detail: installedAt
        ? "Demo unit assigned. Rental service began."
        : "Lead only; excluded from customer acquisition and LTV denominators.",
    },
    ...events,
  ],
});
export const customerHistory: CustomerHistory = {
  asOf: "2026-09-30",
  customers: [
    customer(
      "avery",
      "Avery Chen",
      "Google Search",
      "2026-01-10",
      null,
      "Active renter",
      [
        {
          date: "2026-01-08",
          title: "Agreement signed",
          detail: "Traditional indoor · $300/month · 12-month initial term.",
        },
      ],
    ),
    customer(
      "maya",
      "Maya Patel",
      "Referral",
      "2026-02-12",
      "2026-06-01",
      "Cancellation",
      [
        {
          date: "2026-05-15",
          title: "Cancellation requested",
          detail:
            "Rental ended June 1. Unit collected; refundable deposit returned.",
        },
      ],
    ),
    customer(
      "jordan",
      "Jordan Ellis",
      "Meta Ads",
      "2026-03-05",
      null,
      "Renewal",
      [
        {
          date: "2026-06-01",
          title: "Agreement renewed",
          detail:
            "New three-month term; monthly rental changed from $250 to $275.",
        },
        {
          date: "2026-09-01",
          title: "Agreement renewed",
          detail: "Renewed for another three months at $275/month.",
        },
      ],
    ),
    customer(
      "riley",
      "Riley Morgan",
      "Google Search",
      "2026-04-18",
      null,
      "Partial refund",
      [
        {
          date: "2026-07-20",
          title: "Service issue resolved",
          detail:
            "Heater repair completed. $100 rental credit and refund issued.",
        },
      ],
    ),
    customer(
      "casey",
      "Casey Rivera",
      "Organic",
      "2026-06-08",
      "2026-09-01",
      "Sauna purchase",
      [
        {
          date: "2026-09-01",
          title: "Purchased rental unit",
          detail:
            "$4,000 sale ends the rental. Customer remains in historical LTV; leaves rental retention.",
        },
      ],
    ),
    customer("taylor", "Taylor Brooks", "Meta Ads", null, null, "Lead only"),
  ],
  revenue: [],
  cash: [],
  costs: [],
  spend: [],
};
for (const c of customerHistory.customers) {
  if (!c.installedAt) continue;
  const start = c.installedAt.slice(0, 7);
  const end = c.rentalEndedAt?.slice(0, 7) ?? "2026-10";
  for (
    let month = start;
    month < end && month <= "2026-09";
    month = addMonth(month, 1)
  ) {
    const date = month === start ? c.installedAt : `${month}-01`;
    const amount =
      c.id === "jordan"
        ? month < "2026-06"
          ? 25000
          : 27500
        : c.id === "maya"
          ? 22000
          : 30000;
    customerHistory.revenue.push({
      id: `invoice-${c.id}-${month}`,
      customerId: c.id,
      date,
      category: "rental",
      amount,
      description: `${month} rental service`,
    });
    // One unpaid invoice makes earned revenue and cash visibly different.
    if (!(c.id === "avery" && month === "2026-09"))
      customerHistory.cash.push({
        id: `payment-${c.id}-${month}`,
        customerId: c.id,
        date,
        category: "rental",
        kind: "payment",
        amount,
        description: `${month} rental collected`,
        stripeId: `demo_pi_${c.id}_${month}`,
        xeroId: `demo_payment_${c.id}_${month}`,
      });
    customerHistory.costs.push({
      customerId: c.id,
      date,
      amount: 6000,
      description: "Assumed servicing, payment fees and maintenance allocation",
    });
  }
  customerHistory.revenue.push({
    id: `delivery-${c.id}`,
    customerId: c.id,
    date: c.installedAt,
    category: "delivery",
    amount: 10000,
    description: "Delivery and installation charge",
  });
  customerHistory.cash.push(
    {
      id: `delivery-cash-${c.id}`,
      customerId: c.id,
      date: c.installedAt,
      category: "delivery",
      kind: "payment",
      amount: 10000,
      description: "Delivery charge collected",
      stripeId: `demo_pi_delivery_${c.id}`,
      xeroId: `demo_payment_delivery_${c.id}`,
    },
    {
      id: `deposit-${c.id}`,
      customerId: c.id,
      date: c.installedAt,
      category: "deposit",
      kind: "payment",
      amount: 50000,
      description: "Refundable security deposit; excluded from revenue and LTV",
      stripeId: `demo_pi_deposit_${c.id}`,
      xeroId: `demo_payment_deposit_${c.id}`,
    },
  );
  customerHistory.costs.push({
    customerId: c.id,
    date: c.installedAt,
    amount: 18000,
    description: "Assumed delivery and installation cost",
  });
}
customerHistory.revenue.push(
  {
    id: "credit-riley",
    customerId: "riley",
    date: "2026-07-20",
    category: "rental",
    amount: -10000,
    description: "Service credit note",
  },
  {
    id: "sale-casey",
    customerId: "casey",
    date: "2026-09-01",
    category: "sale",
    amount: 400000,
    description: "Sauna purchase, excluding tax",
  },
);
customerHistory.cash.push(
  {
    id: "refund-riley",
    customerId: "riley",
    date: "2026-07-20",
    category: "rental",
    kind: "refund",
    amount: 10000,
    description: "Service refund linked to credit note",
    stripeId: "demo_re_riley",
    xeroId: "demo_credit_riley",
  },
  {
    id: "return-deposit-maya",
    customerId: "maya",
    date: "2026-06-01",
    category: "deposit",
    kind: "refund",
    amount: 50000,
    description: "Security deposit returned; excluded from revenue refunds",
    stripeId: "demo_re_deposit_maya",
    xeroId: "demo_deposit_return_maya",
  },
  {
    id: "sale-cash-casey",
    customerId: "casey",
    date: "2026-09-01",
    category: "sale",
    kind: "payment",
    amount: 400000,
    description: "Unit purchase collected",
    stripeId: "demo_pi_sale_casey",
    xeroId: "demo_payment_sale_casey",
  },
  {
    id: "sale-tax-casey",
    customerId: "casey",
    date: "2026-09-01",
    category: "tax",
    kind: "payment",
    amount: 35000,
    description: "Illustrative sales tax; excluded from revenue and LTV",
    stripeId: "demo_pi_tax_casey",
    xeroId: "demo_tax_casey",
  },
);
customerHistory.costs.push({
  customerId: "casey",
  date: "2026-09-01",
  amount: 240000,
  description: "Assumed remaining unit cost on sale",
});
const channels = ["Google Search", "Referral", "Meta Ads", "Organic"];
for (let month = "2026-01"; month <= "2026-09"; month = addMonth(month, 1)) {
  channels.forEach((channel, index) =>
    customerHistory.spend.push({
      month,
      channel,
      amount: [35000, 5000, 20000, 10000][index],
    }),
  );
}
