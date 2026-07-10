// Sync pricing from Lovable Cloud (Supabase) into src/lib/generatedPricing.ts.
// Runs automatically before `npm run build` (see the "prebuild" script) and
// can be run manually with `npm run pricing:sync`.
//
// Uses the public/anon key — pricing rows are readable by anyone since they
// are also displayed on the marketing site.

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "src", "lib", "generatedPricing.ts");

// Prefer env vars; fall back to parsing .env so this works locally too.
function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf8");
    const line = raw.split("\n").find((l) => l.startsWith(`${name}=`));
    if (!line) return undefined;
    return line.slice(name.length + 1).trim().replace(/^"(.*)"$/, "$1");
  } catch {
    return undefined;
  }
}

const SUPABASE_URL = readEnv("VITE_SUPABASE_URL");
const SUPABASE_KEY = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "[pricing:sync] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY — " +
      "keeping existing src/lib/generatedPricing.ts."
  );
  process.exit(0);
}

const SAUNA_TYPE_IDS = [
  "indoor_infrared",
  "outdoor_infrared",
  "indoor_outdoor_traditional_latest",
  "outdoor_traditional_latest",
  "indoor_traditional",
  "outdoor_traditional_original",
];

const CONFIG_KEYS = {
  insurance_monthly: "INSURANCE_MONTHLY",
  second_heater_monthly: "SECOND_HEATER_MONTHLY",
  delivery_fee_outside_sf: "DELIVERY_FEE_OUTSIDE_SF",
  reservation_deposit_infrared: "RESERVATION_DEPOSIT_INFRARED",
  reservation_deposit_traditional: "RESERVATION_DEPOSIT_TRADITIONAL",
  security_deposit_infrared: "SECURITY_DEPOSIT_INFRARED",
  security_deposit_traditional: "SECURITY_DEPOSIT_TRADITIONAL",
};

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  const [{ data: tiers, error: tiersErr }, { data: cfg, error: cfgErr }] =
    await Promise.all([
      supabase
        .from("pricing_tiers")
        .select("sauna_type_id, commitment_months, monthly_price, install_fee, badge"),
      supabase.from("pricing_config").select("key, value_int"),
    ]);

  if (tiersErr) throw tiersErr;
  if (cfgErr) throw cfgErr;
  if (!tiers?.length) throw new Error("pricing_tiers returned no rows");
  if (!cfg?.length) throw new Error("pricing_config returned no rows");

  // Group tiers by sauna_type_id -> months.
  const grouped = {};
  for (const t of tiers) {
    grouped[t.sauna_type_id] ??= {};
    grouped[t.sauna_type_id][t.commitment_months] = {
      monthly: t.monthly_price,
      installFee: t.install_fee,
      badge: t.badge ?? undefined,
    };
  }

  for (const id of SAUNA_TYPE_IDS) {
    if (!grouped[id]) throw new Error(`Missing pricing for sauna type: ${id}`);
    for (const m of [1, 3, 6, 12]) {
      if (!grouped[id][m]) throw new Error(`Missing ${m}-month tier for ${id}`);
    }
  }

  const cfgMap = Object.fromEntries(cfg.map((r) => [r.key, r.value_int]));
  for (const key of Object.keys(CONFIG_KEYS)) {
    if (typeof cfgMap[key] !== "number") {
      throw new Error(`Missing pricing_config row: ${key}`);
    }
  }

  const tierBlock = (id) => {
    const months = grouped[id];
    const line = (m) => {
      const t = months[m];
      const badge = t.badge ? `, badge: ${JSON.stringify(t.badge)}` : "";
      return `    ${m}: { monthly: ${t.monthly}, installFee: ${t.installFee}${badge} },`;
    };
    return `  ${id}: {\n${[1, 3, 6, 12].map(line).join("\n")}\n  },`;
  };

  const out = `// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Regenerate with \`npm run pricing:sync\` (reads from the pricing_tiers +
// pricing_config tables in Lovable Cloud). Committed to git so the app can
// build/prerender even when the database is unreachable.

export type SaunaTypeId =
  | "indoor_infrared"
  | "outdoor_infrared"
  | "indoor_outdoor_traditional_latest"
  | "outdoor_traditional_latest"
  | "indoor_traditional"
  | "outdoor_traditional_original";

export type CommitmentMonths = 1 | 3 | 6 | 12;

export interface PricingTierRow {
  monthly: number;
  installFee: number;
  badge?: "Most Popular" | "Best Value";
}

export const PRICING_TIERS: Record<SaunaTypeId, Record<CommitmentMonths, PricingTierRow>> = {
${SAUNA_TYPE_IDS.map(tierBlock).join("\n")}
};

export const INSURANCE_MONTHLY = ${cfgMap.insurance_monthly};
export const SECOND_HEATER_MONTHLY = ${cfgMap.second_heater_monthly};
export const DELIVERY_FEE_OUTSIDE_SF = ${cfgMap.delivery_fee_outside_sf};
export const RESERVATION_DEPOSIT_INFRARED = ${cfgMap.reservation_deposit_infrared};
export const RESERVATION_DEPOSIT_TRADITIONAL = ${cfgMap.reservation_deposit_traditional};
export const SECURITY_DEPOSIT_INFRARED = ${cfgMap.security_deposit_infrared};
export const SECURITY_DEPOSIT_TRADITIONAL = ${cfgMap.security_deposit_traditional};
`;

  writeFileSync(OUT, out);
  console.log(`[pricing:sync] Wrote ${OUT}`);
}

main().catch((err) => {
  console.error("[pricing:sync] FAILED:", err.message ?? err);
  process.exit(1);
});