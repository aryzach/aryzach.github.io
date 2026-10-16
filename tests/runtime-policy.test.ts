import test from "node:test";
import assert from "node:assert/strict";
import {
  isProductionRuntime,
  isExternalAction,
  productionHosts,
  isPublicPrerenderRead,
} from "../src/lib/runtimePolicy.ts";
import { emptyPreviewResponse } from "../src/dev/emptyResponses.ts";

test("production access requires a production build on an exact trusted host", () => {
  for (const host of productionHosts) {
    assert.equal(isProductionRuntime("production", host), true);
    assert.equal(isProductionRuntime("development", host), false);
    assert.equal(isProductionRuntime("preview", host), false);
  }
  for (const host of [
    "localhost",
    "127.0.0.1",
    "branch.pages.dev",
    "preview.lovable.app",
    "sfsaunarental.com.attacker.invalid",
  ]) {
    assert.equal(isProductionRuntime("production", host), false);
  }
});

test("checkout and booking destinations are identified without blocking normal navigation", () => {
  for (const url of [
    "https://cal.com/sf-sauna/test",
    "https://buy.stripe.com/test",
    "//checkout.stripe.com/test",
  ]) {
    assert.equal(isExternalAction(url, "http://localhost:8080"), true);
  }
  assert.equal(isExternalAction("/pricing", "http://localhost:8080"), false);
});

const request = (path: string, body?: object, headers = {}) =>
  new Request(
    `https://preview.invalid${path}`,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
        }
      : undefined,
  );

test("preview reads return no fabricated records or availability, and writes remain blocked", async () => {
  for (const path of [
    "/rest/v1/sauna_types",
    "/rest/v1/public_sauna_availability",
    "/rest/v1/pricing_tiers",
  ]) {
    const response = await emptyPreviewResponse(request(path));
    assert.deepEqual(await response.json(), []);
  }
  assert.equal(
    (await emptyPreviewResponse(request("/rest/v1/reservations"))).status,
    403,
  );
  assert.equal(
    (
      await emptyPreviewResponse(
        request("/functions/v1/reservation-get", {
          id: "not-loaded",
          token: "preview",
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await emptyPreviewResponse(
        request("/functions/v1/reservation-create", { intent: "reserve" }),
      )
    ).status,
    403,
  );
});

test("preview admin access exposes empty lists, never sample customer identities", async () => {
  const headers = { "x-admin-password": "preview" };
  const response = await emptyPreviewResponse(
    request("/functions/v1/admin-api", { action: "list_customers" }, headers),
  );
  assert.deepEqual(await response.json(), { customers: [] });
  assert.equal(
    (
      await emptyPreviewResponse(
        request(
          "/functions/v1/admin-api",
          { action: "delete_reservation" },
          headers,
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await emptyPreviewResponse(
        request("/functions/v1/accounting-api", { action: "login" }),
      )
    ).status,
    401,
  );
});

test("static production rendering permits only exact public REST reads", () => {
  assert.equal(
    isPublicPrerenderRead("GET", "/rest/v1/public_sauna_availability"),
    true,
  );
  for (const path of [
    "/rest/v1/reservations",
    "/rest/v1/sauna_inventory",
    "/functions/v1/reservation-get",
    "/storage/v1/object/lead-uploads",
  ]) {
    assert.equal(isPublicPrerenderRead("GET", path), false);
  }
  assert.equal(isPublicPrerenderRead("POST", "/rest/v1/sauna_types"), false);
});
