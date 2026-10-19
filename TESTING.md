# Testing and validation

## Local commands

Use Node >=22.13; install locked dependencies with `npm ci`.

```sh
npm run typecheck
npm test
npm run format:check
npm run legal:build
git diff --exit-code -- docs public/legal
npm run release:check
npx expo export --platform ios --output-dir /private/tmp/flavorfinder-architecture-ios
```

Release checking needs the owner's real public configuration loaded locally/EAS; it does not need privileged server keys. Do not print `.env.local`. Export verifies JavaScript bundling, not native compilation/signing.

The quality workflow runs install/typecheck/tests/format/legal drift with no service credentials. It does not run live integration tests, create Apple builds, deploy or modify cloud settings. Hosted execution is still pending.

## Coverage and limits

- Node test runner uses deterministic fixtures and TypeScript transpilation; hook/component harnesses simulate state and RN APIs, not a native UI runtime.
- PGlite runs actual PostgreSQL migration/RLS/RPC behavior. Scheduler creation is excluded in the local room test; hosted pg_cron and Auth are not recreated. This is not proof of real simultaneous database transaction behavior under load.
- Mocked Edge handlers cover route/parameter validation, authentication rejection, quota rejection, upstream error redaction, logs and deletion safeguards. They mock Auth.getUser; forged test tokens do not prove production JWT acceptance.
- No real Google/SMTP/production DB calls in this review. Historical launch evidence is separately labeled in `launch/`.
- App `tsc` excludes Deno functions. Deno is unavailable in PATH; no Deno type check was executed. Compiler strict mode is currently not enabled.
- Full end-to-end/device and uptime/load/restore checks remain open. No coverage percentage, memory result, p95 latency or scale claim was measured.

## October 19 architecture review evidence

Baseline: all **60** tests passed (observed runner duration ~8.84 seconds; one local sample, not a performance benchmark).

Three added behavioral regressions were run before fixes and reproduced failures:

1. Disabled discovery requested location permission (one call, expected zero).
2. Manual-city → denied device-location switch retained the manual-city card.
3. Deletion handler crashed on a non-array authentication-method claim.

Targeted runs after fixes passed: **11 discovery tests**, **6 hosted-handler tests**. Final validation: **63/63 tests passed**, zero failures/skips (observed local runner duration ~9.28 seconds, not a benchmark). App TypeScript check, full configured Prettier check plus workflow formatting, release guard, generated-page drift and `git diff --check` passed. iOS JavaScript export succeeded: 1,130 modules, 3.1 MB Hermes bundle at `/private/tmp/flavorfinder-architecture-ios`. Metro's measured bundling step was 8.434 seconds in this single run. These are build/test observations, not a measured app startup or frame-rate improvement.

A new native archive, phone test, hosted CI run, Deno check, clean dependency install, fresh registry audit and hosted deployment were not performed. Existing installed dependencies were used. The earlier npm audit snapshot remains explicitly unresolved; no downgrade or new package was introduced.

## Required real-device checks

Use the same final signed build on both tester phones and record build/device/iOS/date/results. Follow `launch/VOTING_DEVICE_RETEST.md`, `AUTH_DEVICE_QA.md` and `ACCESSIBILITY_AUDIT.md`. Add manual→device permission denial/retry and disabled-startup behavior for this branch. AdMob requires applicable regional consent/privacy/no-fill tests and correct test inventory. Use a disposable account for deletion; never use the owner account or real production data for destructive tests.

Provider load/cost checks require fresh before/after counters and categorized forwarded logs. Count blocked attempts separately; request totals are not invoices. Do not generate billable traffic merely to benchmark.
