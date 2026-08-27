# Research

Last updated: 2026-08-27

## Source paper

**GenRec: An LLM-Backed Recommendation Ranker at Netflix**
https://arxiv.org/abs/2608.10257 (submitted 2026-08-10)
Authors: Ying Li, Shradha Sehgal, Arjun Rao, Rein Houthooft, Yaochen Zhu, Ashish Rastogi

Two-phase framework:
- **Phase 1 (domain adaptation)**: adapt an open-source LLM to Netflix's catalog and
  member behavior data, building content understanding + instruction following.
- **Phase 2 (ranking alignment)**: post-train the Phase-1 model with
  recommendation-ranking-specific data, labels, and reward signals, aligning
  the ranker to business requirements and long-term member satisfaction.

Result: in a large-scale A/B test (~10% of Netflix traffic), GenRec beat the
mature production baseline on both short- and long-term online metrics, while
using **10-40x fewer Phase-2 labeled training examples** and far fewer
hand-engineered features than the traditional ranker it replaced.

Relevance to this project: the 10-40x label efficiency is the key transferable
insight — a volunteer-matching ranker likely needs even less labeled data than
Netflix did, because the matching signal (skills/interests/availability →
opportunity) is mostly semantic and already within an LLM's zero-shot
reasoning ability, unlike entertainment taste. Phase 1's heavy domain
adaptation is probably less necessary here; Phase 2-style lightweight
feedback alignment (saved/applied/completed signals) is the more directly
useful piece.

Sources: https://arxiv.org/abs/2608.10257 ,
https://netflixtechblog.com/genrec-towards-llm-native-recommendation-at-netflix-f20be6f643e3

## Open data sources evaluated

| Source | What it provides | Access | Notes |
|---|---|---|---|
| Idealist Open Network API | ~100k volunteer opportunities + paid nonprofit jobs, 250k+ orgs | Free for nonprofit/CSR/gov use, requires application | Best primary source — covers both volunteer roles and paid nonprofit jobs in one place. https://solutions.volunteermatch.org/open-network-api |
| ProPublica Nonprofit Explorer API | EIN, name, city/state, street address, NTEE cause code, raw Form 990 financials, ~1.8M orgs | Free, keyless | **Corrected after live testing (2026-08-27)**: earlier secondary-source research said this includes mission text and website — it does not, on either the search endpoint or the org detail endpoint. Confirmed via direct API calls during implementation. This is org-identity + financial data only, no descriptive/contact fields. See RECOMMENDATIONS.md for the product workaround. https://projects.propublica.org/nonprofits/api |
| Data.gov / catalog.data.gov CKAN API | Would provide dataset search (e.g. a WA volunteer-opportunities dataset, if one exists) | Free, no key — in theory | **Found dead during implementation (2026-08-27)**: `catalog.data.gov/api/3/action/*` returns 404 on every endpoint tested, including a basic `status_show` health check, while the human-facing site (`catalog.data.gov`) itself returns 200. The CKAN API appears to have been retired or moved without the docs being updated. Kept as a best-effort, non-blocking step in the scraper in case it's restored. |
| IRS Exempt Organizations Business Master File | All registered nonprofits by state/address/NTEE code | Free, public | Same fields as ProPublica's data (no mission/website either, since it's the same underlying IRS source) — not worth adding as a separate source |
| Candid / Charity Navigator APIs | Richer profiles including website field | Free tier / signup required | Not used in v0 to avoid an extra account dependency; worth revisiting specifically to close the website-field gap if Idealist access is delayed |

Explicitly avoided: scraping sites like Indeed/LinkedIn for job listings — both
prohibit scraping in their Terms of Service. Idealist's API is the compliant
path to paid nonprofit job listings.

## Competitive landscape

| Platform | Model | Gap relative to this project |
|---|---|---|
| Idealist (absorbed VolunteerMatch, 2025) | National/global directory, ~40M users, 250k orgs, search/filter | Generic, not personalized, not job-seeker-aware |
| POINT app | Curated feed by cause, in-app apply/waivers/hour-tracking | Not hyperlocal to Puget Sound, not availability-first matching |
| JustServe | Hyperlocal listings | Broad general-purpose, no job-seeker framing |
| VolunteerMark | Skill/interest matching + printable service certificate for employers | Closest existing hint at the "proof for employers" angle, but framed as hour-logging, not community/identity support |
| Taproot Foundation, Catchafire | Skilled professional volunteering matched to nonprofit needs | Aimed at donating expertise, not structuring time during unemployment |
| United Way of King County Volunteer Center | Most comprehensive listing, but King County only | Confirms local coverage is fragmented by county line — Lynnwood/Bothell/Mill Creek are mostly Snohomish County, outside UWKC's core coverage |

**White space identified**: (1) the job-seeker framing itself — community,
routine, and resume-building during unemployment, not just "volunteer
matching"; (2) cross-county Puget Sound coverage stitched into one place,
since existing tools are fragmented by county; (3) availability-first
semantic matching via LLM reasoning over free-text interests, vs. the
category/zip-code filtering every existing tool uses.

Sources: https://www.idealist.org/volunteermatch , https://pointapp.org/volunteers/ ,
https://www.volunteermark.com/volunteers/ , https://www.uwkc.org/volunteer/

## Employment / volunteering statistics

- Nonprofits employ **~12.8 million people in the US (~10% of the workforce)**
  and pay out **$670B+ in wages annually** — confirms "do nonprofits pay
  people" and validates the paid-jobs product leg.
  Source: https://www.bls.gov/opub/ted/2024/nonprofits-accounted-for-12-8-million-jobs-9-9-percent-of-private-sector-employment-in-2022.htm

- CNCS study: unemployed people who volunteer have **27% higher odds of
  finding a job** than those who don't; effect rises to **55% in rural
  areas**. Mechanism: increased social capital + skill-building; volunteering
  sometimes becomes a direct entry route into the hiring org.
  Source: https://onestarfoundation.org/new-study-finds-that-volunteering-increases-likelihood-of-finding-a-job/

- Caveat: at least one study found volunteering while unemployed correlates
  with *longer* unemployment spells for some people, plausibly because it
  displaces job-search time or reflects reverse causation (people who
  struggle more to find work volunteer more as a coping response).
  Correlational, not causal, either direction.
  Source: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12163562/

  **Product implication**: frame the tool as complementary to active job
  search, not a replacement — e.g. surfacing a nonprofit's own paid openings
  alongside its volunteer roles, so volunteering visibly feeds toward
  employment rather than competing with it.

## Grant research

| Program | Fit | Notes |
|---|---|---|
| City of Lynnwood (Healthy Lynnwood Grant, Activate Snohomish Community Grants) | Poor fit | Aimed at community events/arts activation, not tech builds |
| Verdant Health Commission | Possible fit, needs a stretch framing | Public hospital district covering Lynnwood, Mountlake Terrace, Edmonds, Brier, Woodway, parts of Bothell/unincorporated Snohomish County — matches most of the pilot area. $6.5M in 2026 grants across two priorities: child/young-adult mental health, and access to direct healthcare. The isolation/stress-reduction angle for unemployed job seekers could plausibly fit the mental-health priority. **Funds registered nonprofits only** — would need a fiscal sponsor if not operating as a 501(c)(3). https://verdanthealth.org/ |
| AWS Activate (Founders tier) | Not needed yet | $1,000 in AWS credits, no VC funding required — available if free-tier infra is ever outgrown |
| Microsoft for Startups Founders Hub | Not needed yet | $1,000 Azure credits, no VC funding required |

**Conclusion**: infra cost is $0 at 10-100 users/month regardless of grants
(see RECOMMENDATIONS.md), so no grant is a blocker for building the MVP.
Verdant is worth a look later if the project formalizes into a nonprofit and
wants to fund staff time or outreach — not for infrastructure.
