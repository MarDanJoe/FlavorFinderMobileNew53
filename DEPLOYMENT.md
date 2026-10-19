# Build, deployment and recovery

## Environments and credentials

See `.env.example`, `scripts/release-config.cjs`, `app.config.cjs` and `eas.json`. Node >=22.13, Expo 57 and configured EAS cloud build image are the current stack. Public app values: Supabase URL/publishable key, hosted Places URL, legal URLs, project UUID and owned iOS bundle ID. Google Places and Supabase service-role credentials stay server-side; Apple/Expo credentials stay in approved account storage. Never copy `.env.local` wholesale or commit database exports/signing files.

The real iOS identifier is `com.mardanjoe.flavorfinder`; App Store record is `6821721808`. Source builds are not store releases. Inspect existing EAS jobs before requesting a new paid/queued build. Build 12 was in progress in the prior checkpoint and was not refreshed by this architecture audit.

## Safe source changes

Review branch `codex/architecture-review` starts at clean `2e38035`. `main` is the pre-review checkpoint. Run TESTING.md checks and inspect `git diff` before commits. Commit targeted files, never indiscriminate ignored configuration. Push a review branch for backup/review; do not merge or publish release changes implicitly.

The quality workflow is source code only until pushed. It has read-only repository permissions, pinned actions, no secrets, no Pages/EAS/Supabase deployment. GitHub hosting/runner billing and branch-protection settings are not changed by this file.

## Authorized native release procedure

After owner approval of the tested diff: build with the existing production EAS profile, inspect native compilation and submission results, await Apple processing, assign existing internal tester group, and test the final binary. Reinventory privacy manifests when dependencies change. Public Apple submission and live ad activation are separate decisions. Use manual App Store release initially.

Ad mode defaults to test; live needs explicit `EXPO_PUBLIC_ADS_MODE=live` and a nondevelopment build. No remote ad enablement is performed by this review. Google bank verification, app readiness and crawler verification remain account tasks.

## Authorized backend change procedure

No handler from this review has been deployed. The deletion hardening changes local source only. For a future approved deployment, validate/test the handler and preserve current deployed revision before publishing. Schema/RPC changes need additive migration, compatibility tests, backup, staged rehearsal and explicit production approval. Never edit a previously applied migration to pretend it changes hosted state.

Room/Places operations authenticate server-side even with platform `verify_jwt=false`. Preserve RLS, empty security-definer search paths, service-only administrative RPCs and absence of privileged client keys. Use current deployment tooling instructions from the provider before executing an actual deployment.

## Rollback and recovery

- Source: retain baseline and separate commits. To inspect the old app, switch to `main` only with a clean working tree. Do not use reset/clean to discard work. Selective reverts or cherry-picks preserve history.
- Installed binary: source branch switching does not alter TestFlight phones. Build/reassign a validated known revision if needed; an Apple-distributed native change needs a new build.
- Hosted functions: restore approved prior source/config after compatibility review. A Git revert does not roll back a deployed function automatically.
- Database: there is no demonstrated restore drill. Establish encrypted export, separate access/retention, isolated restore and measured recovery objectives before public launch. Restore never occurs against production without explicit approval. Source Git and room cleanup are not backups.

## Operational acceptance

Define recovery contact, health/alert checks, quota dashboards and provider/email outage steps. Keep 100/day beta cap until an approved capacity/cost change; the budget email is not a hard spend cap. Record unknowns rather than presenting old checkpoints as live account status. Current detailed launch gates: `launch/LAUNCH_CHECKLIST.md` and IMPROVEMENT_ROADMAP.md.
