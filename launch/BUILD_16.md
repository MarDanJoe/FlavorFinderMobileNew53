# Build 16 — TestFlight candidate

Requested October 29, 2026. Version 1.0.0 (16), source commit `6a519eb5003ae68607f33e631f227e0e26c8830b` on `codex/architecture-review`.

- EAS build: `27d8aa0b-bb35-4b57-add4-d547125756d4`
- Automatic Apple submission: `06bde9b3-26cc-4774-b711-436261b67b44`
- Build uploaded and IN_PROGRESS at first status check. Submission scheduled after successful build; Apple processing and tester availability are separate checks.
- Test ads remain enabled. No public App Store submission or live inventory activation.

Includes fixed active-voting viewport, consent-gated completed-results banner, authentication modal history cleanup, icon license notices, and tooling security patch. Existing Discover/Saved behavior and backend remain unchanged by this build.

Validation: 108 tests passed; TypeScript, changed-code formatting, release configuration and diff checks passed. Owner confirmed disposable-account deletion and inability to sign in with the deleted credentials on the preceding build; backend retention is not independently verified by that device test.

Device acceptance after installation:

1. Confirm TestFlight shows 1.0.0 (16).
2. Sign in/create a disposable account; verify completed signup/confirmation screens cannot be revealed by downward dismissal. Verify switching Sign in/Create account and Continue exploring do not accumulate sheets.
3. Check active group voting fits without page scrolling, including action buttons, waiting state and room information controls; repeat on smaller screen/larger text where available.
4. Verify Saved and completed-results test banners, and no banner during active voting or lobby. Consent/privacy options must remain usable; an ad failure must not block results.
5. Repeat two-phone same-deck/runoff/winner checks when a second tester is available. Invite-link device test remains pending.

These are candidate acceptance checks, not a declaration of public-release readiness. See FIRST_PUBLIC_RELEASE.md for the remaining launch gates.
