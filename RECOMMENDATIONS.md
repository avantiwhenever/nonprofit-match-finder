# Recommendations & Project Status

Last updated: 2026-08-31. See [`SESSION_LOG.md`](./SESSION_LOG.md) for a
chronological, session-by-session record of changes; this doc stays a
point-in-time status/roadmap summary rather than a full history.

## Project summary

A hyperlocal volunteer + nonprofit-job matching site, piloting in Seattle-area
Puget Sound communities (Lynnwood, Bothell, Mill Creek, Bellevue, Redmond, and
surrounding Washington counties). Primary audience: people who are between
jobs, looking for structure, social connection, and social impact while job
hunting — with nonprofit volunteering as a pathway to both community and,
sometimes, paid employment at the same organizations. Ranking approach is
inspired by Netflix's GenRec paper (arxiv.org/abs/2608.10257): an LLM-backed
ranker that matches people to opportunities using free-text interests +
availability, rather than rigid keyword filters.

Three product legs, all in scope for the pilot:
1. Volunteer opportunity matching (interest + schedule based)
2. Paid nonprofit job listings at the same orgs (the "graduate to employment" track)
3. Completion certificates (confirmed by the nonprofit, downloadable/shareable proof of hours + skills)

Target scale: 10-100 users/month. Constraint: free-tier infrastructure only,
website first (no native app yet).

## Recommended MVP architecture

| Piece | Recommendation | Why |
|---|---|---|
| Frontend | React (Vite), **deployed and live on GitHub Pages** (`.github/workflows/deploy-pages.yml`, deploys on every push to `main`) | Reusable later via React Native/Capacitor for iOS/Android. GitHub Pages was chosen over Vercel specifically so the repo could stay under `gh` CLI control end-to-end with no external account/login — the tradeoff is GitHub Pages requires the repo to be public on the free plan, so the repo was made public (see "v0 status" below) |
| Backend | None initially. When needed: Cloudflare Workers or Vercel Functions (free tier) | A JVM backend (Spring Boot) needs ~300-500MB RAM and has slow cold starts on free hosting tiers (30-60s after idle sleep) — not worth it at this scale yet |
| Search | Static JSON index + client-side search (Fuse.js) | No live query endpoint means nothing for bots to hammer or rate-limit; doubles as the "flat file that can move to a real index later" |
| Scraper / data refresh | GitHub Actions scheduled workflow (free cron), pulling from open APIs only | Free at this volume; use official APIs (Idealist Open Network API, ProPublica Nonprofit Explorer API, Data.gov) — do not scrape sites like Indeed/LinkedIn whose ToS forbid it |
| User data (accounts, saved items, applications, certificates) | **Deferred, not in v0.** When needed: Supabase free tier (Postgres + built-in Auth + 500MB storage) | Explicit product decision, not an oversight: v0 tracks nothing (see README.md's "What this is right now" section for the click-through flow). No credit card required when this comes back; one service covers auth + data + storage |
| Logging | Hosting platform's built-in log viewer for now; Grafana Cloud free tier when centralized logging is actually needed | Datadog free tier is 1-day retention/5 hosts; self-hosted ES needs a paid server — both are premature at this scale |
| Secrets | GitHub Actions secrets + Vercel/Supabase environment variables | Built-in, encrypted, free; a dedicated secrets manager is a team-scale problem |
| Maps | Leaflet.js + OpenStreetMap tiles | Free, no API key, no billing account required (unlike Google Maps) |
| Containerization | Docker for whatever backend eventually exists | Costs nothing, keeps the option to move off free tier portable |
| Certificates | **Deferred, not in v0** — same as user data above. When needed: serverless function generates a PDF once a nonprofit confirms hours | No extra service needed |
| Repo/dependency security | GitHub's free-for-public-repos suite: secret scanning + push protection, Dependabot security updates, weekly CodeQL scan (`.github/workflows/codeql.yml`, `.github/dependabot.yml`) | Zero cost, zero extra service, appropriate now that the repo is public (see "v0 status"); details in `SECURITY.md` |
| Visit counter | Free public counter API (`abacus.jasoncameron.dev`), called client-side from the footer | The only "tracking" in the app, and it's a single anonymous hit count, not per-user — matches the "no accounts/no tracking" decision below while still surfacing basic traffic |

## Roadmap (add when workload justifies it)

- **Live backend for LLM ranking** — needed once ranking logic requires hiding an API key or doing server-side reasoning; start with Cloudflare Workers/Vercel Functions before Spring Boot
- **Spring Boot** — reasonable if there's a specific reason to use/learn it; revisit once there's steady traffic that justifies an always-on paid-tier instance (avoids free-tier JVM cold-start problems)
- **Centralized logging** — Grafana Cloud free tier first, Datadog later if scale demands it
- **Elasticsearch** — once the opportunity/job dataset is large enough that client-side JSON search is slow (thousands of listings, not the dozens-to-hundreds expected at launch)
- **Native iOS/Android** — wrap the React app via React Native/Capacitor; no rearchitecture needed if the web app stays disciplined about component structure now
- **Dedicated secrets manager, multi-region infra** — team/compliance-scale concerns, not pilot-scale

## Data sources (see RESEARCH.md for full detail)

- **Idealist Open Network API** — still the primary target for opportunity-
  and job-level data at scale (~100k listings, 250k+ orgs) — that part of
  the gap is unchanged and still gated on API access.
- **ProPublica Nonprofit Explorer API** — org identity + cause code: EIN,
  name, city/state, street address, NTEE code, raw Form 990 financials.
  **No mission text, no website field** — confirmed via live API calls,
  corrects earlier secondary-source research. See RESEARCH.md.
  **Update**: the website-field gap turned out to be closable by hand at
  this scale rather than only via Idealist — a manual verification pass
  (`scripts/verified-websites.json`, documented in `HOWTO.md`) has now
  confirmed real websites for 257 orgs. `fetch-orgs.mjs` also now *excludes*
  an org from the shipped directory entirely if it has no verified website,
  rather than showing it with a constructed Google-search fallback (see "v0
  status" below) — so Idealist is no longer strictly required to close this
  particular gap, just to make it lower-effort at a larger scale than King +
  Snohomish County.
- **Data.gov** — confirmed dead as of 2026-08-27 (`catalog.data.gov`'s CKAN API 404s on every endpoint). Kept as a non-blocking best-effort step in case it's restored.

## v0 status (as of 2026-08-31)

Built and working: static React (Vite) app, `scripts/fetch-orgs.mjs` pulling
275 WA nonprofits from ProPublica (filtered to the pilot-area cities) plus 5
hand-verified curated orgs with real volunteer-page links, client-side
search/filter (Fuse.js), a Leaflet/OSM map with city-level pins, and a
nightly GitHub Actions refresh workflow. Verified end-to-end in a real
browser (Playwright), not just a successful build.

**Second pass added (same day)**: individual volunteer opportunity and paid
job listings, hand-pulled directly from each of the 5 curated orgs' real
volunteer/careers pages (`scripts/curated-opportunities.json` — 16 real
opportunities with schedule/commitment/requirements/sign-up links;
`scripts/curated-jobs.json` — 41 real jobs across the 4 orgs). The app now
has three tabs (Nonprofits / Volunteer Opportunities / Paid Jobs), plus a
County filter (King / Snohomish / Both) — both explicit product decisions,
not automated at directory scale. Deliberately scoped to just the 5
already-curated orgs rather than attempted across all 275 ProPublica-sourced
ones, since most of those don't even have a known website (see the
ProPublica gap above) — visiting 275 unknown sites isn't something to
automate reliably yet. Growing this list is manual, one real org at a time,
until Idealist access replaces it with a real feed.

**Third pass (same day) — a real gotcha, now handled systematically**:
`voaww.org/jobs` and `bgcsc.org/employment/` both initially looked like they
had zero open positions. They don't — a plain HTML fetch just can't see
their listings, because both load them via JavaScript into an embedded ATS
widget (Paycom for VOAWW, ADP for BGCSC) that never executes on a static
fetch. Rendering the page with a real headless browser revealed the iframe,
and the iframe's own URL was the actual listings source: 22 real VOAWW jobs
and 9 real BGCSC jobs, previously invisible. Cocoon House had a related
issue at smaller scale: its own `/employment` page's text (fetched
statically) turned out slightly stale/imprecise on shift locations compared
to its live Paylocity board — corrected against the authoritative source
once found.

This is now a formalized, reusable check: `scripts/deep-fetch.mjs` renders
any URL with a real browser and reports every embedded iframe, so this
pattern gets caught instead of silently missed next time. It's a dev tool,
not part of the automated nightly pipeline — see its header comment and the
README for usage. Applying it retroactively to the other pages already
scraped (LNC, childcare, Cocoon House's root/volunteer pages, ChildStrive's
volunteer page) found nothing else hidden — those were already complete.
One more finding from that pass: the ChildStrive PDF link provided
(`KPL-Calendar-26-27.pdf`) turned out to be a parent/caregiver "Play &
Learn" group calendar, not a volunteer or job listing — read, confirmed
irrelevant to this data model, not force-fit into it.

Two things surfaced during implementation that the original research got
wrong — corrected in RESEARCH.md:
- **ProPublica has no mission-text or website field**, on either its search
  or org-detail endpoints (earlier research, from secondary sources, said it
  did). Product workaround: most cards link out via a constructed Google
  search ("Search for their volunteer page →") instead of a verified direct
  link; only the 5 curated orgs get a real "Volunteer page →" link. This is
  the actual argument for prioritizing Idealist API access — it's not just
  about opportunity-level data, it's the only free path to verified org
  websites at scale.
- **catalog.data.gov's CKAN API is dead** (404 on every endpoint, including
  a basic health check), despite the human-facing site being up. Kept as a
  non-blocking best-effort step in the scraper.

No accounts, database, or tracking in v0 — confirmed as an explicit product
decision (see README.md's "What this is right now" section for the
click-through flow), not an oversight.

**Fourth pass (same day) — UI: filters, radius search, pagination**: cause
filter now shows per-tab (its counts reflect whichever of
Nonprofits/Opportunities/Jobs is active, not always the org list — e.g. the
Jobs tab only shows the 2 causes jobs actually exist in, not all 9). Added
a "Search near me" radius filter (5/10/25/50 mi) using the browser's
geolocation API against the same city-centroid coordinates the map already
uses — deliberately city-level, not per-org geocoding, consistent with the
MapView tradeoff. Added pagination (20/page) to all three tabs, synced to
the URL as `?type=&page=` so a specific page is a real shareable/typeable
link — this needed a real fix mid-build: an effect-based "is this the first
render" guard for resetting pagination on filter changes silently broke
under React StrictMode's dev-mode double-effect-invocation, wiping out a
page number restored from the URL right after mount. Replaced with the
React-documented "compare previous prop in render" pattern, which doesn't
have that failure mode. Also removed the "mission" field from the org card
view entirely (per product decision — it's absent for 270 of 275 orgs
anyway, see the ProPublica gap above, and showing an apologetic placeholder
for missing data added clutter, not usable value).

One data correction from a user-provided link: Cocoon House's Front Desk
role is also subject to the org's "screening, background checks,
orientation, and training" requirement — Tech Center Volunteer already had
this captured, Front Desk was missing it. Fixed by re-reading the org's own
page rather than assuming symmetry between similar-sounding roles.

**Fifth pass (2026-08-31) — closed most of the website-verification
backlog, and stopped shipping unverified orgs at all**: ran a full research
pass over the remaining unverified ProPublica orgs, taking verified websites
from 203 to 257 and explicitly excluding 4 more orgs that don't actually
belong in a WA-serving directory (three internal Providence entities hiding
behind a shared Renton tax-filing address — same pattern as the Kadlec/
Covenant Health exclusions — plus AmazonSmile Foundation, whose program was
discontinued in 2023). Then went further than "verify more": changed
`fetch-orgs.mjs` to drop any org lacking a verified website from the
directory entirely, rather than shipping it with a constructed Google-search
link. For the same reason, removed the equivalent fallback on the
*volunteer-page* link (`org.volunteerUrl`) — a link that just reroutes to a
Google search isn't a real, actionable listing either. Only the 5 curated
orgs (which supply a real, hand-verified volunteer-page URL directly) get a
"Volunteer page →" link now; every other org just gets its verified "Visit
website →" link. Net effect: the directory shrank from 275 to 261 orgs, but
every single one now has a real website behind it — see `HOWTO.md` step 5
for the manual verification workflow this all runs on.

**Sixth pass (2026-08-31) — visual redesign**: reshaped the UI around a
distinctive, subject-specific direction — a civic library card-catalog look
(guide-tab cause labels, a circulation-stamp footer) rather than a generic
SaaS template, since this is literally a directory and one of its featured
orgs is the Seattle Public Library Foundation. New palette (white
background per explicit request, ledger green, one stamp-red accent, guide-
tab gold), new type system (Fraunces + Public Sans + IBM Plex Mono), and
`lucide-react` icons throughout (tabs, cause tags, search, filters, external
links). Full mobile-responsive pass verified at 390px width with zero
horizontal overflow. Found and fixed two real overflow bugs along the way —
a long `employmentType` string forcing a job card wider than its column, and
a long contact email bleeding out of an opportunity card — both traced to
missing `overflow-wrap` handling, now fixed at the shared `.org-card` level
so the same class of bug can't recur silently. Full detail in the README's
new "Harder problems solved" section.

**Seventh pass (2026-08-31) — the footer became the signature element, and
did triple duty**: a rotated circulation-stamp graphic shows a real,
site-wide visit count (the "Visit counter" row above) — the actual answer
to "add a free click tracker" — while also carrying a data-freshness note
(what data this is, and a LinkedIn link for update requests) and a © 2026
copyright line. Also added an "org's own website" link to every job and
opportunity card (previously only the Nonprofits tab linked out to the org
directly), plus a derived link to the real domain behind a job's `mailto:`
apply address when that domain differs from the org's own site (a fiscal
sponsor or staffing partner posted the listing on the org's behalf, in the
handful of cases this came up).

**Eighth pass (2026-08-31) — URL-synced filters**: extended the existing
`?type=&page=` URL sync to cover every filter that defines "what's being
browsed" — `?q=`, `?county=`, `?cause=`, `?radius=` — so a saved, shared, or
reloaded link reproduces the same filtered view, including distance (the
actual ask). Restoring distance still needs a fresh geolocation grant, since
a browser won't hand a page a location from a URL alone; a saved link with
`?radius=` re-requests it on load, which resolves silently if the browser
already granted this origin permission. Also added a plain-English summary
of active filters next to each tab's result count (e.g. "43 nonprofits for
King County, within 25 mi, Health").

**Ninth pass (2026-08-31) — deployed, and hardened for being public**:
deployed to GitHub Pages (see the architecture table above) — which
required making the repo public, since GitHub Pages isn't available for
private repos on the free plan. Checked for tracked secrets/credentials
first (none found) before flipping visibility. Once public, added the
safety measures documented in `SECURITY.md`: GitHub secret scanning + push
protection + Dependabot security updates enabled on the repo, a weekly
CodeQL scan, a Content-Security-Policy meta tag scoped to the exact external
hosts the app actually calls, and `rel="noopener noreferrer"` on every
external link. `npm audit` currently reports 0 vulnerabilities.

## Open questions / not yet decided

- Whether to formalize as a nonprofit (affects grant eligibility, see RESEARCH.md)
- Exact LLM provider/model for the ranking step, and how Phase 2 (ranking alignment) feedback signals get collected at low user volume
- Whether Verdant Health Commission's mental-health framing is worth pursuing as a grant angle, and whether a fiscal sponsor is needed
- Certificate format/design and what "confirmed by nonprofit" verification flow looks like operationally

## Next steps

1. ~~Scaffold the repo: React app + GitHub Actions scraper workflow~~ — done, see "v0 status" above
2. ~~Deploy v0 so it's actually usable, not just running locally~~ — done: live on GitHub Pages, see "v0 status" above
3. Get Idealist Open Network API access (application/approval may take time — start early; still the top blocker for opportunity/job-*level* data at scale — the org-website gap it was also meant to close turned out to be solvable by hand at this scale, see "Data sources" above)
4. Design the LLM ranking prompt (interest + availability → ranked shortlist) and test against sample data before wiring to live listings
5. Decide the curated-org list's growth path: keep hand-adding real local orgs to `scripts/curated-orgs.json`, or treat it as a stopgap fully superseded once Idealist access lands
6. Decide whether the manual website-verification pass (now 257 orgs deep) is worth continuing by hand for the last 13 remaining unverified orgs, or worth stopping there — they're mostly private foundations/trusts with no public website, a genuine dead end rather than a backlog
