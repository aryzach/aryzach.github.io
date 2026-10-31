import { createClient } from "npm:@supabase/supabase-js@2.110.1";
import { z } from "npm:zod@3.25.76";
import { validateValue } from "./engine.ts";
const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const origins = new Set([
  "https://sfsaunarental.com",
  "https://www.sfsaunarental.com",
  "https://aryzach.github.io",
  "https://cedar-home-sanctuary.lovable.app",
]);
const encoder = new TextEncoder();
async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
function random() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
async function derive(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: encoder.encode(salt),
          iterations: 310000,
          hash: "SHA-256",
        },
        key,
        256,
      ),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i++) n |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return n === 0;
}
async function store(command: string, payload: unknown = {}) {
  const { data, error } = await db.rpc("academy_store", { command, payload });
  if (error) throw Error(error.message);
  return data;
}
Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": origins.has(origin)
      ? origin
      : "https://sfsaunarental.com",
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization,apikey,content-type,x-academy-session",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST" || (origin && !origins.has(origin)))
    return reply({ error: "Request not allowed" }, 403);
  try {
    if (Number(req.headers.get("content-length") || 0) > 150000)
      return reply({ error: "Request too large" }, 413);
    const raw = await req.text();
    if (encoder.encode(raw).length > 150000)
      return reply({ error: "Request too large" }, 413);
    const body = JSON.parse(raw);
    const action = body.action;
    if (action === "login" || action === "activate") {
      const ip = (req.headers.get("x-forwarded-for") || "unknown")
        .split(",")[0]
        .trim();
      if (!(await store("rate", { key: await hash(ip) })).allowed)
        return reply(
          { error: "Too many attempts. Try again in 15 minutes." },
          429,
        );
      const password = z.string().min(12).max(256).parse(body.password);
      const credentials = await store("credentials");
      if (action === "activate") {
        const activation = z.string().min(32).max(128).parse(body.activation);
        const salt = random();
        await store("activate", {
          activation_hash: await hash(activation),
          salt,
          password_hash: await derive(password, salt),
        });
      } else if (
        !credentials.password_hash ||
        !equal(
          await derive(password, credentials.salt),
          credentials.password_hash,
        )
      )
        return reply(
          {
            error: "Password not accepted or academy access is not activated.",
          },
          401,
        );
      const token = random();
      await store("session", { hash: await hash(token) });
      return reply({ token });
    }
    const token = req.headers.get("x-academy-session") || "";
    const tokenHash = await hash(token);
    if (!token || !(await store("verify", { hash: tokenHash })).ok)
      return reply({ error: "Sign in to your academy." }, 401);
    if (action === "logout") {
      await store("logout", { hash: tokenHash });
      return reply({ ok: true });
    }
    if (action === "password") {
      if (!(await store("rate", { key: "password-change" })).allowed)
        return reply(
          { error: "Too many password attempts. Try again in 15 minutes." },
          429,
        );
      const password = z.string().min(12).max(256).parse(body.password);
      const current = z.string().min(12).max(256).parse(body.currentPassword);
      const credentials = await store("credentials");
      if (
        !equal(
          await derive(current, credentials.salt),
          credentials.password_hash,
        )
      )
        return reply({ error: "Current password not accepted." }, 400);
      const salt = random();
      await store("password", {
        expected_hash: credentials.password_hash,
        password_hash: await derive(password, salt),
        salt,
      });
      const token = random();
      await store("session", { hash: await hash(token) });
      return reply({ token });
    }
    if (action === "snapshot") return reply({ state: await store("snapshot") });
    if (action === "entry") {
      const entry = z
        .object({
          id: z.string().regex(/^explorer:[0-9]+\.[0-9]+$/),
          kind: z.literal("note"),
          value: z.unknown(),
          version: z.number().int().min(0),
        })
        .strict()
        .parse(body.entry);
      const value = validateValue(entry.id.slice(9), entry.value);
      return reply({ entry: await store("entry", { ...entry, value }) });
    }
    return reply(
      { error: "This curriculum has no AI tutor or grading endpoint." },
      410,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    if (/Entry changed/.test(message)) return reply({ error: message }, 409);
    return reply(
      {
        error: message.includes("Activation")
          ? message
          : "Unable to save. Check your input and sign-in, then try again.",
      },
      400,
    );
  }
});
