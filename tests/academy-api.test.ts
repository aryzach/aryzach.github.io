import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
test("checklist backend removes its key, isolates legacy data, changes password, revokes sessions and rejects AI calls", async () => {
  const pg = new PGlite(),
    oldFetch = globalThis.fetch,
    oldDeno = (globalThis as any).Deno;
  let handler: (r: Request) => Promise<Response>;
  try {
    await pg.exec(
      "create role anon;create role authenticated;create role service_role;",
    );
    await pg.exec(
      readFileSync(
        "supabase/migrations/20261031080900_academy_private_learning.sql",
        "utf8",
      ),
    );
    // Vault extension is represented by its catalog table; no real secrets enter fixtures.
    await pg.exec(
      `create schema vault;create table vault.secrets(id uuid,name text);create table academy.tutor_config(singleton boolean,secret_id uuid,setup_hash text,setup_expires_at timestamptz);insert into vault.secrets values('11111111-1111-4111-8111-111111111111','sf_sauna_academy_openai_api_key'),('22222222-2222-4222-8222-222222222222','unrelated_service');insert into academy.tutor_config values(true,'11111111-1111-4111-8111-111111111111',null,null);create function public.academy_tutor_secret(text,jsonb) returns jsonb language sql as $$select '{}'::jsonb$$;`,
    );
    await pg.exec(
      readFileSync(
        "supabase/migrations/20261031104124_academy_curriculum_explorer.sql",
        "utf8",
      ),
    );
    assert.equal(
      (await pg.query("select count(*)::int n from vault.secrets")).rows[0].n,
      1,
    );
    assert.equal(
      (await pg.query("select name from vault.secrets")).rows[0].name,
      "unrelated_service",
    );
    assert.equal(
      (
        await pg.query(
          "select has_function_privilege('anon','public.academy_store(text,jsonb)','EXECUTE') ok",
        )
      ).rows[0].ok,
      false,
    );
    const activation = "fixture-owner-reset-link-with-32-characters";
    const hash = Buffer.from(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(activation),
      ),
    ).toString("hex");
    await pg.query(
      "update academy.owner set activation_hash=$1,activation_expires_at=now()+interval '1 hour'",
      [hash],
    );
    (globalThis as any).Deno = {
      env: {
        get: (name: string) =>
          ({
            SUPABASE_URL: "https://academy-test.invalid",
            SUPABASE_SERVICE_ROLE_KEY: "fixture-service",
          })[name],
      },
      serve: (h: typeof handler) => (handler = h),
    };
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const r = new Request(input, init);
      assert.equal(
        new URL(r.url).pathname,
        "/rest/v1/rpc/academy_store",
        "no AI or Vault reads are permitted",
      );
      const { command, payload } = await r.json();
      try {
        const result = await pg.query(
          "select public.academy_store($1,$2::jsonb) result",
          [command, JSON.stringify(payload || {})],
        );
        return new Response(JSON.stringify(result.rows[0].result), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ message: (e as Error).message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    };
    const compiled = await build({
      entryPoints: ["supabase/functions/academy-api/index.ts"],
      bundle: true,
      write: false,
      platform: "node",
      format: "cjs",
      packages: "external",
      plugins: [
        {
          name: "npm",
          setup(b) {
            b.onResolve({ filter: /^npm:/ }, (args) => ({
              path: args.path.replace(/^npm:/, "").replace(/@\d[^/]*$/, ""),
              external: true,
            }));
          },
        },
      ],
    });
    new Function("require", compiled.outputFiles[0].text)(require);
    const call = async (
      action: string,
      body: Record<string, unknown> = {},
      token = "",
    ) => {
      const r = await handler(
        new Request("https://academy-test.invalid/functions/v1/academy-api", {
          method: "POST",
          headers: {
            origin: "https://sfsaunarental.com",
            "Content-Type": "application/json",
            "x-academy-session": token,
          },
          body: JSON.stringify({ action, ...body }),
        }),
      );
      return { status: r.status, body: await r.json() };
    };
    assert.equal((await call("snapshot")).status, 401);
    const activated = await call("activate", {
      activation,
      password: "first-password-fixture",
    });
    assert.equal(activated.status, 200);
    let token = activated.body.token;
    assert.equal(
      (
        await call("activate", {
          activation,
          password: "another-password-fixture",
        })
      ).status,
      400,
    );
    await pg.exec(
      "insert into academy.entries(id,kind,value) values('legacy-note','note','{}');",
    );
    assert.equal(
      (await call("snapshot", {}, token)).body.state.entries.length,
      0,
    );
    const entry = {
      id: "explorer:1.1",
      kind: "note",
      value: {
        readings: { "1.1:r1": true },
        questions: {},
        notes: "Private evidence",
      },
      version: 0,
    };
    assert.equal((await call("entry", { entry }, token)).status, 200);
    assert.equal((await call("entry", { entry }, token)).status, 409);
    assert.equal(
      (await call("entry", { entry: { ...entry, id: "other:1.1" } }, token))
        .status,
      400,
    );
    const finalEntry = {
      id: "explorer:24.7",
      kind: "note",
      value: {
        readings: { "24.7:r5": true },
        questions: { "24.7:q28": true },
        notes: "Final exercise evidence",
      },
      version: 0,
    };
    assert.equal(
      (await call("entry", { entry: finalEntry }, token)).status,
      200,
    );
    const persistedFinal = (
      await call("snapshot", {}, token)
    ).body.state.entries.find((e: { id: string }) => e.id === finalEntry.id);
    assert.equal(persistedFinal.value.questions["24.7:q28"], true);
    assert.equal((await call("tutor", {}, token)).status, 410);
    assert.equal((await call("evaluate", {}, token)).status, 410);
    const foundationEntry = {
      id: "explorer:5.4",
      kind: "note",
      value: {
        readings: { "5.4:r3": true },
        questions: { "5.4:q10": true },
        notes: "Independent control evidence",
      },
      version: 0,
    };
    assert.equal(
      (await call("entry", { entry: foundationEntry }, token)).status,
      200,
    );
    const branchEntry = {
      id: "explorer:2.6",
      kind: "note",
      value: {
        readings: { "2.6:r4": true },
        questions: { "2.6:q1": true, "2.6:q16": true },
        notes: "Original notes and new feasibility matrix",
      },
      version: 0,
    };
    assert.equal(
      (await call("entry", { entry: branchEntry }, token)).status,
      200,
    );
    const changed = await call(
      "password",
      {
        currentPassword: "first-password-fixture",
        password: "second-password-fixture",
      },
      token,
    );
    assert.equal(changed.status, 200);
    assert.equal((await call("snapshot", {}, token)).status, 401);
    token = changed.body.token;
    assert.equal(
      (await call("snapshot", {}, token)).body.state.entries.find(
        (e: { id: string }) => e.id === "explorer:1.1",
      ).value.notes,
      "Private evidence",
    );
    assert.equal(
      (await call("login", { password: "first-password-fixture" })).status,
      401,
    );
    assert.equal(
      (await call("login", { password: "second-password-fixture" })).status,
      200,
    );
    // Owner-authorized one-use password reset also invalidates every previous device.
    await pg.query(
      "update academy.owner set activation_hash=$1,activation_expires_at=now()+interval '1 hour'",
      [hash],
    );
    assert.equal(
      (
        await call("activate", {
          activation,
          password: "third-password-fixture",
        })
      ).status,
      200,
    );
    assert.equal((await call("snapshot", {}, token)).status, 401);
  } finally {
    globalThis.fetch = oldFetch;
    (globalThis as any).Deno = oldDeno;
    await pg.close();
  }
});
