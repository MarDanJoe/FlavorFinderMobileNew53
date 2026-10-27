# Download-aware room invites — October 27, 2026

The owner approved deployment on October 27. The invite page is published on GitHub Pages; app invite sharing awaits the next TestFlight binary.

Waiting-room Invite Friends now opens the system share sheet with a web link to `https://mardanjoe.github.io/FlavorFinderMobileNew53/join.html#room=CODE`, plus the code and a reminder to join before voting starts. Users can select Messages or another installed sharing app. No messages are sent automatically.

The page displays the validated code, offers copy and explicit app-opening actions, and supports both six-digit and existing long codes. The code stays in the fragment, omitted from hosting requests, and referrer policy is no-referrer. There is no analytics, room lookup, automatic redirect, automatic enrollment or deferred installation deep linking. After installing, recipients return to the page or enter the code manually. Invalid codes cannot produce executable links or markup.

The owner supplied `https://testflight.apple.com/join/NsKqNMrH`. It is configured in `src/config/distribution.json`; the generated page now offers a TestFlight download button. Apple installation and external build eligibility still need a device check; the web reader could not access the TestFlight page. Do not confuse the room code with a TestFlight redemption code.

## Remaining rollout

1. The public link is supplied and configured. Verify an eligible externally approved build is attached to Friends Beta, and keep beta capacity appropriate for the shared 300-request/day backend cap.
2. The invite page has been regenerated with the supplied link. Tests validate official URL destinations and TestFlight button generation.
3. Published only docs/join.html to main/docs in commit d494ebd20664f72359fcfda7f63962e8db204d9f; GitHub Pages reports built and the fetched live file is byte-identical to the reviewed page. App code and backend source were not merged into main. Phone checks for code copying, app opening and installation remain pending.
4. The room migration is deployed and verified. Include invite-message changes in the next TestFlight build; the website is already published.
5. After public App Store release, set appStoreUrl to the real public listing, regenerate/publish the page, and update the beta wording in invite messages. This keeps previously shared web links useful without rebuilding merely to change the download destination.

Validation: all 92 tests passed. TypeScript, formatting, release configuration and diff checks passed. No tester enrollment or public App Store release was performed. Build and Apple processing status must be verified separately.
