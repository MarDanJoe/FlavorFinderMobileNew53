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
