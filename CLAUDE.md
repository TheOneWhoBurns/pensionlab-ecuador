# PensionLab

Static website hosted on AWS (S3 + CloudFront).

## Infrastructure

- **Domain**: `pensionlabec.com` (registered via OpenSRS/Zoho)
- **DNS**: AWS Route 53 (Hosted Zone `Z09804922IETK9KPXK5QL`)
- **Hosting**: S3 bucket `pensionlabec.com` with static website hosting
- **CDN**: CloudFront distribution `EV1SL8GAZMRQ6` (`d2rh96afr6oqbr.cloudfront.net`)
- **SSL**: ACM certificate for `pensionlabec.com` + `*.pensionlabec.com`
- **Email**: Zoho Mail (MX, SPF, DKIM, DMARC records configured in Route 53)
- **GitHub Secrets required**:
  - `AWS_ACCESS_KEY_ID` — IAM user `Github-CI` access key
  - `AWS_SECRET_ACCESS_KEY` — IAM user `Github-CI` secret key

## CI/CD Pipeline

Defined in `.github/workflows/ci.yml`. Triggers on push to `main` and PRs to `main`.

**Two jobs:**

1. **test** — Runs the full Playwright QA suite on ubuntu-latest (Node 20)
2. **deploy** — Runs only on push to `main`, after tests pass. Syncs files to S3 and invalidates CloudFront cache.

Deployments are automatic: merge to `main` → tests pass → deploy to S3 + CloudFront.

## QA Pipeline

Playwright test suite in `/tests/` with 8 spec files:

- `nav.spec.js` — navigation, sticky nav, sidebar, CTA scrolling
- `cookie-consent.spec.js` — cookie consent banner
- `form-rapida.spec.js` — estimation form validation, submission, calculator
- `whatsapp.spec.js` — WhatsApp integration
- `mobile.spec.js` — mobile-specific tests (Pixel 5 viewport)

Config: `playwright.config.js` — runs Chromium desktop + Pixel 5 mobile projects.

**Run locally:**
```
npm ci
npx playwright test          # headless
npx playwright test --headed # watch
npx playwright show-report   # view last report
```

Local dev server starts automatically on port 8080 via the Playwright config.
