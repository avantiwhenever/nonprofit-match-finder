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

The Nonprofits tab covers 275 orgs (broad but shallow — name/cause/location
only, from ProPublica). The Volunteer Opportunities and Paid Jobs tabs are
narrower but deep: real, individually-detailed listings (schedule,
commitment, requirements, pay, sign-up links) hand-pulled from just the 5
curated orgs' actual websites — see `scripts/curated-opportunities.json`
and `scripts/curated-jobs.json`. Growing that list further is a manual,
one-org-at-a-time process for now (see RECOMMENDATIONS.md for why).

**Known limitation, by design**: the primary data source (ProPublica's
Nonprofit Explorer API) has organization-level data only — no individual
opportunity listings, no schedules, no paid/unpaid distinction, no
volunteering requirements. Most cards therefore link to a constructed search
("Search for their volunteer page →") rather than a verified direct link. A
small hand-curated set of local orgs (`scripts/curated-orgs.json`) has real
verified mission text and direct volunteer-page links — those cards say
"Volunteer page →" instead. Closing this gap at scale is gated on getting
Idealist Open Network API access (see RECOMMENDATIONS.md).

## Local setup

```bash
cd app
npm install
npm run dev
```

## Regenerating the org data

```bash
node scripts/fetch-orgs.mjs
```

Pulls from ProPublica's Nonprofit Explorer API (filtered to Washington State,
across several NTEE cause categories, restricted to the pilot-area cities
listed in `scripts/fetch-orgs.mjs`), merges in the hand-curated orgs from
`scripts/curated-orgs.json`, and writes `app/src/data/orgs.json`. A GitHub
Actions workflow (`.github/workflows/refresh-data.yml`) runs this nightly
and commits any changes automatically.

To add another hand-curated org (one with a real, verified volunteer page),
add an entry to `scripts/curated-orgs.json` matching the existing shape and
re-run the script — curated entries always survive a re-scrape.

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
