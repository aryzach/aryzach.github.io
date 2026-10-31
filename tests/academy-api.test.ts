import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
test("Edge Function enforces owner session, regrades submitted answers, validates tutor output and prevents duplicate paid calls", async () => {
  const pg = new PGlite();
  const oldFetch = globalThis.fetch;
  const oldDeno = (globalThis as any).Deno;
  let handler: (r: Request) => Promise<Response>;
  let paidCalls = 0;
  try {
    await pg.exec(
      "create role anon;create role authenticated;create role service_role;",
    );
    const dir = new URL("../supabase/migrations/", import.meta.url);
    await pg.exec(
      readFileSync(
        new URL(
          readdirSync(dir).find((n) =>
            n.endsWith("_academy_private_learning.sql"),
          )!,
          dir,
        ),
        "utf8",
      ),
    );
    await pg.exec(
      "update academy.owner set activation_hash='" +
        Buffer.from(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode("fixture-activation-token-32-characters"),
          ),
        ).toString("hex") +
        "',activation_expires_at=now()+interval '1 hour';",
    );
    let key = "";
    (globalThis as any).Deno = {
      env: {
        get: (name: string) =>
          ({
            SUPABASE_URL: "https://academy-test.invalid",
            SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
            OPENAI_API_KEY: key,
          })[name],
      },
      serve: (h: typeof handler) => {
        handler = h;
      },
    };
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      if (url.pathname === "/rest/v1/rpc/academy_store") {
        const { command, payload } = await request.json();
        try {
          const data = await pg.query<{ result: unknown }>(
            "select public.academy_store($1,$2::jsonb) result",
            [command, JSON.stringify(payload)],
          );
          return new Response(JSON.stringify(data.rows[0].result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ message: (e as Error).message }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
      }
      assert.equal(url.href, "https://api.openai.com/v1/responses");
      paidCalls++;
      const body = await request.json();
      assert.equal(body.store, false);
      assert.equal(body.max_output_tokens, 4096);
      assert.equal(body.service_tier, "default");
      return new Response(
        JSON.stringify({
          status: "completed",
          usage: { input_tokens: 100, output_tokens: 200 },
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    score: 1,
                    feedback:
                      "Explain the evidence boundary before drawing a conclusion.",
                    criteria: [],
                    sources: ["osha"],
                  }),
                },
              ],
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      );
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
          name: "deno-npm",
          setup(b) {
            b.onResolve({ filter: /^npm:/ }, (a) => ({
              path: a.path.startsWith("npm:zod")
                ? "zod"
                : "@supabase/supabase-js",
              external: true,
            }));
          },
        },
      ],
    });
    new Function("require", compiled.outputFiles[0].text)(require);
    const call = async (
      body: unknown,
      token?: string,
      origin = "https://sfsaunarental.com",
    ) => {
      const res = await handler(
        new Request("https://academy-test.invalid/functions/v1/academy-api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin,
            ...(token ? { "x-academy-session": token } : {}),
          },
          body: JSON.stringify(body),
        }),
      );
      return { status: res.status, data: await res.json() };
    };
    assert.equal((await call({ action: "snapshot" })).status, 401);
    assert.equal(
      (await call({ action: "snapshot" }, undefined, "https://evil.invalid"))
        .status,
      403,
    );
    const activated = await call({
      action: "activate",
      password: "fixture-password-not-real",
      activation: "fixture-activation-token-32-characters",
    });
    assert.equal(activated.status, 200);
    const token = activated.data.token;
    assert.ok(token);
    assert.equal(
      (
        await call({
          action: "activate",
          password: "fixture-password-not-real",
          activation: "fixture-activation-token-32-characters",
        })
      ).status,
      400,
    );
    assert.equal(
      (await call({ action: "login", password: "incorrect-password" })).status,
      401,
    );
    assert.equal(
      (await call({ action: "login", password: "fixture-password-not-real" }))
        .status,
      200,
    );
    const result = await call(
      {
        action: "attempt",
        attempt: {
          id: crypto.randomUUID(),
          questionId: "diag-current",
          response: "20",
          confidence: 5,
          correct: true,
        },
      },
      token,
    );
    assert.equal(result.status, 200);
    assert.equal(result.data.attempt.correct, false);
    const waiting = await call(
      {
        action: "attempt",
        attempt: {
          id: crypto.randomUUID(),
          questionId: "regulation-transfer",
          response:
            "A component mark does not cover changed cabin controls. Request exact scope.",
          confidence: 3,
        },
      },
      token,
    );
    assert.equal(waiting.data.attempt.method, "pending");
    assert.equal(
      (
        await call(
          {
            action: "tutor",
            requestId: crypto.randomUUID(),
            message: "What is listing scope?",
          },
          token,
        )
      ).status,
      503,
    );
    key = "fixture-openai-key";
    const requestId = crypto.randomUUID();
    const prompt = {
      action: "tutor",
      requestId,
      message: "Explain component recognition versus finished listing.",
      moduleId: "regulation",
    };
    assert.equal((await call(prompt, token)).status, 200);
    assert.equal((await call(prompt, token)).status, 200);
    assert.equal(paidCalls, 1);
    const evaluated = await call(
      {
        action: "evaluate",
        requestId: crypto.randomUUID(),
        attemptId: waiting.data.attempt.id,
        moduleId: "regulation",
      },
      token,
    );
    assert.equal(evaluated.status, 200);
    assert.equal(
      evaluated.data.attempt.correct,
      false,
      "Empty rubric cannot pass even when model score is 1",
    );
    await call({ action: "logout" }, token);
    assert.equal((await call({ action: "snapshot" }, token)).status, 401);
  } finally {
    globalThis.fetch = oldFetch;
    (globalThis as any).Deno = oldDeno;
    await pg.close();
  }
});
