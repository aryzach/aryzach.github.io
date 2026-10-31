import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
test("academy Vault bridge denies clients, requires expiring one-use setup, and reads only its named secret", async () => {
  const pg = new PGlite();
  try {
    // Test-only provider stand-in: verifies our SQL policy, not Vault's encryption implementation.
    await pg.exec(`create role anon;create role authenticated;create role service_role;
   create schema academy;create schema vault;
   create table vault.fixture_secrets(id uuid primary key default gen_random_uuid(),name text unique,decrypted_secret text);
   create view vault.decrypted_secrets as select id,decrypted_secret from vault.fixture_secrets;
   create function vault.create_secret(s text,n text,d text) returns uuid language plpgsql as $$declare v uuid;begin insert into vault.fixture_secrets(name,decrypted_secret) values(n,s) returning id into v;return v;end$$;`);
    const dir = new URL("../supabase/migrations/", import.meta.url);
    const file = readdirSync(dir).find((n) =>
      n.endsWith("_academy_tutor_vault.sql"),
    )!;
    await pg.exec(readFileSync(new URL(file, dir), "utf8"));
    const call = async (command: string, payload: unknown = {}) =>
      (
        await pg.query<{ result: unknown }>(
          "select public.academy_tutor_secret($1,$2::jsonb) result",
          [command, JSON.stringify(payload)],
        )
      ).rows[0].result;
    for (const role of ["anon", "authenticated"]) {
      const r = await pg.query<{ allowed: boolean }>(
        `select has_function_privilege('${role}','public.academy_tutor_secret(text,jsonb)','EXECUTE') allowed`,
      );
      assert.equal(r.rows[0].allowed, false);
      await pg.exec(`set role ${role}`);
      await assert.rejects(call("read"), /permission denied/);
      await pg.exec("reset role");
    }
    assert.deepEqual(await call("read"), { key: null });
    const token = "fixture-install-token".padEnd(64, "x");
    const key = "sk-fixture-only-not-a-real-key-0123456789";
    await assert.rejects(call("install", { token, key }), /not authorized/);
    await pg.query(
      "update academy.tutor_config set setup_hash=$1,setup_expires_at=now()-interval '1 minute'",
      [createHash("sha256").update(token).digest("hex")],
    );
    await assert.rejects(call("install", { token, key }), /not authorized/);
    await pg.exec(
      "update academy.tutor_config set setup_expires_at=now()+interval '10 minutes'",
    );
    await assert.rejects(
      call("install", { token: "wrong", key }),
      /not authorized/,
    );
    assert.deepEqual(await call("install", { token, key }), { ok: true });
    assert.deepEqual(await call("read"), { key });
    await assert.rejects(
      call("install", {
        token,
        key: "sk-other-fixture-key-01234567890123456789",
      }),
      /not authorized/,
    );
    const r = await pg.query<{ cleared: boolean; rls: boolean }>(
      "select setup_hash is null and setup_expires_at is null cleared,(select relrowsecurity from pg_class where oid='academy.tutor_config'::regclass) rls from academy.tutor_config",
    );
    assert.deepEqual(r.rows[0], { cleared: true, rls: true });
  } finally {
    await pg.close();
  }
});
