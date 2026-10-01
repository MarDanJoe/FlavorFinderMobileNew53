# Reliability review — October 1, 2026

## Findings fixed

1. LibraryProvider retained previous-account data/readiness until its effect ran. A render immediately after switching accounts could expose the old favorites and permit a new callback to mutate the previous store. Published data/readiness now follow the library owner, and mutation checks include the store's owner. Tests explicitly render between the account change and effect execution, attempt writes through both old/new callbacks, and verify sign-out loads only guest storage.
2. A delayed cloud save used the shared Supabase client's current authentication, which could change after the save originated. The storage adapter now verifies the expected account and explicitly binds each read/write to that session's bearer token. A mismatched account fails before RPC; a subsequent account change cannot retarget the prepared write. No bearer tokens are stored in audit documents or logs. Regression tests simulate both timings.
3. An old voting action's error could overwrite the newer session/action's message. Action errors now use the same revision check as successful results. Existing room polling and restoration guards remain in place.

## Reviewed safeguards

Existing tests exercise actual PostgreSQL isolation and optimistic saves; shared API quotas before upstream requests; private room votes, immutable vote retries, late joins, host departure, all-pass and stable ties; secure session storage failure/concurrency; location/filter pagination races; expired-room recovery. Source review confirms hosted functions validate callers with getUser and client saved libraries persist place IDs/preferences rather than provider snapshots.

This review does not certify absence of vulnerabilities or replace physical-device QA. No new live owner account was deleted or emailed, and no hosted schema/security setting was changed. Signed-device cross-account sync/deletion and auth-code expiry/reuse still require dedicated test accounts. See AUTH_DEVICE_QA.md.

## Validation

Four new regression tests cover account boundaries and cloud-save session capture. Final test suite, TypeScript, formatting, release guard and iOS JavaScript export results are recorded in the current checkpoint. Native gestures, VoiceOver, background/foreground behavior and keychain behavior still need real iPhones.
