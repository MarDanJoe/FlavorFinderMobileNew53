# Google Places review — September 30, 2026

Reviewed against https://developers.google.com/maps/documentation/places/web-service/policies (updated September 24, 2026).

Implemented:
- Official unmodified Google Maps attribution logo at 18 dp, with required clear space and accessibility label. Discovery credits sit inside the place card; detail and room views preserve photo authors and source links. Saved thumbnails open a larger, fully credited detail view.
- Provider attribution is requested and carried through search and detail responses. Photo source links survive empty author arrays. Reviews show available author avatars/names/profile links, source links, relevance ordering and supplied visit month/year.
- Favorites and room decks persist place IDs, not restaurant snapshots, photo references or reviews. Provider data is refreshed for display. Backend JSON and photo responses use `Cache-Control: no-store`.
- Privacy, terms and support screens are accessible from profile and account screens without requiring sign-in. Static HTML counterparts are generated from the same source with `node scripts/build-legal-pages.cjs`.
- Backend update deployed; live search returned 20 results, provider attribution arrays, photo source links for all 20, and no-store headers. TypeScript, 32 tests and native iOS JS export passed. This is not a signed device test.

Launch requirements still open:
- Copy the published public URL variables into EAS preview/production environments before cloud builds. The owner-approved pages were published September 30, 2026 on free GitHub Pages at https://mardanjoe.github.io/FlavorFinderMobileNew53/ (privacy.html, terms.html, support.html). Local release URL variables are configured.
- Confirm the legal operator identity, provider log/backup/email retention settings, and privacy disclosures against actual launch operations. The current contact is owner-supplied; no home address is included.
- Review the Google project’s billing-region-specific agreement, key restrictions, quota settings and retirement of the old key. A technical attribution review is not a determination of legal compliance.
- Validate visible credits and links on an actual iPhone, including large text settings, room cards, saved-place detail views and provider responses with third-party credits.
- Update policies and Apple privacy declarations before adding advertisements, memberships, analytics or other providers. The current privacy policy discloses observed email open events; decide whether to disable provider tracking before launch.

Google Maps logo assets are documented in `assets/google/README.md`. Policy content source: `src/legal/policies.json`. For future updates, regenerate and publish `docs` from the current policy source rather than the older placeholder draft.

## Console review — September 30, 2026

The replacement `Flavor Finder Backend` key is restricted to Places API (New); application restriction is None. Supabase documents that Edge Functions do not have static/stable egress IPs, so an IP allowlist cannot be applied reliably to this deployment. The key remains server-side. Two older keys exist (`API key 2`, unrestricted, and `Maps Platform API Key`, restricted to eight APIs); identify their users and retire the exposed key separately before launch. Other OAuth clients exist in this project, so do not disable unrelated services or change project-wide settings blindly.

The billing overview currently reports $0 for September, with delayed reporting noted. An owner-approved monthly $5 alert budget was saved and verified for the Flavor Finder project, emailing existing billing admins/users at 50%, 90%, and 100% ($2.50, $4.50, $5). It is alert-only and does not pause services. Google quota setup remains unverified. The backend default 100 forwarded requests/day is an app-service limit, not a dollar ceiling and not protection against direct use of an exposed key.

Sources: https://developers.google.com/maps/api-security-best-practices ; https://supabase.com/docs/guides/troubleshooting/why-supabase-edge-functions-cannot-provide-static-egress-ips-for-whitelisting-3d78b0
