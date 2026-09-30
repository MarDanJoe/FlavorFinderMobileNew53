# Flavor Finder

An Expo SDK 57 / React Native iPhone restaurant discovery app. Discovery, filters, swipes, saved places, optional accounts, profile editing and detail/contact actions share the same code across native and browser previews.

## Current release state

Expo project identity is connected. The Supabase database schema, anonymous guest authentication, and `places`/`delete-account` functions are deployed. Live checks confirmed guest sign-in, unauthenticated request rejection, and guest cloud-save/account-deletion rejection. The replacement Google key is installed and a live restaurant search returned 20 results. Brevo SMTP and hosted email templates are configured; sender verification and confirmation email delivery to the owner’s Gmail inbox passed. Confirmation code verification, sign-out and owner-completed password recovery passed; sign-in with the new password also passed; another mailbox provider remains to test. Apple Developer enrollment and public policy/support URLs still need owner setup. A signed iOS build and physical-device/TestFlight validation are pending. See [launch checklist](launch/LAUNCH_CHECKLIST.md).

No advertisements, purchases or tracking SDKs are included. See [monetization plan](launch/MONETIZATION.md). Store listing and privacy/terms content are drafts under `launch/`.

## Development

Use Node 22.13+ and npm. Copy `.env.example` to ignored `.env.local` and fill in configuration after creating your own accounts.

```sh
npm ci
npm start
```

Use Supabase Auth (email/password, confirmation and recovery) and deployed Supabase Edge Functions for restaurant requests and account deletion. Native session credentials use SecureStore with atomic chunked writes. Guests use anonymous API sessions but keep favorites locally. Registered users sync place IDs/preferences through row-level security and optimistic revision checks; conflicting saves require a reload. Google data is fetched for display rather than persisted as restaurant snapshots. The library currently limits new saves to 100 places; reloads fetch detail data and therefore consume API quota.

The old local-password accounts are retired. Obsolete local credential keys are removed; local passwords are never uploaded as cloud credentials. Historical account-specific libraries are left untouched and are not silently assigned to a new cloud account. Guest saves are separate from signed-in saves.

For local legacy API debugging only:

```sh
npm run places
```

This runs `server/places.cjs` at `127.0.0.1:8082`; its routes differ from the production Places API (New) adapter. Use the deployed function for manual city lookup and production integration tests. A phone cannot use this Mac's `localhost` URL.

## Browser preview

```sh
npm run demo
```

Uses shared screens with isolated sample data. Sample food photos are web-only; native modules resolve `demoData.ts` without those photo assets. Store build profiles force demo mode off and reject missing release configuration. The preview is not an App Review substitute.

## Checks

```sh
npm run typecheck
npm test
npm run format:check
npx expo-doctor
npx expo install --check
npm run release:check
npx expo export --platform ios --platform android --output-dir dist-native
```

Tests include actual PostgreSQL execution of the schema, row-level access, conflict rejection, deletion cascade, shared quotas, mocked hosted handlers, secure-session transaction failures, release configuration, discovery races and library writes. Mocked handlers are not a live Supabase/Google/SMTP integration test. Native exports validate JS bundles, not signed binaries.

`npm run release:check` deliberately fails until real public URLs, client credentials, the bundle identifier and EAS project UUID exist. Set them in EAS preview/production environments before using the profiles in `eas.json`. The native build image is pinned to the documented SDK 57 image with Xcode 26.6.

The Xcode parser's transitive UUID package is overridden to patched 11.1.x. Its CommonJS v4 API is verified with Xcode project generation and native prebuild; revisit this override when upstream removes the outdated dependency.

## Credential handling

The old Google key was previously tracked in Git. Rotate it in Google Cloud even though it is now ignored locally. The replacement belongs in Supabase function secrets. Never put it, a Supabase service-role key or Apple signing secrets in an `EXPO_PUBLIC_` variable or committed file. Public app config contains only the Supabase publishable key and public URLs.

## Group voting rooms

Discover → **Create a voting room** locks in 2–20 restaurant IDs from the host’s current filters. Share a 12-character code or `flavorfinder://room/CODE` link with up to ten people, including guests. Everyone joins before the host starts and receives the same ordered deck. Swipes and accessible buttons submit private, immutable votes; retrying a vote is safe. Active clients refresh progress every four seconds, pause while backgrounded, and resume after reconnection. The server finishes automatically when everyone completes, or the host can finish early. Most likes wins; tied leaders receive one persisted random winner. An all-pass room has no winner. Leaving an unfinished room excludes those votes; a host leaving cancels it. Completed tallies remain frozen.

The room schema and hourly cleanup migrations (`202609300002_rooms.sql` and `202609300003_room_cleanup.sql`) are deployed. Live checks with three separate guest sessions passed privacy, tie consistency, late join rejection, all-pass handling, early finish, and host departure. All room tables have RLS and no direct client grants. The membership-checked RPC exposes only the current user’s votes until completion. Rooms expire after 24 hours; an hourly database job removes expired rooms and cascades their members/votes, normally within 25 hours of creation. Old join-attempt buckets are also cleaned. The job is active and a manual invocation succeeded; delays or project pauses can delay physical removal. Production links currently use the app scheme and require the app installed; universal links await an owned public domain. Account sign-out changes the session identity and clears the displayed room; a guest should finish their room before signing in.

## Email setup status

In-app signup confirmation now accepts the email code, offers resending with a 60-second cooldown, and supports returning to confirmation from sign-in. Recovery asks for a new password twice and clears credential fields after completion. The branded confirmation/recovery HTML templates are in `supabase/templates/`; local config references them. The owner saved Brevo custom SMTP and both hosted templates were deployed on September 30, 2026. The sender is verified, and confirmation delivery passed with provider logs and owner receipt. Confirmation code entry, sign-out, recovery delivery and owner-completed password recovery also passed. The owner also confirmed sign-in with the new password. Another mailbox provider remains to test. See [email setup](launch/EMAIL_SETUP.md) for the temporary no-domain beta option and the production domain requirements.

## Privacy, terms and provider attribution

Profile and account screens expose Privacy, Terms and Support without requiring sign-in. Content is maintained in `src/legal/policies.json`; `npm run legal:build` generates script-free HTML in `public/legal` and `docs`. The approved pages are published on free GitHub Pages: [privacy](https://mardanjoe.github.io/FlavorFinderMobileNew53/privacy.html), [terms](https://mardanjoe.github.io/FlavorFinderMobileNew53/terms.html), and [support](https://mardanjoe.github.io/FlavorFinderMobileNew53/support.html). Public URL variables are set locally; copy them to EAS preview/production environments before cloud builds. Google Places content uses the official Google Maps attribution asset and preserves provider, photo and review credits. See [Google API review](launch/GOOGLE_API_REVIEW.md) for validated behavior and remaining launch requirements.
