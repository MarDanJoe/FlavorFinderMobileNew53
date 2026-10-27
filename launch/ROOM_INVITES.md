# Download-aware room invites — October 27, 2026

Prepared on the review branch, not published or in TestFlight yet.

Waiting-room Invite Friends now opens the system share sheet with a web link to `https://mardanjoe.github.io/FlavorFinderMobileNew53/join.html#room=CODE`, plus the code and a reminder to join before voting starts. Users can select Messages or another installed sharing app. No messages are sent automatically.

The page displays the validated code, offers copy and explicit app-opening actions, and supports both six-digit and existing long codes. The code stays in the fragment, omitted from hosting requests, and referrer policy is no-referrer. There is no analytics, room lookup, automatic redirect, automatic enrollment or deferred installation deep linking. After installing, recipients return to the page or enter the code manually. Invalid codes cannot produce executable links or markup.

The owner confirmed there is no public TestFlight link yet. `src/config/distribution.json` deliberately has empty download URLs. Until an official link is supplied, the page explains invitation-only beta access and does not invent a working download button. An approved external build and enabled TestFlight public invitation link are needed for new people to install without individual email invitations. Do not confuse the room code with a TestFlight redemption code.

## Remaining rollout

1. In App Store Connect, select the existing Friends Beta external group, ensure an eligible externally approved build is attached, enable its public link, and copy the official `https://testflight.apple.com/join/...` URL. Keep beta capacity appropriate for the shared 300-request/day backend cap.
2. Set `testFlightUrl` in distribution.json; run `scripts/build-legal-pages.cjs` to regenerate join.html. Tests validate official URL destinations and TestFlight button generation.
3. Publish the reviewed docs/join.html to the existing GitHub Pages main/docs site without unintentionally merging unrelated application/backend changes. Verify the deployed page, code copying, app opening and actual TestFlight installation on a phone that does not have Flavor Finder.
4. Deploy the separately prepared room migration before distributing six-digit room creation. Include invite-message changes in the next TestFlight build only after the website is published.
5. After public App Store release, set appStoreUrl to the real public listing, regenerate/publish the page, and update the beta wording in invite messages. This keeps previously shared web links useful without rebuilding merely to change the download destination.

Validation: the full 90-test suite passed before two additional generator tests were added; all five invite tests pass. TypeScript, formatting and diff checks passed. No hosted configuration, tester enrollment, website deployment or new binary was performed in this change.
