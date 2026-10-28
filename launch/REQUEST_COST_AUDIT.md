# Request cost audit — October 11, 2026

The hosted daily bucket showed 110 attempts today against a 100-total-forwarded-request limit. Attempts rejected after exhaustion increment the counter; the count is not an invoice or a count of 110 successful Google calls. No per-route historical totals are stored in that table. Supabase's last-24-hour function log aggregation returned no results, so a historical photo/details/search split is unavailable from the current evidence.

Google Billing overview showed $0.00 total for October 1–11. Google warns reporting can take longer than 24 hours. This is a provisional displayed balance, not proof today's final charges are zero. The $5 budget alert is not a spending cutoff. Daily limits remain unchanged.

## Code changes

- Load saved place IDs/preferences at startup without requesting provider details. Resolve the list when Saved is first opened for that account; reopening the tab does not reload the library. Explicit retry/account changes can refresh it.
- Share identical in-flight basic/full detail requests. Remove the pending entry on success or failure; a later request is fresh. No persistent provider-content cache is added.
- Keep Saved's initial/render window small instead of rendering the default ten image rows immediately.
- Pass the host's existing discovery cards through the active in-memory navigation flow into the room. Shared room data and invitations still contain place IDs only. This avoids duplicate host detail calls; joining friends and app-restored rooms still fetch their cards.
- Explain the shared daily quota exhaustion and display its reset time in the device's local time.

Only place IDs and preferences are persisted. Google attribution stays visible. Existing active-screen card objects are reused, not uploaded to the database. No quota, credential, paid plan, monthly budget or database schema was changed.

## Deterministic request model, not measured billing

Seven saved places previously meant seven detail calls at startup; now startup means zero. Opening Saved still resolves those seven places and visible rows can load photos.

Browsing 20 distinct cards typically needs one search plus up to 20 photos: 21 Google calls. Saving a currently loaded card writes IDs to storage and does not need another Places call.

A 20-card room host used to request up to 20 basic details again; with the active discovery deck it needs zero duplicate details. Photos can still load for voting cards. Each joining friend can need 20 basic details plus 20 photos; room polling, votes and tally are Supabase operations, not Places calls.

These changes reduce waste but do not make the photo-heavy experience cheap at scale. Native request measurements are still needed; do not extrapolate revenue or approve expanded beta capacity from these models alone.

## Price classification

Provider fields matter. Current search requests include rating/price/hours, triggering Nearby/Text Search Enterprise ($35/1000 after 1000 monthly free calls per SKU). Basic details include rating/price, triggering Place Details Enterprise ($20/1000 after 1000 free). Full details include reviews, triggering Enterprise + Atmosphere ($25/1000 after 1000 free). Photos are $7/1000 after 1000 free. Earlier $17/1000 basic-detail estimate did not account for rating fields and is superseded.

Sources: https://developers.google.com/maps/billing-and-pricing/pricing ; https://developers.google.com/maps/documentation/places/web-service/place-details ; https://developers.google.com/maps/documentation/places/web-service/policies . Rates verified October 11; billing-account usage/free allowances still need verification before financial planning.

## Next native measurement

After the UTC daily reset, test one controlled session per tester: cold start, 20 cards, save three, open Saved, create/join a short room, vote and finish. Record UTC start/end and use hosted logs/provider metrics after their reporting delay. Compare cold-start and host-detail counts with the previous model. Do not repeatedly refresh when quota is exhausted.

Before widening beta, implement reliable category counts for forwarded versus blocked requests and a conservative backend budget policy. Decide a dollar allowance explicitly; today's aggregate daily counter and $5 email alert are insufficient as a monthly spending guard.

## October 12 solo-test follow-up

Read-only measurement at 2026-10-12 15:24:07 UTC (11:24 a.m. Eastern): day:20261012 count 54, expiry 2026-10-13 00:00 UTC. This leaves 46 under the unchanged shared cap, but is not an exact solo-test delta: no starting snapshot was recorded, and the counter is shared. The owner reported only the prescribed test actions (10 swipes, two hearts, one cuisine change, Saved/details/restart checks). The recent per-route log query returned no category breakdown. Do not convert 54 into a specific dollar charge.

A further code audit found discovery could search before persisted preferences finished loading, then again after the saved cuisine was restored. Same-account Saved hydration also reset preferences to defaults while loading, which could trigger more searches. Added account-scoped search readiness, gated the first search until preferences load, retained preferences during same-account hydration, and kept the discovery card mounted during that refresh. Regression tests cover the initial search gate and hydration without resetting the cuisine. Tacos is a remembered selection; the default remains All flavors. Exact savings from this follow-up still require a before/after measurement on the updated native build.

### October 12 controlled Discover test — build 8

Read-only shared daily counter: 71 at 16:18:26 UTC (12:18 p.m. Eastern), then 78 at 16:27:57 UTC (12:27 p.m. Eastern). Increase: 7 requests during the test window. Owner reported completion of the prescribed five swipes and two hearts, staying on Discover without filters, refresh, Saved, details or voting. This is a shared-counter delta; attribution assumes no concurrent users. No per-route breakdown or actual charge is established. It does not establish scaling economics or quantify savings relative to an equivalent older-build test. Daily cap remains 100. Screenshots in ignored verification directory preserve both readings.

### October 12 Saved phase

Owner reported opening Saved once and finishing. Shared counter rose from 78 at 16:27:57 UTC to 110 at 16:41:19 UTC (12:41 p.m. Eastern): 32 attempts in the window. Counter includes rejected attempts; daily limit 100 means this is not 32 billable Google requests. Concurrent usage, app relaunch, number of favorites, and individual request types are unverified. Daily cap exhausted; pause live provider testing until reset at 8 p.m. Eastern. Investigate Saved detail hydration and photo requests before attributing the increase to a specific cause. Screenshot verification/quota-oct12-saved-110.png.

Saved follow-up implementation: load three saved places initially and three more per explicit Load more action. Reuse existing details held in the current account session; persist only IDs/preferences. Keep the list mounted while loading additional rows to avoid remounting existing photos. Search/rating sort apply to loaded rows, with search placeholder stating that scope. Account changes reset the batch size and do not reuse another account's details. Local regression verifies seven IDs yield only three initial detail requests and the next batch fetches only the next three. Native request savings pending a new TestFlight build.

### October 13 build 10 controlled Discover test

Baseline 0 at 16:08:15 UTC; post-test 7 at 16:12:02 UTC (12:12 p.m. Eastern). Owner completed five swipes/two hearts. Function logs show exactly seven places_usage_v1 entries during 12:10:51–12:11:08 Eastern: one search and six photos, all forwarded with upstream/response status 200. No details or blocked entries in this observed window. Shared counter attribution assumes other testers stayed closed. This is a request measurement, not an invoice or proof of scale sustainability. Next: Saved initial three rows, no Load more; note whether app was resumed or cold-started. Starting count 7.

October 13 Saved phase: counter 7 -> 15 at 16:14:52 UTC, +8. Logs confirm one search at 12:13:59 Eastern, one photo at 12:14:02, then three basic detail requests at 12:14:07 and three photos at 12:14:08–09; all forwarded/upstream/status 200. Owner opened Saved and did not Load more or open any row. Six calls are consistent with the three Saved rows; preceding search/photo are consistent with opening on Discover, an inference from timing. No automatic hydration of all 13 saved rows observed. Next test: keep app running, switch away/back to Saved without force quitting, no refresh/Load more/details, baseline 15; inspect whether existing details are reused and whether photos repeat. Do not promise zero calls because image remounts can request photos again.

October 13 repeat-visit phase: owner reports completed Profile/Saved switch; daily count 15 -> 23 at 16:17:27 UTC (+8). Latest logs explicitly show three basic details at 12:16:47 Eastern and three photos at 12:16:54, all forwarded/status 200. Two other entries not yet classified. Repeat detail calls are confirmed; whether runtime/account restarted or library reloaded is not established. Clarify whether reopening landed on Discover before concluding a same-session reuse defect. Do not claim repeat-visit zero requests or savings.

October 13 clarification and confirmed same-session revisit: owner had force-quit between earlier phases, so +8 repeat measurement is not a same-session reuse failure. Owner then left app running on Saved, switched Saved -> Profile -> Saved and waited. Baseline 23 at 16:21:01 UTC; after 23 at 16:21:53 UTC: zero additional shared-counter attempts. Current-session reuse passes this physical-device scenario. Cold starts still fetch fresh provider data; do not extrapolate zero calls across app restarts. Next: test one Load more batch without closing app, baseline 23.

October 13 Load more phase: owner loaded next three without opening rows or closing app. Counter 23 -> 29 at 16:23:16 UTC (+6). Category logs not yet verified: function Logs view retained old results after refresh; reload timed out and shows Taking longer than expected. Six calls match the expected three basic details plus three photos, but that breakdown remains an inference until logs recover. Do not claim a confirmed no-duplicate breakdown for this phase. Same-session tab revisit remains verified zero calls. Next priority: recover logs for batch classification; two-person voting when available, followed by individual full-detail measurement.

## October 28 — build 15 cold start and idle observation

Owner confirmed TestFlight build 15. Shared day:20261028 baseline was 0 at 13:12:53 UTC. Owner opened Discover, waited for the first restaurant/photo, and reported no swipes or other actions. Counter was 12 at 13:15:47 UTC. Owner confirmed the logo, card and action buttons are visible without page scrolling.

Requested an additional untouched idle period; after the owner reported completion, the counter was 41 at 13:22:15 UTC (+29 since the prior snapshot). The actual measurement window spans about six minutes, not precisely the requested 30 seconds. This is a shared attempt counter and does not establish successful/billable Google calls or attribution to this phone. Other testers/browser activity remains unconfirmed; per-route log evidence is not yet available. Paused further provider testing and asked the owner to fully close the app and identify concurrent use. Do not increase the cap or declare an idle loop fixed without evidence. Counter snapshots are saved under ignored verification/build15-*-20261028.json.

Extended idle clarification: the owner kept the app open on the first card without touching it, rather than closing it. The next reading at 13:32:01 UTC remained 41, unchanged from 13:22:15 UTC (about 9 minutes 46 seconds). This observed window produced zero additional shared-counter attempts; it does not support a continuously running idle-request loop. The earlier +29 remains unattributed and is not an invoice. Concurrent usage and route breakdown remain unconfirmed.

Build 15 controlled swipe phase: baseline 41 at 13:32:01 UTC, post-test 48 at 13:33:29 UTC (+7). Owner reported completing the prescribed five passes and two hearts without other requested navigation. This is consistent with one photo load per newly exposed card, but route logs and independent confirmation of no other users are absent; do not claim seven verified photo requests or billable charges. Card/control stability was requested but not explicitly confirmed. Next phase is initial Saved view without force quitting or loading more, starting from 48.

Build 15 post-swipe idle verification: owner clarified Saved had not been opened and Discover remained untouched. At 13:43:29 UTC, the shared count remained 48, unchanged from 13:33:29 UTC: zero additional attempts over ten minutes. Saved phase is still pending, baseline 48.

Build 15 initial Saved phase: owner opened Saved without selecting a restaurant or loading more and waited about 15 seconds. Shared counter was 52 at 13:44:43 UTC, up four from 48 at 13:43:29 UTC. This is four attempts during the window; route categories, success/billing status and isolation from other testers are not independently established. Next: same-session Saved -> Profile -> Saved without force quitting, baseline 52.

Build 15 same-session Saved revisit: owner completed Saved -> Profile -> Saved without closing the app. Counter remained 52 at 13:45:26 UTC, unchanged from 13:44:43 UTC: zero additional shared attempts in this observed revisit. Same-session reuse passes this scenario; this does not establish cold-start reuse. Next: select one restaurant from Saved, wait for details/photo, baseline 52.

Build 15 one Saved detail: owner opened one saved restaurant and waited for loading. Shared count increased 52 -> 54 at 13:46:18 UTC (+2), consistent with one full detail request and one photo request, without per-route confirmation. No charge or exclusive-device attribution is established. Next: return to Saved without closing the app, baseline 54; verify list preservation and whether returning adds requests.

Build 15 return from detail to Saved: owner confirmed the titles still look right. Shared count remained 54 at 13:47:08 UTC, unchanged from 13:46:18 UTC: zero additional attempts on the observed return. Next optional isolated phase: one Load more batch, starting at 54, with no restaurant-detail selection or app restart.

Build 15 one Saved Load more batch: owner completed the requested single batch without opening a restaurant. Shared count rose 54 -> 60 at 13:48:01 UTC (+6). The implementation adds three rows per batch; six attempts are consistent with three basic detail requests plus three photos, without per-route confirmation. Controlled sequence after stable baseline 41 totals +19: seven swipes +7, initial Saved +4, same-session revisit +0, one detail +2, return +0, one Load more +6. The earlier startup 0 -> 41 remains unattributed; do not present the later controlled deltas as a diagnosis of startup or proof of billing/cost sustainability. Next device coverage: local sorting without searching, then updated two-phone room/runoff/invite checks.

Build 15 sorting-only phase: owner completed returning to Discover and applying Highest rated without other instructed filter changes. Shared count rose 60 -> 61 at 13:49:05 UTC (+1). A photo for the newly exposed top card is a plausible explanation; the aggregate counter cannot distinguish it from a search or another caller, so the device measurement does not independently prove zero search calls. Hook tests separately verify sorting does not invoke search. Visible ranking correctness remains unconfirmed by owner.

Build 15 sorting follow-up: owner confirmed the top card displayed a high rating of 4.8 after selecting Highest rated. This confirms the observed displayed rating, not a provider-wide ranking audit.
