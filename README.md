# AIVA — Think Further

**Global Career & Opportunity Intelligence** · Free beta

This repository currently contains a static public-facing website (`index.html`), a client-side CV reader and job-matching interface (`career.html`), and a scheduled Himalayas job-data importer.

## Actual functionality

- Opportunity directory: links to third-party websites; **these are source portals, not individual verified open opportunities**.
- Career Passport: reads text-based PDF, DOCX and TXT resumes in the browser (PDF.js and Mammoth); no CV server or saved user account.
- Matching: rule-based skills/keyword matching. This is **not semantic AI** and does not determine hiring eligibility.
- Job Finder: searches imported Himalayas remote listings, official employer boards, Arbeitnow Europe listings and curated direct employer sources with query, location, source, remote and saved-only filters; includes sorting, pagination, shareable search links and local CSV export.
- Browser bookmarks: job finder, Career Passport matching/swipe, employer explorer and account all use a shared local bookmark key. Bookmarks can be removed and exported from the account screen; no login required.
- Business: supports locally saved opportunity drafts with a 20-item draft library, edit/load, delete and JSON export; no employer publication.
- Remote and Europe jobs: scheduled importers preserve source attribution and original application URLs. Missing or older feeds are shown as such rather than presented as live-verification.
- Paid subscriptions: none; beta is free.

## Deployment and enabling listings

1. In repository Settings → Pages select deploy from `main` / root.
2. In Actions → **Update real job listings** run the workflow manually.
3. Confirm successful execution and that `data/jobs.json` was committed.
4. Confirm the public site loads, and test a real application link.

**A site deployed without `data/jobs.json` cannot show the imported job cards.** External API access from browsers might be blocked; failure must not be disguised as live data. This integration provides remote job coverage only, not every job in every country.

## Known limitations

- No production-ready login, employer registration, application submission or server-backed saved job synchronization without configuring a separate Supabase project and backend host.
- Global scholarship, grant and fellowship links are official/public source directories, not verified individual open opportunities.
- No 100% worldwide coverage: data is limited by the connected source, language, region and remote-work availability.
- Local CV parsing does not work on scanned-image PDFs without OCR.
- CV file is handled locally; third-party parsing libraries are fetched from CDN, and the public hosting platform receives normal website requests.
- Scheduled updates can fail due to rate limits, unavailable APIs or repository permissions.
- Source API usage and redistribution must comply with [Himalayas API terms](https://himalayas.app/api).

## Development priorities

1. Verify a successful scheduled sync; add importer fixture tests and schema validation.
2. Add genuine sources with licenses/terms for individual listings, one integration at a time.
3. Standardize job country eligibility, expiry and verified timestamps.
4. Introduce consent-driven identity/storage only when a secure authenticated backend is deployed.
5. Test accessibility, mobile UX and end-to-end CV parsing with safe synthetic CVs.

Never publish test vacancies as real jobs or claim a missing feed is active.
