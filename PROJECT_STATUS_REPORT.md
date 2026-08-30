# Quietly Remembered — Full Current Project Report

**Report date:** 27 August 2026  
**Current checkpoint:** `f6c43797`  
**Project path:** `/home/ubuntu/quietly-remembered`  
**Product:** Anonymous multilingual remembrance space  
**Current validation:** TypeScript check passed; 5 test files and 21 tests passed; production build passed.

## Executive summary

Quietly Remembered has evolved from a visual single-page prototype into a full-stack, multilingual remembrance product. Visitors can write a message for someone they miss without creating an account or entering their own name. The recipient’s name, message, and selected paper tone form a public keepsake that can be searched and remembered by other visitors.

The product now combines a Paper Lantern stationery aesthetic with a React 19 frontend, Express and tRPC backend, Drizzle ORM, and a MySQL/TiDB-compatible database. The implemented experience includes public notes, ranked recipient search, cursor pagination, anonymous reactions, public reporting, private deletion links, admin moderation, Arabic and Sorani Kurdish RTL support, and optional scheduled publishing behind an explicit production feature flag.

The latest update corrected two Sorani Kurdish phrases in the About-page copy. The text now uses **لەبیرمە** and **خۆزگە لێرە دەبووی**, matching the wording supplied by the user.

## Product and visual direction

The visual language is intentionally tender rather than social-media-like. Warm parchment backgrounds, botanical stationery artwork, persimmon accents, torn-paper note objects, small tape details, and editorial typography create a quiet ritual around writing and reading.

The typography system uses Fraunces for emotional headings and note text, DM Sans for Latin interface copy and form controls, and Noto Sans Arabic for Arabic and Sorani Kurdish. The earlier typewriter-first treatment and font selector were removed after review; visitors can still personalize paper tone, but the core typography remains consistent across the product.

## Current pages and user flows

| Route | Current purpose | Main capabilities |
|---|---|---|
| `/` | Public collection | Hero invitation, searchable archive, ranked recipient search, cursor pagination, reactions, reporting, loading/error/empty states |
| `/write` | Anonymous writing ritual | Recipient name, message, paper tone, honeypot protection, optional scheduling, localized helper copy, private manage link after submission |
| `/manage/:token` | Private note control | Token-based lookup, note summary, confirmed deletion, invalid-link handling |
| `/moderation` | Owner-only moderation | Report queue, reviewed/resolved actions, associated note removal |
| `/rituals` | Supportive content | Gentle, non-prescriptive remembrance rituals |
| `/about` | Product explanation | Purpose, anonymity, privacy intent, and emotional context |
| `/customize` | Local personalization | Persistent paper-tone preference stored in the visitor’s browser |

## Home page status

The Home page was completed in checkpoint `15fa89af` and was intentionally not redesigned during the later Write-page pass. It has a calmer hierarchy, a spacious hero, search-first archive presentation, clear collection messaging, and responsive note cards.

Search is handled server-side. Results are ranked so exact or closer recipient-name matches appear first, and pagination uses a cursor rather than a fixed client-side list. The feed displays only notes that are currently public and excludes deleted notes. Visitors can react anonymously through a duplicate-safe browser key and can report harmful content through a disclosure control.

The earlier SQL failure caused by an invalid `ORDER BY 0` expression was fixed in checkpoint `5a189a77`. The related HTML-as-JSON tRPC error was a cascade from that failed API response and was resolved when the feed query began returning valid JSON again.

## Write page status

The Write page received the latest major polish pass. The page now reads as a deliberate writing ritual rather than a generic form. The editorial split layout, return path, page kicker, headline, reassurance block, paper card, and submit area have more consistent hierarchy and spacing.

The form asks only for the person’s name and the message. It does not request the writer’s name or an account. Helper text now appears beneath the recipient field, message field, and paper-tone choices, explaining the emotional purpose of each control. The anonymous-by-design reassurance remains visible beside the form.

The four paper tones remain available: warm parchment, quiet sage, morning blue, and faded rose. The selected tone has a visible focus ring and is saved with the note so the paper color is shared with every visitor who reads it.

Scheduling remains an optional disclosure. The interface explains that the selected future date and time are interpreted in the visitor’s local time. On the server, scheduled publication remains gated behind production mode and `QR_ENABLE_SCHEDULED_PUBLISHING=true`; no live scheduled jobs are created in local development or preview.

After a successful submission, the confirmation presentation clearly states that the note is present or scheduled, displays the private management link, explains that the link is the only deletion method, and provides escape routes to the collection or another note. The copy-link control provides explicit copied feedback.

The confirmation UI was extracted into the reusable `WriteConfirmation` component. This made it possible to test the actual confirmation markup, private link, idle copy control, and copied state without creating durable live content.

## Note lifecycle and privacy model

A note is created with a recipient name, message, selected paper color, lifecycle status, and timestamps. When no future publication time is selected, the note is published immediately according to the current product decision. A future date uses the scheduled path and is unavailable unless production scheduling has been explicitly enabled.

The writer receives a private management URL after creation. The raw token is not stored in the database; only its SHA-256 hash is persisted. Deletion requires a confirmation action. Once deleted, the note is no longer returned by the public feed and the same private link no longer resolves to an active note.

The product is anonymous by design, but this should not be interpreted as absolute anonymity in every infrastructure layer. The application avoids collecting a sender name and does not persist raw browser reaction keys or report keys. Operational logs and hosting-layer data still require a separate privacy and retention policy before public launch.

## Moderation and safety controls

The public site has no moderation dashboard in its normal navigation. Public visitors can report a note, while the owner can use the separate admin-only `/moderation` route to review reports and remove associated notes. Reports support open, reviewed, and resolved states.

Note creation uses invisible honeypot protection and a centralized in-memory throttle. Reporting uses a separate anonymous reporter key and throttle. These controls reduce obvious automated abuse without persisting raw IP addresses, but they are single-process protections. A shared durable rate-limit mechanism should be considered before operating at meaningful multi-instance scale.

The immediate-public-posting decision means moderation is reactive: a note can be visible before a report is reviewed. The owner should decide whether that policy remains permanent and should define response times, escalation rules, community guidelines, and handling for private or harmful information.

## Localization and RTL status

The supported languages are English (`en`), Arabic (`ar`), and Sorani Kurdish (`ku`). The language preference is persisted in the browser through `qr-language`. Arabic and Kurdish set the document direction to RTL and use the Arabic-compatible font stack.

New interaction copy has been localized across the application, including reporting, reactions, pagination, errors, scheduled publishing, private management, deletion, Write-page guidance, field hints, paper-tone hints, optional labels, and copy-link feedback.

The requested Kurdish homepage headline remains:

> بۆ ئەو کەسانەی هێشتا قسەیان لەگەڵ دەکەین یاخود نا؟

The latest About-page correction now reads:

> ئەمە کۆمەڵەیەکی نەناسراوە بۆ ئەو وشانە. شوێنێک بۆ وتنی سوپاس، ببورە، لەبیرمە، خۆزگە لێرە دەبووی—یان تەنها ناویان.

Arabic and Sorani Kurdish Write-page states were directly checked in the browser for translated navigation, headings, labels, placeholders, helper text, paper-tone labels, scheduling copy, and submit controls. A native-speaker review remains recommended for final punctuation, dialect, and tone.

## Technical architecture

The frontend is React 19 with Vite, Wouter routing, Tailwind CSS 4, Lucide icons, and shared context providers. TanStack Query and the generated tRPC client handle server data and mutations. `LanguageContext` owns dictionary selection, persisted language preference, and document direction.

The backend uses Express, tRPC 11, Drizzle ORM, and the existing Manus authentication infrastructure. Public note flows do not require authentication. Admin moderation is protected by the owner/admin role. The database is MySQL/TiDB-compatible.

| Model | Purpose |
|---|---|
| `remembranceNotes` | Recipient name, message, paper color, lifecycle status, manage-token hash, scheduled-publication metadata, and timestamps |
| `noteReports` | Report reason, optional explanation, hashed reporter key, and report status |
| `noteReactions` | Anonymous reaction records keyed by note and hashed browser key |
| `users` | Existing authenticated users and admin role information |

## Validation and test coverage

| Check | Result |
|---|---|
| TypeScript | Passed with `pnpm check` |
| Automated tests | Passed: 5 test files, 21 tests |
| Production build | Passed with `pnpm build` |
| Home behavior coverage | Loading, error, populated, and empty archive branches are covered |
| Server behavior coverage | Notes, throttling, honeypot, reports, reactions, search, pagination, scheduling, manage tokens, and deletion |
| Write behavior coverage | Manage URL construction, confirmation status rendering, private-link display, idle copy control, and copied feedback state |
| Browser verification | Home and Write states checked in English; Arabic and Sorani Kurdish RTL copy checked directly; mobile layouts checked through the shared responsive rules and narrow viewport capture |

The build emits a non-blocking advisory that one JavaScript chunk exceeds 500 kB after minification. Route-level code splitting could improve first load performance. The installed pnpm version also warns that the package-level `pnpm` field is ignored; neither warning blocks the current build.

## Checkpoint history

| Checkpoint | Meaning |
|---|---|
| `c75d8dbd` | Completed the broader full-stack remembrance brief, including reports, reactions, private management, search, and scheduling paths |
| `2e5e97d7` | Updated the full project status report after the core feature work |
| `5a189a77` | Fixed the Home feed SQL ordering failure and HTML-as-JSON cascade |
| `15fa89af` | Completed Home-page polish and verification |
| `155a7813` | Completed Write-page polish, localized helper copy, confirmation extraction, and client-side test discovery |
| `f6c43797` | Corrected the Sorani Kurdish About-page wording and revalidated the suite |

## Remaining work before public launch

The implementation is in a strong development state, but two QA items remain intentionally open. First, the complete real submission → confirmation → copy-link → deletion flow should be run in a deployed staging environment. This should use a disposable, clearly labeled note and immediate cleanup, or an isolated staging database, so production content is not polluted.

Second, Arabic and Sorani Kurdish should receive explicit narrow-mobile device captures if the launch checklist requires language-specific visual evidence. The shared mobile layout and direct RTL browser rendering have been checked, and English has a narrow-mobile capture, but the current screenshot harness does not share the browser’s persisted language state for separate Arabic and Kurdish mobile captures.

Before public release, the owner should also decide on a privacy policy, retention policy, community guidelines, incident-response procedure, report retention rules, and the permanent public-versus-unlisted note model. Native-speaker review of Arabic and Sorani Kurdish is strongly recommended.

## Recommended next actions

The next practical step is deployment to a private staging environment, followed by the complete note lifecycle test: create a disposable note, confirm it appears, copy and open the private manage link, delete it, verify that it disappears from search, submit a report from a second browser if needed, and review the moderation path as the owner.

After staging verification, finalize the public trust copy and decide whether immediate publication remains appropriate. If the site grows beyond a single process, replace the in-memory throttles with a shared mechanism while preserving the current privacy-conscious approach of not persisting raw IP addresses.

## Copy-ready handoff prompt

```text
I am building Quietly Remembered, an anonymous multilingual remembrance website.

A visitor writes the name of someone they miss and a message for that person without entering the sender’s name. Notes are public torn-paper keepsakes that can be searched by recipient name.

Stack:
- React 19 + Vite + Tailwind CSS 4
- Express + tRPC 11
- Drizzle ORM with MySQL/TiDB-compatible database
- Wouter routing + TanStack Query
- Manus authentication infrastructure for owner/admin access
- English, Arabic, and Sorani Kurdish with RTL support

Pages:
- Home: public feed, ranked recipient search, cursor pagination, reactions, reporting
- Write: anonymous form, paper-tone selection, honeypot, optional scheduling, private manage link
- Manage: private token lookup and confirmed deletion
- Moderation: admin-only report review and note removal
- Rituals, About, and Customize: supporting content and local paper personalization

Visual system:
- Paper Lantern stationery aesthetic
- Warm parchment, botanical artwork, torn paper, tape, and persimmon accents
- Fraunces for emotional text, DM Sans for Latin UI, Noto Sans Arabic for Arabic/Kurdish

Current state:
- Home polish is complete in checkpoint 15fa89af.
- Write-page polish is complete in checkpoint 155a7813.
- Latest checkpoint is f6c43797, which includes the corrected Sorani Kurdish About copy: «لەبیرمە، خۆزگە لێرە دەبووی».
- `pnpm check` passes.
- `pnpm test` passes with 5 files and 21 tests.
- `pnpm build` passes.
- Remaining QA is a deployed staging lifecycle test and explicit Arabic/Kurdish narrow-mobile captures.

Please continue by preserving the anonymous, emotionally respectful product direction. Do not redesign Home unless a shared component change is necessary. Treat real user-generated content and moderation as sensitive; do not fabricate reviews, testimonials, or public notes.
```
