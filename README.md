# AIVA — Think Further

**Global Career & Opportunity Intelligence** · Free beta

This repository currently contains a static public-facing website (`index.html`), a client-side CV reader and job-matching interface (`career.html`), and a scheduled Himalayas job-data importer.

## Actual functionality

- Opportunity directory: links to third-party websites; **these are source portals, not individual verified open opportunities**.
- Career Passport: reads text-based PDF, DOCX and TXT resumes in the browser (PDF.js and Mammoth); no CV server or saved user account.
- Matching: rule-based skills/keyword matching. This is **not semantic AI** and does not determine hiring eligibility.
- Remote jobs: importer reads public data from Himalayas when scheduled sync succeeds. Attribution to Himalayas and application URLs are preserved.
- Paid subscriptions: none; beta is free.

## Deployment and enabling listings

1. In repository Settings → Pages select deploy from `main` / root.
2. In Actions → **Update real job listings** run the workflow manually.
3. Confirm successful execution and that `data/jobs.json` was committed.
4. Confirm the public site loads, and test a real application link.

**A site deployed without `data/jobs.json` cannot show the imported job cards.** External API access from browsers might be blocked; failure must not be disguised as live data. This integration provides remote job coverage only, not every job in every country.

## Known limitations

- No real login, employer registration, application submission or server-backed saved jobs.
- No reliable automated ingestion yet for scholarships, grants and other opportunity types.
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
