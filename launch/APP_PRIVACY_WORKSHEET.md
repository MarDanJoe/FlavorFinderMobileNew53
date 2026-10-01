# Apple app privacy worksheet — October 1, 2026

Draft for the current app without advertising, memberships or analytics SDKs. Do not publish these answers until the provider-retention checks and signed-build review below are complete.

Apple requires disclosures for retained data collected by the app and its partners. Optional account creation does not by itself exempt that data. Data used only to service a request in real time may be outside Apple's collection definition, but provider logs and retention must be checked first. Source: https://developer.apple.com/app-store/app-privacy-details/ (reviewed October 1, 2026).

## Source audit and proposed answers

| Data / proposed Apple type | Current behavior | Purpose / linkage | Remaining verification |
| --- | --- | --- | --- |
| Email Address | Supabase account email; Brevo authentication delivery | App Functionality; linked to account | Confirm Brevo retention and open/click tracking configuration |
| Name | Account display name and room nickname | App Functionality; linked to user ID | Confirm final profile fields; room nickname visible to room members |
| User ID | Registered and anonymous Supabase IDs, library ownership, room membership, quota subject | App Functionality; linked to user | Guest IDs are still user identifiers; do not describe them as anonymous for Apple linkage purposes |
| Other User Content | Preferences and saved place IDs; room deck and recorded votes | App Functionality; linked to user | Reconcile Apple's final categories with Product Interaction where applicable; do not omit retained votes |
| Product Interaction | Room voting/progress and request-count buckets | App Functionality; linked where subject ID retained | Review operational logs and email-open events; declare Analytics as a purpose only if actually used for analytics |
| Precise / Coarse Location | Coordinates forwarded to hosted places function and Google to find restaurants; manual city/ZIP query also forwarded | App Functionality; final collection/linkage answer pending | Check Supabase/Google logs, Google terms and retention before deciding whether real-time processing qualifies for exclusion; include both types if both are retained |
| Search History | City/ZIP and restaurant search parameters forwarded for requests | App Functionality; retention/linkage pending | Source does not persist search history in app tables; verify provider logging before declaring exclusion |
| Diagnostics / Other Data Types | Infrastructure may retain request/IP/error metadata | App Functionality; pending provider review | Inventory actual retained fields and their Apple categories; app has no dedicated crash/analytics SDK |
| Customer Support | User may email public support | App Functionality; linkage depends on message | Evaluate Apple's optional support-disclosure criteria against actual support process |

The current application has no ad identifiers, cross-app advertising SDK, purchase history, contacts access, camera/microphone collection or payment flow. This source finding does not establish third-party provider practices. No ATT prompt is implemented; revisit before adding any tracking SDK or data sharing.

## Retention evidence

- Libraries persist only place IDs/preferences and are deleted with the account.
- Voting tables retain session IDs, nicknames and choices. Rooms expire after 24 hours; hourly cleanup removes expired rooms, memberships and votes. Finished aggregate results persist only until cleanup.
- Request buckets expire and are removed during later requests; this is not a scheduled guarantee of immediate deletion. Room attempt buckets also have cleanup.
- Unused anonymous Auth users are not yet cleaned up automatically. Establish a reviewed policy and job before public launch.
- Provider logs/backups and transactional-email retention are not fully verified. Public privacy policy already describes observed email-open events; do not assume tracking is disabled.

## Submission gates

1. Confirm operator legal identity and reconcile the published privacy policy with actual provider retention.
2. Audit Supabase logs/backups, Google data use and Brevo open/click tracking; record the settings and purposes.
3. Inspect the signed native build's privacy manifests and required-reason API declarations for every dependency. A JavaScript export does not verify these.
4. Complete the App Store Connect questionnaire with the above evidence. Stored account data means “Data Not Collected” is inappropriate. Use linkage/purpose answers supported by the final configuration.
5. Review again before adding advertising, subscriptions, analytics or changing providers.

Apple entry instructions: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
Tracking guidance: https://developer.apple.com/app-store/user-privacy-and-data-use/
