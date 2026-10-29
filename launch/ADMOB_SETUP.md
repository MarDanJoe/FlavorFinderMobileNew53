# AdMob setup — October 19, 2026

User created Flavor Finder iOS app and Saved list banner. IDs verified from supplied AdMob screenshot, stored as public configuration in src/config/admob.json. iOS app: ca-app-pub-7492972275879789~4427379837. Saved banner: ca-app-pub-7492972275879789/8641037145. One unit is sufficient for the one placement. No rewarded/interstitial/app-open units or room ads introduced.

## Implementation

SDK 17.3.1 matches installed React Native >=0.86 peer constraint. New signed binary required. Web previews use a null component and never import native SDK. iOS only; Android plugin has Google's demo app ID and no enabled placement. SDK measurement is delayed until initialize; UMP consent gathered first. Initialization and consent requests coalesce per process. Consent/setup failure suppresses ads without blocking discovery, saves or voting. A required regional privacy-options entry is exposed in Profile, and existing banners are removed before changes. Non-personalized request option is always used; no user/restaurant/room/location fields supplied. No ATT request added. This is not a claim that all SDK data collection or identifiers are disabled.

Saved shows a labeled fixed banner beneath the list with spacing from content/navigation, only while focused. Failed ad loads collapse the slot; there is no JavaScript refresh loop. The app remains usable when no inventory is available. Default signed and development modes use Google TestIds.BANNER. Live inventory requires EXPO_PUBLIC_ADS_MODE=live and a non-development build. off disables runtime initialization. Do not click live ads during QA.

## Account/store steps still required

Browser-control tools are unavailable in this turn; no AdMob account settings, privacy messages or verification states were changed by the agent.

1. In Flavor Finder's AdMob Privacy & messaging configure applicable consent/US-state privacy messages, use the published privacy URL, and publish messages. Do not enable an IDFA/ATT explainer with the current no-ATT integration. Verify UMP canRequestAds and REQUIRED privacy options behavior on devices.
2. Link the app's public App Store listing when available; an internal TestFlight record is not a public listing. Complete any AdMob app-readiness/ownership checks in the account.
3. Publish the account-specific app-ads.txt at the developer website hostname ROOT, not just /FlavorFinderMobileNew53/. Expected publisher line is prepared below; confirm against AdMob's own personalized snippet. The existing root-site repository had no app-ads.txt. Added the publisher line at its root in commit a1e2d26da08566fc2064f9d5d03afdbc6af18e1f. Pages source confirmed main /; deployment still reports building and public root returned 404 during this deployment. Public/crawler status must still be verified. Do not claim publishing project docs alone satisfies hostname-root discovery.
4. Update final App Store privacy answers, verify new signed privacy manifests, test consent/opt-out/no-fill and label/touch separation before live serving. Revisit launch age/audience settings honestly; a PG content cap is not an age-verification or child-directed determination.

Publisher snippet (confirm in AdMob):

```text
google.com, pub-7492972275879789, DIRECT, f08c47fec0942fa0
```

No live activation or revenue claim in this pass. Public policy updated prospectively for new versions with advertising.

## Dependency audit

npm audit reported 17 high-severity entries, largely propagated through existing Expo/React Native/Metro and node-forge/braces dependency chains (including the new SDK's peer links). Its suggested fix would downgrade Expo 57 to 44 and React Native 0.86 to 0.72; no forced downgrade applied. SDK install adds no separate direct advisory beyond those peer chains. Full report is in ignored temporary local evidence; remediation remains a separate launch review item.

Sources: https://developers.google.com/admob/ios/test-ads ; https://developers.google.com/admob/ios/privacy/data-disclosure ; https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent ; https://support.google.com/admob/answer/9363762 .


## October 29 public-release preparation

Owner selected live Saved-page ads for the first public release. This is the planned configuration, not confirmation that live inventory or AdMob account readiness is active. Current EAS production builds remain pinned to test mode. The public hostname-root app-ads.txt was fetched successfully today and its publisher line matches the configured account. AdMob crawler verification, app readiness/store linking, bank verification and final consent/privacy/device checks are still unverified. See FIRST_PUBLIC_RELEASE.md before changing the release profile.


## October 29 authenticated account check and results placement

TinyFish read-only inspection confirmed Flavor Finder's readiness label is Requires review and App store details is unconfigured. Saved list banner ending /8641037145 exists. The public root app-ads.txt content matches, but account crawler status was not visible. One published and one draft US-state message were visible; inclusion/payment requirement were inspected further in a separate read-only task. No readiness, payment or privacy setting was changed by the initial inspection.

Owner requested another placement. Created exactly one standard Banner unit, Voting results banner, ID ca-app-pub-7492972275879789/6081831146, under the existing Flavor Finder iOS app. Saved unit is unchanged. The prepared client renders it only on finished rooms with a winner, below result/room actions with additional spacing. It is never rendered during active voting, waiting lobbies or all-pass results. It shares the existing consent-gated, coalesced SDK initialization and non-personalized request options. Test mode still uses Google's test unit; missing live configuration or ad failure hides the banner. All 100 tests, TypeScript and formatting pass. Physical-device placement/consent checks and the final signed public configuration remain pending. No new cloud build or live inventory activation occurred here.

Google readiness sequencing: link the public supported-store listing after publication to start review; limited serving may apply before approval. Do not treat missing public store linkage in a not-yet-published app as something a TestFlight URL can solve. Reference: https://support.google.com/admob/answer/10564477 and https://support.google.com/admob/answer/9989980 .


Follow-up read-only account inspection found the published English US-state message associated with two apps, but individual app names/IDs and a privacy-policy URL were not exposed by the inspected views. Earlier owner confirmation of Flavor Finder inclusion and URL entry remains historical evidence; this automated check did not independently reverify it. Do not claim a missing field proves the policy URL is unconfigured.

The generic payment warning remains. The Verification tab displayed Verify your identity with a threshold-based explanatory notice, without an explicit pending/completed result. No bank-verification status was visible. This does not establish the cause of the alert or prove bank verification complete; the account owner must resolve the actual payment-account requirement directly. No financial values/details were collected into repository evidence, and no payment/privacy settings were changed. The additional results-banner native export passed (1,132 modules, 3.1 MB).
