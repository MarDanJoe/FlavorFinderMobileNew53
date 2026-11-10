# App Store submission checkpoint — November 9, 2026

Owner explicitly authorized completing required publishing and submitting for Apple review. Keep manual public release selected. Review submission has NOT been completed.

## Verified and saved in App Store Connect

- Four original iPhone screenshots exist in Media Manager; no duplicate upload needed.
- Guest review instructions saved; Sign-in required is unchecked. Core discovery, local favorites and voting do not need a registered account.
- Manual release selected and persisted.
- Owner-approved third-party Content Rights declaration saved and read back.
- Age questionnaire corrected for advertising, third-party user reviews, infrequent profanity and alcohol references; Apple calculated 13+ (12+ on older OS versions).
- Privacy URL points to the published GitHub Pages policy.
- Privacy drafts now configure Name, Email Address, Other User Content and User ID for linked App Functionality; SDK coarse location, interaction, advertising and diagnostics drafts entered from signed manifest evidence. Device ID remains unset. Privacy is NOT published.

## Remaining blockers

1. Automatic action review rejected saving Device ID as not tracking while the signed Google Ads manifest declares a tracking capability. NPA requests and absence of ATT alone do not establish absence of cross-app measurement. Verify runtime/provider behavior or change implementation before final labels. Do not simply retry the rejected answer or mark tracking true without reconciling permission behavior.
2. Final provider retention/linkage decision for precise coordinates and search text remains open; inspect infrastructure/provider logs rather than treating the absence of application-level history as absence of collection.
3. Build18 uses test ads. The owner requested live ads in the public release. New `app-store` EAS profile extends production and overrides only ad mode to live; existing production/TestFlight profile stays test.
4. Build19 preparation started on Expo, ID `3fb367f4-eff1-4b56-b3e1-28591d99c04c`, native version1.0.0(19). No automatic Apple upload or review submission is scheduled. An earlier auto-upload attempt was rejected by automatic action review while privacy was incomplete; build-only preparation was accepted as the safer alternative. Check this existing build before starting another.
5. After configuration/privacy acceptance, upload and select the accepted binary, replace provisional review notes mentioning build18/test ads, publish accurate privacy answers, resolve Apple's validation, and submit for review. Do not claim Awaiting Review until visibly verified.

Owner was asked whether to retain live ads and finish verification or approve an initial ad-disabled release. Prior preference remains live ads unless the owner changes it.

## Validation

114 tests passed after preparing the separate release profile. Release configuration check passed. Source screen behavior was not changed in this pass. Signed build18 inventory is in BUILD_18_PRIVACY_INVENTORY.md; the raw IPA/JSON remain ignored local evidence.
