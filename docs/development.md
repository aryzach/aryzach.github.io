# Development with Lovable and Codex

Keep one repository and the existing React/Vite structure. Lovable remains the visual editor. The user has authorized committing and pushing each tested frontend update directly to `main` so Lovable can sync it. Push coherent, validated updates rather than individual file saves. Existing main workflows also deploy production; do not fabricate customer or financial data. This authorization does not include database migrations, credential changes or infrastructure changes. No production deployment, database migration, account ownership or secret configuration was changed by this development setup.

## Repeatable setup

Use Node **22.22.2** (`nvm install && nvm use`) and npm **10.9.4** (`npm install -g npm@10.9.4`). npm is the canonical package manager for CI; existing Bun lockfiles remain for Lovable compatibility and are not the CI source of truth.

```sh
npm ci
npm run dev
```

The lockfile uses public npm registry artifacts with integrity verification, including optional platform binaries. Do not use `--no-save` dependency workarounds or disable TLS/checksum verification. For cloud machines with system Chromium, set `PUPPETEER_SKIP_DOWNLOAD=true` during installation and `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` for tests. Otherwise `npm ci` installs Puppeteer's browser normally.

No credentials are required for development. Vite overrides Supabase configuration with preview placeholders in development and preview builds; it ignores the tracked production public values for those modes. `.env.example` describes the placeholders. Never add server credentials to `VITE_*`, the repository, fixtures or the browser.

Each Codex cloud task is already isolated. Use its existing checkout; do not create a Git worktree unless explicitly requested.

## Safe browser workflow

- `npm run dev`: visual development with empty data states, including Lovable's development preview.
- `npm run build:preview`: offline preview artifact; avoids the production `prebuild` pricing sync and sitemap writes.
- `npm run preview`: serve the existing artifact; build with `build:preview` first.
- `/admin` and `/accounting`: preview password `preview`; private production data is never loaded. Admin/accounting preview lists are empty by default. An explicitly authorized private local snapshot may populate the admin core records and original inventory grid through the loopback-only development loader; copied records stay read only and outside public/build files. Local draft edits remain tab-local. Live backend mutations remain disabled in preview.

A visible banner identifies preview mode. No sample records or assumed metrics are displayed. Preview submissions, uploads, bookings, payments, external fetch/XHR and beacons are blocked. Checkout/Cal links lead to an explanatory local page. Marketing images/videos/fonts and map embeds can still load from external hosts; this is not an offline asset mirror or a general-purpose browser sandbox.

`src/dev/bootstrap.ts` runs before the application and the generated Supabase client. `src/dev/emptyResponses.ts` returns empty lists for supported reads; unknown requests and writes fail. The preview transport never emulates success for a submission. `src/lib/runtimePolicy.ts` requires **both** production build mode and an exact recognized hostname before live integrations/analytics activate. A normal production bundle served on localhost or an unknown preview hostname is therefore also guarded. This client-side boundary prevents accidents; it is not backend authorization.

The existing production prerender script uses a loopback-only static-render marker. In that mode the transport permits only GET requests to the five public catalog/config REST resources; it blocks all private reads, functions and writes, disables analytics/widgets, and omits preview records/banners from generated production HTML. The marker cannot enable writes.

Production host allowlist: `sfsaunarental.com`, `www.sfsaunarental.com`, `aryzach.github.io`, `cedar-home-sanctuary.lovable.app`. Add a new live hostname only as a reviewed code change. An unknown custom domain intentionally remains in preview mode. Do not host branch previews on these live origins. GTM now starts after the production runtime check; the unconditional no-JavaScript tracking iframe was removed. Lovable's generated client and preview auth broker remain intact.

## Validation

```sh
npm run typecheck
npm run lint:safety
npm test
npm run build:preview
npm run test:browser
```

The browser test starts/stops its own local server, checks marketing/customer/internal pages, tests blocked transports and denies external requests before they can reach a backend, CRM, payments or analytics. It fails on runtime errors or attempted service traffic. CI repeats these checks against a production bundle served on a preview host, and mocks public backend reads to validate the static-render path without contacting production. The PR workflow has read-only repository permissions, no production secrets and no deployment steps; fork PRs run the same empty-state workflow.

`npm run lint` currently reports pre-existing repository failures (106 errors / 12 warnings at the audited revision). PR validation does not claim lint passes or weaken its rules. Resolve that baseline separately before making repository-wide lint required. The runtime/preview transport code and its policy tests are linted by the required `lint:safety` check.

`npm run build` remains the existing production command. Its prebuild reads live public pricing and rewrites generated pricing/sitemap files. Do not run that command for routine cloud/PR work. `pricing:sync`, database migrations, backend deployment and production publication are release actions, not setup steps.

## Release boundary and remaining work

The existing `main` GitHub Pages and Cloudflare Worker deployment workflows are unchanged. This PR does not add branch protection or release approval gates in GitHub/Cloudflare/Lovable. Configure those separately after confirming ownership. Direct pushes to main are authorized for the current frontend work, but the PR workflow does not run automatically on those pushes. Run its relevant checks locally before pushing. It does not create a deployment approval gate.

Before using a shared staging backend: provision it using the existing provider's supported isolation, reconstruct/verify the combined migration history, add synthetic seeds and storage definitions, and route Stripe test mode, email sinks, CRM and scheduling to nonproduction destinations. Merely replacing the Supabase URL is insufficient: public API discovery metadata and backend emails/webhooks also contain production URLs. Staging integration mode is not enabled by this change; unrecognized modes/hosts remain guarded.

Known production security findings (webhook fail-open behavior, lead-photo policies, legacy RPC access, shared-password authorization and token privacy) require separate reviewed backend changes. This setup does not fix or claim to validate them.

## Planned returns

In Inventory, click a rented sauna’s Booking availability label and choose **Schedule return / future availability**. Enter its planned pickup and next booking availability dates. Both may be the same day. The current customer, placement, rental dates, commitments and future assignment remain unchanged until actual pickup is recorded in Rentals. Confirm the returned sauna is ready before installing it for the next customer; same-day pickup and reinstallation are supported. Canceling a plan clears only its planned dates. Existing dated booking conflicts must be resolved before changing or canceling a conflicting plan.

The owner explicitly approved the production database update and code publication in this chat on 2026-10-28, including same-day redeployment. Migration `20261028103314_schedule_sauna_returns.sql` was applied to project `vtmzagwocvgezbniewnu` through the connected Supabase migration tool. The migration ledger version is retained in the filename. Existing inventory assignment, availability and commitment values were verified unchanged after application. This is authorization for this release, not blanket authorization for future migrations.

Regression checks use disposable local PostgreSQL databases and synthetic records only:

```sh
SF_LIFECYCLE_TEST_PG_PORT=55449 python3 scripts/test-return-plans-database.py
```

The isolated development form at `/tests/browser/return-plan.html` exercises scheduling requests and booking conflicts without using customer data or contacting live services. It is not included in the production build.

## Fleet selection

Check inventory rows before opening **Manage sauna condition / fleet**, or check/uncheck rows while the form is open. The single button uses all checked rows, including rows hidden by filters. With no rows checked, the unit dropdown remains available. Once submission begins, targets are pinned through the result summary; successful units are unchecked and failed units remain checked. Reopen the form for another update. Read-only assignment cells show names without a disabled removal button; use Bookings or Rentals for changes.

Run the isolated checkbox integration regression with installed Chrome:

```sh
PUPPETEER_EXECUTABLE_PATH="/path/to/chrome" node scripts/test-fleet-selection.mjs
```

See [the state-machine diagrams](state-machines.md) for the separate customer, booking, rental, fleet, custody, condition and allocation states.

## State machine reference

Admin → State machines renders `docs/state-machines.md` directly, including all six Mermaid diagrams. The guide and renderer load only when that tab is opened. Diagrams support zoom and horizontal scrolling, with text available below each one. Edit the Markdown guide to update both the admin reference and GitHub documentation. The browser preview check verifies all six rendered diagrams, zoom, mobile containment and reopening the tab.

## Booking selector and model waitlist

Numbered sauna selection is numerically sorted and supports exact case-insensitive substring search across the full label, including the current customer's name. The password-verified core workspace supplies customer names; no public customer query is added.

Bookings → View / manage → Move to waitlist / change requested type releases a future allocation, preserves evidence/payment/terms, and records an explicit model preference and waitlist hold. Model preference is separate from the catalog type. Database guards protect it from legacy automatic allocation. Explicit compatible allocation converts the waitlist entry; cancellation closes it.

Validation: `SF_LIFECYCLE_TEST_PG_PORT=55449 python3 scripts/test-booking-waitlist-database.py` and `node scripts/test-booking-picker.mjs` (set `PUPPETEER_EXECUTABLE_PATH` for installed Chrome). Fixtures use synthetic records only.

Release on October 30, 2026 (Asia/Shanghai): the owner explicitly requested the v1 waitlist workflow and an existing booking's move to it. Migration `20261029162959_booking_model_waitlist.sql` was tested on a disposable local database, then applied to production through the connected migration tool (retain its migration-ledger timestamp in the filename). Production admin-api v36 preserves the existing v35 bundle outside five verified edits for the authenticated waitlist action and selector/waitlist display fields; JWT and password verification are unchanged. This is authorization for this release, not blanket authorization for later migrations. No signed agreements or pricing policies were rewritten.

## Personal curriculum explorer

`/learn-certify` now uses the owner's supplied reading curriculum, with independent reading/question checks, topic notes, search, progress totals, and JSON backup. See [academy.md](academy.md) for content provenance, received gaps, syncing, password changes, and the removal of the former AI tutor. Use `npm run academy:content` after editing the supplied content and topic guidance, then redeploy the matching validation bundle if topic IDs change. Preview uses separate browser-local progress.

The owner explicitly authorized replacement of the old app, deletion of its Supabase API credential, and a new access password on October 31, 2026. Migration `20261031104124_academy_curriculum_explorer.sql` removes only its dedicated Vault credential and the tutor credential RPC; the deployed academy backend accepts only checklist and access operations. Business data is outside this release's scope. Existing personal academy records stay private as legacy history.
