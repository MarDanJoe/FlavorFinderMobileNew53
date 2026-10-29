# App Store listing draft — October 29, 2026

App Store Connect record 6821721808 exists. The owner has tested build 15. The fixed voting viewport is prepared on the review branch but not distributed. Public submission remains pending. The copy in store-metadata.en-US.json is the current structured submission draft; it has not been uploaded. Owner requests live Saved/results banners. Copyright/public identity, screenshots, age rating and final privacy answers remain open.

Name: Flavor Finder: Swipe & Vote
Subtitle: Swipe. Vote. Eat together.
Promotional text: Find restaurants you love and decide together. Invite friends to a voting room, swipe the same restaurant deck, and let Flavor Finder settle the tie.

## Description

Make choosing where to eat part of the fun.

Flavor Finder helps you discover restaurants near you or in a city you choose. Filter by cuisine, budget, rating, distance and whether a place is open. Save the places you want to try and explore available photos, reviews and restaurant details.

Eating with friends? Create a voting room and share its six-digit code or invitation. Everyone swipes the same restaurant deck, and Flavor Finder tallies the votes. If the top choices tie, it randomly selects one winner for the whole room, and the host can start a runoff using just the tied restaurants. If everyone passes, you can try a new deck.

• Discover restaurants as a guest, or create an account to sync saved places.
• Use your location or search a city or ZIP code.
• Choose food that fits your cravings and budget.
• Invite up to 10 people to vote on 2–20 restaurants.
• Keep individual choices private while voting; see group results when voting finishes.
• Save favorites and open restaurant contact or map links.

Restaurant information is provided by Google Maps. Hours, prices, availability and ratings may change; confirm important details directly with the restaurant. Internet access is required for restaurant discovery and group voting.

Advertising: the planned first public release includes a non-personalized banner on Saved and completed group results. Live serving has not been enabled; AdMob readiness and disclosures must be verified before release.

Keywords draft: restaurants,food,dining,group,vote,swipe,nearby,cuisine,favorites,date night
Category candidate: Food & Drink
Initial territory: United States
Copyright draft: 2026 Danny Ambrose (owner-selected display preference). Apple’s verified individual seller/developer name is separate and may remain Daniel Leonard Ambrose. No Apple identity change is implied.
Support URL: https://mardanjoe.github.io/FlavorFinderMobileNew53/support.html
Privacy URL: https://mardanjoe.github.io/FlavorFinderMobileNew53/privacy.html
Terms URL: https://mardanjoe.github.io/FlavorFinderMobileNew53/terms.html
Support contact: ohlqcommunity@gmail.com

## Screenshots

Capture from the signed production app at Apple's required dimensions. Keep Google/source credits visible; use actual behavior and data. Do not use the web demo as a device screenshot.

1. Discovery: “Find your next favorite meal.”
2. Room lobby with two participants: “Bring friends to the table.”
3. Voting card: “Same places. Everyone gets a say.”
4. Finished room with group result: “Dinner decided.”
5. Filters and favorites: “Follow your cravings. Save your finds.”

## App Review notes

Flavor Finder uses Google Places API (New). Current TestFlight builds use a Google test banner on Saved. Live advertising is not enabled yet; revise final store metadata/privacy answers before enabling live inventory. No paid memberships or in-app purchases are included. Location access is optional: use Change location and enter a city or ZIP code. Guest sessions support discovery, local favorites and voting; email/password registration is optional for cloud favorites/preferences. Room membership belongs to the session that joined.

Suggested review path:
1. Continue as guest and search a city (for example Columbus, Ohio). Open a restaurant detail to view Google/source credits.
2. Create a room using restaurant selections, enter a display name and share the code with a second device/session. Join before the host starts voting; joining after voting starts is rejected.
3. Start voting as host and swipe the shared deck on both devices. Progress is shared; individual choices stay private during voting. Completion displays the same winner to every member. A tie has a persisted random choice, with an optional host-started runoff. The host can confirm finishing early. All-pass results explain that no restaurant was selected.
4. Register/confirm an account or use the confirmed review account supplied securely in App Store Connect. Save a favorite and sign in on another device to verify cloud sync.
5. Profile offers account deletion after password reauthentication. Use a dedicated disposable review account for deletion; a fresh confirmed account will be needed afterward.

Rooms expire after 24 hours. Hosted cleanup runs hourly. Google/API limits are intentionally conservative for the private beta; increase measured capacity before review so reviewers cannot be locked out by the shared daily limit. Keep Supabase, Google billing and SMTP available throughout review.

Reviewer credentials: create a dedicated confirmed account before submission. Enter credentials only in App Store Connect's secure review fields; never commit passwords. Refresh credentials if that account is deleted.
