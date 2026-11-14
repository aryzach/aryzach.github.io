import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lifecycleDatabase } from "./helpers/lifecycleDatabase.ts";
test("location migration and commands separate capability, agreement and actual installation without rewriting history", async () => {
  const pg = await lifecycleDatabase();
  const query = async (sql: string, params: unknown[] = []) =>
    pg.query<Record<string,unknown>>(sql, params);
  const scalar = async (sql: string, params: unknown[] = []) =>
    Object.values((await query(sql, params)).rows[0])[0];
  const call = async (
    op: string,
    payload: Record<string, unknown>,
    id = crypto.randomUUID(),
  ) =>
    scalar("select rental_lifecycle_command($1,$2,$3::jsonb)", [
      id,
      op,
      JSON.stringify(payload),
    ]) as Promise<{rentalId:string;[key:string]:unknown}>;
  const version = (id: string) =>
    scalar("select version from rentals where id=$1", [id]);
  const rid = async (type = "Outdoor Traditional") => {
    const c = crypto.randomUUID();
    await query(
      "insert into customer_profiles(id,display_name) values($1,$2)",
      [c, "Synthetic customer"],
    );
    const r = await call("manual_reservation", {
      customerId: c,
      sourceKey: crypto.randomUUID(),
    });
    await call("terms", {
      rentalId: r.rentalId,
      version: await version(r.rentalId),
      minimumMonths: 12,
      monthlyCents: 50000,
      saunaType: type,
      source: "Owner confirmed agreement",
    });
    return r.rentalId as string;
  };
  const asset = async (code: string, locations = ["indoor", "outdoor"]) => {
    const id = crypto.randomUUID();
    await query(
      "insert into sauna_inventory(id,unit_code,sauna_type_id,status,condition_state,locations,style,model_key) values($1,$2,'test-location','Available','ready',$3,'traditional','standard')",
      [id, code, locations],
    );
    return id;
  };
  try {
    await pg.exec(
      "insert into sauna_types(id,name,description,placement,reservation_fee_cents,stripe_payment_link,location,style,model_key) values('test-location','Indoor Traditional','Synthetic','indoor',0,'https://example.invalid','indoor','traditional','standard')",
    );
    const legacy = await rid(),
      unit = await asset("TEST-1");
    await call("install", {
      rentalId: legacy,
      version: await version(legacy),
      assetId: unit,
      date: "2026-11-01",
      evidence: "Owner confirmed original installation",
    });
    const placement = (await scalar(
      "select id from rental_placements where rental_id=$1",
      [legacy],
    )) as string;
    const original = await scalar(
      "select to_jsonb(p) from rental_placements p where id=$1",
      [placement],
    );
    const inventory = await scalar(
      "select to_jsonb(i) from sauna_inventory i where id=$1",
      [unit],
    );
    const rental = await scalar(
      "select to_jsonb(r) from rentals r where id=$1",
      [legacy],
    );
    const noUnit = await rid();
    await call("backfill_history", {
      rentalId: noUnit,
      version: await version(noUnit),
      start: "2026-10-01",
      dateSource: "Owner confirmed date",
      state: "active",
      reason: "Synthetic confirmed date",
    });
    await pg.exec(
      readFileSync(
        "supabase/migrations/20261114034855_separate_installation_location.sql",
        "utf8",
      ),
    );
    assert.equal(
      await scalar(
        "select location from rental_installation_locations where placement_id=$1",
        [placement],
      ),
      "outdoor",
    );
    assert.equal(
      await scalar(
        "select catalog_conflict from rental_installation_locations where placement_id=$1",
        [placement],
      ),
      true,
    );
    assert.deepEqual(
      await scalar("select to_jsonb(p) from rental_placements p where id=$1", [
        placement,
      ]),
      original,
    );
    assert.deepEqual(
      await scalar("select to_jsonb(i) from sauna_inventory i where id=$1", [
        unit,
      ]),
      inventory,
    );
    assert.deepEqual(
      await scalar("select to_jsonb(r) from rentals r where id=$1", [legacy]),
      rental,
    );
    assert.equal(
      await scalar(
        "select location from rental_installation_locations where rental_id=$1",
        [noUnit],
      ),
      "outdoor",
    );
    const next = await rid(),
      nextUnit = await asset("TEST-2"),
      indoor = await asset("TEST-3", ["indoor"]);
    const request = {
      rentalId: next,
      version: await version(next),
      assetId: nextUnit,
      date: "2026-11-02",
      evidence: "Confirmed location",
    };
    await assert.rejects(
      async () => call("install", request),
      /Explicitly confirm/,
    );
    await assert.rejects(
      async () =>
        call("install", { ...request, installationLocation: "indoor" }),
      /match the agreement/,
    );
    await assert.rejects(
      async () =>
        call("install", {
          ...request,
          assetId: indoor,
          installationLocation: "outdoor",
        }),
      /capability/,
    );
    assert.equal(
      await scalar(
        "select count(*) from rental_placements where rental_id=$1",
        [next],
      ),
      0,
    );
    const id = crypto.randomUUID(),
      payload = { ...request, installationLocation: "outdoor" };
    const first = await call("install", payload, id);
    assert.deepEqual(await call("install", payload, id), first);
    await assert.rejects(
      async () =>
        call("install", { ...payload, installationLocation: "indoor" }, id),
      /Request ID/,
    );
    assert.equal(
      await scalar(
        "select source from rental_installation_locations where rental_id=$1",
        [next],
      ),
      "explicit_confirmation",
    );
    const p = await scalar(
      "select id from rental_placements where rental_id=$1",
      [next],
    );
    await assert.rejects(
      async () =>
        call("swap", {
          rentalId: next,
          version: await version(next),
          placementId: p,
          assetId: indoor,
          date: "2026-11-03",
          evidence: "Test swap",
          installationLocation: "outdoor",
        }),
      /capability/,
    );
    assert.equal(
      await scalar(
        "select removed_on is null from rental_placements where id=$1",
        [p],
      ),
      true,
    );
    const review = {
      rentalId: legacy,
      version: await version(legacy),
      placementId: placement,
      installationLocation: "outdoor",
      evidence: "Reviewed original agreement and actual installation",
    };
    const reviewId = crypto.randomUUID();
    const result = await call("confirm_location", review, reviewId);
    assert.deepEqual(await call("confirm_location", review, reviewId), result);
    assert.equal(
      await scalar(
        "select source from rental_installation_locations where placement_id=$1",
        [placement],
      ),
      "explicit_confirmation",
    );
    await assert.rejects(
      async () =>
        call("confirm_location", {
          ...review,
          version: await version(legacy),
          installationLocation: "indoor",
        }),
      /match an unambiguous/,
    );
    await assert.rejects(
      () =>
        pg.exec("set role anon;select * from rental_installation_locations"),
      /permission denied/,
    );
    await pg.exec("reset role");
    await assert.rejects(
      () =>
        pg.exec(
          "set role service_role;select rental_agreed_location(gen_random_uuid(),current_date)",
        ),
      /permission denied/,
    );
    await pg.exec("reset role");
    await assert.rejects(
      () => pg.exec("delete from rental_installation_locations"),
      /confirmation command/,
    );
  } finally {
    await pg.close();
  }
});
