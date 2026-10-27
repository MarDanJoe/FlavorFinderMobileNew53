# Beta quota update — October 27, 2026

The owner approved increasing the hosted shared daily Places request limit from 100 to 300. Supabase `GOOGLE_DAILY_REQUEST_LIMIT=300` was saved successfully at 17:16 UTC; the returned secret digest was verified against SHA-256 of `300`.

This overrides the conservative source fallback of 100. No app rebuild or function deployment was required. Existing daily usage is not reset. Per-user rate limits and Google-side method quotas were not changed; previously recorded Google caps of 100 per method may still block individual methods before the shared backend reaches 300. Budget alerts are notifications, not spending cutoffs. Review actual usage and charges during beta before another increase.
