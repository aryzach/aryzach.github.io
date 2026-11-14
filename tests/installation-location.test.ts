import test from "node:test";
import assert from "node:assert/strict";
import {
  agreedLocation,
  confirmedInstallation,
  confirmedSaunaType,
  locationFromType,
} from "../src/lib/installationLocation.ts";
import { scatterFixture } from "./fixtures/rateCommitment.ts";
test("capability never determines actual placement and catalog conflicts retain confirmed outdoor location", () => {
  const s = scatterFixture(),
    r = s.lifecycle!.rentals[0];
  s.assets = [
    {
      id: "u",
      code: "051",
      model: "v2",
      typeName: "Indoor Traditional",
      locations: ["indoor", "outdoor"],
    },
  ];
  s.lifecycle!.placements = [
    {
      id: "p",
      rental_id: "r",
      asset_id: "u",
      installed_on: "2026-01-01",
      removed_on: null,
      type_at_install: "Indoor Traditional",
      address: null,
      evidence: "Fixture",
    },
  ];
  Object.assign(s.lifecycle!.installationLocations![0], {
    placement_id: "p",
    catalog_conflict: true,
  });
  assert.equal(confirmedSaunaType(s, r, "2026-11-13"), "Outdoor Traditional");
  assert.equal(confirmedInstallation(s, r, "2026-11-13").catalogConflict, true);
  s.lifecycle!.installationLocations = [];
  assert.equal(
    confirmedSaunaType(s, r, "2026-11-13"),
    "Placement needs review",
  );
});
test("agreement, date, capability and confirmation conflicts are surfaced rather than silently choosing a label", () => {
  const s = scatterFixture(),
    r = s.lifecycle!.rentals[0];
  assert.equal(confirmedSaunaType(s, r, "2026-11-13"), "Outdoor Traditional");
  s.lifecycle!.terms[0].sauna_type = "Indoor Traditional";
  assert.equal(confirmedInstallation(s, r, "2026-11-13").needsReview, true);
  s.lifecycle!.terms[0].sauna_type = "Indoor / Outdoor Traditional";
  assert.equal(agreedLocation(s, r.id, "2026-11-13").location, null);
  for (const label of ["Indoor / Outdoor Traditional", "Both", "Unknown"])
    assert.equal(locationFromType(label), null);
  assert.equal(
    locationFromType("Outdoor Traditional (Original Collection)"),
    "outdoor",
  );
});
test("a later unconfirmed swap cannot inherit the previous installation location", () => {
  const s = scatterFixture(),
    r = s.lifecycle!.rentals[0];
  s.lifecycle!.placements.push({
    id: "new",
    rental_id: r.id,
    asset_id: "u2",
    installed_on: "2026-08-01",
    removed_on: null,
    type_at_install: "Outdoor Traditional",
    address: null,
    evidence: "Swap recorded",
  });
  assert.equal(
    confirmedSaunaType(s, r, "2026-11-13"),
    "Placement needs review",
  );
});
