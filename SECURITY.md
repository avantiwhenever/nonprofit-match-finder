# Security

This is a small static site (no accounts, no user data, no backend) — see
README.md's "What it is" section for exactly what it does and doesn't
track.

## Reporting an issue

If you find a security issue (e.g. something that could expose data, or a
supply-chain concern in a dependency), please open a GitHub issue or reach
out via the LinkedIn link in the site's footer rather than a public PR
containing exploit details.

## What's already in place

- No secrets, credentials, or `.env` files in this repo — verified before
  the repo was made public.
- GitHub secret scanning + push protection enabled on this repo.
- Dependabot security updates enabled for both npm (`app/`) and the GitHub
  Actions workflows themselves (`.github/dependabot.yml`).
- CodeQL static analysis runs on every push to `main` and weekly
  (`.github/workflows/codeql.yml`).
- A Content-Security-Policy is set in `app/index.html`, scoped to the exact
  external hosts this app actually calls (Google Fonts, OpenStreetMap tiles,
  and the free visit-counter API in the footer) — nothing else is allowed to
  load.
- All external links (`target="_blank"`) use `rel="noopener noreferrer"`.
- No `dangerouslySetInnerHTML`, `eval`, or `innerHTML` usage anywhere in the
  app — all rendered data goes through React's normal escaping.
