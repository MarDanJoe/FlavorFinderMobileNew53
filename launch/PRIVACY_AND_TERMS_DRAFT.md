> Superseded working draft. Review the current app policy in `src/legal/policies.json` and generated pages in `public/legal/`. See `GOOGLE_API_REVIEW.md` for remaining publication and owner review requirements.

# Privacy, terms and support content — owner review required

These are drafts for the initial implementation. Replace owner/contact placeholders, establish retention periods, confirm provider contracts and publish before configuring release URLs. These pages are not deployed.

## Privacy policy draft

Flavor Finder is operated by [OWNER LEGAL NAME]. Contact: [SUPPORT EMAIL]. Effective date: [PUBLICATION DATE].

Flavor Finder uses the location you permit or the city/ZIP code you enter to request restaurant results. Search coordinates/query are sent through our hosted API to Google Maps Platform. The app does not create a location-history database. Our infrastructure providers may keep technical request/security logs under their retention policies; [CONFIRM LOG DATA AND RETENTION].

Optional accounts use your email, password and display name for authentication, recovery and profile display. Supabase processes authentication; passwords are handled by the authentication provider, not stored as plaintext by the app. Native sessions are stored in the device keychain. Browser sessions use browser storage.

For registered accounts, we store saved Google place IDs and discovery preferences in an access-controlled Supabase database for synchronization. Guest favorites/preferences stay on the device; an anonymous authentication session is used to secure restaurant requests and voting-room membership. Restaurant records, reviews and photo references are refreshed for display and are not intentionally stored in our favorites database.

Group voting rooms store a room code, host/member authentication IDs, chosen restaurant IDs, nicknames, votes, and the final restaurant tally. Anyone with a room code can join before voting starts, up to the room limit. Members see nicknames and completion progress; individual likes/passes are available only to their voter through the app API. After voting, members can see aggregate likes and the shared winner. Keep invitation codes within your intended group. Groups with very few members may infer individual preferences from the final totals. Room data is inaccessible after 24 hours and scheduled for deletion by an hourly cleanup, normally within 25 hours of creation. Scheduling delays or project pauses can delay physical deletion. Backups and technical logs follow separately disclosed retention periods. Account deletion removes the user's room memberships and votes, and rooms they hosted; aggregate results in other hosts' completed rooms remain until room cleanup.

Google Maps Platform provides restaurant data and processes API requests. See https://policies.google.com/privacy and https://cloud.google.com/maps-platform/terms . Supabase provides authentication/database/API hosting; see https://supabase.com/privacy . [ADD SMTP PROVIDER AND ANY OTHER ACTUAL PROVIDERS].

Use Profile → Delete account to initiate permanent deletion of your account and associated synced library. Reauthentication is required. [SPECIFY BACKUP EXPIRY, OPERATIONAL LOG RETENTION AND ANY LEGALLY REQUIRED RETENTION]. Guest saves can be removed individually or by clearing app data. Contact [SUPPORT EMAIL] for privacy requests.

The initial version includes no advertising, purchases, cross-app tracking or advertising identifiers. If these practices change, we will update this policy and any required permissions/declarations before introducing them.

[COMPLETE AGE/CHILDREN POLICY, USER RIGHTS BY LAUNCH REGION, INTERNATIONAL TRANSFERS AND SECURITY CONTACT USING ACTUAL OPERATIONS.]

## Terms draft

Flavor Finder helps users discover restaurants and coordinate group dining votes. Most likes wins; tied leaders receive a random pick, and a room with no likes has no winner. The host can finish voting early. Leaving an unfinished room excludes those votes. Provider information can change; contact the restaurant to confirm hours, pricing, dietary needs and availability. Users are responsible for their own dining decisions. Accounts must use an email address you control; protect your credentials. Do not abuse the API, scrape provider data or attempt to access another user's account.

Google Maps data is subject to Google Maps Platform terms at https://cloud.google.com/maps-platform/terms and Google privacy policy at https://policies.google.com/privacy . Flavor Finder is not affiliated with or endorsed by listed restaurants.

[OWNER LEGAL NAME] operates the service. [COMPLETE APPLICABLE LAW, DISPUTES, SERVICE CHANGES, LIABILITY, CONTACT AND EFFECTIVE DATE FOR YOUR LAUNCH MARKETS.]

## Support page draft

Need help discovering or saving a restaurant? Contact [SUPPORT EMAIL]. Include your app version, iOS version, what happened and the steps leading to the issue. Never send a password or payment credential.

Try another city if location is unavailable. Check your internet connection if restaurant information cannot refresh. For account recovery, use Forgot password on the sign-in screen. To delete an account, use Profile → Delete account.
