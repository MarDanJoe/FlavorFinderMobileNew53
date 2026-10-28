# Discover layout, room codes, stable cards, and tie runoffs — October 27, 2026

Prepared on `codex/architecture-review`. The owner approved deployment on October 27. The targeted room migration is now live and verified; it is not included in already-distributed TestFlight build 14. EAS build 15 has completed successfully; its automatic Apple submission is queued. Apple processing and tester availability remain unverified.

## Behavior

- Discover keeps its brand header, cuisine strip, card frame and action controls in a fixed screen layout. The duplicate room-creation shortcut and large introductory copy are removed; Eat Together remains in the bottom tabs. Card content and error states can scroll within the available frame, with horizontal gestures retaining card ownership. Location editing opens a separate modal rather than expanding the page.
- New rooms use six numeric digits, preserving leading zeroes. Existing twelve-character hexadecimal invites remain accepted by the backend and updated client. Creation retries a code collision at most three times with the same captured identity. Membership checks, ten-person capacity, expiry and join-attempt limits remain unchanged.

- Carry the host nickname through independent room search and deck confirmation, including changing area/filters. Confirmation shows the existing name instead of asking again. Direct room-setup entry still asks once if no nickname was provided.
- Reserve a 500-point card frame for restaurant content, loading and retry states. The image remains 190 points; the text/details section scrolls within the fixed card for long names and larger text. Horizontal voting still locks page scrolling. A stale card cannot submit a vote for a newly selected restaurant.
- Keep the existing shared random winner on ties. The host can instead start a runoff with only the tied highest-scoring restaurants, preserving original deck order and active group membership. Votes/progress reset for each runoff. Further ties can have another round. All-pass results do not offer runoffs.
- Focused finished-room screens continue background-aware polling so other participants receive the host's runoff. No new Google search is needed to form a runoff deck; restaurant/photo loads remain subject to existing quotas.
- Round numbers reject delayed vote, finish and runoff requests. Host authorization, membership privacy, atomic locking, expiration and rate limits remain enforced by PostgreSQL.

## Validation

92 automated tests passed, including PostgreSQL RPC tests, code collision/compatibility tests and UI flow tests. TypeScript, formatting and diff checks passed. A clean iOS JS/Hermes export passed (1,130 modules). Additional migration testing verifies upgrading an existing finished room preserves its result and six-argument RPC calls.

## Rollout

Applied only `supabase/migrations/202610270001_room_runoffs.sql` after owner approval; do not blindly push unrelated pending migrations. The migration atomically allows short codes alongside existing codes, adds a default round number and replaces the RPC with a backward-compatible optional seventh argument, restores authenticated execution permission, and requests a PostgREST schema reload. Existing rooms start at round one with their saved votes/results intact. No function secrets, quotas, account-deletion backend, ads or other services change.

Deployment evidence: the prior deployed function body matched the original reviewed migration. Its definition and constraints were saved under ignored `verification/deployments/rooms-20261027/`. The new deployed function body exactly matches the approved migration after whitespace normalization. Authenticated execution is allowed; anonymous-role execution is denied. Counts remain one room, two memberships and 40 votes. A live rollback-only transaction passed short-code creation, tie calculation, host-only runoff, round reset, stale-vote rejection and a clear runoff winner. No Google requests or persistent test records were created. The project has no Supabase migration ledger: this targeted SQL was applied directly, so do not later blindly replay it via db push.

Next, build and distribute a new TestFlight binary. All participants must update to join new six-digit rooms and use runoffs: older clients can use round one, but their votes in later rounds are rejected to prevent stale votes from contaminating new results. Deploy the database migration before distributing the new client: without it the client hides runoffs, but its six-digit room creation would be rejected by the old backend.

On two updated phones: check Discover at small and large text sizes, change location and verify the header/buttons remain visible while swiping; create and join a six-digit room (including a leading-zero code) and verify an existing long invite still works. Enter a host name once; confirm/change the deck; start voting; check loading and long-title cards keep the controls stationary; create a tie; verify both devices show the same random winner; host starts a runoff; verify both receive only tied cards and zeroed progress; complete a clear winner and another repeated tie. Test guest rejection of host actions, reconnect during a runoff, and large accessibility text. Physical-device checks remain pending.

If a release issue appears, disable new distribution and retain round data for diagnosis. Restoring the old six-argument RPC requires removing the new seven-argument routine first and restoring the original routine definition from the prior migration; do not rerun its table-creation statements or delete live room data. Take a database backup before any production rollback.

## Owner device verification — October 28, build 15

Two participants joined the same room without being asked for a name twice. Following the instructed tie votes, both phones displayed the same initial winner (reported as Sekura/Sakura). The host started another round containing the two tied restaurants. After both liked the first and passed on the second, both phones displayed Sakura as the winner. The owner explicitly confirmed that cards stayed the same size. The invite-link test was intentionally skipped; reconnect and broader accessibility/device coverage remain pending. The newer fixed-viewport voting stage is a subsequent app change and has not yet been tested on these phones.
