# Nonprofit Match Finder

A pilot tool for finding nonprofits to volunteer with in the Seattle area,
built for people between jobs looking for community, structure, and social
impact while job hunting. See [`RECOMMENDATIONS.md`](./RECOMMENDATIONS.md)
for the full architecture/roadmap and [`RESEARCH.md`](./RESEARCH.md) for the
background research (competitive landscape, data sources, employment stats,
grants).

## What this is right now (v0)

A static, account-free directory with three tabs: **Nonprofits** (browse/
search by cause and location), **Volunteer Opportunities**, and **Paid
Jobs**. A County filter (King / Snohomish / Both) applies across all three.
Every card links out to that organization's own site — this is a discovery
tool, not a booking system. Nothing is tracked.

The Nonprofits tab covers 261 orgs (broad but shallow — name/cause/location
only, from ProPublica) — every one has a hand-verified real website; orgs
`fetch-orgs.mjs` can't verify a real site for are left out of the shipped
directory entirely rather than shown with just a constructed Google-search
link (see "Verifying nonprofit websites" below). The Volunteer Opportunities
and Paid Jobs tabs are
narrower but deep: real, individually-detailed listings (schedule,
commitment, requirements, pay, sign-up links) hand-pulled from just the 5
curated orgs' actual websites — see `scripts/curated-opportunities.json`
and `scripts/curated-jobs.json`. Growing that list further is a manual,
one-org-at-a-time process for now (see RECOMMENDATIONS.md for why).

### Checking a new org's page for hidden listings

Some careers/volunteer pages look empty on a plain fetch but actually load
their real listings via JavaScript into an embedded ATS widget (this bit us
with VOAWW's Paycom board and BGCSC's ADP board — both looked like zero
openings until rendered for real). Two dev-only tools for this, neither a
project dependency (kept out of package.json to avoid bloating the deployed
app — install either on demand):

**`scripts/crawlee-fetch.mjs`** (preferred) — give it just an org's homepage
and it automatically discovers and follows likely volunteer/careers links
itself, then reports any embedded iframes and follows one hop further if a
page links out to an external ATS domain (`paycomonline.net`,
`workforcenow.adp.com`, `icims.com`, `myworkday.com`, etc. — see the pattern
list in the script). Verified against bastyr.edu, where it found the hidden
Paycom chain (`/about/jobs` → paycomonline.net → the real career-page
iframe) with no prior knowledge of any of those URLs.

```bash
npm install --no-save crawlee playwright && npx playwright install chromium
node scripts/crawlee-fetch.mjs https://example.org
```

Crawlee itself is free and open-source (MIT) — no Apify account or paid
service required.

**`scripts/deep-fetch.mjs`** (fallback) — the original, simpler tool: renders
exact URLs you already know to check and reports their iframes, without any
automatic link-following. Kept as a backup in case crawlee-fetch.mjs proves
less reliable in practice.

```bash
npm install --no-save playwright && npx playwright install chromium
node scripts/deep-fetch.mjs https://example.org/careers
```

**Known limitation, by design**: the primary data source (ProPublica's
Nonprofit Explorer API) has organization-level data only — no individual
opportunity listings, no schedules, no paid/unpaid distinction, no
volunteering requirements, and (see "Verifying nonprofit websites" below)
no website field either. Every org shown in the Nonprofits tab has a real,
hand-verified homepage link, but most still link to their *specific*
volunteer page via a constructed, site-scoped search ("Search for their
volunteer page →") rather than a verified direct link — ProPublica's data
just doesn't go that deep. A small hand-curated set of local orgs
(`scripts/curated-orgs.json`) has a real, verified direct volunteer-page
link instead — those cards say "Volunteer page →". Closing this gap at scale
is gated on getting Idealist Open Network API access (see
RECOMMENDATIONS.md).

## Running this locally

```bash
cd app
npm install
npm run dev
```

For the full guide — typechecking/building, regenerating the org data,
verifying a nonprofit's website, checking a careers page for hidden ATS
listings, adding curated opportunities/jobs, and deploying — see
[`HOWTO.md`](./HOWTO.md).

## Harder problems solved

A few of the trickier issues this project has actually run into, for anyone
gauging how much is really behind a "static directory site":

- **Hidden ATS widgets.** `voaww.org/jobs` and `bgcsc.org/employment/` both
  looked like they had zero openings on a plain fetch — both load their real
  listings via JavaScript into an embedded ATS iframe (Paycom, ADP) that
  never executes on a static HTML fetch. Rendering with a real headless
  browser (Playwright) revealed 22 real VOAWW jobs and 9 real BGCSC jobs that
  were otherwise invisible. Formalized as reusable dev tools
  (`scripts/deep-fetch.mjs`, and its Crawlee-based upgrade
  `scripts/crawlee-fetch.mjs`, which auto-discovers volunteer/careers links
  and follows ATS iframes with no prior knowledge of the URLs involved).

- **A primary data source with real, load-bearing gaps.** ProPublica's
  Nonprofit Explorer API — confirmed live, not assumed from docs — has *no
  website field and no mission text* on either its search or org-detail
  endpoints. Closing that gap required building a whole manual
  verification pipeline (`scripts/verified-websites.json` +
  `fetch-orgs.mjs`), and it's the actual reason the shipped directory only
  covers 261 orgs today rather than everything ProPublica returns for the
  pilot cities — an org without a hand-confirmed real site is left out of
  the directory rather than shown with just a constructed search link.

- **Shared tax-filing addresses masking out-of-state orgs as local ones.**
  Several nationwide Providence Health hospitals — in Burbank CA, Santa
  Rosa CA, Lubbock TX, Montana, Oregon, Southern California — file their
  IRS paperwork under one shared Renton, WA tax-department address, which
  makes ProPublica's city-filtered search return them as if they were
  WA-serving orgs. Caught by cross-referencing conflicting location
  signals across sources, and now handled with an explicit, documented
  `EXCLUDED_IDS` list in `fetch-orgs.mjs` (with a one-line reason per
  entry) rather than a silent drop that a future re-scrape could undo.

- **Defunct entities that still show up as "active."** AmazonSmile
  Foundation is still IRS-registered in Washington years after the
  AmazonSmile program was discontinued and the entity terminated (2023) —
  excluded explicitly rather than presented to a user as something they
  could actually engage with today.

- **Job listings whose apply-by-email address belongs to someone else's
  domain.** Several hand-curated jobs' `mailto:` apply address resolves to
  a different domain than the hiring org's own site — a fiscal sponsor or
  staffing partner handling the posting on the org's behalf. Solved by
  deriving that domain from the address and surfacing it as its own "Job
  posting source →" link (`app/src/lib/mailto.ts`), instead of quietly
  presenting it as if it were the org's own site.

- **Duplicate orgs across two different data sources.** The same real
  organization (e.g. Boys & Girls Clubs of Snohomish County) can appear
  under both a hand-curated id and a separately-scraped ProPublica id.
  Deduping on id alone missed this; fixed by deduping on *normalized name*
  instead (case, `&`/`and`, punctuation folded).

- **A budget-capped scraper's backfill behavior.** `fetch-orgs.mjs` caps
  how many orgs it pulls per NTEE cause-category per run
  (`MAX_ORGS_PER_GROUP`). Excluding an org — or an org losing its verified
  website — doesn't shrink the directory by one; it frees a budget slot
  that the next scrape fills with a different, previously-uninspected org.
  Worth knowing before assuming an exclusion or a stricter filter only
  removes what it targeted — it can surface brand-new orgs that also need
  verifying.

- **A React 18 StrictMode footgun in URL-synced pagination.** An
  effect-based "is this the first render" guard for resetting pagination
  on filter changes silently broke under StrictMode's dev-mode double
  effect invocation, wiping out a page number just restored from the URL
  right after mount. Fixed with React's documented "compare the previous
  value during render" pattern instead of an effect, which has no such
  double-invocation failure mode.

## Deploying

The app is a static build (`npm run build` in `app/`, output in `app/dist/`).
Either works, unmodified:

- **Vercel** (recommended): import the repo, set the root directory to `app`,
  framework preset "Vite" — free tier, no config needed.
- **GitHub Pages**: enable Pages on the repo, pointed at a workflow that
  builds `app/` and publishes `app/dist/`.

## Roadmap

See [`RECOMMENDATIONS.md`](./RECOMMENDATIONS.md) — next up is Idealist API
integration (real opportunity-level listings, schedules, paid/unpaid tags,
requirements), then LLM-based ranking (interest + availability → ranked
shortlist, inspired by [GenRec](https://arxiv.org/abs/2608.10257)), then
accounts/tracking only if a real need for it emerges.
