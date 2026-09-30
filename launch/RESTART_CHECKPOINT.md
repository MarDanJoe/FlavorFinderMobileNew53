# Flavor Finder restart checkpoint — September 30, 2026

Workspace: `/Users/dannyambrose/Documents/ChatGPT/Flavor finder/repository`.

Real Expo SDK 57 app, Supabase authentication/places/account deletion and voting rooms are implemented. Hosted functions, room schema, hourly cleanup, and Brevo SMTP/templates are deployed. Owner confirmed confirmation, recovery and password sign-in work. Restaurant discovery by city works. Last full checks: 32 tests, TypeScript and iOS JavaScript export passed; no signed iPhone build or device QA yet.

Public privacy, terms and support pages: https://mardanjoe.github.io/FlavorFinderMobileNew53/ (privacy.html, terms.html, support.html). GitHub Pages main/docs is active. Remote static-page commits: a98db634946154b2385915f24a5b414aa4048b8f and 818f272a575a481ae8452eff306d8b2525d1ae1b. Local app changes have not been pushed to GitHub. Before a future push, integrate those remote docs commits without discarding local work.

Local ignored .env.local contains release URLs, proposed bundle identifier com.mardanjoe.flavorfinder, EAS identity and backend configuration. Do not print or upload secrets. Local release:check passes; cloud EAS environments still need setup. Replacement Google key is stored in Supabase and restricted to Places API (New). Supabase Edge Functions do not offer fixed egress IPs. Old Google keys still require retirement review. Owner-approved monthly $5 Google budget alert saved; alerts at $2.50/$4.50/$5 to existing billing admins/users. No enforced dollar cap. Backend default shared request limit: 100/day.

Owner considering Apple Developer membership; not enrolled yet. Mac currently macOS15.2/Xcode16.2; update required for local SDK57 native build. Xcode26.6 (Expo SDK57 cloud image) requires macOSTahoe26.2 or later. See IPHONE_TESTING.md. Owner must handle Apple signup/agreements/payment.

After reboot, use the bundled Node runtime if node is missing from PATH. Start real web preview with `npm run web -- --port 8085` (demo mode false). A browser preview is not native iPhone testing. Browser sessions and dev servers may need reopening; do not assume they survived restart.

Remaining: Google quotas/old key retirement, EAS environment setup, Apple signing, physical iPhone tests, operator identity/provider retention review, App Store metadata/privacy declarations. No ads or paid membership SDKs added yet.
