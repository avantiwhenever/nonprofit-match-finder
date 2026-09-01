# Harder Problems Solved

A few of the trickier issues this project has actually run into, for anyone
gauging how much is really behind a "static directory site." See
[`SESSION_LOG.md`](./SESSION_LOG.md) for exactly when each of these landed,
and [`HOWTO.md`](./HOWTO.md) for how to run the tools mentioned below.

- **Hidden ATS widgets.** `voaww.org/jobs` and `bgcsc.org/employment/` both
  looked like they had zero openings on a plain fetch — both load their real
  listings via JavaScript into an embedded ATS iframe (Paycom, ADP) that
  never executes on a static HTML fetch. Rendering with a real headless
  browser (Playwright) revealed 22 real VOAWW jobs and 9 real BGCSC jobs that
  were otherwise invisible. Formalized as reusable dev tools
  (`scripts/deep-fetch.mjs`, and its Crawlee-based upgrade
  `scripts/crawlee-fetch.mjs`, which auto-discovers volunteer/careers links
  and follows ATS iframes with no prior knowledge of the URLs involved —
  verified against bastyr.edu, where it found the hidden Paycom chain
  (`/about/jobs` → paycomonline.net → the real career-page iframe) with no
  prior knowledge of any of those URLs). Cocoon House had a related issue at
  smaller scale: its own `/employment` page's text, fetched statically,
  turned out slightly stale/imprecise on shift locations compared to its
  live Paylocity board — corrected against the authoritative source once
  found.

- **A primary data source with real, load-bearing gaps.** ProPublica's
  Nonprofit Explorer API — confirmed live, not assumed from docs — has *no
  website field and no mission text* on either its search or org-detail
  endpoints. Closing that gap required building a whole manual
  verification pipeline (`scripts/verified-websites.json` +
  `fetch-orgs.mjs`), and it's the actual reason the shipped directory only
  covers 261 orgs today rather than everything ProPublica returns for the
  pilot cities — an org without a hand-confirmed real site is left out of
  the directory rather than shown with just a constructed search link. The
  equivalent fallback on the *volunteer-page* link (a constructed
  `site:<host> volunteer` Google search) was removed for the same reason —
  a link that just reroutes to a search a visitor could've typed themselves
  isn't a real, actionable listing.

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

- **A card's free-text tag forcing the whole card to overflow.** A job's
  `employmentType` is free text pulled from each org's own careers page and
  can run long ("Part-time (remote eligible, US only, excluding
  AK/CA/HI/NY)") — reusing the short cause-label tag's `white-space: nowrap`
  styling forced the card wider than its grid column. Allowing the tag to
  wrap introduced a second bug — a *short* tag like "Full-time" got squeezed
  so narrow it broke mid-word ("Full-tim-e"). Fixed by letting the card's
  header row wrap (`flex-wrap: wrap`) so a tag that doesn't fit next to the
  title drops to its own line at a natural width, instead of being squeezed
  into whatever space was left. Long unbroken strings elsewhere in a card
  (a contact email was the concrete case) get the same protection via one
  inherited `overflow-wrap: break-word` on `.org-card`, rather than a
  per-class fix that has to be remembered every time.
