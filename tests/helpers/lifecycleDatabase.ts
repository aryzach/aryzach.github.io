import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readFileSync } from "node:fs";
export async function lifecycleDatabase() {
  const root = process.cwd();
  const pg = new PGlite({ extensions: { btree_gist } });
  const read = (p) => readFileSync(root + "/" + p, "utf8");
  await pg.exec(
    "CREATE SCHEMA extensions;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;",
  );
  await pg.exec(
    `CREATE FUNCTION extensions.gen_random_bytes(n integer) RETURNS bytea LANGUAGE sql VOLATILE AS $$ SELECT decode(substr(repeat(md5(random()::text),greatest(1,(n+15)/16)),1,n*2),'hex') $$;`,
  );
  const src = read("tests/fixtures/lifecycle-legacy-schema.sql");
  for (const table of [
    "sauna_types",
    "reservations",
    "sauna_inventory",
    "contracts",
    "reservation_events",
    "waitlist_entries",
  ]) {
    const ddl = src.match(
      new RegExp("CREATE TABLE public\\." + table + " \\(.*?\\n\\);", "s"),
    )[0];
    await pg.exec(
      ddl + " ALTER TABLE public." + table + " ADD PRIMARY KEY(id);",
    );
  }
  const core = read(
    "supabase/migrations/20261017075300_core_customer_rental_foundation.sql",
  );
  await pg.exec(
    core.slice(
      core.indexOf("CREATE TABLE public.customer_profiles"),
      core.indexOf("-- LOCAL REVIEW ONLY."),
    ),
  );
  await pg.exec(
    "ALTER TABLE customer_profiles ADD COLUMN version integer NOT NULL DEFAULT 1;",
  );
  const notifications = read(
    "supabase/migrations/20261017060000_atomic_payment_and_notification_intents.sql",
  );
  await pg.exec(
    notifications.slice(0, notifications.indexOf("-- Lock the reservation")),
  );
  for (const f of [
    "drizzle/migrations/0004_auto_committed_until.sql",
    "supabase/migrations/20261017220000_rental_lifecycle.sql",
    "supabase/migrations/20261018020000_reviewed_historical_corrections.sql",
  ]) {
    await pg.exec(read(f));
  }
  await pg.exec(
    "CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text,name text);",
  );
  for (const name of [
    "20260727175749_b5718cc6-b74b-480a-8fd5-420e33ad6fcb.sql",
    "20261018040000_booking_lifecycle.sql",
    "20261018043000_complete_booking_operations.sql",
    "20261018044500_presold_booking_compatibility.sql",
    "20261018045000_protect_confirmed_booking_history.sql",
    "20261018080000_authoritative_assignments_and_booking_links.sql",
    "20261018130000_incoming_fleet_actions.sql",
    "20261018130500_preserve_shipping_during_booking.sql",
    "20261018160000_fleet_schedule_conflicts.sql",
    "20261018170000_separate_inbound_and_booking_availability.sql",
    "20261028103314_schedule_sauna_returns.sql",
    "20261029162959_booking_model_waitlist.sql",
  ])
    await pg.exec(read("supabase/migrations/" + name));
  return pg;
}
