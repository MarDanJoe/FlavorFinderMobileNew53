# Build 17 — location and cuisine candidate

November 3, 2026. Source `b89f9dc` on `codex/architecture-review`. Version 1.0.0 (17).

- EAS build: `2d4dd6a5-b145-4984-b8cd-89bfb7bcc6eb`
- Automatic submission: `483de49c-d9e6-4966-9908-3f9177922ccf`
- Expo build FINISHED without errors at 15:19:07 UTC. Automatic Apple submission is IN_QUEUE, without a reported error, at the final SDK check. Tester availability not yet confirmed.
- Test ads remain enabled; no live inventory activation or public App Store submission.

Includes fresh GPS on device-location refresh, immediate hiding of previous-area cards, and 33 cuisine/food choices plus All flavors in Discover and room filters. 112 tests, TypeScript, formatting and iOS export passed before upload.

Device check: enter two clearly separated cities with a 1-mile radius and verify the resolved location label, nearby results and no old cards while loading. Reselect current location after moving; verify expanded cuisine labels and room filters. Exact reported home-address lookup is not independently confirmed. No home address was collected.

Owner reports AdMob bank verification completed November 3. This does not establish app readiness or policy completion; see the separate readiness check.
