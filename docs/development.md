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

## Confirm installation: reserved sauna

Rentals → Manage → Confirm installation shows the numbered sauna from that rental’s Inventory future-customer link, including type, inventory status and the booking’s agreed date. A single, consistent assignment is preselected; other saunas remain selectable in number order. Missing, multiple, cancelled or conflicting allocations are shown for review without a preset. A cached booking pointer alone never replaces the inventory assignment. Selecting another unit displays a warning; saving still uses the existing lifecycle command, actual date, confirmation note and server checks.

Regression checks: `tests/installation-selection.test.ts` covers allocation identity and ambiguity; `tests/installation-flow-ui.test.ts` exercises the rental form through selection and submission using synthetic records and a test dialog surface.

## Delivery and access fees — November 12, 2026

The owner requested the new service fee schedule for all unsigned and future agreements: $150 for 1–15 stairs or elevator access, then $100 for each additional increment of up to 15 stairs; $200 delivery outside San Francisco, with another $200 beyond 50 miles ($400 total). City matching uses the city field and excludes South San Francisco. Distance and access are still confirmed before delivery; this release does not invent a measured distance or stair count. Existing explicit admin overrides and the existing prepaid-discount policy remain available.

`supabase/functions/_shared/serviceFeePolicy.ts` supplies the contract wording shown in configuration, generated summaries and final PDFs. The active master PDF replaces only Sections 2.e and 2.g; all other paragraph text was compared with the previous master. A new storage object was uploaded, leaving historical masters intact. The new PDF SHA-256 is `9aeb1edffce8e77593b549fb059e402ff9f394b235f85628ac53e1f087c02ea4`.

The owner’s request authorized the production data and contract-service release. The two inspected unsigned legacy drafts were updated to the new master and $200 base delivery, retaining unknown access charges, rent, installation fees and custom clauses. Both require regeneration and review before signing. The update transaction checked that signed agreements and all reservation records stayed unchanged. The public pricing configuration now stores $200, so production pricing generation preserves the change. No schema migration was needed.

The deployed contract-api bundle was patched from its existing version 18 with only the corresponding service-fee, city matching, summary and stale-draft signature checks; unrelated deployed code and authentication were retained. Regression coverage includes legacy drafts, stale signature rejection and signed-record preservation. Headless browser launch is blocked by the macOS sandbox; the in-app browser verified configuration and a generated outside-SF summary instead.

## Unsigned rental rate reset — November 12, 2026

The owner subsequently requested every unsigned and future rental agreement use $600/month plus $500 installation for six months; $500/month with free installation for twelve months; and $350/month with free installation for twenty-four months, explicitly including Zepher and Steve. This supersedes earlier preservation of unsigned legacy/custom prices for these three terms, across all sauna models. One- and three-month rates, permitted terms, extra options, delivery/access rules, customer-specific clauses and signed agreements are preserved.

`currentRentalRates.ts` is the shared authoritative lookup. It takes precedence over legacy/frozen catalog values, existing unsigned draft prices and custom quotes for the three revised terms. The token-verified API supplies revised options even to old clients. Newly generated summaries store `rental_rate_revision=20261112`; signing rejects an older revision and requires regeneration/review. The UI uses the same lookup for term buttons and totals. This changes rental rates without enabling new optional services on older bookings.

The requested production data release updated all six models' catalog tiers, the two existing unsigned drafts, and unsigned custom quote options. Zepher's and Steve's booking options were explicitly updated and read back. Signed contract records were verified byte-for-byte unchanged; all booking fields outside the requested pricing options and update timestamps were transactionally checked unchanged. No schema migration, assignment change, charge or customer message was made. Contract-api version 21 patches the existing version 20 bundle only for the corresponding rate lookup, returned quote options, snapshot marker and stale-signature checks. Existing master agreement wording already takes rent and installation amounts from the customer-specific Rental Summary, so a new master PDF was not necessary.

Regression tests exercise legacy magic-link reads, custom quotes, old unsigned drafts, all six model families and both legacy/current option policies, plus signed-agreement preservation. Browser preview check expectations now include the revised legacy rates and $350 twenty-four-month option.

## Traditional security deposit — November 12, 2026

The owner requested a $2,500 security deposit for every unsigned and future traditional sauna agreement, including Original Collection and custom quotes. Both client and contract-service calculations enforce the traditional amount; infrared defaults and custom deposits are preserved. Signing rejects a traditional draft whose stored deposit or commercial-terms deposit is stale and requires regeneration and review.

Production pricing configuration and the two unsigned legacy drafts were updated to $2,500. Those drafts require regeneration and review; the transaction verified signed records, all reservations and unrelated draft terms remained unchanged. No schema migration or master PDF replacement was needed because the master takes the amount from the Rental Summary. Contract-api version 23 patches only the corresponding deposit calculation and stale-signature guard in the existing version 22 bundle. Tests cover all traditional variants, old custom overrides, infrared override preservation and stale signature rejection; all 183 tests, typecheck, safety lint and preview build passed.

## Recovery table sorting and source popup — November 13, 2026

All nine sauna cost-recovery table headers support ascending/descending sorting, including type, rental cash, sale proceeds and displayed status. Missing numeric values stay last. Each source-entry count opens a keyboard-accessible, scrollable dialog with newest entries first, Xero contact names, amounts and original source links. Incoming cash shows the payer, outgoing cash shows the recipient, and supplier bills are labeled as bills rather than payments. Missing names remain unknown; current inventory customer names are never used as payment attribution.

Admin-api version 37 retains version 36 outside two verified edits in its recovery-source transformer, adding the cached Xero contact name and bill/source distinction. Existing JWT and admin-password checks remain unchanged. No database schema, accounting records, allocations or financial calculations changed. Synthetic model/UI tests, all 186 tests, typecheck, safety lint and preview build passed. A private read-only copy of unit #001's 24 real source entries verified dates, payer labels, unchanged totals and desktop/mobile dialog containment. Private copies and screenshots remain outside the repository.

The recovery search also matches case-insensitive customer-name substrings from current inventory names, explicit current/future rental links, dated past placements, sales and numbered Xero rental/sale entries. Business contacts and linked Xero aliases are included. Supplier costs, untagged payments and ambiguous multi-unit tags do not create customer matches. Customer associations remain searchable when the sales display toggle is off. This is a frontend-only search index: it does not change financial attribution, totals or assignments. Targeted model/UI checks verify current, future, past and payer-name matching, exclusions, whitespace/case handling and clearing the search. A read-only local copy verified a real payer-name search returns sauna #001.

## Owner-corrected sauna payment attribution — November 13, 2026

Owner-approved payment attribution is stored as a `payment_sauna_attribution_corrected` history event with version, exact Xero contact ID, effective date, original inventory asset ID and destination asset ID. The recovery/search overlay applies only to USD receipts on/after that date with a single original unit tag. Purchase-cost lines, other payers, earlier dates, ambiguous tags and outgoing payments retain their original attribution. Original cached Xero records, source links, tax splits and physical placements remain untouched. Each affected source entry explains its owner correction. The same overlay applies after a cache refresh and to customer-name search; no source facts are rewritten.

The owner explicitly authorized the production correction and confirmed the same-day boundary. One existing private history event records the rule and the five source IDs reviewed. The transaction verified Xero caches, inventory, placements and signed agreements unchanged. Verification against the real cached payments moved exactly five entries and $1,898.60 of rental cash from the original unit to the corrected unit, preserving their combined recovered revenue. Admin-api version 38 adds only the source contact ID to version 37's protected recovery transformer; authentication remains unchanged. No migration, Xero write, charge, customer message or rental-placement update was needed. Regression coverage includes the inclusive boundary, exact payer matching, unchanged money, exclusion cases, search and repeated imports.

Attribution rules also support an optional exclusive end date and an open start, so disjoint date ranges can route an owner's confirmed past/current unit split without chained or circular corrections. The owner confirmed the earlier unit applies through September 3 and the later one from September 4. Production readback verified eight corrected receipts and unchanged total recovery. A separately confirmed November 1 sale used the canonical lifecycle sale command, leaving unrelated installations intact. The original $500 Xero receipt was edited through its authenticated transaction UI to account 372 and the sold unit's tracking tag, retaining $39.70 tax. The existing one-use sync dispatcher refreshed the private accounting cache; verification found $460.30 sale proceeds with no rental double count. No provider write scope, secret change or schema migration was introduced. All 189 tests, typecheck, safety lint and preview build passed.

## Signature name comparison — November 13, 2026

The signature field and contract-api share `signatureName.ts`: name comparison uses canonical Unicode normalization, removes invisible keyboard formatting, and collapses whitespace before the existing case-insensitive match. Spelling, accents and punctuation remain significant; blank or different names are rejected. The original entered signature is retained in the existing audit and PDF, and all acknowledgment, token, stale-terms and signed-record guards remain in place. The empty field now says “Type your full legal name” rather than displaying the customer's name as a placeholder; mobile name autofill is enabled and autocorrection is disabled.

Contract-api version 24 patches only the name comparison in the existing version 23 bundle, preserving its authentication and unrelated behavior. No contract records were changed or signed during verification. Synthetic handler and rendered-input regression tests cover mobile whitespace, invisible formatting, Unicode equivalence, mismatches, consent checks and audit preservation. All 192 tests, typecheck, safety lint and preview build passed; a separate loopback-only browser fixture verified the rendered input without contacting live services.

## Monthly rate versus commitment scatter plot — November 13, 2026

Dashboard → Rate vs. commitment shows one dot per installed customer. The vertical axis uses the original base monthly rent from that customer's latest recorded agreement. The horizontal-axis toggle selects that agreement's original rental commitment or all recorded agreements combined, using the existing rental LTV calculation and its signed prepaid-discount handling. Add-ons count in the commitment; deposits, tax, purchase proceeds and service fees do not. Original rates are not replaced by today's catalog or cash receipts.

Sauna-type checkboxes and stable colors use the latest recorded installed type. Current customers have an active installed rental and circle markers; historical customers have recorded returns for all installed rentals and diamond markers. Both groups are shown by default and can be filtered separately. Hover details show the customer's name and amounts; the filtered table includes every customer even when points overlap. Unknown or conflicting latest agreements/rates/commitments are listed separately rather than shown as zero. Pending, never-installed and purchase records are excluded.

This is a frontend-only view of the existing authenticated core workspace. No public reads, new database fields, customer mutations or Xero changes are introduced. Read-only verification against the current records found 68 eligible customers (48 current and 20 historical), with usable data for both commitment scopes. Synthetic model/UI tests cover original and discounted commitments, renewals, scope changes, missing data, ambiguity, group filters, colors/shapes and customer-name tooltips. A separate loopback-only example fixture verified the chart layout without placing customer records in the repository.

Validation for this release: all 201 tests, typecheck, safety lint, targeted chart lint and the preview build passed.

### Signed future agreements on the scatter plot

The owner requested future contracts and confirmed signed agreements only. The chart now includes uninstalled planned/unconfirmed rentals with a non-voided signed agreement recorded by the chart date. Future customers use triangle markers, a dedicated status filter and their contracted sauna type, explicitly distinct from confirmed installation placement. Unsigned drafts, waitlist requests without signed terms, canceled/voided agreements and purchases remain excluded. Missing financial terms remain review gaps.

One customer still produces one point: an active installed rental takes current status; otherwise a signed upcoming rental takes future status ahead of historical. The latest/all-agreements toggle includes eligible signed future commitments, preserving signed prepaid amounts and original monthly rates. This is a frontend-only change using the existing protected workspace; no contracts, inventory or accounting records are changed. Regression coverage includes future markers, customer-name tooltips, filters, signed-only guards and repeat-customer deduplication.

Validation: all 205 tests, typecheck, safety lint, targeted chart lint and preview build passed. Browser verification covered the signed-future filter and triangle marker on a narrow viewport using example records only.

## Separate installation-location tracking — November 13, 2026

The owner explicitly authorized structural changes and confirmed that agreement placement always matches actual installation. Capability remains on inventory `locations` and eligibility. Agreement placement is a stored generated field on rental terms, derived from the preserved agreement type. Actual installation locations are separate private dated records, optionally linked to a known numbered placement; the original `type_at_install` catalog snapshot remains unchanged.

Install, swap and legacy swap require explicit indoor/outdoor selection. The database validates it against the agreement effective at installation and the unit's capability, preserving existing lifecycle locks, versions, idempotency, assignments and commitment rules. Rentals can review or confirm a historical location with an evidence note. Charts use confirmed locations; unknown or conflicting records are visibly grouped for review. Corrected catalog conflicts remain visible in Rentals. Future contracts continue to use their contracted type.

The migration records the owner's agreement-matching rule as the source of known historical confirmations, and audits each confirmation and catalog conflict. It leaves dates and unknown numbered-unit assignments intact. A transactional hash assertion verifies that contracts, reservations, inventory, rentals, original placements, original terms and sales remain unchanged. No public table access or extra accounting/provider scopes are added.

Release verification: migration `20261114034855_separate_installation_location.sql` is applied to production, retaining its migration-ledger version. It created 66 dated location confirmations and six explicitly audited catalog-conflict corrections under the owner's rule. Two historical records remain flagged because placement changes or agreement timing are ambiguous. Pre/post hashes verified all original contracts, reservations, inventory, rentals, placements, terms and sales unchanged. Admin-api version 39 adds only the private location-record read, capability fields and review-command allowlist entry to version 38; JWT and password checks are unchanged. All 209 tests, typecheck, safety lint, targeted new-code lint and preview build passed.

### Scatter plot density

The rate/commitment chart is 880px tall. A deterministic pixel-space layout separates nearby markers across all sauna types and rental statuses, recalculating for the responsive chart width. Displaced chart coordinates are separate from financial values: customer hover details and the table retain exact original rates and commitments. Compact clusters show density; their displayed positions are approximate. This is a frontend display change only.

### Traditional installation offers — November 18, 2026

Unsigned traditional agreements now show “Installation within 1 week,” including 36 months at $300/month with free installation, plus “February installation” for February 2027: 12 months at $400/month or 24 months at $300/month, both with free installation. February choices use the stable `february_2027` pricing variant, require a valid February date, and retain the timing label in the quote, preview and signed PDF. Server-calculated prices override submitted amounts. Existing 12/24-month upfront-payment eligibility is unchanged; 36 months uses monthly billing. Signed agreements remain untouched, and outdated unsigned summaries require regeneration before signing. Migration 20261119023728 adds the four traditional 36-month catalog rows. Contract API v25 preserves v24 authentication and other behavior outside the bounded pricing changes; JWT verification remains at its existing setting. All 20 signed contracts retained their exact pre-release row checksum.

### Infrared and Original Collection offers — November 18, 2026

Unsigned/future indoor infrared offers only 6/12/24 months at $300/$200/$150 per month. Outdoor infrared and both Original Collection placements offer only 6/12/24 months at $400/$300/$200 per month. Every one of these tiers has free installation. Original Collection no longer shares standard traditional's 36-month or February offers. The shared family policy overrides stale custom/frozen unsigned prices and rejects removed terms server-side. Infrared has no Premium or second-heater controls; absent choices normalize to false and attempts to add them are rejected. The delivery/access explanatory section is removed from the configuration and on-screen summary, while existing fee values and master-agreement provisions remain. Migration 20261119030248 updates only catalog tiers. Contract API v26 preserves authentication and signed documents; all 20 signed contract rows retained their checksum. The standard traditional options remain as released previously.

## Accounting billing history

`/accounting` → Billing reads all customer profiles, bookings, lifecycle rentals, dated agreements/terms, physical placements, sales and cached Xero customer links through the existing password-verified accounting API. Former customers are retained without requiring a current inventory link. Repeat rentals and standalone sales have separate rows; unlinked Xero contacts remain reviewable identities rather than automatic name matches. Booking-only and incomplete records are labeled separately from customers with recorded service.

“Returned on” uses an ended rental’s recorded actual end, excluding sales. Planned pickup dates, swap removals and Xero receipts never establish a return date. A known return without an exact date is explicitly unknown. Historical start dates derived from an owner-approved Xero proxy are labeled as such. Original signed fee snapshots and recorded dated rates are preserved; today’s catalog prices, payment method and reservation deposit are never substituted for missing history.

Search covers names, contact details, addresses and sauna numbers; all data columns sort with unknowns last in either direction. The column chooser exposes all billing fields. Customer details show missing information, all dated terms (including superseded evidence), placements and private agreement downloads. Totals include only recorded current base rent, not historical or future rent. The table is an agreed-terms/history view, not proof of payment or a live subscription audit.

The local development loader can optionally display `billingRows` in an explicitly authorized private runtime snapshot using the existing loopback-only `/__local-records` transport. No customer data is imported into source, public files, fixtures or builds. The preview remains empty by default and cannot retrieve production documents or mutate live records.

Archived profiles with no bookings, rentals or sales are retained in the database but do not create empty duplicate billing rows. Archived customers with history remain included. An explicitly owner-reviewed continuous rental can group its related historical bookings and owner-recorded prior/current sauna numbers; this never creates physical placements or promotes an estimated swap date into a confirmed event.

### Security deposits applied to a later purchase

An owner-reviewed payment allocation linked to a recorded sale follows that sale's numbered sauna, even when the original receipt was untagged or tagged to an earlier rental. Source cash dates and amounts remain unchanged. Sale proceeds exclude the separately classified tax; the remaining rental and fee classifications on a mixed receipt remain intact. A missing sale, mismatched customer or missing asset is flagged rather than assigned from current inventory. Xero deposit-to-sale journals remain separate from the original bank receipts, so they do not create duplicate cash in the recovery table. Regression coverage includes untagged deposits, an earlier rental's tag, preserved rental cash, tax exclusion, the sales toggle and invalid sale ownership.
