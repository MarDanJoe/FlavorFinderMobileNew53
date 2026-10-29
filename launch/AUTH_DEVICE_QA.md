# Authentication release checks

Owner confirmed live signup code entry, recovery and sign-in on September 30. Automated tests cover malformed confirmation codes, missing sessions, provider rejection and resend failures. These checks do not prove real expired/reused tokens or delivery to a second email provider.

Use a dedicated disposable account on the signed app; keep email codes/passwords out of Git and screenshots.

- Register and confirm with a fresh code; retry the same code after signing out and verify rejection.
- Request a new confirmation code; check the old/replaced code is rejected. Separately wait for the configured expiry and verify an expired code fails clearly.
- Repeat recovery: wrong code, expired code, reused code, successful new password, old password rejected. Confirm recovery ends signed out and successful sign-in uses the new password.
- Deliver confirmation/recovery to a second provider inbox and check spam, sender, code readability and absence of home address.
- Save on device A, load on B, then edit concurrently; verify stale writes prompt reload. Sign out and verify private favorites are not shown to the next account.
- Attempt deletion with a wrong password; verify nothing is deleted. Delete the disposable account with correct reauthentication, then verify its library is gone and old credentials cannot sign in. Do not delete the owner's account for QA.
- Change guest/registered identity during voting; original votes/membership must not appear under the new identity.

Record date, build, device/iOS, expected/actual result and failures before completing launch gates. Keep the reviewer account separate from the disposable deletion test account.

## October 29 — device findings and prepared navigation fix

Owner reports saving a restaurant succeeded on the registered test account. An incorrect password during deletion returned “invalid login creds”; this verifies rejection only, not completed account deletion. Correct-password deletion remains pending on the disposable account.

Owner could dismiss the main app through older creation/confirmation sheets. Auth completion previously pushed another MainApp route. Prepared fix resets the root stack to the existing MainApp route (preserving tab state), and replaces Login/Register when switching forms. Guest exit clears auth history too. Password recovery and failed authentication remain on the form. Eight component-handler regressions cover these paths. This change requires the next signed build and device confirmation; it is not in build 15.
