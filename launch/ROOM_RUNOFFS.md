# Discover layout, room codes, stable cards, and tie runoffs — October 27, 2026

Prepared on `codex/architecture-review`; not deployed to Supabase or included in TestFlight build 14.

## Behavior

- Discover keeps its brand header, cuisine strip, card frame and action controls in a fixed screen layout. The duplicate room-creation shortcut and large introductory copy are removed; Eat Together remains in the bottom tabs. Card content and error states can scroll within the available frame, with horizontal gestures retaining card ownership. Location editing opens a separate modal rather than expanding the page.
- New rooms use six numeric digits, preserving leading zeroes. Existing twelve-character hexadecimal invites remain accepted by the backend and updated client. Creation retries a code collision at most three times with the same captured identity. Membership checks, ten-person capacity, expiry and join-attempt limits remain unchanged.

- Carry the host nickname through independent room search and deck confirmation, including changing area/filters. Confirmation shows the existing name instead of asking again. Direct room-setup entry still asks once if no nickname was provided.
- Reserve a 500-point card frame for restaurant content, loading and retry states. The image remains 190 points; the text/details section scrolls within the fixed card for long names and larger text. Horizontal voting still locks page scrolling. A stale card cannot submit a vote for a newly selected restaurant.
- Keep the existing shared random winner on ties. The host can instead start a runoff with only the tied highest-scoring restaurants, preserving original deck order and active group membership. Votes/progress reset for each runoff. Further ties can have another round. All-pass results do not offer runoffs.
- Focused finished-room screens continue background-aware polling so other participants receive the host's runoff. No new Google search is needed to form a runoff deck; restaurant/photo loads remain subject to existing quotas.
- Round numbers reject delayed vote, finish and runoff requests. Host authorization, membership privacy, atomic locking, expiration and rate limits remain enforced by PostgreSQL.

## Validation

87 automated tests passed, including PostgreSQL RPC tests, code collision/compatibility tests and UI flow tests. TypeScript, formatting and diff checks passed. A clean iOS JS/Hermes export passed (1,130 modules). Additional migration testing verifies upgrading an existing finished room preserves its result and six-argument RPC calls.

## Rollout

Apply only `supabase/migrations/202610270001_room_runoffs.sql` after approval; do not blindly push unrelated pending migrations. The migration atomically allows short codes alongside existing codes, adds a default round number and replaces the RPC with a backward-compatible optional seventh argument, restores authenticated execution permission, and requests a PostgREST schema reload. Existing rooms start at round one with their saved votes/results intact. No function secrets, quotas, account-deletion backend, ads or other services change.

Then build and distribute a new TestFlight binary. All participants must update to join new six-digit rooms and use runoffs: older clients can use round one, but their votes in later rounds are rejected to prevent stale votes from contaminating new results. Deploy the database migration before distributing the new client: without it the client hides runoffs, but its six-digit room creation would be rejected by the old backend.

On two updated phones: check Discover at small and large text sizes, change location and verify the header/buttons remain visible while swiping; create and join a six-digit room (including a leading-zero code) and verify an existing long invite still works. Enter a host name once; confirm/change the deck; start voting; check loading and long-title cards keep the controls stationary; create a tie; verify both devices show the same random winner; host starts a runoff; verify both receive only tied cards and zeroed progress; complete a clear winner and another repeated tie. Test guest rejection of host actions, reconnect during a runoff, and large accessibility text. Physical-device checks remain pending.

If a release issue appears, disable new distribution and retain round data for diagnosis. Restoring the old six-argument RPC requires removing the new seven-argument routine first and restoring the original routine definition from the prior migration; do not rerun its table-creation statements or delete live room data. Take a database backup before any production rollback.
