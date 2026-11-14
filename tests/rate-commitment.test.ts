import test from "node:test";
import assert from "node:assert/strict";
import { rateCommitment } from "../src/lib/rateCommitment.ts";
import {
  scatterFixture,
  scatterTerm,
  scatterFutureFixture,
} from "./fixtures/rateCommitment.ts";
const today = "2026-11-13";
test("scatter uses original base rent on Y and original rental-only minimum including add-ons on X", () => {
  const s = scatterFixture(),
    original = JSON.stringify(s);
  const r = rateCommitment(s, today);
  assert.equal(r.points.length, 1);
  assert.deepEqual(r.points[0], {
    customerId: "c",
    name: "Example Current",
    saunaType: "Outdoor Traditional",
    status: "current",
    monthlyRate: 500,
    committedValue: 6240,
    installedOn: "2026-01-01",
    unverified: false,
  });
  assert.equal(JSON.stringify(s), original);
  // An unrelated cached quote and purchase never become rental commitments.
  s.lifecycle!.rentals.push({
    ...s.lifecycle!.rentals[0],
    id: "purchase",
    purpose: "purchase",
  });
  assert.equal(rateCommitment(s, today).points[0].committedValue, 6240);
});
test("historical includes archived customers; active and returned are distinct from pending or unknown", () => {
  const s = scatterFixture();
  s.customers[0].archived = true;
  Object.assign(s.lifecycle!.rentals[0], {
    lifecycle_state: "ended",
    actual_end: "2026-10-01",
  });
  assert.equal(rateCommitment(s, today).points[0].status, "historical");
  for (const patch of [
    { actual_end: null },
    { actual_end: "2026-12-01" },
    { actual_end: "2025-12-01" },
  ]) {
    const copy = structuredClone(s);
    Object.assign(copy.lifecycle!.rentals[0], patch);
    assert.equal(rateCommitment(copy, today).points.length, 0);
    assert.equal(rateCommitment(copy, today).gaps.length, 1);
  }
  for (const patch of [
    { actual_start: "2026-12-01" },
    { lifecycle_state: "canceled" },
    { owner_review: { neverInstalled: true } },
    { purpose: "purchase" },
  ]) {
    const copy = structuredClone(s);
    Object.assign(copy.lifecycle!.rentals[0], patch);
    assert.equal(rateCommitment(copy, today).eligible, 0);
  }
});
test("missing minimum or rate never plots zero; valid zero base rate is retained", () => {
  for (const patch of [
    { minimum_months: null },
    { base_monthly_cents: null },
    { currency: "CAD" },
    { base_monthly_cents: NaN },
  ]) {
    const s = scatterFixture();
    Object.assign(s.lifecycle!.terms[0], patch);
    const r = rateCommitment(s, today);
    assert.equal(r.points.length, 0);
    assert.equal(r.gaps.length, 1);
  }
  const s = scatterFixture();
  s.lifecycle!.terms[0].base_monthly_cents = 0;
  assert.equal(rateCommitment(s, today).points[0].monthlyRate, 0);
  s.lifecycle!.rentals[0].owner_review = { heaterChargeStatus: "unknown" };
  assert.equal(rateCommitment(s, today).points.length, 0);
});
test("latest agreement supplies original base rate; scope toggle changes X only", () => {
  const s = scatterFixture();
  s.lifecycle!.agreements.push({
    ...s.lifecycle!.agreements[0],
    id: "renewal",
    signed_on: "2026-08-01",
  });
  s.lifecycle!.terms.push(
    scatterTerm({
      id: "renewal-t",
      agreement_id: "renewal",
      effective_from: "2026-08-01",
      base_monthly_cents: 35000,
      minimum_months: 6,
      sauna_type: "Indoor Infrared",
    }),
  );
  s.lifecycle!.placements.push({
    id: "p",
    rental_id: "r",
    asset_id: "unit",
    installed_on: "2026-01-01",
    removed_on: null,
    type_at_install: "Outdoor Traditional",
    address: null,
    evidence: "owner",
  });
  const r = rateCommitment(s, today);
  assert.equal(r.points.length, 1);
  assert.equal(r.points[0].monthlyRate, 350);
  assert.equal(r.points[0].committedValue, 2220);
  assert.equal(r.points[0].saunaType, "Outdoor Traditional");
  assert.equal(rateCommitment(s, today, "all").points[0].committedValue, 8460);
  assert.equal(rateCommitment(s, today, "all").points[0].monthlyRate, 350);
  // Simultaneous incompatible original rates are surfaced, rather than picked arbitrarily.
  s.lifecycle!.terms.push(
    scatterTerm({
      id: "ambiguous",
      agreement_id: "renewal",
      effective_from: "2026-08-01",
      base_monthly_cents: 60000,
    }),
  );
  assert.equal(rateCommitment(s, today).gaps.length, 1);
});
test("signed discounted initial commitment is reused, without requiring payment history", () => {
  const s = scatterFixture();
  s.lifecycle!.terms[0].source = "Signed in-app agreement";
  s.lifecycle!.agreements[0].source_terms = {
    commercialTerms: { version: 2, initial_commitment_cents: 561600 },
  };
  assert.equal(rateCommitment(s, today).points[0].committedValue, 5616);
  assert.equal(rateCommitment(s, today).points[0].monthlyRate, 500);
  s.lifecycle!.agreements[0].signing_state = "unconfirmed";
  assert.equal(rateCommitment(s, today).points[0].unverified, true);
});

test("a later base-rate change within the same agreement does not replace its original base rate", () => {
  const s = scatterFixture();
  s.lifecycle!.terms.push(
    scatterTerm({
      id: "change",
      effective_from: "2026-07-01",
      base_monthly_cents: 30000,
    }),
  );
  assert.equal(rateCommitment(s, today).points[0].monthlyRate, 500);
});
test("incomplete earlier rental excludes all-agreement value but permits a complete latest agreement", () => {
  const s = scatterFixture();
  s.lifecycle!.rentals.push({
    ...s.lifecycle!.rentals[0],
    id: "earlier",
    lifecycle_state: "ended",
    actual_start: "2025-01-01",
    actual_end: "2025-06-01",
  });
  assert.equal(rateCommitment(s, today, "latest").points.length, 1);
  assert.equal(rateCommitment(s, today, "all").points.length, 0);
});

test("future and voided agreements cannot displace the latest usable agreement; date ties require review", () => {
  const s = scatterFixture();
  s.lifecycle!.agreements.push({
    ...s.lifecycle!.agreements[0],
    id: "future",
    signed_on: "2026-12-01",
  });
  s.lifecycle!.terms.push(
    scatterTerm({
      id: "future-t",
      agreement_id: "future",
      effective_from: "2026-12-01",
      base_monthly_cents: 90000,
    }),
  );
  assert.equal(rateCommitment(s, today).points[0].monthlyRate, 500);
  s.lifecycle!.agreements[1].signed_on = "2026-10-01";
  s.lifecycle!.agreements[1].signing_state = "voided";
  assert.equal(rateCommitment(s, today).points[0].monthlyRate, 500);
  s.lifecycle!.agreements[1].signed_on = "2026-01-01";
  s.lifecycle!.agreements[1].signing_state = "signed";
  assert.equal(rateCommitment(s, today).points.length, 0);
  assert.match(rateCommitment(s, today).gaps[0].reason, /ambiguous/);
});

test("signed future contracts plot before installation using contracted type and original commitment in both scopes", () => {
  const s = scatterFutureFixture();
  for (const scope of ["latest", "all"] as const) {
    const r = rateCommitment(s, today, scope);
    assert.equal(r.points.length, 1);
    assert.equal(r.points[0].status, "future");
    assert.equal(r.points[0].installedOn, null);
    assert.equal(r.points[0].saunaType, "Outdoor Traditional");
    assert.equal(r.points[0].monthlyRate, 350);
    assert.equal(r.points[0].committedValue, 8880);
    assert.equal(r.points[0].unverified, false);
  }
});
test("unsigned, voided, canceled, never-installed and purchase requests never appear as signed future contracts", () => {
  for (const status of ["unconfirmed", "draft", "voided", "superseded"]) {
    const s = scatterFutureFixture();
    s.lifecycle!.agreements[0].signing_state = status;
    assert.equal(rateCommitment(s, today).eligible, 0, status);
  }
  for (const patch of [
    { lifecycle_state: "canceled" },
    { purpose: "purchase" },
    { owner_review: { neverInstalled: true } },
    { lifecycle_state: "active" },
  ]) {
    const s = scatterFutureFixture();
    Object.assign(s.lifecycle!.rentals[0], patch);
    assert.equal(rateCommitment(s, today).eligible, 0);
  }
  const s = scatterFutureFixture();
  s.lifecycle!.agreements[0].signed_on = "2026-12-01";
  assert.equal(rateCommitment(s, today).eligible, 0);
});
test("future agreements preserve signed prepaid commitments and expose missing values instead of zero", () => {
  const s = scatterFutureFixture();
  s.lifecycle!.terms[0].source = "Signed in-app agreement";
  s.lifecycle!.agreements[0].source_terms = {
    commercialTerms: { version: 2, initial_commitment_cents: 799200 },
  };
  assert.equal(rateCommitment(s, today).points[0].committedValue, 7992);
  s.lifecycle!.terms[0].minimum_months = null;
  assert.equal(rateCommitment(s, today).points.length, 0);
  assert.equal(rateCommitment(s, today).gaps.length, 1);
});
test("repeat customers stay one point across installed and signed upcoming rentals; all scope includes both", () => {
  const s = scatterFixture(),
    f = scatterFutureFixture();
  f.lifecycle!.rentals[0].customer_id = "c";
  s.lifecycle!.rentals.push(...f.lifecycle!.rentals);
  s.lifecycle!.agreements.push(...f.lifecycle!.agreements);
  s.lifecycle!.terms.push(...f.lifecycle!.terms);
  assert.equal(rateCommitment(s, today).points.length, 1);
  assert.equal(rateCommitment(s, today).points[0].status, "current");
  assert.equal(rateCommitment(s, today).points[0].committedValue, 8880);
  assert.equal(rateCommitment(s, today, "all").points[0].committedValue, 15120);
  Object.assign(s.lifecycle!.rentals[0], {
    lifecycle_state: "ended",
    actual_end: "2026-10-01",
  });
  assert.equal(rateCommitment(s, today).points[0].status, "future");
});
