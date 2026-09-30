# Flavor Finder email setup

The app's confirmation/recovery flows and branded code templates are implemented. On September 30, 2026, the owner saved Brevo custom SMTP in the hosted Supabase project, and both confirmation and recovery templates were saved and verified in the dashboard preview. The stored SMTP password is hidden; no key is kept in this document or source control. Brevo marks the Flavor Finder sender as verified, using a free email domain. An owner-approved passwordless test signup created an account and sent the branded confirmation email. Brevo's Logs page records Sent and Delivered, and the owner confirmed receipt. The From address was rewritten to Brevo's sending domain. The onboarding verification screen remained empty despite actual delivery; use the Logs page as evidence. Brevo also recorded delivery of the recovery email, including the request sent through the real app. The owner inspected the received confirmation email and reported that it does not show their home address. This check applies to the tested confirmation email; other message types still need inspection. The owner successfully entered the confirmation code in the real app; the signed-in profile was observed and sign-out returned to guest mode. The owner completed the recovery form with a new password and reported success. The owner also signed in successfully with the new password. Invalid/reused code rejection, second-provider delivery and tracking settings remain pending. Email confirmation stays enabled.

## Provider choice without a domain

Brevo Free provides SMTP and up to 300 sends per day. A verified free-address sender can be temporarily rewritten to Brevo's authenticated sending domain. This is a beta option, not a permanent branded sender. Brevo account approval and sender verification must finish before delivery can be relied on. Before public launch, use an owned domain and configure DKIM/DMARC. Resend Free is an alternative after obtaining a domain (3,000 sends/month, 100/day).

Verified September 30, 2026 using [Brevo plan documentation](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans) and [sender requirements](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders). Confirm actual account eligibility and limits during setup.

## Owner steps

1. Complete the free Brevo account signup and any terms, email/phone verification or approval requirements yourself. Do not choose a paid plan.
2. Create a sender with display name **Flavor Finder** and an email address you control. Complete sender verification.
3. Obtain the SMTP host/port/login and create its SMTP key in the provider dashboard. Keep the key out of chat and source control. Do not substitute an API key for a Brevo SMTP key.
4. Configure Supabase Authentication → Emails → SMTP Settings using the verified sender and the SMTP settings shown in the provider dashboard. Use encrypted SMTP. Store the credential only in Supabase's SMTP password field; confirm this destination before transferring it.
5. Keep provider click/open tracking off for authentication emails where possible; these messages do not need marketing tracking.

## Templates

After SMTP is saved, set:

- Confirm signup subject: **Confirm your Flavor Finder email**; body: `supabase/templates/confirmation.html`.
- Reset password subject: **Reset your Flavor Finder password**; body: `supabase/templates/recovery.html`.

Both bodies use Supabase's `{{ .Token }}` variable, not a hard-coded code. In-app signup confirmation verifies with `type: email`; recovery retains `type: recovery`, then updates the password and signs out. Confirmation email resend has a 60-second UI cooldown; server-side rate limits still govern requests. Account discovery is not inferred from resend success.

Configure the local Supabase template paths from `supabase/config.toml` for local development. Hosted dashboard configuration is separate; changing this file does not deploy templates or SMTP.

## Delivery gates

Use only test inboxes owned by the user or explicitly authorized testers. Do not put passwords or verification codes in reports.

- Signup email arrives in Gmail and another mailbox provider; check spam placement and the actual sender shown.
- The code verifies once; wrong, expired and reused codes fail.
- Existing unconfirmed signup can request a fresh code without creating another account.
- Recovery email works for a registered test account; old password fails and new password works afterward.
- Missing/unknown addresses and rate limits produce understandable messages without implying account existence.
- Provider logs show accepted/delivered messages; note that SMTP acceptance alone is not inbox delivery.
- Verify total Supabase/provider quotas, sender approval, free-plan branding and privacy disclosures before beta invitations.
