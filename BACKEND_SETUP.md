# AIVA server-backed launch checklist
The API files require a Node-compatible serverless host (e.g. Vercel). **GitHub Pages cannot execute these APIs.** The static website remains a beta until the app is deployed to a backend-capable host.

1. Confirm the dedicated Supabase organization/project; do not deploy into unrelated database projects.
2. Apply reviewed `database/aiva_core.sql` then `database/aiva_billing.sql`, perform RLS checks.
3. Configure server-only environment variables from `.env.example` on the serverless host; never expose `STRIPE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in GitHub Pages.
4. Verify Stripe account ownership and test/live mode. Set up recurring prices and a signed webhook pointing at `/api/stripe-webhook`.
5. Configure APP_ORIGIN to production HTTPS website on same backend-capable host, rather than the GitHub Pages site.
6. Seed organizations and membership through a trusted administrative workflow; the employer API accepts only authorized existing members and sends submissions to pending moderation.
7. Deploy, run signup, checkout, webhook replay, subscription cancellation, cross-account and org isolation tests.
8. Add Stripe Customer Portal, tax/VAT, cancellation/refunds policies, invoices, company identity checks, abuse prevention and GDPR flows before public paid launch.

Endpoints: `POST /api/checkout` (signed-in user, JSON {plan:'pro'|'business'}), `POST /api/stripe-webhook` (Stripe-signed), `GET/POST /api/employer-opportunities` (Supabase Bearer token). These are API foundations; they are not connected to live billing yet.
