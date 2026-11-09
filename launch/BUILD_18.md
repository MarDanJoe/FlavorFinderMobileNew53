# Build 18 — latest TestFlight candidate

November 9, 2026. Version 1.0.0 (18), source commit `39711e8` on `codex/architecture-review`.

- EAS build: `66ac15b6-a68c-4896-863e-9b89ac171ff6`
- Automatic Apple submission: `8cde60e6-3ddc-455e-b622-32340354d6ef`
- Source uploaded and automatic submission scheduled. Build completion, Apple processing and tester availability are not yet confirmed.

Adds Healthy to the shared Discover and room cuisine/food filters (34 specific searches plus All flavors). Healthy is a provider search term, not a nutritional certification. Includes build 17's expanded cuisines/location fixes and neutral public/beta invitation wording prepared afterward. App Store invitation destination remains staged with appStoreLive false; current download page retains the beta path.

114 tests passed, TypeScript and release configuration checks passed before upload. Test ads remain enabled. No live-ad activation or public App Store submission.

Phone acceptance: verify version (18), location switching at a 1-mile radius, Healthy and other cuisine selections in Discover and room setup, shared voting/winner, navigation after authentication, Saved/results test ads, and invite download/open/copy flow. Capture clean original device screenshots from the accepted candidate. Public-release privacy, age/content rights, review access, capacity/backup and final live-ad gates remain tracked in FIRST_PUBLIC_RELEASE.md.
