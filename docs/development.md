# Development with Lovable and Codex

Keep one repository and the existing React/Vite structure. Lovable remains the visual editor. The user has authorized committing and pushing each tested frontend update directly to `main` so Lovable can sync it. Push coherent, validated updates rather than individual file saves. Existing main workflows also deploy production; keep demo features gated to preview mode. This authorization does not include database migrations, credential changes or infrastructure changes. No production deployment, database migration, account ownership or secret configuration was changed by this development setup.

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

- `npm run dev`: fixture-backed visual development, including Lovable's development preview.
- `npm run build:preview`: offline preview artifact; avoids the production `prebuild` pricing sync and sitemap writes.
- `npm run preview`: serve the existing artifact; build with `build:preview` first.
- `/reservation/00000000-0000-4000-8000-000000000001?token=preview`: synthetic customer portal.
- `/admin` and `/accounting`: demo password `preview`; private production data is never loaded. Admin/accounting demo tables are deliberately sparse. Mutations remain disabled.

A visible banner identifies demo data. Preview submissions, uploads, bookings, payments, external fetch/XHR and beacons are blocked. Checkout/Cal links lead to an explanatory local page. Marketing images/videos/fonts and map embeds can still load from external hosts; this is not an offline asset mirror or a general-purpose browser sandbox.

`src/dev/bootstrap.ts` runs before the application and the generated Supabase client. `src/dev/fixtures.ts` permits only specific synthetic reads; unknown requests and writes fail. Fixtures never emulate success for a submission. `src/lib/runtimePolicy.ts` requires **both** production build mode and an exact recognized hostname before live integrations/analytics activate. A normal production bundle served on localhost or an unknown preview hostname is therefore also guarded. This client-side boundary prevents accidents; it is not backend authorization.

The existing production prerender script uses a loopback-only static-render marker. In that mode the transport permits only GET requests to the five public catalog/config REST resources; it blocks all private reads, functions and writes, disables analytics/widgets, and omits preview fixtures/banners from generated production HTML. The marker cannot enable writes.

Production host allowlist: `sfsaunarental.com`, `www.sfsaunarental.com`, `aryzach.github.io`, `cedar-home-sanctuary.lovable.app`. Add a new live hostname only as a reviewed code change. An unknown custom domain intentionally remains in preview mode. Do not host branch previews on these live origins. GTM now starts after the production runtime check; the unconditional no-JavaScript tracking iframe was removed. Lovable's generated client and preview auth broker remain intact.

## Validation

```sh
npm run typecheck
npm run lint:safety
npm test
npm run build:preview
npm run test:browser
```

The browser test starts/stops its own local server, checks marketing/customer/internal pages, tests blocked transports and denies external requests before they can reach a backend, CRM, payments or analytics. It fails on runtime errors or attempted service traffic. CI repeats these checks against a production bundle served on a preview host, and mocks public backend reads to validate the static-render path without contacting production. The PR workflow has read-only repository permissions, no production secrets and no deployment steps; fork PRs run the same fixture workflow.

`npm run lint` currently reports pre-existing repository failures (106 errors / 12 warnings at the audited revision). PR validation does not claim lint passes or weaken its rules. Resolve that baseline separately before making repository-wide lint required. The runtime/fixture code and its policy tests are linted by the required `lint:safety` check.

`npm run build` remains the existing production command. Its prebuild reads live public pricing and rewrites generated pricing/sitemap files. Do not run that command for routine cloud/PR work. `pricing:sync`, database migrations, backend deployment and production publication are release actions, not setup steps.

## Release boundary and remaining work

The existing `main` GitHub Pages and Cloudflare Worker deployment workflows are unchanged. This PR does not add branch protection or release approval gates in GitHub/Cloudflare/Lovable. Configure those separately after confirming ownership. Direct pushes to main are authorized for the current frontend work, but the PR workflow does not run automatically on those pushes. Run its relevant checks locally before pushing. It does not create a deployment approval gate.

Before using a shared staging backend: provision it using the existing provider's supported isolation, reconstruct/verify the combined migration history, add synthetic seeds and storage definitions, and route Stripe test mode, email sinks, CRM and scheduling to nonproduction destinations. Merely replacing the Supabase URL is insufficient: public API discovery metadata and backend emails/webhooks also contain production URLs. Staging integration mode is not enabled by this change; unrecognized modes/hosts remain guarded.

Known production security findings (webhook fail-open behavior, lead-photo policies, legacy RPC access, shared-password authorization and token privacy) require separate reviewed backend changes. This setup does not fix or claim to validate them.
