# Flavor Finder improvements

## Launch preparation — September 30, 2026

- Upgraded incrementally from Expo 53 through 54/55/56 to stable SDK 57 and matched native modules/TypeScript. Updated splash configuration and added the missing native font dependency. Scoped patched UUID override removes the Xcode parser advisory without downgrading Expo.
- Guest discovery and saving no longer require a registered account. Added manual city/ZIP lookup alongside optional device location, with radius filtering for biased search results.
- Replaced device-only password accounts with Supabase integration, email confirmation, recovery-code password reset, profile updates and server-side account deletion with recent password authentication. Legacy local credentials are retired; they are not migrated into cloud accounts.
- Native credentials use keychain chunks with an atomic manifest; failed replacement keeps the previous session intact.
- Added deployment-ready authenticated Places API (New) and deletion Edge Functions. Google credentials stay server-side. Shared database quotas limit forwarded traffic; fields are limited and duplicate detail requests removed.
- Cloud libraries store only place IDs/preferences, with RLS, atomic revision conflicts and cascade deletion. Guest persistence also stores IDs rather than full provider content. Details refresh for display; unavailable data uses explicit placeholders.
- Added Google attribution and author/source links for provider photos/reviews. Review selection is labeled.
- Added EAS build profiles, store configuration guard, iPhone-focused configuration, new vector-derived app icon/splash/favicon, and launch/store/privacy/monetization drafts.
- Added actual PostgreSQL security tests and hosted-handler/session/release regression checks.

External accounts, backend deployment, key rotation, SMTP delivery, policy publishing, live integrations, signing, physical-device/TestFlight checks and App Review remain pending. No purchases, ads, deployments or Git pushes were performed.

## Earlier app foundation

Warm cream/forest-green/terracotta shared design; responsive discovery cards, animated swipes, accessible skip/save actions and undo; persistent filters; saved-place search/sort/removal; loading/error/retry states; deduplicated pagination; stale-response protection; real profile editing and contact/map/share actions. The browser preview uses shared real screens and isolated sample data.
