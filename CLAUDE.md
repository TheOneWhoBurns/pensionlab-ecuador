# PensionLab

Static website deployed on AWS EC2 (t2.micro).

## Infrastructure

- **Hosting**: AWS EC2 t2.micro instance
- **Deployment**: rsync over SSH from GitHub Actions
- **Serving**: Static files (HTML/CSS/JS) served via web server on EC2
- **GitHub Secrets required**:
  - `EC2_SSH_KEY` — private key for SSH access
  - `EC2_HOST` — EC2 public IP/hostname
  - `EC2_USER` — SSH user (e.g. `ec2-user` or `ubuntu`)
  - `DEPLOY_PATH` — absolute path on EC2 where files are served from

## CI/CD Pipeline

Defined in `.github/workflows/ci.yml`. Triggers on push to `main` and PRs to `main`.

**Two jobs:**

1. **test** — Runs the full Playwright QA suite on ubuntu-latest (Node 20)
2. **deploy** — Runs only on push to `main`, after tests pass. Uses rsync to sync the repo to EC2 via SSH, excluding dev-only files (tests, node_modules, .github, etc.)

Deployments are automatic: merge to `main` → tests pass → deploy to EC2.

## QA Pipeline

Playwright test suite in `/tests/` with 8 spec files:

- `nav.spec.js` — navigation, sticky nav, sidebar, CTA scrolling
- `cookie-consent.spec.js` — cookie consent banner
- `form-minima.spec.js` — minimal form validation, submission, localStorage, honeypot
- `form-rapida.spec.js` — quick form
- `form-detallada.spec.js` — detailed form
- `form-version-switcher.spec.js` — form version switching
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
