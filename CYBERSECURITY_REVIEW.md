# Quietly Remembered cybersecurity review

## Scope and method

This is an authorized, non-destructive review of the Quietly Remembered source code, Supabase migrations, dependency manifest, production build shape, and current preview response headers. The review looked for common web-application weaknesses, accidental secret exposure, unsafe rendering, authorization mistakes, abuse controls, dependency risk, and deployment mismatches. It did not attempt exploitation against third-party systems, did not dump private data, and did not modify the existing Netlify site.

A useful security habit is to separate **confirmed findings** from **design risks** and **unverified assumptions**. A missing header observed in a response is a confirmed finding; a dependency advisory is a risk that must be checked for reachability and exploitability; a concern about a future Netlify deployment is a deployment blocker rather than a vulnerability in the current app.

## Executive summary

The project has several strong foundations. Secrets are read from server-side environment variables rather than committed source, the Supabase service-role client is kept in server code, the audio bucket is private, playback uses short-lived signed URLs, management tokens are hashed before storage, input schemas constrain public procedures, and remembrance text is rendered as React text rather than injected HTML. The Supabase migrations also disable direct anonymous access to reports and reactions through restrictive row-level security policies.

The most important improvements are operational. The current preview exposes an `X-Powered-By: Express` fingerprint and does not show standard browser hardening headers. The application trusts the first `X-Forwarded-For` value for rate limiting, which can be spoofed when proxy trust is not explicitly configured. Its 50 MB JSON and URL-encoded parser limits are much larger than the product’s validated payloads and create avoidable memory-abuse exposure. In-memory rate limiting will not provide reliable protection across multiple server instances. The production dependency audit also reports 17 high, 47 moderate, and 8 low advisories in the current dependency graph; many are transitive, so they require triage and upgrades rather than automatic assumptions of exploitability.

There is also a deployment blocker: this is an Express/tRPC full-stack application. A plain Netlify static deploy would publish the Vite frontend but would not automatically run the custom Node server routes under `/api/trpc`, scheduled callbacks, Supabase service-role operations, or storage proxy logic. Netlify supports server-side code through Functions, but this project has not been converted to that model.[4] The newly created dedicated Netlify site exists, but I have intentionally not uploaded a static-only copy that would look live while its backend was broken.

## Findings

| ID | Severity | Finding | Status | Why it matters |
| --- | --- | --- | --- | --- |
| F-01 | High | Full-stack runtime is not Netlify-static compatible as-is | Confirmed deployment blocker | A static upload would omit the Express/tRPC backend and make note creation, moderation, reactions, audio signing, and scheduled routes fail. |
| F-02 | Medium | Missing baseline security response headers | Confirmed in preview headers | Without CSP, HSTS, `X-Content-Type-Options`, Referrer-Policy, and frame protections, browser defenses are weaker and token-bearing URLs have more leakage opportunities. OWASP recommends treating these headers as part of web response hardening.[1][2] |
| F-03 | Medium | Rate-limit identity trusts client-supplied `X-Forwarded-For` | Confirmed in `server/routers.ts` | A caller can rotate or forge the first forwarded address unless the deployment proxy is explicitly trusted and normalizes the value. This can bypass per-IP submission throttling. |
| F-04 | Medium | Rate limiting is process-local and unbounded | Confirmed in `server/routers.ts` | The `Map` resets during restarts, is not shared across instances, and retains keys until their next access. It is useful as a basic guard but not a production-grade abuse barrier on autoscaling infrastructure. |
| F-05 | Medium | Request body parser allows 50 MB before procedure validation | Confirmed in `server/_core/index.ts` | Attackers can send oversized JSON or URL-encoded bodies and consume memory before Zod rejects the request. The application’s intended audio payload is approximately 2.8 MB base64 and its text fields are far smaller. |
| F-06 | Medium | Dependency graph contains known advisories | Confirmed by `pnpm audit --prod` | The current audit reported 17 high, 47 moderate, and 8 low advisories, with no critical advisories. Examples include `qs`, `dompurify`, `mermaid`, `uuid`, `nanoid`, `axios`, and `body-parser`. Reachability varies, but production dependencies should be upgraded and retested. |
| F-07 | Low | Express fingerprint is exposed | Confirmed in preview response | The preview returns `X-Powered-By: Express`. This is not an exploit by itself, but removing it reduces unnecessary stack disclosure. |
| F-08 | Design risk | Private management tokens are bearer capabilities in URLs | Confirmed by design | Anyone who obtains a manage URL can view or delete that note. The token is generated with strong randomness and stored only as a hash, which is good, but URL history, screenshots, logs, and referrers must be treated as sensitive. |

## Positive controls already present

The server uses Zod schemas on public tRPC procedures, including bounded recipient names, messages, paper colors, report reasons, audio MIME types, audio duration, and audio base64 length. The manage token is generated with `randomBytes(32)` and only its SHA-256 hash is stored. Public Supabase reads are restricted to published, scheduled-eligible notes. Reports and reactions have server-only row-level-security policies, while audio is stored in a private bucket and exposed through a five-minute signed URL after checking note visibility. React note rendering does not use `dangerouslySetInnerHTML`; the one chart component using style injection is static component configuration rather than user-supplied note content.

The moderation route is protected by the centralized `adminProcedure`, which requires an authenticated user with the `admin` role. The scheduled publishing endpoint also checks the authenticated request for a cron identity and task UID. These controls should be regression-tested whenever the hosting model changes.

## How to learn from these findings

When reviewing another website, begin at the trust boundaries: browser to API, API to database, API to object storage, and admin tools to public data. For each boundary, ask what the caller controls, what the server trusts, and whether the server re-checks authorization at the point of use. Then inspect resource limits and state: can an anonymous caller create unlimited records, upload unlimited bytes, enumerate IDs, or force expensive work? Finally, inspect the deployment layer because a secure application can still fail if its backend routes, secrets, and scheduled jobs are not present in production.

For this project, a safe learning exercise is to trace one flow without attacking it: note creation generates a random bearer token, stores only its hash, returns the raw token once, and later compares a hash of the presented token. Trace a second flow: audio playback first checks that the note is public, then creates a time-limited signed URL. These are examples of **capability-based access** and **defense in depth**. A useful negative test is to confirm that an anonymous Supabase client cannot directly read reports, reactions, or private storage; perform that only against the project you own and with a minimal test query.

## Prioritized remediation plan

First, add response headers at the actual production boundary. Start with `X-Content-Type-Options: nosniff`, a restrictive `Referrer-Policy: no-referrer`, `Permissions-Policy` limiting unused capabilities, `frame-ancestors 'none'` through CSP, and HSTS only after confirming every production path is HTTPS. A CSP should be introduced incrementally because this app loads Google Fonts and may use runtime assets; begin with report-only mode, review violations, then enforce a narrow policy.[2]

Second, reduce the Express body-parser limits to a value that covers the supported compressed audio envelope rather than 50 MB, and reject oversized requests at the edge when Netlify or another proxy is introduced. Third, replace the process-local rate limiter with a shared store or a platform-level abuse control, and derive the client identity from a trusted proxy configuration rather than trusting arbitrary forwarded headers. Fourth, update production dependencies in a controlled batch, beginning with direct dependencies and advisories in request parsing, HTML/diagram handling, and server runtime paths. Run the complete test suite and build after each upgrade group; OWASP’s dependency guidance emphasizes maintaining and monitoring dependencies rather than treating an audit as a one-time event.[3]

Finally, choose a deployment architecture before uploading. The safe choices are either to keep the current full-stack project on its compatible built-in hosting, or to perform a deliberate Netlify Functions migration for tRPC/API routes, scheduled work, storage proxy behavior, environment variables, and SPA routing. Do not publish only `dist/public` and assume the server bundle will execute there.

## Deployment state

A separate Netlify site named `quietly-remembered` was created with site ID `40777bed-bac1-4998-a6e1-88446abc0c54`. The existing site `zesty-scone-8b97b7` was not modified. No deploy was performed because the current project is not a static-only application and a static deploy would be misleading and nonfunctional for core features.

## References

[1]: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html "OWASP HTTP Headers Cheat Sheet"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html "OWASP Content Security Policy Cheat Sheet"
[3]: https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html "OWASP Software Supply Chain Security Cheat Sheet"
[4]: https://docs.netlify.com/build/functions/overview/ "Netlify Functions overview"

## Hosting recommendation addendum

For this project, the best no-additional-cost path is to keep the current full-stack application on its compatible built-in WebDev hosting and publish the verified checkpoint there. The application already matches that environment: it is an Express/tRPC server with Supabase integration, server-side secrets, private audio signing, moderation procedures, and scheduled callbacks. That preserves the working product without a platform migration. Current hosting guidance describes WebDev as free to start with usage-based billing at higher volumes; account-specific limits or charges should be checked in the project hosting panel rather than assumed.

A plain Netlify static deploy is not a better free option for this codebase. It would upload the Vite assets but omit the custom Node server routes, so note creation, moderation, reactions, audio URL signing, and scheduled publishing would fail. A functional Netlify deployment would require a deliberate Netlify Functions migration and separate testing. Since the product is already working and the priority is no added complexity, that migration is not recommended now. The separate `quietly-remembered` Netlify site remains unused as a future migration target, while the existing `zesty-scone-8b97b7` site remains untouched.

## Final Netlify smoke-test evidence

The separate Netlify deployment is now live at [quietly-remembered.netlify.app](https://quietly-remembered.netlify.app). The latest production deploy completed successfully with one bundled `api` Function, two redirect rules, and one security-header rule. The deployment’s secret scan reported zero matches across 165 scanned files.

A disposable success-path test then created one temporary note with a custom dark paper color and a one-second WebM/Opus attachment. The note appeared in the public feed, preserved its custom paper color, exposed audio metadata, returned a signed playback URL, and served the audio bytes successfully. The same test added and removed an anonymous remembered reaction, submitted a report, resolved the private manage link, and deleted the note. A follow-up Supabase cleanup verified two disposable QA notes were unpublished, both QA reports were resolved, and the one uploaded audio object was removed.

The public moderation route was reachable, but the current browser/API session was not authenticated as the project owner, so the admin queue could not be verified through the UI. An unauthenticated moderation request correctly returned 403. The report created for the disposable test was resolved through a guarded server-side cleanup after verifying its unique QA identity; no disposable QA note remains published. To finish admin-specific verification, sign in to the app’s owner OAuth session and confirm that `/moderation` lists and resolves a test report. This is an access prerequisite, not evidence that the moderation authorization boundary is missing.

The live API also passed non-destructive checks for public feed JSON, invalid note rejection with HTTP 400, nonexistent-note guards for reactions/reports/audio with HTTP 404, and unauthenticated scheduled publishing with HTTP 403. The scheduled route was hardened so an invalid session no longer becomes a misleading HTTP 500.
