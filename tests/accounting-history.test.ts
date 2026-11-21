import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBillingHistory,
  type AccountingHistoryData,
} from "../supabase/functions/_shared/accountingHistory.ts";
import {
  readAccountingHistory,
  ACCOUNTING_TABLES,
} from "../supabase/functions/_shared/accountingHistoryRecords.ts";
import {
  filterBillingRows,
  sortBillingRows,
} from "../src/lib/billingHistory.ts";
const empty = (): AccountingHistoryData =>
  Object.fromEntries(
    Object.keys(ACCOUNTING_TABLES).map((k) => [k, []]),
  ) as unknown as AccountingHistoryData;
const build = (data: AccountingHistoryData) =>
  buildBillingHistory(data, "2026-11-20");

test("former customers and repeat rentals remain visible without inventory links; unknowns stay unknown", () => {
  const d = empty();
  d.customers = [
    { id: "a", display_name: "Former" },
    { id: "b", display_name: "Archived", archived_at: "2026-01-01" },
    {
      id: "empty",
      display_name: "Old merged profile",
      archived_at: "2026-01-01",
    },
  ];
  d.rentals = [
    {
      id: "old",
      customer_id: "a",
      lifecycle_state: "ended",
      actual_start: "2025-01-01",
      actual_end: "2025-04-01",
    },
    { id: "repeat", customer_id: "a", lifecycle_state: "active" },
  ];
  d.rentals.push({
    id: "archived-rental",
    customer_id: "b",
    lifecycle_state: "ended",
    actual_end: "2025-01-01",
  });
  const rows = build(d);
  assert.equal(rows.length, 3);
  assert.equal(
    rows.find((r) => r.rental_id === "old")?.return_date,
    "2025-04-01",
  );
  const repeat = rows.find((r) => r.rental_id === "repeat")!;
  for (const value of [
    repeat.payment_method,
    repeat.reservation_deposit,
    repeat.install_fee,
    repeat.security_deposit,
    repeat.monthly_price,
    repeat.insurance_selected,
  ])
    assert.equal(value, null);
  assert.equal(rows.find((r) => r.name === "Archived")?.status, "Returned");
});
test("returns never use sale dates, planned dates, or swaps; ended rental with no pickup date is explicit", () => {
  const d = empty();
  d.customers = [{ id: "a", display_name: "One" }];
  d.rentals = [
    {
      id: "sold",
      customer_id: "a",
      purpose: "purchase",
      lifecycle_state: "ended",
      actual_end: "2026-11-13",
    },
    {
      id: "unknown",
      customer_id: "a",
      lifecycle_state: "ended",
      planned_end: "2026-10-01",
    },
    {
      id: "swap",
      customer_id: "a",
      lifecycle_state: "active",
      planned_end: "2026-11-25",
    },
  ];
  d.placements = [
    { id: "p", rental_id: "swap", asset_id: "s", removed_on: "2026-10-01" },
    { id: "p2", rental_id: "swap", asset_id: "s2", removed_on: null },
  ];
  const rows = build(d);
  assert.equal(rows.find((r) => r.rental_id === "sold")?.return_date, null);
  assert.equal(rows.find((r) => r.rental_id === "sold")?.sold_on, "2026-11-13");
  assert.equal(
    rows.find((r) => r.rental_id === "unknown")?.return_unknown,
    true,
  );
  assert.equal(rows.find((r) => r.rental_id === "unknown")?.return_date, null);
  assert.equal(rows.find((r) => r.rental_id === "swap")?.return_date, null);
});
test("owner-confirmed dated terms take precedence over signed summary without rewriting historical fees", () => {
  const d = empty();
  d.customers = [{ id: "a", display_name: "One" }];
  d.reservations = [{ id: "r", first_name: "One", custom_install_fee: 75 }];
  d.rentals = [
    {
      id: "rental",
      customer_id: "a",
      originating_reservation_id: "r",
      lifecycle_state: "active",
    },
  ];
  d.agreements = [
    {
      id: "ag",
      rental_id: "rental",
      contract_id: "c",
      signing_state: "signed",
      signed_on: "2026-01-01",
    },
  ];
  d.contracts = [
    {
      id: "c",
      reservation_id: "r",
      status: "Signed",
      monthly_price: 600,
      security_deposit: 1000,
      rental_summary_snapshot: { installation_fee: 500 },
    },
    {
      id: "void",
      reservation_id: "r",
      status: "Signed",
      voided_at: "2026-10-01",
      monthly_price: 1,
      rental_summary_snapshot: { installation_fee: 0 },
    },
  ];
  d.terms = [
    {
      id: "t",
      rental_id: "rental",
      agreement_id: "ag",
      state: "effective",
      effective_from: "2026-01-01",
      base_monthly_cents: 40000,
      minimum_months: 12,
      source: "Owner correction",
    },
    {
      id: "future",
      rental_id: "rental",
      agreement_id: "ag",
      state: "planned",
      effective_from: "2027-01-01",
      base_monthly_cents: 90000,
    },
    {
      id: "superseded",
      rental_id: "rental",
      state: "superseded",
      effective_from: "2026-10-01",
      base_monthly_cents: 100,
    },
  ];
  const row = build(d)[0];
  assert.equal(row.monthly_price, 400);
  assert.equal(row.install_fee, 500);
  assert.equal(row.security_deposit, 1000);
  assert.equal(row.term_history.length, 3);
  d.agreements[0].signing_state = "voided";
  assert.equal(build(d)[0].install_fee, null);
});
test("imported agreement never borrows unrelated current contract and Xero names do not merge identities", () => {
  const d = empty();
  d.customers = [{ id: "a", display_name: "Same Name" }];
  d.rentals = [
    {
      id: "old",
      customer_id: "a",
      originating_reservation_id: "r",
      lifecycle_state: "ended",
    },
  ];
  d.agreements = [
    {
      id: "legacy",
      rental_id: "old",
      document_id: "pdf",
      signing_state: "unconfirmed",
      source_terms: { amount: 200, billingUnit: "month" },
      owner_corrections: {
        amount: 250,
        billingUnit: "month",
        commitmentMonths: 4,
      },
    },
  ];
  d.contracts = [
    {
      id: "new",
      reservation_id: "r",
      status: "Signed",
      monthly_price: 900,
      rental_summary_snapshot: { installation_fee: 500 },
    },
  ];
  d.xeroHistory = [
    {
      tenant_id: "tenant",
      contact_id: "contact",
      contact_name: "Same Name",
      transactions: [
        {
          id: "pay",
          date: "2026-10-01",
          type: "RECEIVE",
          status: "AUTHORISED",
        },
      ],
    },
  ];
  const rows = build(d);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].install_fee, null);
  assert.equal(rows.find((r) => r.rental_id)?.monthly_price, 250);
  assert.equal(rows.find((r) => r.status === "Xero only")?.customer_id, null);
  assert.ok(
    rows.every((r) => r.issues.some((i) => i.includes("shares this name"))),
  );
});
test("name search, status and review filters combine; numeric and date sorts keep nulls last both ways", () => {
  const d = empty();
  d.customers = [
    { id: "a", display_name: "Person 10" },
    { id: "b", display_name: "Person 2" },
    { id: "c", display_name: "Unknown" },
  ];
  d.rentals = [
    {
      id: "a",
      customer_id: "a",
      lifecycle_state: "ended",
      actual_end: "2026-02-01",
    },
    {
      id: "b",
      customer_id: "b",
      lifecycle_state: "ended",
      actual_end: "2025-12-01",
    },
  ];
  const rows = build(d);
  assert.equal(filterBillingRows(rows, "PERSON 2", "Returned", true).length, 1);
  assert.deepEqual(
    sortBillingRows(rows, (r) => r.name, "asc").map((r) => r.name),
    ["Person 2", "Person 10", "Unknown"],
  );
  assert.deepEqual(
    sortBillingRows(rows, (r) => r.return_date, "desc").map((r) => r.name),
    ["Person 10", "Person 2", "Unknown"],
  );
  assert.deepEqual(
    sortBillingRows(rows, (r) => r.return_date, "asc").map((r) => r.name),
    ["Person 2", "Person 10", "Unknown"],
  );
});
test("private history reader paginates all tables with stable ordering and fails closed on errors", async () => {
  const offsets: number[] = [];
  const client = {
    from(table: string) {
      const q = {
        select() {
          return q;
        },
        order() {
          return q;
        },
        range(from: number) {
          if (table === "customer_profiles") {
            offsets.push(from);
            return {
              data: Array.from({ length: from === 0 ? 1000 : 1 }, (_, i) => ({
                id: from + i,
              })),
              error: null,
            };
          }
          return { data: [], error: null };
        },
      };
      return q;
    },
  };
  const data = await readAccountingHistory(client);
  assert.equal(data.customers.length, 1001);
  assert.deepEqual(offsets, [0, 1000]);
  await assert.rejects(
    readAccountingHistory({
      from() {
        const q = {
          select() {
            return q;
          },
          order() {
            return q;
          },
          range() {
            return { error: new Error("Denied") };
          },
        };
        return q;
      },
    }),
    /Denied/,
  );
});

test("standalone sale stays separate from the same customer’s earlier returned rental", () => {
  const d = empty();
  d.customers = [{ id: "a", display_name: "Repeat buyer" }];
  d.rentals = [
    {
      id: "old",
      customer_id: "a",
      lifecycle_state: "ended",
      actual_end: "2026-05-10",
    },
  ];
  d.sales = [
    {
      id: "sale",
      customer_id: "a",
      rental_id: null,
      asset_id: "s",
      sold_on: "2026-11-01",
      agreed_cents: 250000,
    },
  ];
  d.inventory = [{ id: "s", unit_code: "019" }];
  const rows = build(d);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.rental_id)?.return_date, "2026-05-10");
  const sale = rows.find((r) => r.id === "sale:sale")!;
  assert.equal(sale.status, "Sold");
  assert.equal(sale.unit_code, "019");
  assert.equal(sale.return_date, null);
  assert.equal(sale.sale_price, 2500);
});

test("unconfirmed history retains explicit future allocation and labels the requested product separately", () => {
  const d = empty();
  d.saunaTypes = [{ id: "outdoor", name: "Outdoor Infrared" }];
  d.customers = [{ id: "a", display_name: "Reserved" }];
  d.reservations = [{ id: "r", sauna_type_id: "outdoor" }];
  d.rentals = [
    {
      id: "rent",
      customer_id: "a",
      originating_reservation_id: "r",
      lifecycle_state: "unconfirmed",
    },
  ];
  d.inventory = [{ id: "unit", unit_code: "038", future_customer_id: "r" }];
  const row = build(d)[0];
  assert.equal(row.unit_code, "038");
  assert.equal(row.start_date, null);
  assert.equal(row.status, "History incomplete");
  assert.equal(row.sauna_type, "Outdoor Infrared (requested)");
  assert.ok(row.issues.some((i) => i.includes("future allocation")));
});

test("continuous owner-reviewed rental consolidates legacy bookings and retains both sauna identities", () => {
  const d = empty();
  d.customers = [{ id: "a", display_name: "Continuous" }];
  d.links = [
    { customer_id: "a", reservation_id: "first" },
    { customer_id: "a", reservation_id: "second" },
  ];
  d.reservations = [
    { id: "first", booking_kind: "manual_historical" },
    { id: "second", booking_kind: "manual_historical" },
  ];
  d.rentals = [
    {
      id: "rent",
      customer_id: "a",
      originating_reservation_id: "first",
      lifecycle_state: "active",
      owner_review: {
        continuous: true,
        priorUnit: "019",
        currentUnit: "041",
        summary: "Swap date estimated; one continuous rental",
      },
    },
  ];
  d.inventory = [
    { id: "one", unit_code: "019" },
    { id: "two", unit_code: "041", current_customer_id: "first" },
  ];
  const rows = build(d);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].unit_code, "019, 041");
  assert.equal(rows[0].related_bookings.length, 2);
  assert.match(rows[0].notes!, /estimated/);
  assert.equal(rows[0].placements.length, 0);
});
