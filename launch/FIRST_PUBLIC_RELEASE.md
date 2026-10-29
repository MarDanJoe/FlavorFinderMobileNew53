# First public App Store release — October 29, 2026

Status: preparing, not submitted or public. Scope: iPhone, United States, free download, restaurant discovery plus group voting, one live non-personalized banner on Saved. The owner selected live Saved ads and proceeding with the existing individual Apple membership. Preferred draft copyright/contact name: Danny Ambrose. Apple’s verified legal seller/developer name is controlled by membership records and may remain Daniel Leonard Ambrose; do not promise removal of the middle name or substitution of a nickname. No public account identity or legal-policy text has been changed in this preparation.

## Completed evidence

- [x] Build 15 installed and owner-tested.
- [x] Discover header/card/actions visible without whole-page scrolling.
- [x] Six-digit rooms, no duplicate host-name entry, shared tie result and two-place runoff verified by two testers; both reported Sakura and stable card dimensions.
- [x] Two extended Discover idle windows recorded no extra shared attempts; same-session Saved revisits also added zero.
- [x] Sorting changed the top displayed rating to 4.8; one additional shared attempt was observed.
- [x] Room migration and invite page deployed; web download points to the supplied public TestFlight link.
- [x] Public hostname-root app-ads.txt fetched successfully and publisher line matched on October 29. AdMob crawler/account verification is a separate pending check.
- [x] Fixed active-voting viewport committed and backed up on the review branch; CI and iOS export passed. This UI is not yet distributed.
- [x] Structured English listing/reviewer draft prepared in store-metadata.en-US.json. Name/subtitle/promotion/keyword lengths validated. Not uploaded to Apple.

## Gates before public review submission

### 1. Final build and device acceptance

- [ ] Resolve the compatible dependency remediation/reachability review before selecting the binary. Compatible node-forge patch completed and clean-install/export/tests passed. Remaining npm audit: eight affected dependency entries (three high, five low); no forced framework downgrade. See DEPENDENCY_REVIEW.md.
- [ ] Create the next release candidate with the fixed voting viewport; retain current test-ad build settings until live-ad readiness is verified.
- [ ] Test fixed voting layout, modal progress/leave/early-finish controls, loading/error/waiting states, larger text and a compact iPhone.
- [ ] Test app close/reopen/rejoin during voting; verify membership/votes recover and both devices get one shared winner.
- [ ] Test invite link installation/opening on another phone. Do not assume room codes transfer automatically through app installation.
- [ ] On disposable registered accounts, test signup/recovery, two-device library sync, cross-account isolation, wrong-password deletion and successful account deletion. Keep a separate confirmed reviewer account. Never delete the owner's account for QA.
- [ ] Check location denied/manual city, offline/provider failure and VoiceOver paths.

### 2. Live ads and privacy

- [ ] In AdMob, verify app readiness, public-store linking prerequisites, payment verification status, crawler result and the published US-state message's Flavor Finder inclusion. Do not infer account readiness from the public app-ads.txt fetch.
- [ ] Verify consent failure/denial/privacy choices/no-fill on real iPhones; do not click live ads during QA. Test IDs remain the correct way to exercise ad interactions.
- [ ] Inspect final signed native SDK/privacy manifests and reconcile retained provider/SDK data with Apple disclosures. No ATT prompt currently exists; non-personalized ads still process data.
- [ ] Only after these checks, explicitly set the selected public build to live Saved inventory. Current EAS production profile remains test mode. Include ads honestly in age rating, privacy and review information.
- [ ] Verify privacy/support URLs and contact identity, provider/email retention practices, and final acknowledgements/asset provenance. Do not claim 'Data Not Collected.'

### 3. Service capacity and operations

- [ ] Investigate the earlier startup count of 0 -> 41. Later controlled idle windows were stable; the earlier requests remain unattributed. Capture route metrics and concurrent-user isolation before making capacity/cost claims.
- [ ] Agree on a monthly cost allowance, then review shared and per-user enforcement plus Google method quotas. Current backend cap is 300 total attempts/day; separately recorded Google method caps were 100 each. They are not sufficient evidence of capacity for an unrestricted public audience.
- [ ] Establish and test encrypted database backup/restore, incident contact and service availability during review. Git backs up source, not user records.
- [ ] Document guest-identity retention/cleanup and hosted logs/backups. No destructive cleanup job or quota increase is authorized by this plan.

### 4. Apple listing and release

- [ ] Sign back into App Store Connect; inspect current version status rather than relying on historical snapshots.
- [ ] Capture real signed-app screenshots after final layout validation, covering Discover, room setup/voting/results and Saved. Keep Google attribution visible and meet current Apple size requirements.
- [ ] Enter reviewed metadata and copyright preference; verify the actual Apple seller name. Complete current age-rating, app-privacy, export-compliance, content-rights and pricing/US territory fields accurately.
- [ ] Supply reviewer contact and a working confirmed review account in Apple's private fields only; explain two-session voting and keep backend/SMTP available.
- [ ] Select the verified final build and **manual release**. Obtain owner approval of the concrete final submission before sending to review. Approval for preparation is not approval to publish publicly.
- [ ] After Apple approval, make the separate public-release decision. Update invite page to the real App Store download URL, verify installation, and monitor provider requests/errors/ads.

## Evidence and references

Current device measurements: REQUEST_COST_AUDIT.md. Voting evidence and deployment: ROOM_RUNOFFS.md. Prepared layout: FIXED_VOTING_LAYOUT.md. Account QA: AUTH_DEVICE_QA.md. Signed privacy: NATIVE_PRIVACY_MANIFESTS.md and APP_PRIVACY_WORKSHEET.md. Planned ads: ADMOB_SETUP.md. Structured metadata: store-metadata.en-US.json.

Apple primary guidance checked October 29:
- https://developer.apple.com/app-store/submitting/
- https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/
- https://developer.apple.com/support/offering-account-deletion-in-your-app/
- https://developer.apple.com/help/app-store-connect/create-an-app-record/set-your-developer-name/
- https://developer.apple.com/help/account/membership/program-enrollment
