# How to Run This Project Locally

A step-by-step guide to getting the app running, regenerating its data, and
extending it on your own machine. For the "why" behind these choices, see
[`RECOMMENDATIONS.md`](./RECOMMENDATIONS.md); for a summary of the harder
problems this project has already run into and solved, see the
["Harder problems solved"](./README.md#harder-problems-solved) section of
the README.

## Prerequisites

- Node.js 20+ (the repo's GitHub Actions workflow pins `20`; any newer LTS
  works fine locally too)
- npm (ships with Node)
- No API keys, accounts, or paid services needed for any of the steps below

## 1. Clone and install

```bash
git clone https://github.com/avantiwhenever/nonprofit-match-finder.git
cd nonprofit-match-finder/app
npm install
```

All frontend work happens inside `app/`. The repo root (`scripts/`) holds the
Node.js data-pipeline scripts, which have no `npm install` step of their own
— they only use built-in `fetch`/`fs` plus, occasionally, a couple of
on-demand dev tools (see step 5).

## 2. Run the dev server

```bash
# from app/
npm run dev
```

Opens a Vite dev server (defaults to `http://localhost:5173`, picks the next
free port if that's taken) with hot reload. The app reads its data from the
static JSON files already checked into `app/src/data/` (`orgs.json`,
`opportunities.json`, `jobs.json`) — you don't need to run the scraper just
to browse the app locally.

## 3. Typecheck and build

```bash
# from app/
npx tsc --noEmit   # typecheck only, fast
npm run build      # tsc -b && vite build — full production build to app/dist/
npm run lint       # oxlint
```

Run `npm run build` before committing any change to `app/src/` — it's the
same check CI would fail on, and it catches type errors the dev server's
fast-refresh can silently paper over.

## 4. Regenerate the org data

```bash
# from the repo root
node scripts/fetch-orgs.mjs
```

Pulls Washington nonprofits from ProPublica's Nonprofit Explorer API
(filtered to the pilot-area cities in `scripts/fetch-orgs.mjs`'s
`PILOT_CITIES`), merges in the 5 hand-curated orgs from
`scripts/curated-orgs.json`, and rewrites all three of:

- `app/src/data/orgs.json`
- `app/src/data/opportunities.json`
- `app/src/data/jobs.json`

**An org only ships in `orgs.json` if it has a verified real website** (see
step 5) — ProPublica itself has no website field, and an org this pipeline
can't verify a real site for is left out of the directory entirely rather
than shown with just a constructed Google-search link. A GitHub Actions
workflow (`.github/workflows/refresh-data.yml`) runs this same script
nightly and auto-commits any changes.

## 5. Verify a nonprofit's website (the manual research step)

This is the one part of the pipeline that isn't automated — ProPublica's API
has no website field, so someone has to actually find and confirm each org's
real site by hand. The workflow:

**a. List what's still unverified:**

```bash
node -e "
const orgs = require('./app/src/data/orgs.json');
const verified = require('./scripts/verified-websites.json');
// orgs.json only contains already-verified orgs (see step 4) — to see the
// full unverified backlog, re-run fetch-orgs.mjs against the *scraped*
// candidate set instead, or just search ProPublica directly by name/city
// for a candidate org you already know about.
console.log(Object.keys(verified).length, 'verified so far');
"
```

Since unverified orgs are filtered out of `orgs.json` (step 4), the working
list of "what's left" lives implicitly in ProPublica's own search results
for the pilot cities, cross-referenced against `scripts/verified-websites.json`'s
keys — anything with a `pp-<ein>` id not already a key there is a candidate.

**b. Search for the org's real website.** Confirm it's actually the same
org (matching city/mission), not a same-named org elsewhere, and not a
shared administrative address masking an out-of-state entity (see "Harder
problems solved" in the README for a real example of this).

**c. Add a confirmed entry** to `scripts/verified-websites.json`:

```json
"pp-123456789": "https://www.example-nonprofit.org"
```

**d. If an org turns out not to be a real, distinct WA-serving org** (wrong
location, a defunct/terminated entity, a financing vehicle, etc.), exclude
it explicitly instead of just leaving it unverified — add its id to
`EXCLUDED_IDS` in `scripts/fetch-orgs.mjs`, with a one-line comment
explaining why. This keeps the reasoning visible and durable across
re-scrapes, rather than silently dropped.

**e. Re-run the pipeline and verify:**

```bash
node scripts/fetch-orgs.mjs
cd app && npx tsc --noEmit && npm run build
```

**f. Commit** `scripts/verified-websites.json`, `scripts/fetch-orgs.mjs` (if
you touched `EXCLUDED_IDS`), and the regenerated `app/src/data/orgs.json`
together.

## 6. Checking an org's careers/volunteer page for hidden listings

Some pages look empty on a plain fetch but load their real listings via
JavaScript into an embedded ATS widget (see "Harder problems solved" in the
README). Two dev-only tools, neither an `npm` dependency of the deployed app
— install on demand:

```bash
# preferred — auto-discovers volunteer/careers links and follows ATS iframes
npm install --no-save crawlee playwright && npx playwright install chromium
node scripts/crawlee-fetch.mjs https://example.org

# fallback — renders exact URLs you already know to check
npm install --no-save playwright && npx playwright install chromium
node scripts/deep-fetch.mjs https://example.org/careers
```

## 7. Adding a real, individually-detailed opportunity or job listing

Opportunity/job-level listings (schedule, commitment, pay, apply links) are
hand-curated only, pulled directly from an org's real volunteer/careers
page — add an entry to `scripts/curated-opportunities.json` or
`scripts/curated-jobs.json` matching the existing shape, then re-run
`node scripts/fetch-orgs.mjs` (step 4) to merge it into
`app/src/data/`.

## 8. Deploying

The app is a static build — nothing here needs a server.

```bash
cd app && npm run build   # output in app/dist/
```

- **Vercel** (recommended): import the repo, set the root directory to
  `app`, framework preset "Vite" — free tier, no config needed.
- **GitHub Pages**: enable Pages on the repo, pointed at a workflow that
  builds `app/` and publishes `app/dist/`.
