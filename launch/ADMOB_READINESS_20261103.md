# AdMob readiness — November 3, 2026

Owner reports bank method verification completed. Read-only signed-in browser checks made no setting changes.

Observed:
- Flavor Finder iOS app 4427379837: Requires review. App store details show Add, without a linked listing.
- Policy center reports no current issues.
- Saved list banner /8641037145 and Voting results banner /6081831146 both exist. Source counters beside units are not evidence that units themselves are disabled.
- Published English US-state message editor's app selector has Flavor Finder iOS selected (along with another app). Opt-out is on. No changes were saved or published.
- Privacy URL was not visible in the inspected view. This is unknown, not evidence it is missing. Owner historically entered the published privacy URL.
- Generic AdSense Payments issue banner remains. Inspection did not establish its underlying cause or contradict the owner's bank-verification report.
- Public https://mardanjoe.github.io/app-ads.txt fetched successfully and contains the expected publisher record: google.com, pub-7492972275879789, DIRECT, f08c47fec0942fa0. AdMob crawler/verification status was not visible and remains unknown.

Google's readiness guidance requires a publicly available supported-store listing and linkage for review: https://support.google.com/admob/answer/10564477?hl=en . Do not treat absence of pre-release AdMob approval as a circular requirement preventing initial App Store availability. After the real listing becomes available, link it and complete verification/review.

Remaining: diagnose the payments banner if it persists; verify app-ads crawler status and privacy URL in their applicable views; complete native consent/privacy/device checks and public release requirements. Current build 17 remains test ads. No live inventory activation or public submission performed.
