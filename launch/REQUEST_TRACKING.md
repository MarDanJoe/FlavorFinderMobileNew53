# Restaurant request tracking

The Places function emits one JSON `places_usage_v1` entry per authenticated, validated restaurant request. Find these entries in the places function Logs view. Group by `route`, `status` and `forwarded`; compare timestamps over a controlled test window. Logs distinguish search, city lookup, basic details, full details and photos.

`forwarded: false` with status 429 means quota blocked the request before Google. `forwarded: true` means the provider fetch was attempted, not that Google billed it. `upstream_status` is recorded when response headers arrive. Successful streamed photo headers do not guarantee the entire image reached the device. Duration measures handler time until response creation.

No identifiers, search text, location, URLs, headers or keys are logged by this instrumentation. No new database or analytics SDK is installed. Existing infrastructure logging/retention still applies. Health/OPTIONS/invalid/unauthorized requests do not produce these usage entries. Historical requests cannot be reconstructed from the new logs.

Test after deployment and daily reset: capture daily counter and start time; keep other testers closed; run five swipes/two hearts; capture end time/counter. Repeat Saved separately with three initial rows, then Load more once. Compare logs to shared counter deltas; do not turn raw counts into a dollar claim without SKU/free-tier and billing evidence.

Rollback: redeploy the previous Places source from Git. Do not change quota/authentication settings to enable testing.
