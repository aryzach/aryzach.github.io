# Electrical Safety & Certification Curriculum Explorer

`/learn-certify` is a personal reading checklist with sections, topics, individual reading and understanding checkboxes, topic notes, search, section/global progress, and JSON import/export. It replaces the former AI academy. There are no tutor, grading, diagnostic, calculator, or paid API calls.

The owner's supplied documents are preserved in `docs/curriculum-source/`. `scripts/build-curriculum.mjs` extracts their actual topics, questions, summaries, and reading assignments; the later Module 17 continuation supersedes the incomplete earlier version. `src/academy/topic-guidance.json` adds topic-specific context and learning objectives without replacing source assignments. Regenerate `content.json` and then run `npm run academy:sync` after content changes.

Received coverage: all 24 modules, 145 topic/capstone pages, 1,129 self-assessment/checklist items, and 364 readings. No topics remain marked incomplete. The latest five continuations complete Topic 6.6, add Topics 6.7–6.9 and Modules 7–11, and replace the truncated Topic 8.4, Topic 10.3, and Module 11 capstone pastes with their complete continuations. The original four Topic 6.6 questions and all three reading identities are retained; seven unique questions append after them. All other previously published topics remain byte-equivalent as content objects. The original Topic 2.6 question also retains its identity. Module 10 and 11 capstones use individual topic pages with persistent checklists and the existing notes field. Module 11 has 15 deliverables and 18 mastery questions, each independently checkable, plus the full report requirements and completion criteria. Module progress includes these capstone checks. Distinct assignments using the same URL retain independent checkboxes, including the two NEC readings in Topic 10.6. Standards catalogs and technical libraries are honestly labeled; source summaries are preserved, with no invented clauses, limits, or approval claims.

Future additions should retain existing item IDs and order so saved checks remain meaningful. Do not renumber existing readings/questions without an explicit migration of saved progress.

Standards catalog and access links are labeled. Public descriptions do not supply the complete normative requirements, and no clause numbers, thresholds, product approval, or installation legality are inferred. Manufacturer case-study claims remain material to investigate, not verified certification conclusions.

## Persistence and access

The owner explicitly requested a password despite the pasted prompt's default of no authentication. Existing isolated owner authentication and private cloud storage are reused so phone and computer stay synced. No new backend service or AI subscription is needed.

Production requests use the password-verified `academy-api`. Only its service role can call `academy_store`; private tables have RLS and no client grants. The backend only returns new `explorer:` records. Existing notes, attempts, and actual API cost history are retained privately rather than erased or presented as checklist progress. Customer, inventory, booking, and accounting tables are untouched.

Each topic has its own version. Stale writes fail instead of overwriting another device. The UI refreshes every 30 seconds and on focus unless there are unsaved notes or a save in progress. Notes save explicitly or before internal navigation; leaving with unsaved notes prompts the browser. Local preview uses separate browser-local storage and never contacts production.

Settings → Change access password requires the current password and a new password of at least 12 characters. Password changes revoke all previous sessions; the changing device receives a fresh session. Owner-issued reset links are one-use, expiring, hashed in storage, removed from the address bar on opening, and revoke previous sessions when used. Never put a password in Git or chat.

Import validates the full document before writing, asks before replacing included topics, and reports partial progress if a network/conflict failure interrupts cloud writes. Export first for a backup. Reading completion never checks understanding automatically.

## Removal of the old tutor

On October 31, 2026 the owner explicitly authorized removing the old app and its Supabase API credential. Migration `20261031104124_academy_curriculum_explorer.sql` deletes only the Vault secret named `sf_sauna_academy_openai_api_key` referenced by the academy configuration, clears setup state, removes the secret-reading RPC, and restricts persistence to checklist/auth operations. The deployed function has no OpenAI client, credential lookup, tutor, evaluation, or budget actions. The old temporary key-setup function remains a closed tombstone. The dedicated key variable was also removed from ignored local `.env.local`. This removes stored copies and application access; it does not claim revocation of the key in the OpenAI account.

Validation includes verbatim question coverage, independent checklists, backup rejection, DOM interactions, private database access, removal of only the dedicated Vault secret, live/backend deployment checks, password changes, reset single use, session invalidation, stale write rejection, and absence of AI calls. Browser launch may be blocked by the desktop sandbox; do not claim visual verification when it is.

The extension corrects the supplied NASA handbook URL (404) to NASA’s official handbook introduction and uses the verified official UL 60730-1 Edition 6 catalog record dated October 31, 2024. Catalog links are access links rather than claims that an edition is the one required for either product. Source documents retain the exact originally supplied URLs.

The Module 23 Follow-Up Services URL returned 404; its reading uses UL’s official `follow-services` page. Original supplied URLs remain in the source documents.

Local live preview now runs at `http://127.0.0.1:5174/learn-certify` with `CHOKIDAR_USEPOLLING=true`. The older server on 5173 serves stale transforms and cannot be stopped by this session; reuse the 5174 server.
