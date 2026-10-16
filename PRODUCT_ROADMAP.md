# AIVA SaaS MVP — Product & Revenue Plan

## Positioning
AIVA helps early-career professionals find *relevant, eligible, and current* international remote jobs from source-backed listings. Start with careers; scholarships and grants come later once source coverage is reliable.

## Target customer and value proposition
Primary ICP: English-speaking graduates and early-career workers looking for international remote jobs. Test with at least 15 interviews before investing in advanced AI. Do not assume global eligibility based on a listing being remote.

Core user journey: landing page → browse jobs → optional CV/profile → see explainable ranked opportunities → save opportunities → receive opt-in alerts → optionally upgrade.

## Beta scope
- [ ] Reliable ingestion: fixtures, schema validation, stale/expired listing handling, source attribution, deduplication, sync status monitoring
- [ ] Structured opportunity metadata: title, employer, original URL, source, fetched_at, expiry, work location, country eligibility, remote status
- [ ] User-controlled profile + explicit consent; do not upload CV without informed opt-in
- [ ] Authentication, authorization, account deletion and data export
- [ ] Saved jobs and preference-based notifications
- [ ] Explainable matching with eligibility filtering; never portray keyword matching as AI
- [ ] Legal pages: privacy, terms, cookie disclosure (where needed), source licensing review
- [ ] Analytics: activation, saved-job rate, alert engagement, retention, conversion, churn
- [ ] CI/CD, automated tests, error tracking, backups, rate limiting, secrets handling, accessibility and mobile testing

## Monetization hypothesis (not active pricing)
Free: browse job listings and limited matches.
Pro (€9/month candidate test): alerts, saved opportunities sync, more personalized ranking, deadline reminders.
Annual candidate test: €79/year.
Do not publish these as purchasable offers until billing, taxes, cancellation, refunds where applicable, support and entitlements are functioning.

## Recommended architecture (decision, not current implementation)
- Frontend: migrate static pages incrementally to Next.js or keep static UI while introducing API-backed features
- Backend/database: PostgreSQL + managed auth, row-level security
- Ingestion: server-side scheduled jobs with data quality validation
- Billing: Stripe Checkout and customer portal with webhook-confirmed subscription state and idempotent handlers
- Email: transactional provider, opt-in preferences and unsubscribe
- Hosting: managed platform with separate staging/production environments

## Security / privacy release gates
- No secrets in frontend or repository
- Verified auth and per-user access controls; CV documents private, encrypted at rest, retention policy
- GDPR lawful basis, transparency, deletion/export workflow, vendor agreements and regional requirements
- No unsupported 'live', 'verified', 'AI matching' or 'worldwide eligibility' claims
- Source terms checked for commercial redistribution

## First 4 weeks
Week 1: audit feed quality + testable ingest, validate problem through 15 customer interviews, instrument anonymous funnel.
Week 2: secure accounts and saved jobs, privacy/terms draft, staging.
Week 3: preferences and opt-in alerts, email deliverability, billing in test mode.
Week 4: payment checkout/webhooks and entitlements, end-to-end tests, launch to small private beta.

## Launch gates / measurable hypotheses
- ≥15 interviews; ≥5 users ask to continue using AIVA
- ≥90% of displayed jobs link to valid and reasonably current original sources in sampled QA
- At least 30 people complete core flow; track weekly return and saved jobs
- Target 3–5 real paid pilot customers to validate willingness-to-pay; no revenue guaranteed

## Prioritized implementation issues
1. Feed quality audit and contract-compliant provenance
2. Secure profile/auth and saved opportunities
3. Opt-in email alert pipeline
4. Subscription lifecycle and billing webhook validation
5. Analytics + release QA
