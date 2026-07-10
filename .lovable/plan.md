# Pricing in the database, generated into code at build time

Goal: single source of truth for pricing in the database, zero runtime cost, no change to paint speed or SEO.

## Approach

1. **New table `pricing_tiers`** holds every price. Admin can edit in the future via SQL or a small admin UI.
2. **A build script** (`scripts/generate-pricing.mjs`) reads the table and writes a TypeScript file `src/lib/generatedPricing.ts` with all pricing constants.
3. **Existing files** (`pricingCatalog.ts`, `contractConfig.ts`, `supabase/functions/_shared/pricing.ts`) import from the generated file instead of hardcoding numbers.
4. **The script runs automatically** before `vite build` and before prerender, so deploys always pick up the latest DB values. Also runnable manually with `npm run pricing:sync`.

Result: pricing pages still prerender statically with prices baked in. Paint time unchanged. To change a price, update one DB row and redeploy (~1–2 min).

## Database

Table `pricing_tiers`:
- `sauna_type_id` (text, FK to `sauna_types.id`)
- `commitment_months` (int: 1, 3, 6, or 12)
- `monthly_price` (int, USD)
- `install_fee` (int, USD)
- `badge` (text, nullable: "Most Popular" | "Best Value")
- primary key on (sauna_type_id, commitment_months)

Plus a small `pricing_config` table for the flat values (insurance $19, second heater $209, delivery fee $150, reservation deposits, security deposits).

Read access: `GRANT SELECT` to `authenticated` and `service_role` only — the build script uses the service role. Anon users never hit this table; they see the generated static values.

Seed rows: all current prices from the three code files.

## Generated file

`src/lib/generatedPricing.ts` — auto-generated, checked into git. Header comment: "DO NOT EDIT — run `npm run pricing:sync`". Exports:

- `PRICING_TIERS: Record<SaunaTypeId, Record<CommitmentMonths, { monthly, installFee, badge? }>>`
- `INSURANCE_MONTHLY`, `SECOND_HEATER_MONTHLY`, `DELIVERY_FEE_OUTSIDE_SF`
- `RESERVATION_DEPOSIT_INFRARED`, `RESERVATION_DEPOSIT_TRADITIONAL`, `SECURITY_DEPOSIT_INFRARED`, `SECURITY_DEPOSIT_TRADITIONAL`

The three existing pricing files become thin wrappers that import from this and keep their current exported API, so no consumer code changes.

## Build integration

- `scripts/generate-pricing.mjs` uses `@supabase/supabase-js` with the service role key from env.
- `package.json`:
  - `"pricing:sync": "node scripts/generate-pricing.mjs"`
  - `"prebuild": "npm run pricing:sync"` (Vite runs this before `build`)
- If the DB is unreachable during build, script fails loudly rather than shipping stale prices — but the file is committed, so local dev without DB access still works from the last synced snapshot.
- GitHub Pages workflow gets the service role key added as a repo secret so `prebuild` can run there.

## Technical details

- Edge functions (`supabase/functions/_shared/pricing.ts`) will read the same generated file. Deno imports the `.ts` file directly.
- No RLS-protected client reads needed at runtime — the browser never queries `pricing_tiers`.
- Schema migration + seed data is one migration. Data edits after that use the insert/update flow.
- The `sauna_types` table already exists with matching ids; `pricing_tiers.sauna_type_id` FKs to it.

## What I won't change

- No client-side fetching of prices. No loading states. No SEO regression.
- No admin UI in this pass — edits are DB-level for now. Easy to add later.
