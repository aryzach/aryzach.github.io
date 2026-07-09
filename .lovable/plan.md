# Reservation System MVP

Build a new `/reservation-system` page plus a password-protected `/admin-reservations` page, backed by Lovable Cloud (Supabase). Availability is tracked at the sauna-type level via availability events, minus paid active reservations.

## Scope

- Customer flow: browse sauna types → reserve → pay via Stripe link (placeholder) → confirmation with Cal.com scheduling links (placeholders).
- Admin flow: password gate → manage availability events + reservations statuses.
- No webhooks, no accounts, no contracts/ID/waitlist.

## Backend (Lovable Cloud)

Enable Lovable Cloud, then create three tables:

1. `sauna_types` (seeded, read-only from client)
   - `id` (text PK, e.g. `indoor_infrared`)
   - `name`, `description`, `placement` ('indoor'|'outdoor'|'either')
   - `reservation_fee_cents`, `stripe_payment_link` (placeholder URL)
2. `availability_events`
   - `id` uuid, `sauna_type_id`, `quantity` int, `available_starting_date` date, `reason`, `notes`, `created_at`
3. `reservations`
   - contact fields, `sauna_type_id`, `placement_choice`, `access_notes`, `min_commitment_months`, `preferred_install_at` timestamptz
   - status enums: `reservation_status`, `payment_status`, `contract_status`, `id_status`, `consult_status`
   - `admin_notes`, `created_at`

RLS: 
- `sauna_types` + `availability_events`: public SELECT (needed to compute availability on customer page).
- `reservations`: anonymous INSERT only (no SELECT for anon). Admin reads via edge function using service role.
- All admin mutations go through an edge function `admin-api` that checks a shared password header against `ADMIN_PASSWORD` secret.

Grants: SELECT to anon/authenticated on sauna_types + availability_events; INSERT to anon on reservations; service_role full.

## Edge function `admin-api`

Single function, actions via body:
- `login` (verify password → returns ok)
- `list_reservations`, `update_reservation` (patch statuses/notes)
- `list_events`, `create_event`, `update_event`, `delete_event`

Header `x-admin-password` required on every call. Client stores password in sessionStorage after successful login.

## Customer page `/reservation-system`

- Grid of cards, one per sauna type (fetched from DB).
- Availability computed client-side: sum event quantities where `available_starting_date <= today` minus paid-active reservations on/before today → if >0 "Available immediately"; else earliest future date; else "Currently unavailable".
- Paid-active reservations are computed via a public SQL view `paid_reservation_consumption` exposing only `(sauna_type_id, preferred_install_date)` — no PII.
- Reserve button opens a dialog with the reservation form (react-hook-form + zod).
- On submit: insert into `reservations` with `reservation_status='Pending Payment'`, `payment_status='Pending'`, then redirect to the sauna type's Stripe link, appending `?client_reference_id={reservation_id}` for future webhook wiring.

## Confirmation page `/reservation-system/confirmation`

Shown after form submit (before Stripe redirect, opened in same tab after return isn't guaranteed, so we render this page first with the "Pay Reservation Fee" button, then Cal.com links). Route: `/reservation-confirmation?id=…`.
- Reservation received notice + payment reminder.
- Buttons: Pay Reservation Fee (Stripe link), Schedule Video Consultation, Schedule Installation.

## Admin page `/admin-reservations`

- Password prompt (calls `admin-api` `login`).
- After auth: tabs/sections per sauna type showing available-now qty and future events (edit/delete/add).
- Reservations table with inline dropdowns to update each status + notes textarea (save button).

## Placeholders (constants in `src/lib/reservationConfig.ts`)

```
INFRARED_STRIPE_PAYMENT_LINK
TRADITIONAL_STRIPE_PAYMENT_LINK
CALCOM_VIDEO_CONSULT_LINK
CALCOM_INSTALLATION_LINK
```

Seed the 5 sauna types with their payment link (infrared vs traditional) and fees ($200 / $500).

## Design

Match existing brand (Tailwind + shadcn, semantic tokens from `index.css`). Mobile-first cards. No new fonts/colors.

## Routes added

- `/reservation-system` (customer)
- `/reservation-confirmation` (post-submit)
- `/admin-reservations` (admin)

Add to `App.tsx` + `src/routes.ts` + `vite.config.ts` prerender list (skip admin from sitemap priority).

## Out of scope

Stripe webhooks, accounts, contracts, ID upload, waitlist, physical unit tracking, HubSpot.
