# Photo delivery and sorting — October 27, 2026

## Changes in the review branch

Discover and independent group filters offer Recommended, Nearest first, Highest rated and both price directions. Selection persists in existing preferences JSON; no database schema change. Invalid/old preference values normalize to Recommended. A sort change reorders the loaded deck and resets the card index without another Places search. Unknown prices remain last in either direction; ties retain current order. Recommended restores the search order. Each later page is sorted before appending, preserving already-swiped card positions. This is sorting loaded results, not a global ranking of every restaurant in the area. UI explains the page limitation. Room hosts confirm the sorted IDs; participants retain the same frozen deck.

Saved thumbnails request 200px instead of 400px. Discovery/detail cards retain 400px. A component discarded during session lookup stops before starting a photo request. No Image.prefetch, persistent photo cache, CDN mirroring or automatic retries were added.

## Optional photo fast path — enabled for build 14; phone verification pending

The existing photo route gains an optional `delivery=url` query. After the same token/parameter/quota validation, Google is called once with `skipHttpRedirect=true`; the function returns only a validated HTTPS Google image CDN URI with no-store headers. The phone requests image bytes directly from Google's image host instead of relaying them through Supabase. App authorization and publishable-key headers are sent only to the authenticated app endpoint, never attached to the CDN image source. Allowed hosts are Google-owned googleusercontent.com/ggpht.com/gstatic.com subdomains; URLs with credentials/API key query or the server key are rejected. Photo/source attribution UI remains in place. Signed URL freshness is per display; no cross-session cache is introduced.

Existing clients still receive streamed image bytes unless they opt in, so build 13 is compatible with the backend change. `EXPO_PUBLIC_DIRECT_PHOTOS` is false/unset by default and documented in .env.example. Owner approved deployment on October 27. Places version 5 is ACTIVE and downloaded source matches all three tested files byte-for-byte. After owner authorization, the production build profile explicitly enables the public flag for build 14 and pins ads to test mode. Existing build 13 retains its old delivery path. That flag is public behavior configuration, not an authentication secret. One allowed photo call still consumes the existing shared quota; image sizes/direct delivery do not change Google pricing or remove requests.

Owner's architecture-review prompt explicitly requires permission before production deployment. The concrete proposed change is the backward-compatible Places function photo response above, preserving limits/auth and existing response mode. Do not deploy delete-account merely because its local hardening exists on the branch. Save current hosted Places source/version first; roll back the function and leave the client flag off if acceptance fails.

## Verification and limits

Automated fixtures cover ordering, ties/missing prices, persistence normalization, sort-only no-search, pagination preserving consumed cards, host summary/confirmed settings, thumbnail width, removed-image cancellation, direct CDN source with no app headers, one provider call, quota enforcement, unsafe URL rejection and compatibility for older streamed-photo clients. No real Google calls were generated to benchmark this work. Deno is unavailable locally; mocked handler execution is not a hosted deployment/type check. App tsc, full tests, formatting, export and CI results are recorded in TESTING.md/checkpoints as completed.

Real-device acceptance still required: loaded-card image latency/size/quality, Saved/details return paths, weak network/failure states, source links, independent host sorts/same participant deck, and before/after categorized provider counters. No measured millisecond/percentage speedup is claimed. Small thumbnails may look softer on high-density displays; assess before shipping.

References checked October 27:
- https://developers.google.com/maps/documentation/places/web-service/place-photos — official JSON photoUri/skipHttpRedirect path and size behavior.
- https://developers.google.com/maps/documentation/places/web-service/policies — caching and attribution boundaries.
- https://reactnative.dev/docs/image — prefetch downloads into disk cache; not used here.


## October 27 production deployment evidence

Owner explicitly approved deploying the compatible photo backend. Official Supabase CLI 2.122.0 login completed; deployed **only places** with API bundling and the existing platform verify_jwt=false configuration. Handler Auth.getUser checks remain. No SQL, secrets, caps, AdMob settings, delete-account function or EAS settings were changed.

- Deployed revision: Places version **5**, ACTIVE; bundle hash `58ab5cc5341b806abec9a4c8ba7fdc16bae4618972820580832b0bdf6e587fb9`.
- Downloaded post-deploy index.ts/provider.ts/_shared/auth.ts are byte-identical to tested source at commit 5455898.
- Public health returned 200 `{ok:true}`. Unauthenticated normal search and delivery=url photo requests both returned 401, all with Cache-Control no-store. These checks made no Google calls.
- Before-deploy hosted source matched prior reviewed implementation after local-import inlining. Original single-file SHA256: `a318f027546e4d554022255758d69f3a08e867a1f60aa015e91c46db4992fd71`.
- Rollback copy retained outside Git under `verification/deployments/places-20261027-before/`; temporary complete CLI layout is `/private/tmp/flavor-places-before-20261027/`. Git source at aad2acf provides the prior reviewed implementation too.
- Authenticated real-photo/CDN and iPhone latency tests remain pending; no anonymous test account or paid provider call was created merely for this deployment check. Existing build13 continues using the stream response. Client direct-photo flag remains off/unset until a subsequent testing build is configured.


## Build 14 preparation

Owner authorized the next testing binary after backend verification. Commit670314f sets production-profile EXPO_PUBLIC_DIRECT_PHOTOS=true and EXPO_PUBLIC_ADS_MODE=test; no server credential is bundled. EAS build88bf138f-70e8-40c0-944a-eb4718c3e86b uploaded and submission9a1fe9cd-a584-450f-90e1-fae634f54ef5 scheduled. Processing/testing status must be checked separately. Clean iOS JS export with the same flags succeeded and includes the direct-request marker. Use --clear when validating public-env flag changes locally; the initial warm export retained the prior transform. No actual photo-latency claim is made until phone acceptance.
