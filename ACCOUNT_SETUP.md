# AIVA Account beta

This PR adds `account.html`, a browser-based Supabase Auth sign-up/sign-in/sign-out flow and a saved-opportunities list connected to RLS-protected tables. It does not modify the public homepage or existing Career Passport.

## Enable on an AIVA-specific staging project
1. Review and apply `database/aiva_core.sql` to the *dedicated* AIVA Supabase database; test RLS and privileges using two users.
2. Configure Supabase Auth email provider and add your site's origin / `account.html` path to approved redirect URLs.
3. Copy `aiva-config.example.json` to `aiva-config.json`; enter only your Supabase project URL and **publishable** API key. This config is public and MUST NOT contain secret/service-role keys.
4. Open `account.html`; create two test accounts, confirm email, sign in/out, and verify cross-user saved-opportunity isolation.
5. Seed a legitimately published opportunity using trusted admin/server operations (not browser user) and use its UUID to test Save and Remove.

## Known limitations
- This is a staging integration and is not connected to imported JSON job IDs. No automatic feed→database importer is implemented.
- Only UUIDs of published database opportunities may be saved, not portal bookmarks or local CV data.
- No account deletion, profile UI, employer registration, CV cloud storage, billing or paid entitlement system yet.
- No production runtime or end-to-end test was performed: Supabase project provisioning and key configuration are required.
- Never add a service role/secret key to frontend, GitHub Pages or this repository.
- Before a public launch: rate limiting/CAPTCHA as appropriate, privacy policy, account export/deletion, email template review, accessibility checks and security tests.

If `aiva-config.json` is absent or contains placeholders, the UI deliberately shows a setup message and does not pretend that user login works.
