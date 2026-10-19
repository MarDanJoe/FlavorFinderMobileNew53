# Engineering audit — October 19, 2026

## Assessment and scope

Baseline: clean `main` at `2e38035`; work isolated on `codex/architecture-review`. Reviewed navigation/screens/components, hooks/contexts, service boundaries, hosted handlers/provider adapter, all three SQL migrations, configuration/build scripts, test infrastructure, package/lockfile, legal generation and launch evidence. Existing historical dashboard/device results are explicitly distinguished from checks executed in this review. No production calls, infrastructure changes, paid builds or destructive tests were made.

The architecture is appropriate for the product. RLS, RPC authorization, server-only Google credentials, revisioned library writes, immutable private votes and persisted ties are meaningful strengths. The app is in internal beta. Public launch still depends on device verification, recoverability, privacy declarations, capacity and advertising verification. No P0 exploit or data-loss incident was established by this review; that is not a security certification.

## Confirmed findings and corrections

### FF-01 — P1: failed location refresh can retain the previous search area — fixed locally

- Evidence/files: `src/hooks/useRestaurants.ts` retained `location` when permissions failed after selecting a manual city. The new regression failed against baseline with `manual-city` still displayed after denial.
- Root cause: location state was not bound to its selection/retry generation. A refresh could reuse old coordinates, confusing users and potentially issuing unnecessary provider requests.
- Correction/benefit: bind resolved coordinates to a key containing location selection, retry and enabled state. Pending/denied selections cannot reuse a previous city's position. Existing stale-response guards remain.
- Complexity/risk: small; affects permission/search transitions. No API or persistence change. Verify manual→device denial, retry, filters, late responses and native permission handling.
- Verification: deterministic hook test reproduces the original failure and passes with the correction. Physical-device retest remains required.

### FF-02 — P2: disabled discovery still requests location permission — fixed locally

- Evidence/files: same hook ran its permission effect despite `enabled: false`. New regression observed one permission request instead of zero before enabling.
- Correction/benefit: respect `enabled` in location resolution. Avoid premature permission prompts while startup preferences are still loading; search remains gated.
- Complexity/risk: small; enabling now starts location work explicitly. Test disabled→enabled, manual city and permission timeout. Both old and new regression paths pass.

### FF-03 — P2: malformed authentication-method claims can crash deletion handler — fixed locally, not deployed

- Evidence/files: `supabase/functions/delete-account/index.ts` assumed `claims.amr` was an array of objects. Handler simulation with an object threw `TypeError: claims.amr?.some is not a function`; null entries also lacked validation and string timestamps were coercible.
- Correction/benefit: require an array, object entry and finite numeric timestamp before accepting a recent password method. Malformed claims fail closed with 403.
- Scope: Auth.getUser already validates the token first. A caller cannot simply forge claims to bypass authentication; no authentication bypass was demonstrated. Handler tests mock authenticated identity and test defensive validation only.
- Complexity/risk: small; conforming numeric Supabase claims remain accepted. Verify missing, malformed, stale/future and valid password claims; actual provider behavior on disposable-device deletion before deployment approval.

### FF-04 — P1: no automated repository quality workflow — prepared locally

- Evidence/files: no tracked `.github/workflows` existed despite extensive executable tests and release-sensitive integrations.
- Correction/benefit: added `quality.yml` for PR/main/review-branch checks: lockfile install, TypeScript, tests, formatting and legal page drift. Actions pinned to verified upstream commits, read-only contents, persisted checkout credentials disabled, timeout and redundant-run cancellation. No production secrets or deploy steps.
- Complexity/risk: small; consumes normal GitHub Actions minutes after push. Repository billing/branch protection and hosted execution are not configured or verified. Do not claim required checks until an actual successful run and branch rules are confirmed.
- Verification: local equivalent commands and formatting checks; initial hosted workflow succeeded: https://github.com/MarDanJoe/FlavorFinderMobileNew53/actions/runs/39292960066 . Follow-up commit checks must be verified separately.

### FF-05 — P2: documentation contradicts current app behavior — corrected locally

- Evidence/files: README said Apple enrollment/builds were pending, no ads existed and room creation reused Discover filters. These conflict with code and newer checkpoints.
- Correction/benefit: updated README and added architecture/audit/roadmap/testing/deployment references. Launch chronology remains evidence rather than the authoritative current status.
- Complexity/risk: small; no runtime change. Check links and inspect generated policy drift. No invented live build/readiness result.

## Confirmed open release and engineering findings

### FF-06 — P1: backups and restore readiness are not established

- Evidence: `launch/PROVIDER_PRIVACY_REVIEW.md` records Free project without managed backups and no verified restore. Source Git does not protect hosted favorites/accounts.
- Plan/benefit: encrypted off-site backup, access/retention policy and restore drill in isolated nonproduction environment. Reduce recovery/data-loss risk.
- Complexity: medium; depends on owner-approved storage/access and protection of Auth data. Never commit exports. Verify restore contents, permissions, dependencies and recovery time. Current account state was not rechecked in this review.

### FF-07 — P1: quota saturation can deny discovery to all users; minute blocks are mislabeled

- Evidence/files: `202609300001_launch.sql` increments global day and subject-minute counters before returning a boolean. `places/index.ts` labels every false as daily exhaustion, including minute exhaustion. A blocked call consumes a day-counter increment. The configured beta default is 100 shared attempts/day.
- Plan/benefit: preserve current RPC compatibility while designing classified quota outcomes and accepted-forward accounting, plus abuse controls and measured launch capacity. Prevent misleading reset instructions and reduce denial-of-service exposure. Guest Auth identities make per-user limits insufficient on their own.
- Complexity: medium; schema/RPC contract and cost behavior require review and explicit hosted-deployment approval. Do not simply raise caps or remove authentication. Verify concurrent attempts, both reset boundaries, blocked-vs-forwarded totals and old-client error compatibility.

### FF-08 — P1: dependency advisories remain unresolved

- Evidence: retained October 19 npm audit snapshot reports 17 high dependency entries, propagated primarily through two underlying advisories: braces recursion DoS and node-forge signature validation. These are dependency findings, not 17 independently confirmed remotely exploitable app vulnerabilities. Lockfile/tool usage reviewed; mobile exploitability not established.
- Sources checked: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm and https://github.com/advisories/GHSA-86w9-cpqp-85rv . Braces advisory lists no patched version at review time. Do not assume installing a random newer package fixes it.
- Plan/benefit: refresh audit, map reachable paths in build/native/server bundles, select compatible upstream fixes or documented mitigations. Restrict build tooling to trusted workspaces/inputs meanwhile.
- Complexity: medium/high; suggested audit fixes downgrade Expo/RN major versions and are unsuitable as an automatic repair. Validate clean install, native builds, package generation and full regression suite before adopting dependency changes. Initial pass reused the snapshot; follow-up refreshed npm audit and still found 17 high entries from the same two advisories. Neither advisory lists a patched version. No package or lockfile changes were made; see launch/DEPENDENCY_REVIEW.md.

### FF-09 — P1: native voting and AdMob paths need final device verification

- Evidence: owner found voting swipe navigation failure; code fix and independent setup are present but native retest is still open in VOTING_DEVICE_RETEST.md. AdMob is new, test-only; no successful iPhone banner/consent verification recorded. Build 12 status was not refreshed during this review.
- Plan/benefit: both testers install the same final build; execute linked voting/device/privacy cases. Verify banner no-fill, opt-out, privacy changes, same winner and membership after restart. Avoid premature store release or live inventory.
- Complexity: medium; needs two phones/testers and processed build. Mocks cannot close this gate.

### FF-10 — P1: final privacy and operational declarations are incomplete

- Evidence: APP_PRIVACY_WORKSHEET.md, NATIVE_PRIVACY_MANIFESTS.md, ASSET_AUDIT.md and store draft retain operator, AdMob manifest/data, branding/license and review-form gates. Build 10 inventory predates the ad SDK. User confirmed a published US-state message includes Flavor Finder and entered the public policy URL; no account inspection in this audit.
- Plan/benefit: inventory final IPA, reconcile runtime/provider data use, complete Apple disclosures/age rating/copyright and AdMob app/store/app-ads verification. Bank verification is pending per owner, separate from SDK testing.
- Complexity: medium; depends on final binary and owner decisions. Verify actual public artifacts and account status. Do not equate non-personalized ads with no collection or declare legal compliance from code alone.

### FF-11 — P2: boundary types and hosted runtime checks remain incomplete — partially improved

- Correction to initial assessment: installed TypeScript 6.0.3 defaults strict checking on even though Expo's config omits the flag. Verified with `getStrictOptionValue({}, "strictNullChecks") === true`; the earlier statement that app strict checking was off was incorrect. `strict: true` is now explicit to preserve intent across tool changes. Ignored verification/release exports are excluded from app checking.
- Evidence/files: tsconfig still excludes `supabase/functions`. Handler tests transpile without Deno type validation; Deno is unavailable in PATH. Some provider/Auth fields still use `any`.
- Follow-up: explicit RestaurantDetails/RestaurantReview types replace detail-screen `any`, exposing three nullable link callbacks that were guarded. City/detail coordinate fields now require finite numbers within geographic bounds; malformed names/details fail with a controlled error. Two new contract regressions failed before correction and pass afterward. This is partial response validation, not a claim every nested field is validated.
- Plan/benefit: continue typed provider/search normalization and add Deno checking in a reviewed tooling change. Medium effort; verify app tsc, Deno and malformed-payload fixtures without weakening real-data attribution.

### FF-12 — P2: large stateful screens and custom test harnesses raise maintenance risk

- Evidence: RoomsScreen ~775 lines, HomeScreen ~685, detail ~454; tests reconstruct hook scheduling/RN primitives. Existing tests cover meaningful state/SQL behavior but not actual React Native rendering/navigation.
- Plan/benefit: isolate room action/session state and card gesture logic only behind established behavior tests; add realistic rendered/device coverage. Keep SQL authoritative. Avoid a wholesale architecture rewrite.
- Complexity: medium; extraction risks stale closures and gesture behavior. Verify account change, repeated actions, canceled swipes, polling and recovery before/after each extraction.

### FF-13 — P2: unused guest identity lifecycle is not implemented

- Evidence: hourly SQL cleanup removes expired rooms/attempts, not unused `auth.users` guest records. Privacy policy discloses this distinction; provider review calls it out.
- Plan/benefit: design age/inactivity and room-aware retention with dry-run counts and explicit deletion approval. Limit hosted growth without deleting active users or host rooms.
- Complexity: medium; security/admin access, cascade effects and retention obligations. Verify dry run and fresh/active-room exclusions in staging first.

### FF-14 — P2: legacy authentication helper remains, but is not used by active auth

- Evidence: `services/passwords.ts` and direct `@noble/hashes` imports are referenced only by legacy helper tests. Active auth uses Supabase; obsolete local password keys are removed at startup.
- Plan/benefit: remove helper/direct dependency and irrelevant tests as a separate dependency cleanup after confirming no migration consumer. Clarify threat model and reduce onboarding confusion. This is not a plaintext password finding.
- Complexity: small/medium; lockfile changes need clean install/export validation. Avoid deleting historical user libraries.

### FF-15 — P2: observability and failure-recovery runbooks need operational evidence

- Evidence: Places category/status logs and health handler exist; no verified alert delivery, uptime response owner, restore drill or public load test in repository. Internal polling is four seconds per active room client (~15 RPCs/client/minute, up to ~150 for 10 continuously active clients); not a measured DB capacity result.
- Plan/benefit: alerts and runbook covering auth/email/provider outage, quota reset, expired credentials, rollback, backups and testflight/release versions. Measure representative multi-room load in staging with fake provider data, not billable production traffic.
- Complexity: medium; owner-approved external monitoring if selected. Verify alert delivery and recovery exercise; never log credentials/coordinates/emails to gain observability.

## Race investigations — confirmed and corrected in follow-up

### FF-16 — P1: delayed room RPCs can use a changed identity — fixed locally

- Evidence/files: `services/rooms.ts` called RPC using ambient auth after obtaining a session. Deferred-dispatch and deferred local-storage fixtures reproduced execution as Bob for a request started under Alice. The installed Supabase fetch wrapper only supplies Authorization if absent, confirming explicit query headers are honored.
- Correction: capture matching token/session owner, fail safely if those disagree, set explicit bearer header on room RPC, and restore a saved room using the same captured owner/token across the storage await. Existing UI revision guards still prevent late results from being displayed after account switches. No privilege escalation or production incident was established; server RLS remains authoritative.
- Complexity/risk: small/medium; no API/schema change. Tokens can expire/change while requests are pending; normal server rejection/retry applies. Verified delayed vote, delayed restore, network retention and owner-specific expiry cleanup. Native real-auth/session-change retest still open.

### FF-17 — P1: Saved hydration can hide a successful in-flight save — fixed locally

- Evidence/files: LibraryProvider created a replacement store/read while a previous same-account save was pending. A test using the real PersistentLibrary and deferred storage reproduced an empty displayed list after the save succeeded, including two consecutive reloads. This was a stale view, not demonstrated permanent server data loss.
- Correction: place loads and mutations in the same promise queue; replacement same-account stores inherit the previous queue before reading. Consecutive reloads inherit the pending read/write barrier too. Account switches never wait on another user's queue and retain the existing immediate privacy guards.
- Complexity/risk: small/medium; a pending same-account write delays hydration. Existing cloud library reads/writes lack their own explicit request timeout; prolonged provider stalls remain operational work. Verify deferred success/failure, queued writes, reload chains and account transitions; phone sync testing remains required.

## Optional follow-up

### FF-18 — P3: ad consent retry and optional web accessibility improvements

Ads controller starts once per process; initial consent failure suppresses ads until restart. App remains usable. Confirm desired explicit retry UX before changing network behavior. Legal website has headings/focus styling but no skip link; add with real keyboard verification when website work is scheduled. Small effort; neither proves the core restaurant/voting flow is broken.

## Product priorities and final review

Essential: recovery, capacity/error classification, dependency reachability, native voting/ads/account/accessibility tests and final privacy/store gates. High-value: repeatable CI, explicit contracts, stronger real-runtime tests and operational runbooks. Optional: modularize oversized screens where touched. Future: paid memberships, more ad placements, universal links and Android release. None are required to preserve Flavor Finder's central shared-deck decision experience.

Implemented changes keep the stack, database schema, API contract and product identity intact. Rollback remains a branch switch/cherry-pick/revert decision, not a reset or hosted migration. See TESTING.md for exact validation evidence and limitations; no production-ready claim is made.
