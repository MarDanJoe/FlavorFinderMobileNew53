# Invitation download switch

Prepared November 9, 2026. Public App Store destination: https://apps.apple.com/us/app/id6821721808 . This URL is prepared from the app's Apple ID; public availability has not been verified.

`src/config/distribution.json` retains the working TestFlight URL and has `appStoreLive: false`. The page generator validates both URLs, but only uses the App Store destination when `appStoreLive` is explicitly true. It refuses live activation without an official App Store URL.

Room shares use the existing join.html#room=CODE page and now use wording that works for beta and public installs. The room code stays in the fragment and must be copied or reopened after installation; this does not implement automatic deferred room joining.

After Apple public release:

1. Verify the App Store destination opens the correct downloadable app using a US storefront/device.
2. Set `appStoreLive` to true and run `node scripts/build-invite-page.cjs`.
3. Review generated docs/join.html: Download on the App Store, correct destination, room copy/open behavior intact.
4. Publish only the reviewed generated page/config through the existing GitHub Pages workflow; do not blindly merge unrelated application changes to main.
5. Verify the hosted invite with a six-digit code on both an installed and an uninstalled phone. Return to the original invite after install; room code must remain available.

Rollback: set appStoreLive false, regenerate and republish to restore TestFlight while its invitation remains active.

Preparation itself does not change the hosted beta destination, publish a website update or start a new TestFlight build. Neutral in-app share wording requires the next app binary.
