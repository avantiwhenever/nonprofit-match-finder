# Session Log

A running, append-only log of what got done in each work session on this
repo — kept separate from the README/HOWTO (which document current state
and how-to's, not history) so the actual sequence of decisions stays
reviewable later. Newest entry on top.

---

## 2026-08-31 — Website-verification pass, org/job link UI, unverified-org filtering

**Starting state:** 203 verified websites in `scripts/verified-websites.json`
(uncommitted diff already on disk with 9 new entries from a prior session),
67 of 269 ProPublica-sourced orgs still lacking a verified website.

**Steps, in order:**

1. Reviewed the uncommitted `verified-websites.json` diff (9 new sites) and
   computed the unverified count (67 of 269). Committed the diff as its own
   commit: `894d4b5` — "Verify websites for 9 more nonprofits (203 total)".

2. Added org-website links to job and opportunity cards, plus a derived
   "Job posting source →" link for jobs whose apply address is a `mailto:`
   pointing at a different domain than the org's own site (fiscal
   sponsor/staffing partner). New file `app/src/lib/mailto.ts`; threaded an
   existing `orgById` lookup map down through `JobList`/`OpportunityList`
   into `JobCard`/`OpportunityCard`. Typechecked and built clean. Committed:
   `790d840`.

3. Pushed both commits to `origin/main`.

4. Ran a full research pass over all 67 remaining unverified orgs via web
   search — confirmed real websites for 47 of them, and identified 4 that
   don't belong in the directory at all:
   - `pp-810463482` "Providence St Joseph Medical Center" — actually the
     Burbank, CA hospital, filed under a shared Renton, WA tax-department
     address
   - `pp-911861964` "Providence Plan Partners" and `pp-454171900` "Western
     Healthconnect" — internal Providence administrative entities at the
     same shared address, no distinct public-facing presence
   - `pp-462626883` "Amazonsmile Foundation" — program discontinued and
     entity terminated in 2023

   Added the 4 to `EXCLUDED_IDS` in `scripts/fetch-orgs.mjs` (each with a
   one-line reason). Re-ran `node scripts/fetch-orgs.mjs`; the exclusions
   freed 4 budget slots in the per-NTEE-group scrape cap, which backfilled
   4 different, previously-uninspected orgs (Global Health Labs, Provail,
   Samis Foundation, Therapeutic Health Services) — researched and verified
   all 4 of those too. Typechecked and built clean. Committed: `63fe66c`.

5. Closed 3 more of the remaining backlog: Gates Foundation Trust (its own
   page on gatesfoundation.org), The Association of CHRMC and University
   Physicians (its real operating identity, Children's University Medical
   Group, on seattlechildrens.org), and ERTV Compliance Group (the page on
   Marine Exchange of Puget Sound, which administers it). Re-ran the
   pipeline, typechecked, built, committed: `1001b20`. Pushed all three
   commits.

   Result at this point: 253 of 269 ProPublica orgs verified; 13 remaining
   (confirmed via direct search to be private foundations/trusts with no
   public website, or corporate CSR programs with no page dedicated to the
   foundation entity itself).

6. Mid-session, redirected to a product change: **orgs without a verified
   website should not be shown to the user at all**, rather than shown with
   a constructed Google-search fallback link. Changed `fetch-orgs.mjs` to
   skip any ProPublica org lacking a `verified-websites.json` entry when
   building `orgs.json`, instead of writing it in with `website: null`.
   Re-ran the pipeline: total shipped orgs went from 274 to 261 (5 curated +
   256 ProPublica-verified — the 13 still-unverified orgs from step 5 are
   now excluded from the shipped directory, not just flagged). Confirmed
   `orgs.filter(o => !o.website).length === 0`. Typechecked and built clean.

7. Documentation pass (this step): added a "Harder problems solved" section
   to `README.md` (hidden ATS widgets, the ProPublica website/mission gap,
   the shared-tax-address false positives, the defunct AmazonSmile entity,
   mismatched mailto domains, cross-source duplicate orgs, the
   budget-capped scraper's backfill behavior, and a React 18 StrictMode
   pagination bug from an earlier session); updated the stale "275 orgs"
   count and the "most cards link to a constructed search" language to
   match the new verified-only behavior; added `HOWTO.md`, a step-by-step
   guide covering install → dev server → typecheck/build → regenerating org
   data → the manual website-verification workflow → checking for hidden
   ATS listings → adding curated opportunities/jobs → deploying; and this
   file, to keep a durable, chronological record of what was actually done
   in each session (distinct from the README/HOWTO's "current state"
   framing).

**Net result this session:** verified-websites count 203 → 253; 4 orgs
excluded as not genuinely WA-serving/active; shipped directory now shows
only orgs with a real, hand-verified website (261 total, down from 274,
since the remaining 13 unverified orgs are now left out rather than shown
with a fallback search link); org/job cards now link to the organization's
own site; mailto-based job applications link to their real source domain
separately.
