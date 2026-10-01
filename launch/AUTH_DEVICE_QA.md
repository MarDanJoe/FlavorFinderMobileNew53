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
