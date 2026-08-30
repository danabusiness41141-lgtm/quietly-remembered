# Quietly Remembered — Supabase Ambient Integration Report

**Author:** Manus AI  
**Project:** Quietly Remembered  
**Supabase project:** Quietly remembered (`ipxghtdcaucywmzsqifp`)  
**Status:** Implemented and validated locally; ready for a controlled real-audio smoke test.

## Executive summary

Quietly Remembered now has a Supabase-backed content path for anonymous remembrance posts, moderation reports, reactions, scheduling metadata, and private audio metadata. The public archive reads from the selected Quietly remembered project rather than the unrelated `novatech-platform` project. The migration is additive and the old local database helpers remain as a test/local fallback when Supabase is not configured.

The ambient layer is intentionally restrained. A writer may select a per-note light treatment and optionally attach a short audio memory. Audio is never autoplayed. A visitor must click the card or its sound control before the server returns a signed playback URL. The browser now compresses supported source audio to WebM/Opus before the payload is sent to the server; uncompressed source formats may be decoded and recompressed, but the original file bytes are not uploaded or retained.

## What changed

| Area | Implementation |
|---|---|
| Supabase ownership | Runtime credentials now target the user’s **Quietly remembered** project. The server uses a server-only Supabase client with session persistence disabled. |
| Post storage | `qr_notes` stores recipient, message, paper tone, ambient-light choice, moderation status, schedule time, management-token hash, audio metadata, and deletion timestamps. |
| Reports and reactions | `qr_note_reports` supports community reporting and moderation review. `qr_note_reactions` remains duplicate-safe and the public reaction remains one-way in the UI. |
| Moderation | Existing moderation procedures route through the Supabase adapter when configured. Public listing still excludes removed, pending, and not-yet-scheduled notes. |
| Audio storage | A private `qr-audio` bucket exists with a verified **2,000,000-byte** file limit. The database stores metadata and a storage path, not audio bytes. |
| Audio upload | Browser intake accepts common audio sources, reads duration, compresses to WebM/Opus at a bounded bitrate, validates the compressed result, and sends only the compressed base64 payload. |
| Playback | Audio is requested with a disabled-by-default tRPC query only after a card or sound button click. The server returns a short-lived signed URL. |
| Ambient light | Lantern, moon, ember, and no-light choices are represented per note and rendered as a small, low-contrast glow behind the card. |
| Localization | New audio, compression, light-choice, loading, and playback labels exist in English, Arabic, and Sorani Kurdish. RTL layout rules are preserved. |

## Storage safeguards

The implementation uses a layered budget rather than relying on the bucket limit alone. People may choose a source file up to 10 MB, so they do not have to manually compress it first. The decoded duration must be no longer than 30 seconds. The browser then produces a WebM/Opus result, and the result must remain below 2 MB before it is encoded into the request. The private bucket independently enforces the 2 MB limit.

> The application accepts source audio for recompression, but the stored artifact is the compressed WebM result. The original source file is not sent to Supabase and is not retained by the application.

This design favors short voice notes, small musical fragments, and environmental sounds rather than full songs. It keeps the feature compatible with the project’s storage budget and avoids silently storing large originals.

## Security and privacy

The audio bucket is private. Anonymous browser clients do not receive a storage key or service-role credential. Server operations use the privileged Supabase client, while public roles receive explicit deny-by-default policies for reports and reactions. Audio URLs are generated only after the note is already public and a visitor expresses playback intent.

The note-management token remains hashed in the database. The anonymous author model is unchanged: no account or sender name is required. Moderation remains an owner-facing workflow rather than a public dashboard.

Supabase’s security advisor no longer reports missing RLS policies for the new report and reaction tables. It still reports two pre-existing warnings for the project’s unrelated `public.rls_auto_enable()` function; that function was not created by this integration and was not modified.

## Validation evidence

| Check | Result |
|---|---|
| Supabase project discovery | Confirmed the empty **Quietly remembered** project and avoided `novatech-platform`. |
| Supabase schema | Confirmed `qr_notes`, `qr_note_reports`, and `qr_note_reactions`. |
| Storage bucket | Confirmed private `qr-audio` with a 2,000,000-byte limit. |
| Supabase connection test | Passed against the project’s PostgREST root endpoint. |
| Security advisor | New server-only policy warnings cleared; only unrelated pre-existing function warnings remain. |
| TypeScript | `pnpm check` passed. |
| Vitest | 7 test files and 26 tests passed. |
| Production build | `pnpm build` passed. |
| Visual verification | Home empty state and Write ambient controls checked at 390px mobile and desktop widths. |
| Live content safety | No test post or audio was inserted into Supabase during automated validation. |

## Remaining live check

A controlled real-audio smoke test is still recommended before public launch. It should use a disposable note and a short non-sensitive audio clip, confirm upload, public card playback, moderation visibility, signed URL playback, and deletion, then remove the disposable note. This was not performed automatically because it would create real content in the connected Supabase project and requires explicit confirmation.

The current automated and visual checks validate the implementation paths without creating user-like content. They do not substitute for that final end-to-end audio upload test.

## Key files

| File | Purpose |
|---|---|
| `supabase/migrations/20260827_ambient_remembrance.sql` | Supabase tables, moderation fields, indexes, RLS, and private audio bucket. |
| `supabase/migrations/20260827_ambient_server_only_policies.sql` | Explicit deny-by-default policies for server-only report and reaction access. |
| `server/supabase.ts` | Server-only Supabase client factory. |
| `server/supabaseDb.ts` | Supabase post, report, reaction, moderation, schedule, and audio operations. |
| `server/db.ts` | Supabase-first content adapter with local fallback. |
| `client/src/lib/audio.ts` | Browser-side duration validation and WebM/Opus compression. |
| `client/src/pages/Write.tsx` | Optional audio attachment and ambient-light selection. |
| `client/src/pages/Home.tsx` | Deferred signed-audio playback and ambient card presentation. |
| `client/src/index.css` | Ambient glow, sound controls, settings rows, responsive behavior, and reduced-motion rules. |
| `client/src/lib/audio.test.ts` | Audio budget, normalization, and rejection coverage. |

## Recommendation

Keep the current 10 MB source, 30-second duration, and 2 MB stored-output limits for the first release. Do not add a public audio library or autoplay. First run the disposable end-to-end smoke test, then monitor storage and bandwidth usage in Supabase before considering larger limits or longer recordings.

## References

[1]: https://supabase.com/docs/guides/storage  
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security  
[3]: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl

## Follow-up: custom paper colors and reactions

The ambient-light feature remains intact. The Write and Customize pages now offer seven named paper tones—Warm parchment, Quiet sage, Morning blue, Faded rose, Soft lilac, Old butter, and Fired clay—plus a custom six-digit hex color picker. Custom values are validated in the router, constrained by the Supabase `qr_notes` check, and rendered through a safe CSS variable on Write and archive cards.

Reactions are reversible again. The first click inserts the anonymous remembered reaction, and the second click removes that visitor’s own reaction while the count returns to the current total. The unique key still prevents duplicate rows. The Sorani Kurdish active label is now «بەبیرهێنرایەوە», with a localized removal label for the second-click state.

The 390px visual capture confirms the palette fits the Write and Customize layouts while the Lantern/Moon/Ember/No light controls remain available. Final validation for this pass: `pnpm check` passed, 8 test files with 35 tests passed, and `pnpm build` passed.
