import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
test("academy private access, single-use activation, device conflicts, immutable attempts and atomic budget", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role;",
    );
    const dir = new URL("../supabase/migrations/", import.meta.url);
    const file = readdirSync(dir).find((n) =>
      n.endsWith("_academy_private_learning.sql"),
    )!;
    await db.exec(readFileSync(new URL(file, dir), "utf8"));
    const call = async (command: string, payload: unknown = {}) =>
      (
        await db.query<{ value: unknown }>(
          "select public.academy_store($1,$2::jsonb) as value",
          [command, JSON.stringify(payload)],
        )
      ).rows[0].value as any;
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select has_function_privilege('anon','public.academy_store(text,jsonb)','EXECUTE') as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    assert.equal(
      (
        await db.query<{ allowed: boolean }>(
          "select has_schema_privilege('authenticated','academy','USAGE') as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from pg_tables where schemaname='academy' and rowsecurity",
        )
      ).rows[0].n,
      6,
    );
    await assert.rejects(
      call("activate", {
        activation_hash: "wrong",
        password_hash: "test",
        salt: "test",
      }),
    );
    await db.exec(
      "update academy.owner set activation_hash='fixture-activation-hash',activation_expires_at=now()+interval '1 hour';",
    );
    await call("activate", {
      activation_hash: "fixture-activation-hash",
      password_hash: "fixture-pbkdf2",
      salt: "fixture-salt",
    });
    await assert.rejects(
      call("activate", {
        activation_hash: "fixture-activation-hash",
        password_hash: "new",
        salt: "new",
      }),
    );
    await call("session", { hash: "fixture-token-hash" });
    assert.equal(
      (await call("verify", { hash: "fixture-token-hash" })).ok,
      true,
    );
    await call("logout", { hash: "fixture-token-hash" });
    assert.equal(
      (await call("verify", { hash: "fixture-token-hash" })).ok,
      false,
    );
    const one = await call("entry", {
      id: "note:example",
      kind: "note",
      version: 0,
      value: { text: "desktop edit" },
    });
    assert.equal(one.version, 1);
    await assert.rejects(
      call("entry", {
        id: "note:example",
        kind: "note",
        version: 0,
        value: { text: "stale phone edit" },
      }),
      /another device/,
    );
    assert.equal(
      (await call("snapshot")).entries[0].value.text,
      "desktop edit",
    );
    const id = crypto.randomUUID();
    await call("attempt", {
      id,
      response: "original",
      method: "pending",
      createdAt: "2026-10-01T12:00:00Z",
    });
    await call("attempt", { id, response: "changed" });
    assert.equal((await call("snapshot")).attempts[0].response, "original");
    await call("evaluation", {
      id,
      correct: true,
      evaluation: { feedback: "Rubric evidence" },
    });
    assert.equal((await call("snapshot")).attempts[0].response, "original");
    for (let i = 0; i < 25; i++)
      await call("reserve", { id: crypto.randomUUID(), reserved: 2000000 });
    await assert.rejects(
      call("reserve", { id: crypto.randomUUID(), reserved: 1 }),
      /ceiling/,
    );
    assert.equal((await call("usage")).usedMicros, 50000000);
  } finally {
    await db.close();
  }
});
