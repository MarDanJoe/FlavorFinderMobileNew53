# Fixed voting stage — October 28, 2026

Prepared on `codex/architecture-review`; not distributed in TestFlight yet. Build 15 still has the earlier scrollable voting page.

During active voting, the brand header, compact room-code button, personal vote progress, card area and Pass/Like buttons share a fixed viewport. The card uses remaining space and an image bounded by measured card height. Loading, retry and waiting-for-friends states keep that area allocated. Restaurant text, details access and Google credits remain scrollable inside the card. The outer voting stage does not scroll.

Room code, group membership/progress, full connection/error messages, host early finish and leave actions are available from a separate Room details panel. One native modal handles both that panel and confirmation dialogs, avoiding competing native modal presentations. Expired membership retains a way back to Rooms. The panel closes when voting finishes. Lobby/setup/results keep their scrollable layouts so their controls and potentially long results remain accessible.

No database, provider-query, quota, credential or advertisement changes are required. This is an app update and needs a new TestFlight build plus physical-device verification. In particular, test compact iPhones, larger accessibility text, loading/error cards, horizontal swipes, opening/closing progress, leave/finish cancellation, waiting on another voter and a runoff.

Validation: all 95 tests passed before an additional expired-room exit regression test was added. TypeScript, formatting and diff checks passed; A clean iOS/Hermes export passed (1,131 modules, 3.1 MB). The additional expired-room exit test and all 13 voting UI tests also passed. No new cloud build was started as part of preparation.
