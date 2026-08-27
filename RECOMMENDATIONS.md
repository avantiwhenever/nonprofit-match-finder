# Recommendations & Project Status

Last updated: 2026-08-27

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
| Frontend | React (Vite), hosted on Vercel free tier (or GitHub Pages) | Reusable later via React Native/Capacitor for iOS/Android; Vercel adds free serverless functions for when a backend is needed, without a platform migration |
| Backend | None initially. When needed: Cloudflare Workers or Vercel Functions (free tier) | A JVM backend (Spring Boot) needs ~300-500MB RAM and has slow cold starts on free hosting tiers (30-60s after idle sleep) — not worth it at this scale yet |
| Search | Static JSON index + client-side search (Fuse.js) | No live query endpoint means nothing for bots to hammer or rate-limit; doubles as the "flat file that can move to a real index later" |
| Scraper / data refresh | GitHub Actions scheduled workflow (free cron), pulling from open APIs only | Free at this volume; use official APIs (Idealist Open Network API, ProPublica Nonprofit Explorer API, Data.gov) — do not scrape sites like Indeed/LinkedIn whose ToS forbid it |
| User data (accounts, saved items, applications, certificates) | **Deferred, not in v0.** When needed: Supabase free tier (Postgres + built-in Auth + 500MB storage) | Explicit product decision, not an oversight: v0 tracks nothing (see README.md's "What this is right now" section for the click-through flow). No credit card required when this comes back; one service covers auth + data + storage |
| Logging | Hosting platform's built-in log viewer for now; Grafana Cloud free tier when centralized logging is actually needed | Datadog free tier is 1-day retention/5 hosts; self-hosted ES needs a paid server — both are premature at this scale |
| Secrets | GitHub Actions secrets + Vercel/Supabase environment variables | Built-in, encrypted, free; a dedicated secrets manager is a team-scale problem |
| Maps | Leaflet.js + OpenStreetMap tiles | Free, no API key, no billing account required (unlike Google Maps) |
| Containerization | Docker for whatever backend eventually exists | Costs nothing, keeps the option to move off free tier portable |
| Certificates | **Deferred, not in v0** — same as user data above. When needed: serverless function generates a PDF once a nonprofit confirms hours | No extra service needed |

## Roadmap (add when workload justifies it)

- **Live backend for LLM ranking** — needed once ranking logic requires hiding an API key or doing server-side reasoning; start with Cloudflare Workers/Vercel Functions before Spring Boot
- **Spring Boot** — reasonable if there's a specific reason to use/learn it; revisit once there's steady traffic that justifies an always-on paid-tier instance (avoids free-tier JVM cold-start problems)
- **Centralized logging** — Grafana Cloud free tier first, Datadog later if scale demands it
- **Elasticsearch** — once the opportunity/job dataset is large enough that client-side JSON search is slow (thousands of listings, not the dozens-to-hundreds expected at launch)
- **Native iOS/Android** — wrap the React app via React Native/Capacitor; no rearchitecture needed if the web app stays disciplined about component structure now
- **Dedicated secrets manager, multi-region infra** — team/compliance-scale concerns, not pilot-scale

## Data sources (see RESEARCH.md for full detail)

- **Idealist Open Network API** — primary source for both volunteer opportunities and paid nonprofit jobs (~100k listings, 250k+ orgs); also the only free path to verified org websites at scale, since ProPublica doesn't have one (see below)
- **ProPublica Nonprofit Explorer API** — org identity + cause code: EIN, name, city/state, street address, NTEE code, raw Form 990 financials. **No mission text, no website field** — confirmed via live API calls, corrects earlier secondary-source research. See RESEARCH.md.
- **Data.gov** — confirmed dead as of 2026-08-27 (`catalog.data.gov`'s CKAN API 404s on every endpoint). Kept as a non-blocking best-effort step in case it's restored.

## v0 status (as of 2026-08-27)

Built and working: static React (Vite) app, `scripts/fetch-orgs.mjs` pulling
275 WA nonprofits from ProPublica (filtered to the pilot-area cities) plus 5
hand-verified curated orgs with real volunteer-page links, client-side
search/filter (Fuse.js), a Leaflet/OSM map with city-level pins, and a
nightly GitHub Actions refresh workflow. Verified end-to-end in a real
browser (Playwright), not just a successful build.

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

## Open questions / not yet decided

- Whether to formalize as a nonprofit (affects grant eligibility, see RESEARCH.md)
- Exact LLM provider/model for the ranking step, and how Phase 2 (ranking alignment) feedback signals get collected at low user volume
- Whether Verdant Health Commission's mental-health framing is worth pursuing as a grant angle, and whether a fiscal sponsor is needed
- Certificate format/design and what "confirmed by nonprofit" verification flow looks like operationally

## Next steps

1. ~~Scaffold the repo: React app + GitHub Actions scraper workflow~~ — done, see "v0 status" above
2. Get Idealist Open Network API access (application/approval may take time — start early; this is now the top blocker for both opportunity-level data and verified org websites)
3. Deploy v0 (Vercel or GitHub Pages) so it's actually usable, not just running locally
4. Design the LLM ranking prompt (interest + availability → ranked shortlist) and test against sample data before wiring to live listings
5. Decide the curated-org list's growth path: keep hand-adding real local orgs to `scripts/curated-orgs.json`, or treat it as a stopgap fully superseded once Idealist access lands
