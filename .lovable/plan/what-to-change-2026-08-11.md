Standardize all video-consultation scheduling links to the primary Cal.com URL.

## What to change

Replace every occurrence of the old consultation links with `https://cal.com/sf-sauna/sauna-compatibility-consultation?overlayCalendar=true`:

1. `supabase/functions/_shared/reservationEmails.ts` — Update the `CALCOM` constant currently pointing to `https://cal.com/sfsaunarental/sf-sauna-video-consultation?overlayCalendar=true`.
2. `src/pages/EmailMoreInfo.tsx` — Replace the hardcoded Google Calendar `href` with the new Cal.com URL, imported from `src/lib/reservationConfig.ts` (`CALCOM_VIDEO_CONSULT_LINK`) to match the rest of the site.

## Verification

- Search the codebase for the two old links to confirm zero occurrences remain.
- Confirm the site already uses `CALCOM_VIDEO_CONSULT_LINK` as the single source of truth everywhere else (it does, per `src/lib/reservationConfig.ts`).
- Verify build passes after edits.