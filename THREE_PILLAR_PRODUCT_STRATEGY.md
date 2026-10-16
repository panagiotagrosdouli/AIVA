# AIVA — Unified Three-Sided Product Strategy

## One platform, three connected products
AIVA is one product with shared accounts, opportunity catalog, matching, search, alerts and subscription infrastructure.

### 1. AIVA Careers (B2C)
Users: graduates, job seekers, career changers.
MVP: job search, CV-to-job matching with clear explanations, location eligibility, saved jobs, opt-in alerts, application tracking.
Revenue hypothesis: Free; Pro €9/month or €79/year (test, not active pricing).
North star: weekly users who save or apply to a relevant sourced role.

### 2. AIVA Global (B2C)
Users: students, researchers, founders and applicants seeking scholarships, internships, grants, fellowships or startup programs.
MVP: verified individual opportunities with original URL, deadline, funder, geography and eligibility; cross-category personalized alerts.
Revenue hypothesis: included in Pro initially; test a separate premium tier only after observed demand.
North star: qualified opportunities discovered and acted upon.
**No blanket 'worldwide' or 'verified' claims without evidence.** Respect source terms, freshness and attribution.

### 3. AIVA Business (B2B)
Users: small employers, hiring teams, university career offices or incubators.
MVP: verified organization registration, job posting intake, employer dashboard, listing management, basic analytics and moderation.
Revenue hypothesis: pilot packages e.g. €49–€149/month, separately validated. Do not sell automated candidate access without consent, controls and proper lawful basis.
North star: active paying organizations that publish legitimate opportunities and receive qualified traffic.

## Architecture
- One identity and roles: user, organization_member, admin; secure organization-level authorization.
- Shared Postgres entities: users, organizations, opportunities, opportunity_sources, eligibility_rules, user_profiles, saved_opportunities, notification_preferences, subscriptions, events, moderation_queue.
- Opportunity kind enum: job, internship, scholarship, grant, fellowship, startup_program.
- Source ingestion separate from employer-submitted listings; provenance, duplicate detection, expiration and moderation.
- APIs partition public catalog and authorized user/employer operations.
- Stripe subscriptions: webhooks confirm entitlements, idempotency, cancellation and customer portal. Start test mode only.
- Privacy by design: explicit CV opt-in, scoped access, delete/export, audit trails, retention and consent for sharing with organizations.

## Phased delivery — all three, not all features at once
Phase 0 (foundation): source/feed audit, instrumentation, auth, database, roles, staging, tests, privacy.
Phase 1 (Careers): job discovery, explainable matching, saved jobs, opt-in alerts, beta customers.
Phase 2 (Global): scholarship/grant/fellowship ingestion from licensed sources, deadline reminders, eligibility metadata.
Phase 3 (Business): employer onboarding, job posting and moderation, dashboard, paid organization pilots.
Phase 4 (billing and scale): production billing after tested subscription lifecycle, GDPR/consumer-law review, fraud controls, support operations and marketing funnel.

## 30-day execution goals
Week 1: audit existing syncs, validate feed and determine data rights; create core schema and roles; 15 user interviews and 5 employer interviews.
Week 2: user accounts, saved items, Careers beta on staging and usable analytics.
Week 3: opt-in alerts; Global opportunity-source pilot with valid URLs and deadlines.
Week 4: employer sign-up/posting/moderation beta; Stripe test-mode integration and pilot pricing interviews.
Keep production billing gated by QA, privacy/legal readiness and payment tests.

## Revenue validation and gates
- Interview B2C and B2B users; confirm concrete willingness to pay before launch.
- Sample-check listing freshness, links and eligibility and disclose coverage limitations.
- Obtain first 3–5 paying B2C pilot users and first 1–2 paying B2B pilot customers, if demand supports pricing.
- Track weekly activation, opportunity saves, clicks to original listings, 4-week retention, paid conversion, churn, MRR and net margin.
- Avoid revenue guarantees.

## Initial engineering backlog
1. Feed source quality, licenses, schema and freshness tests.
2. Auth + organization roles + row-level access tests.
3. Single normalized opportunity catalog across categories.
4. Career Passport secure opt-in profile persistence and explainable scoring.
5. Saved opportunities and alerts.
6. Global pilot data providers.
7. Employer onboarding, listing approval and abuse prevention.
8. Stripe sandbox and webhook-based entitlements.
9. Production launch checklist and audit.
