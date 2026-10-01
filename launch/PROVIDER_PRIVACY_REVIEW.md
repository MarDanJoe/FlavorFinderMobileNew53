# Provider privacy review — October 1, 2026

Observed in authenticated dashboards; this is a partial review, not a certification.

## Brevo

Transactional-email retention page currently shows All senders, one month, and Never store previews. These selected settings were observed without saving any changes. Account has previously generated recipient-level open events. Tracking page currently shows Anonymous email tracking = No. Recommended change: Yes; this preserves aggregate opens/clicks rather than disabling tracking. Owner decision pending.

Brevo states retention changes apply to old and new logs, whereas disabling previews affects future mail. Existing preview deletion is not assumed. Do not change retention to trigger deletion without reviewing affected data and owner approval.

References:
- https://help.brevo.com/hc/en-us/articles/4415743225746-Configure-a-custom-retention-period-for-your-transactional-logs-and-email-previews
- https://help.brevo.com/hc/en-us/articles/11643306229906-Can-I-anonymize-the-tracking-of-opens-and-clicks-for-my-emails

## Supabase

Dashboard confirms Free plan, Oregon/us-west-2 and one organization member (owner). Backups page explicitly says Free Plan does not include project backups. Do not infer a recoverable backup from the page's general daily-backup heading. No plan upgrade purchased.

Published pricing lists one-day API/database log retention for Free. This is a plan-level statement, not evidence of every internal security log, backup or subprocessor retention period. No log drain or privileged retention change was configured during this review.

Before public launch: establish encrypted off-site database backups with retention/access controls and a tested restore. GitHub source backups do not back up hosted account records or favorites. Keep exports out of Git and ordinary screenshots. Guest-identity cleanup remains pending and needs an account/room-aware policy before any destructive job is deployed.

References:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/backups

## Remaining

Review actual request fields/provider logs, Google retention and downstream data use, operator identity, email tracking decision, deletion/backup retention and native SDK privacy manifests. Current public policy already describes email-open events and provider retention uncertainty; do not claim all data is erased immediately.
