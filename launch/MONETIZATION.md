# A sustainable Flavor Finder

Recommendation: keep core discovery free, validate repeat usage, then test a membership with concrete recurring value. Ads are a possible later channel; ad revenue is not guaranteed and depends on audience, geography, fill rate and placements. No payments, paywall, ad SDK or tracking has been added.

Potential membership features (not built): shared collections, private group dinner voting, trip/date-night planning, and richer organization of favorites. Avoid charging for basic location access or promising advanced features before they exist. Test willingness to pay before choosing a price. An ad-free benefit has no value until the free app actually contains ads.

A future paid release needs StoreKit products, server-verified entitlements, restore purchases, purchase-pending/cancellation/refund handling, subscription disclosures, account deletion and a clear explanation of cancellation. Evaluate Apple regional rules when implementing payment links. Do not store a client boolean as proof of membership. Model revenue after Apple fees, taxes/refunds and API costs. RevenueCat is an optional implementation service; compare current pricing before adopting it.

If testing ads: use clearly separated labeled placements; avoid misleading sponsored restaurant rankings; implement consent/ATT where applicable and update privacy declarations. Paid restaurant partnerships require sales effort and clear labeling, and cannot replace the Google attribution requirements.

Measure without prematurely adding tracking SDKs: registered account counts, backend request counts, service errors, and opt-in tester feedback can validate early usage. Later define consent-aware retention metrics rather than silently collecting locations or cross-app identifiers.

Budget model:
- Apple annual fee / 12 + monthly hosting + email + Google API spend + monitoring = monthly operating cost.
- Contribution per member = membership price minus applicable store fees, taxes/refunds and member-specific costs.
- Break-even members = operating cost / contribution per member, rounded up.

The backend starts with a conservative global daily request quota; actual Google billable SKUs vary by requested fields. Fetching saved-place details and photos adds requests. Restrict unnecessary detail fields and avoid duplicate details calls. Establish per-SKU Google quotas, not only budget alerts.

Free Expo builds and Supabase usage can support development and a small beta within current allowances. Supabase free inactivity pausing, SMTP restrictions, backup limitations and traffic limits must be reviewed before relying on them for public availability. Keep billing accounts owner-controlled and spending limits explicit.

Sources checked September 30, 2026:
- https://expo.dev/pricing
- https://supabase.com/pricing
- https://developers.google.com/maps/billing-and-pricing/overview
- https://developers.google.com/maps/billing-and-pricing/manage-costs
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/programs/enroll/
