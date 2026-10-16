import test from "node:test";
import assert from "node:assert/strict";
import { customerHistory as data } from "./fixtures/customerHistory.ts";
import {
  customerValue,
  monthlyActivity,
  acquisitionCohort,
  valueTrend,
} from "../src/lib/customerMetrics.ts";

test("lifetime value excludes deposits and taxes, and distinguishes unpaid earned revenue from cash", () => {
  assert.deepEqual(customerValue(data, "avery"), {
    revenue: 280000,
    costs: 72000,
    contribution: 208000,
    collected: 250000,
    refunded: 0,
  });
  assert.equal(customerValue(data, "casey").revenue, 500000);
  assert.equal(customerValue(data, "casey").collected, 500000);
  assert.equal(customerValue(data, "maya").refunded, 0); // Security-deposit return is not a revenue refund.
});

test("credit and linked refund affect revenue and cash once each; source references do not double receipts", () => {
  const riley = customerValue(data, "riley");
  assert.equal(riley.revenue, 180000);
  assert.equal(riley.collected, 190000);
  assert.equal(riley.refunded, 10000);
  const [july] = monthlyActivity(data, ["2026-07"]);
  assert.equal(july.rentalRefunds, 10000);
  assert.equal(july.rentalCollections - july.rentalRevenue, 10000);
});

test("renewal changes pricing from its effective month without resetting customer identity", () => {
  const entries = data.revenue.filter(
    (r) => r.customerId === "jordan" && r.category === "rental",
  );
  assert.equal(entries.find((r) => r.date === "2026-05-01")?.amount, 25000);
  assert.equal(entries.find((r) => r.date === "2026-06-01")?.amount, 27500);
  assert.equal(acquisitionCohort(data, "2026-09").customers, 0);
});

test("cohorts exclude leads, count cancellation and conversion out of rental retention, and leave future cells empty", () => {
  assert.deepEqual(
    acquisitionCohort(data, "2026-02").retention.slice(0, 5),
    [1, 1, 1, 1, 0],
  );
  assert.deepEqual(acquisitionCohort(data, "2026-06").retention, [
    1,
    1,
    1,
    0,
    null,
    null,
    null,
    null,
    null,
  ]);
  const september = acquisitionCohort(data, "2026-09");
  assert.equal(september.cac, null);
  assert.equal(september.payback, null);
  assert.ok(september.retention.every((r) => r === null));
});

test("CAC retains spend in months without acquisitions and payback uses cumulative contribution", () => {
  const months = monthlyActivity(data, [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
  ]);
  assert.equal(
    months.reduce((s, m) => s + m.spend, 0) /
      months.reduce((s, m) => s + m.acquired, 0),
    126000,
  );
  assert.equal(acquisitionCohort(data, "2026-01").payback, 4);
  assert.equal(acquisitionCohort(data, "2026-02").payback, null);
});

test("future entries do not leak into historical value or activity", () => {
  const future = {
    ...data,
    revenue: [
      ...data.revenue,
      {
        id: "future",
        customerId: "avery",
        date: "2027-01-01",
        category: "rental" as const,
        amount: 999999,
        description: "Future invoice",
      },
    ],
  };
  assert.deepEqual(
    customerValue(future, "avery"),
    customerValue(data, "avery"),
  );
  assert.equal(monthlyActivity(future, ["2027-01"])[0].rentalRevenue, 0);
});

test("LTV history uses only customers and earned revenue observed by each month, with gaps for unavailable CAC", () => {
  const [january, may, september] = valueTrend(data, [
    "2026-01",
    "2026-05",
    "2026-09",
  ]);
  assert.equal(january.ltv, 40000);
  assert.equal(january.cac, 70000);
  assert.equal(may.cac, null);
  assert.equal(september.ltv, 250600);
});
