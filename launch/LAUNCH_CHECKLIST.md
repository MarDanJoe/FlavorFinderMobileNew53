# Flavor Finder release checklist

This is a working launch checklist, not a certification that the app is ready. Expo and Supabase accounts are connected; the database migration, guest authentication, and both backend functions are deployed. Remaining external setup is listed below. The first release is iPhone focused.

## Owner setup — use accounts you own

1. Free Expo and Supabase accounts are created and connected. Supabase project: enable email confirmation and anonymous sign-ins; set a minimum password length of 8 and enable compromised-password protection if available on the chosen plan. Anonymous accounts are for guest restaurant requests, not saved-place cloud sync.
2. Enroll in Apple Developer ($99 USD/year, regional pricing varies). Choose individual vs organization before enrolling; this affects the seller identity customers see. For an organization, check Apple's enrollment documentation and D-U-N-S requirements.
3. Create/confirm Google Cloud billing, enable **Places API (New)**, rotate the old exposed key, restrict the replacement to Places API. Set project quotas and budget alerts before public testing. Alerts are notifications, not spending caps. Verify whether your cloud hosting supports stable egress before adding IP restrictions.
4. Set up transactional email (SMTP). Supabase's default sender is unsuitable for a public launch; configure a sender/domain and test delivery to multiple email providers. Confirm free-tier limits before choosing a provider.
5. Create a public support contact. Finalize and publish privacy/terms/support pages. Free static hosting can avoid a hosting subscription; a custom domain is optional.

## Deploy backend

Initial deployment completed through the Supabase dashboard on September 30, 2026. Live checks: health 200; unauthenticated restaurant/deletion requests 401; guest sign-in succeeded; guest deletion 403; guest library reads returned no rows; guest saves rejected. The replacement Google key is installed; a live search returned 20 restaurants. Email template editing currently requires custom SMTP in the dashboard. Owner-confirmed email confirmation, recovery and password sign-in passed. Registered-user cross-device sync/deletion still need signed-device verification.

For future CLI deployments, install the Supabase CLI and sign in locally. Never share your service-role key in chat or bundle it in the app.

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set GOOGLE_PLACES_API_KEY=YOUR_ROTATED_SERVER_KEY GOOGLE_DAILY_REQUEST_LIMIT=100
supabase functions deploy places
supabase functions deploy delete-account
```

The supplied functions explicitly verify every caller with Auth; platform `verify_jwt=false` does not make restaurant data or deletion public. Only health is public. Row-level security isolates saved IDs/preferences. Quotas are atomic and shared across function instances. The global default of 100 forwarded requests/day includes photos; it limits traffic, not dollar cost. Lower it for a small private beta and also set Google-side quotas. No shared app secret is used as authentication.

Branded confirmation/recovery templates and in-app signup code verification are implemented. Brevo SMTP is saved and both hosted templates are deployed. The sender is verified, and confirmation email delivery to the owner's Gmail inbox passed with both provider logs and owner confirmation. The owner also confirmed that the received confirmation email does not show their home address. Confirmation code entry and sign-out passed in the real app. Recovery email delivery passed in provider logs, and the owner completed password recovery successfully. The owner also confirmed successful sign-in with the new password. Invalid/reused code checks and another mailbox provider still need testing. See [email setup](EMAIL_SETUP.md).

Configure recovery emails to show `{{ .Token }}` as a code. The app uses `verifyOtp` with recovery type, then changes the password. The prepared confirmation template shows a code that users enter in the app; link-based templates require a working confirmation URL. Set site/redirect URLs for the published support site or an approved app callback; test confirmation end to end before release. Do not disable confirmation just to pass a test.

Schedule deletion of expired, unused anonymous accounts using a server-side administrative job, and establish a backup/restore plan for registered-user libraries. Free projects can pause when inactive; verify plan suitability before a public launch.

## Configure EAS

```sh
npx eas-cli login
npx eas-cli init
```

Choose an owned bundle identifier once; the development fallback is not a store identity. Set EAS environment variables from `.env.example` for preview and production. Set `EAS_PROJECT_ID` to the UUID from `eas init`. Google/server credentials belong only in Supabase secrets. Remove any local Places URL override when using the hosted function.

```sh
npm run typecheck
npm test
npm run format:check
npm run release:check
npx expo-doctor
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

The build profiles pin `macos-tahoe-26.5-xcode-26.6`, documented for SDK 57 on September 30, 2026. Recheck availability when building. Uploading is not submitting for public review. Set the App Store Connect app ID for repeat submissions once it exists.

## Live integration gates

- Real Google data loads near a phone and a manually selected city; location denial does not lock out discovery.
- Guest browsing/save/restart works. Guest favorites stay on that device and are not automatically assigned to a new account.
- Signup confirmation, login, refresh, sign-out, email recovery and name editing work with real SMTP.
- Two accounts cannot read/write each other's library, even with direct API calls.
- Two devices sync favorites; stale writes fail instead of silently overwriting another device. Reload before retrying a conflict.
- Account deletion requires recent password authentication; wrong-password deletion fails. Deleting removes Auth user and the library; old credentials cannot regain access.
- Restaurant endpoint rejects invalid/missing tokens, invalid parameters, excessive requests and upstream failures without leaking keys.
- Verify source/author attribution for Google photos and reviews on all screens.
- No credentials, coordinates, email addresses or password contents are written to application logs. Review hosted-provider retention separately.

## Device/TestFlight gates

Test smaller/larger iPhones, supported iOS versions, VoiceOver, larger text, safe areas, keyboard, swipe cancellation, slow/no internet, location denial, empty results, 100 saved-place limit and sign-out during saves. Record devices, OS versions and failures. A JS export does not replace a signed native build or physical-device testing.

Start with 5–10 testers. Fix crashes and broken core flows before expanding. Verify all store assets depict production behavior. Document backend availability, escalation contact and monitoring checks. Set Google cost alert recipients and a backend outage playbook.

## App Store Connect

Create record; confirm name availability; upload real-device screenshots; complete metadata, age-rating questionnaire, privacy disclosures, encryption/export questions, support and privacy URLs; provide working reviewer credentials and detailed notes. Review generated privacy manifests and required-reason APIs from all native dependencies. Do not guess privacy labels: reconcile them with actual auth, location, provider logging and any later monetization SDKs.

Use manual release initially so approval does not publish unexpectedly. Submission and payment require your Apple account setup; these have not been performed.

## Voting-room launch gates

- [x] Room migrations deployed; live rooms verified with three independent sessions.
- Test shared links on physical iPhones, late join rejection, app restart, connection loss and host early finish.
- Test anonymous-to-registered session changes during a room; explain that membership belongs to the original session.
- [x] Hourly cleanup scheduled for expired rooms and attempts; manual invocation succeeds. Privacy draft covers room data/sharing and retention. Unused anonymous Auth-user cleanup and provider retention review remain pending.
- Verify participant limits, daily creation limits, private individual votes and consistent tie results.
- Group detail/photo loads count toward the shared restaurant quota; tune limits after measuring beta use.

### Verification evidence — September 30, 2026

`verification/live-rooms-results.json` records successful checks against the deployed project using three independent guest sessions and real Google place IDs. Tests cover private votes, direct-table rejection, concurrent tie completion, all-pass results, leaving, and early finish. The hourly cleanup job is active and its function was manually invoked successfully; cascading deletion and retention boundaries are tested in PostgreSQL.

The Codex in-app browser currently blocks direct access to the Supabase API (`ERR_BLOCKED_BY_CLIENT`), so live UI connection/restart testing in that browser could not be completed. Do not treat this as a successful browser integration check. Physical iPhone/TestFlight testing remains pending Apple enrollment/signing.

## Privacy and Google attribution review

Privacy, terms and support are implemented in the app and generated as standalone pages from the same content source. Owner-supplied support email, US launch scope and observed provider behavior are included. The official Google Maps logo, provider credits, photo source links and review visit dates are handled. The updated restaurant backend passed a live check. Approved privacy/terms/support pages are published at https://mardanjoe.github.io/FlavorFinderMobileNew53/. Local and EAS cloud release URLs are configured. Operator identity/retention confirmation, old Google key retirement and physical-device attribution QA remain required. See [Google review](GOOGLE_API_REVIEW.md).

## Verification update — October 1, 2026

- Google confirmed daily limits of 100 each for the four used Places API New methods; the separate backend limit remains 100 total forwarded requests/day. The $5 budget only sends alerts. Old key retirement remains pending identification of other consumers.
- Nine public settings saved for EAS development, preview and production. No Google or privileged Supabase credentials uploaded. Proposed bundle identifier still requires Apple registration.
- Room restoration preserves membership on connection failures, allows retry, removes expired/removed membership and protects a different account’s storage. Four recovery regression tests added.
- 36 automated tests, TypeScript and formatting pass. Live checks passed against hosted Google/Supabase with three sessions: privacy/isolation, immutable retry, late join, concurrent stable tie, all-pass, early finish and host departure. This does not replace signed-device UI QA.
- Store listing/reviewer steps updated for group voting; privacy worksheet prepared in APP_PRIVACY_WORKSHEET.md. Final declarations remain pending provider-retention and native-manifest review.
- Apple membership/payment pending. Mac updated to 15.8.1; local Xcode 16.2 still does not support the required native toolchain.

## Accessibility and asset audit — October 1, 2026

Shared secondary/accent text now has measured contrast of at least 4.74:1 against the three light theme surfaces. Selected small controls have 48-point targets, and discovery/filter/location/room semantics were improved. TypeScript and 36 tests pass. See ACCESSIBILITY_AUDIT.md for source changes and pending physical-device checks. ASSET_AUDIT.md records font/icon/provider evidence and unresolved legacy-image/branding provenance; these assets are not all cleared for launch.
