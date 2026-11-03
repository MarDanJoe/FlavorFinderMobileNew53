# Location changes and expanded cuisines — November 3, 2026

Owner reported downtown/work restaurants remained after entering the home address later that day. No home address was collected or logged during investigation. The exact on-device lookup response and selected radius remain unverified; restaurants within the selected radius can legitimately overlap between locations.

Reproduced with deterministic hook tests before the fix:
- Refreshing device-location discovery reused its previous coordinates rather than reacquiring GPS.
- The first render after changing areas could expose the previous deck before effect cleanup.

Prepared fixes:
- Tag visible results with the current area/filter/refresh selection and hide mismatched cards immediately.
- Refresh current-device searches by reacquiring GPS; manual-city refresh keeps its selected coordinates.
- Preserve generation guards against previous-area responses; clear pagination and seen IDs for each search.
- No automatic background polling or periodic provider calls added.

Added regression checks for moved-device refresh, immediate city switching with a delayed old pagination response, and rejection of out-of-range results. Existing tests cover denied permission, retry, filter changes, pagination, sorting without refetch, and late old-filter responses.

Expanded the shared Discover/room filter to 33 specific cuisine/food searches plus All flavors. The selected cuisine's label now displays correctly on Discover, including choices outside its shortcut row. Provider search terms are not dietary/ingredient guarantees.

This is a source change after build 16, not yet in an installed TestFlight build. Device acceptance should include two clearly separated cities, a 1-mile radius, checking the displayed location label after lookup, then GPS reselection and refresh after moving. If the label resolves to the wrong area, investigate the location lookup separately rather than declaring the reported issue resolved.

Validation: 112 tests passed; TypeScript, formatting and diff checks passed. iOS export succeeded (1,133 modules). No backend deployment, quota change or new cloud build was performed for this change.
