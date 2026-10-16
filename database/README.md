# AIVA Core Database — setup and boundaries

This SQL foundation supports **Careers**, **Global** and **Business** through one catalog and user system.

## Setup
1. Create a **new, dedicated** Supabase project for AIVA (do not reuse unrelated projects).
2. Review `database/aiva_core.sql`, run it in a staging project, inspect RLS and permissions, and verify each policy with anonymous, owner and non-owner test accounts.
3. Configure authentication providers and permitted callback URLs.
4. Add only the **publishable** Supabase key to a frontend; keep secret/service-role keys strictly server-side.
5. Build a backend/API before accepting organization submissions. Organization memberships, verification and publication must be granted by trusted server operations with explicit checks.
6. Add a secure, consent-driven CV upload flow later; this schema intentionally does **not** store CVs.
7. Check third-party listing data licensing before commercial ingestion, and verify freshness and eligibility before publishing.

## Tables
- `profiles`: user-facing, per-user profile
- `organizations` / `organization_members`: company ownership and membership (server-managed)
- `opportunities`: six categories, one shared opportunity catalog
- `saved_opportunities`: per-user saved listings
- `notification_preferences`: email off by default

## Release checks
- Authenticated User A cannot read or modify User B profile, saves or preferences.
- Anonymous users see published opportunities and verified organizations only.
- Frontend users cannot approve opportunities, verify organizations or assign membership.
- Saved listing must be published; duplicate saves rejected.
- Auth, webhooks, data deletion/export, moderation and fraud prevention need implementation before paid launch.

**Status:** repository migration candidate only; not deployed, not connected to the current static HTML pages, and not production-ready. There is no active billing.
