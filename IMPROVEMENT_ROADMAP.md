# Improvement roadmap

October 19, 2026. Audit details, evidence, complexity and verification are in AUDIT_REPORT.md. This supplements the launch checklist; historical launch notes do not override newer evidence.

## Completed on the review branch

- [x] Preserve clean baseline `2e38035` and create `codex/architecture-review`.
- [x] Discovery and architecture/data-flow review.
- [x] Baseline 60 tests pass.
- [x] FF-01: bind coordinates to current selection/retry; regress old-area reuse.
- [x] FF-02: defer location permission until discovery is enabled.
- [x] FF-03: defensively validate deletion authentication-method claims; local only.
- [x] FF-04: prepare read-only CI; hosted execution and branch protection pending.
- [x] FF-05: correct current README and add consolidated engineering documents.

No database migration or hosted deployment was performed. Existing builds do not contain these branch-only fixes.

## Sequence 1 — close release blockers

1. **FF-09 device acceptance**: verify build processing, then both phones retest voting setup/gestures/ties/reconnect and Saved test ads/consent. Follow VOTING_DEVICE_RETEST.md and AUTH_DEVICE_QA.md. Requires testers; do not start duplicate builds just to check status.
2. **FF-08 dependency investigation**: refresh audit and map affected code paths. Compatible isolated upgrades only, with native validation; no automatic framework downgrade. Implementation choices depend on patched upstream availability.
3. **FF-06 recoverability**: agree on recovery-point/time objectives, encrypted backup location/access/retention and restore into a separate environment. Requires owner approval for hosted exports/infrastructure. Git is not the database backup.
4. **FF-07 capacity and quota correctness**: draft compatible classified quota results and accepted-forward accounting, add PostgreSQL/concurrency fixtures, measure representative load with synthetic provider responses. Present migration/rollback plan before production changes. Do not raise spend caps automatically.
5. **FF-10 final release evidence**: final signed manifest/provider collection review, Apple disclosures/screenshots/reviewer account/operator identity, asset notices; verify AdMob app-ads/app-readiness and bank state. Live ads require a separate reviewed activation. Public submission uses manual release.

## Sequence 2 — strengthen boundaries before broad beta

- [x] FF-16 reproduced delayed vote/restore identity retargeting; bind RPC and restore to captured owner/token. Native Auth-transition test remains.
- [x] FF-17 reproduced save-vs-hydration race with real storage class; serialize replacement reads behind pending same-account writes, including repeated reloads.
- [ ] FF-11 partially complete: typed details/reviews, coordinate guards and explicit strict intent; provider-wide contracts and Deno checks remain.
- [ ] FF-13 dry-run anonymous-user retention design; approval before any deletion job.
- [ ] FF-15 operational monitoring/runbook/alert and restore exercise; record owners and measured outcomes.
- [ ] Auth two-device sync/conflict/deletion and second inbox; VoiceOver/large-text/small-screen/offline acceptance.
- [x] Initial hosted CI succeeded (run 39292960066). Verify follow-up commits too; branch protection still requires separate account configuration.

## Sequence 3 — simplify when evidence justifies it

- [ ] FF-14 remove inactive local-password helper/direct dependency in its own commit after clean-install/export verification.
- [ ] FF-12 extract room state/gesture responsibilities incrementally with realistic rendered tests; keep shared-deck/server semantics intact.
- [ ] FF-18 explicit consent retry and legal-site keyboard skip link if validated as useful.

## Deferred product opportunities

Additional ads, paid memberships, Android distribution and universal links remain future decisions. The launch product is restaurant discovery plus trustworthy group voting. New ad units and infrastructure subscriptions are not required by this review.

## Acceptance and rollback

Every implemented item needs a reproduction, relevant regression tests, static/format checks and a reviewed diff. Native/provider behavior also needs its real-runtime evidence. Commit small changes on this branch; merge/cherry-pick deliberately. Leave `main` at its known checkpoint until review. Hosted changes need separate explicit approval and a tested migration/recovery plan; an app branch cannot undo a database deletion.
