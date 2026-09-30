# iPhone testing preparation — September 30, 2026

The app uses Expo SDK 57 and expo-dev-client. Public policy URLs are configured locally. Proposed app identifier: `com.mardanjoe.flavorfinder`; availability and registration still need confirmation with Apple. It has not been registered or signed.

## Free personal-device route

This Mac currently runs macOS 15.2 and Xcode 16.2. Expo’s SDK 57 EAS image uses Xcode 26.6, which requires macOS Tahoe 26.2 or later. Update compatible macOS/Xcode first, back up the Mac, then sign in to Xcode with the owner’s Apple ID and use Personal Team signing. Connect and trust the iPhone, enable Developer Mode, and build locally. The owner must accept any Apple agreements and enter account credentials. Free provisioning expires after seven days; this route is for personal testing, not TestFlight distribution.

## TestFlight route

Enroll in Apple Developer Program ($99/year), confirm/register the app identifier, configure EAS environment variables (local .env.local is not an EAS environment), create a signed production build, then upload to App Store Connect and configure TestFlight. Enrollment/payment and Apple agreements are owner actions. Development internal distribution instead requires registering the physical device before building.

## Device acceptance checks

- Location allowed, declined, and manual city fallback; real restaurant results and photo/source credits.
- Signup code, resend cooldown, sign-in, sign-out, recovery, and account deletion with reauthentication.
- Saved places persist across restart and sync for registered users.
- Two iPhones join the same room; matching deck, private votes, shared tie winner, all-pass result, early finish, and departure behavior.
- Background/resume, interrupted connection, restart restoration, expired room, and shared installed-app link.
- Large text, VoiceOver labels/buttons, safe areas, keyboard handling, and public legal/support links.

Sources: https://docs.expo.dev/build-reference/infrastructure/ ; https://developer.apple.com/xcode/system-requirements ; https://docs.expo.dev/develop/development-builds/introduction/ ; https://developer.apple.com/help/account/basics/about-your-developer-account
