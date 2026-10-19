# Flavor Finder architecture

Reviewed October 19, 2026 on `codex/architecture-review`, baseline `2e38035`.

## Product and maturity

An iPhone restaurant discovery and group decision app. Guests discover/save locally; optional registered accounts sync saved IDs and preferences. A host independently chooses an area/filter/deck, invites friends before voting, and receives one server-persisted result, including a random tie winner. AdMob is implemented in test mode on Saved only. Native builds and internal testing exist; public release readiness is not established.

## Runtime boundaries

- `App.tsx`: SafeAreaProvider → AuthProvider → LibraryProvider → navigation.
- `src/navigation/AppNavigator.tsx`: Discover, Eat together, Saved, Profile tabs; account, legal, restaurant detail, room setup and room stack screens. Custom-scheme invitations require an installed app.
- `src/hooks/useRestaurants.ts`: location permission/selection, search generations, filtered pagination, deduplication and card position. Search generations suppress stale responses; provider content remains in memory.
- `src/services/api.ts`: normalized restaurant contract, city lookup and in-flight-only detail coalescing. `Restaurant` currently lives in the hook module; full details retain some `any` typing.
- `src/services/supabase.ts`: configured Auth client, native SecureStore/browser storage, guest session coalescing, authenticated Places requests with timeout. Browser fallback to a local proxy is development-only.
- `AuthContext`: optional email/password registration, OTP confirmation/recovery, profile, sign-out, password reauthentication before deletion. Supabase handles password storage; legacy hashing helpers are not part of active sign-in.
- `LibraryContext`/`PersistentLibrary`/`libraryStorage`: account-keyed view state, serialized reads/writes with same-account replacement-load barriers, publish-after-persistence, optimistic server revision. Guest storage contains IDs/preferences; account changes immediately hide the previous library. Saved hydrates three rows at a time and reuses available in-memory details.
- `RoomsScreen`/`services/rooms.ts`: shared deck UI, private vote submission, session-aware UI invalidation and four-second foreground polling. RPCs bind a captured bearer token; restoration retains that owner/token across local storage awaits. Host cards can be reused from setup memory; participants load basic details. UI simulations do not prove native gesture arbitration.
- `services/ads`: injectable consent/initialization controller plus native adapter. The iOS Saved banner waits for consent permission; required privacy options appear in Profile. Default is test inventory. Web renders no ad SDK. Non-personalized ads still involve SDK data processing.

## Backend and persistence

`supabase/functions/places` verifies the bearer token with Auth before validating a supported route and atomically checking a service-role-only quota RPC. Google Places API (New) is called with server-held credentials, restricted fields, fixed upstream hostname and a 12-second timeout. Photos are streamed with no-store. Structured logs contain category/status/forwarding/duration, not coordinates or user identifiers. The provider adapter preserves author/source attribution.

`delete-account` checks a non-guest identity, recent password authentication and explicit confirmation before deleting the Auth user. Foreign keys cascade that user's library/membership/votes; deleting a host also deletes owned rooms. This is irreversible and must be tested using disposable accounts.

Database migrations:

1. `202609300001_launch.sql`: owner-readable libraries, RPC-only versioned writes, bounded ID/preference sizes; atomic shared-day and per-user-minute request buckets.
2. `202609300002_rooms.sql`: rooms, members, votes and attempts; no direct client table access. Membership/host authorization occurs inside `room_action`, using an empty search path and a room row lock. First vote wins; final scores/winner are persisted once. Limits: 2–20 cards, 10 participants, five hosted rooms/day/user.
3. `202609300003_room_cleanup.sql`: expiry/host/member indexes, service-only cleanup and hourly pg_cron scheduling. Rooms logically expire after 24 hours. Anonymous Auth-user cleanup is separate and remains outstanding.

No Google restaurant snapshots are stored in cloud libraries or room records. Registered email/password/Auth metadata belong to Supabase Auth; room nicknames/votes are hosted. Git backs up source, not hosted account data.

## Data flows

Discover: restore preferences → resolve chosen location → authenticated Places search → normalized in-memory deck → photo request for displayed content. Swiping advances locally; heart additionally persists the ID.

Saved: load stored IDs/preferences → explicit focused detail hydration of three rows → authenticated basic details/photos → more rows only on request. Full restaurant detail requests add hours/contact/website/reviews.

Voting: independent host setup → explicit restaurant search → confirm ordered IDs → create RPC → invited members join → host starts → immutable vote RPCs + progress polling → atomic completion/tie → shared result.

Account deletion: password sign-in → hosted authenticated deletion → database cascades → local sign-out. No Google or privileged Supabase key belongs in the app.

## Build and operations

Expo 57 / React Native 0.86.3 / React 19.2.3, TypeScript, npm lockfile, EAS signing/build/submission. `app.config.cjs` validates production/preview environment settings. Node >=22.13. The local legacy `server/places.cjs` is loopback-only, uses an older API contract and is not a production backend.

Policies have one JSON source and generated native/static presentations. The quality workflow runs tests, type checking, formatting and generated-page drift checks with read-only repository permission and no deployment credentials.

Keep this architecture: there is no evidence justifying a framework migration, custom auth server, Redis cache or microservices. Next work should close observed reliability/operations gaps. See AUDIT_REPORT.md, IMPROVEMENT_ROADMAP.md and existing launch evidence.
