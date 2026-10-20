# Voting update — October 19, 2026

Owner's two-person test found that a right card swipe could leave the voting screen. Buttons worked and room recovery allowed re-entry. This report does not establish all winner/tie/privacy scenarios passed.

## Changes

- Room stack route disables native back/full-screen gestures. Explicit Leave room confirmation remains available.
- Card claims horizontal drags, refuses responder termination, blocks native responder takeover and disables page scrolling while dragging. Vertical gestures stay available outside card ownership. Cancelled drags reset without voting; loaded-card and in-flight guards prevent unseen/duplicate votes.
- Create room from Discover or Eat together opens independent RoomSetup. Defaults are All flavors / five miles / any rating or price / any hours; personal saved Discover preferences are not read or modified.
- Host can choose city/ZIP or current location and cuisine/distance/rating/price/open-now filters. Restaurant search begins only after Find restaurants for this room. City lookup itself still calls the location endpoint when requested.
- Host reviews up to 20 matching names and settings before Use this deck & continue, enters nickname, then creates the room. Change area or filters remains available before creation. Existing backend freezes IDs at creation; all participants share that deck. Changing a created room's deck requires a new room; this pass does not alter database/RPC behavior.
- Preview lists names without loading restaurant photos/details. Host forwards current cards in memory as before; persistent room records/invites contain IDs only. Provider quotas remain unchanged.

## Physical iPhone retest (both participants update first)

1. On the host, set personal Discover to pizza. Open Create a voting room: confirm group setup shows All flavors. Choose a different cuisine, city and distance. Find restaurants; verify summary/names before creating. Confirm Discover still has the host's original preferences afterward.
2. Invite second participant before Start voting. On both phones, swipe right then left from card center and near card edges. Verify screen stays in room, progress advances exactly once per completed swipe, and both participants see the same restaurant order.
3. Try a short drag and cancelled drag: no vote. Drag horizontally without scrolling vertically; scroll the page outside the card and confirm controls remain reachable.
4. Use Like/Pass buttons too. Open details and return; room membership/votes remain. Use explicit Leave and cancel the confirmation.
5. Complete a small deck; verify same winner on both phones, including tie and all-pass scenarios in separate small rooms. Test host early finish separately.
6. Restart/reconnect and confirm submitted votes are restored. A failed vote must keep the card available and explain retry. Measure requests with fresh before/after counters and categorized logs rather than inferring charges.

Automated UI simulations verify responder ownership/scroll lock, right Like/left Pass, duplicate release guard, cancellation, missing-card gate and independent host filters/location/confirmed IDs. Native iOS navigation arbitration still requires this physical retest.


## October 20 build 13 feedback

Owner installed build 13. Saved test banner/placement and returning from restaurant detail to Saved passed by owner report. During room setup, owner found cuisine absent from filters and no way to cancel from the nickname/create page. Confirmed source omission: FilterSheet had distance/price/rating/hours but no cuisine controls. Added cuisine chips (All flavors, Pizza, Tacos, Japanese, Burgers, Brunch) to the shared sheet, preserving the rest of the draft. Added a visible accessible cancel/back control on the pre-create host page, disabled during a request; this goes back without creating a hosted room. Existing Change area or filters action remains. Regression tests cover selecting/applying cuisine with other settings and cancel/edit navigation with no room RPC. These fixes need a new signed build; they are not present in installed build 13. Retest both paths on the next build, then continue two-phone voting cases above.
