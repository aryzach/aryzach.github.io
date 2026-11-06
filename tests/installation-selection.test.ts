import { test } from "node:test";
import assert from "node:assert/strict";
import { installationSelection } from "../src/lib/installationSelection.ts";
import {
  installationFixture,
  rental,
} from "./fixtures/installationSelection.ts";
test("installation preset follows this rental’s inventory future assignment", () => {
  const state = installationFixture();
  state.legacyLinks!.push(
    {
      rentalId: "other-rental-same-customer",
      assetId: "unit-49",
      kind: "future",
      recordedInstallDate: null,
    },
    {
      rentalId: rental.id,
      assetId: "unit-2",
      kind: "current",
      recordedInstallDate: null,
    },
  );
  const result = installationSelection(state, rental);
  assert.equal(result.preset, "unit-56");
  assert.deepEqual(
    result.reserved.map((a) => a.code),
    ["056"],
  );
});
test("missing or conflicting future allocations never silently use a cached booking pointer", () => {
  const state = installationFixture();
  state.legacyLinks = [];
  assert.equal(installationSelection(state, rental).preset, "");
  assert.equal(installationSelection(state, rental).booked?.id, "unit-56");
  state.legacyLinks = [
    {
      rentalId: rental.id,
      assetId: "unit-49",
      kind: "future",
      recordedInstallDate: null,
    },
  ];
  assert.equal(installationSelection(state, rental).preset, "");
  assert.equal(installationSelection(state, rental).conflict, true);
});
test("ambiguous, unavailable, missing and cancelled allocations require explicit review", () => {
  for (const scenario of [
    "multiple",
    "missing",
    "retired",
    "sold",
    "cancelled",
  ]) {
    const state = installationFixture();
    if (scenario === "multiple")
      state.legacyLinks!.push({
        rentalId: rental.id,
        assetId: "unit-49",
        kind: "future",
        recordedInstallDate: null,
      });
    if (scenario === "missing")
      state.assets = state.assets.filter((a) => a.id !== "unit-56");
    if (scenario === "retired") state.assets[0].retired = true;
    if (scenario === "sold") state.assets[0].sourceStatus = "Sold";
    if (scenario === "cancelled") state.bookings![0].state = "cancelled";
    assert.equal(installationSelection(state, rental).preset, "", scenario);
  }
});
