#!/usr/bin/env node
// Builds app/src/data/orgs.json from free, keyless public data sources.
//
// Verified live against the real APIs during implementation (not just docs):
// - ProPublica Nonprofit Explorer API v2 search results contain NO mission
//   text and NO website field — only ein, name, city, state, ntee_code.
//   The org detail endpoint adds a street address and raw financials, but
//   still no website/mission. This is a real data gap, not an oversight:
//   see RESEARCH.md for the product implication (search-link fallback
//   instead of a direct "visit their site" link).
// - Data.gov (CKAN) is queried best-effort for a WA volunteer dataset; if
//   none is found this step contributes nothing and the pipeline continues.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'app', 'src', 'data', 'orgs.json');
const CURATED_PATH = path.join(__dirname, 'curated-orgs.json');
const CURATED_OPPORTUNITIES_PATH = path.join(__dirname, 'curated-opportunities.json');
const CURATED_JOBS_PATH = path.join(__dirname, 'curated-jobs.json');
const VERIFIED_WEBSITES_PATH = path.join(__dirname, 'verified-websites.json');

// Orgs confirmed, during manual website verification, to not actually be
// what they appear to be from ProPublica's WA-address data alone — kept as
// an explicit list (with reasons) rather than silently dropped, so this
// doesn't get accidentally undone by a future re-scrape.
const EXCLUDED_IDS = new Set([
  'pp-752765566', // "Covenant Health System" — resolves to Providence's Covenant Health in Lubbock, TX; the WA address is a tax-filing address, not a WA-serving org
  'pp-462710915', // "Herons Key" — real org, but physically located in Gig Harbor (Pierce County), not King/Snohomish; the Redmond address is parent org Emerald Communities' HQ
  'pp-910655392', // "Kadlec Regional Medical Center" — real Providence hospital, but physically located in Richland (Benton County); the Renton address is a shared Providence tax-filing address
  'pp-812670401', // "Los Angeles County Facilities Inc" — NTEE code S47 "Real Estate Organizations"; a municipal lease-financing vehicle registered at a Seattle address, not a WA-serving org
  'pp-941231005', // "Santa Rosa Memorial Hospital" — real hospital, but in Santa Rosa, Sonoma County, CA; uses the same shared Providence Renton tax-filing address as Covenant Health/Kadlec
  'pp-810231793', // "Providence Health & Services Mt" — real Providence entity, but operates in Montana
  'pp-510216587', // "Providence Health & Services Oregon" — real Providence entity, but operates in Oregon (Portland/Hood River)
  'pp-510216589', // "Providence Health System-southern California" — real Providence entity, but operates in Southern California
  'pp-951684082', // "Providence Saint Johns Health Center" — real hospital, but in Santa Monica, CA
  'pp-814542216', // "Providence Saint Johns Medical Foundation" — fundraising arm of the same Santa Monica, CA hospital
  'pp-833972614', // "Tarzana Medical Center Llc" — confirmed Providence Cedars-Sinai Tarzana Medical Center, in Tarzana (Los Angeles), CA
  'pp-810463482', // "Providence St Joseph Medical Center" — resolves to the Providence Saint Joseph Medical Center in Burbank, CA; uses the same shared Providence Renton tax-filing address as Covenant Health/Kadlec/Santa Rosa
  'pp-911861964', // "Providence Plan Partners" — internal Providence health-plan administrative entity at the same shared Renton tax-filing address, not a distinct WA-serving direct-service org
  'pp-454171900', // "Western Healthconnect" — internal Providence administrative entity at the same shared Renton tax-filing address, no public-facing presence
  'pp-462626883', // "Amazonsmile Foundation" — the AmazonSmile program was discontinued in 2023 and the foundation terminated; no active operations or website
]);
const OPPORTUNITIES_OUT_PATH = path.join(__dirname, '..', 'app', 'src', 'data', 'opportunities.json');
const JOBS_OUT_PATH = path.join(__dirname, '..', 'app', 'src', 'data', 'jobs.json');

// ProPublica's coarse `ntee[id]` search filter (numeric, confirmed live).
// We use it only to scope the search; the precise cause bundle is derived
// per-org from the actual NTEE code letter returned in each result.
const NTEE_SEARCH_GROUPS = [1, 2, 3, 4, 5, 7];
const PAGES_PER_GROUP = 6; // 25 results/page -> up to 150 orgs per group
const MAX_ORGS_PER_GROUP = 45; // per-category budget so no category starves another
const MAX_ORGS = MAX_ORGS_PER_GROUP * NTEE_SEARCH_GROUPS.length;

// Pilot area: Seattle metro + the specific cities called out for the pilot,
// plus a handful of adjacent Puget Sound cities. City-name match against
// ProPublica's `city` field (case-insensitive). Widening this later is a
// one-line config change, not a re-scrape of the whole pipeline.
const PILOT_CITIES = new Set(
  [
    'Seattle', 'Lynnwood', 'Bothell', 'Mill Creek', 'Bellevue', 'Redmond',
    'Mountlake Terrace', 'Edmonds', 'Shoreline', 'Kirkland', 'Renton',
    'Kent', 'Everett', 'Woodinville', 'Sammamish', 'Issaquah', 'Kenmore',
    'Tukwila', 'Burien', 'SeaTac', 'Mercer Island', 'Snohomish',
  ].map((c) => c.toLowerCase())
);

// First-pass geographic scope, per explicit product decision: King and
// Snohomish county only. All PILOT_CITIES above are already one of the two,
// so this is mostly a explicit label for the UI/filter, not an additional
// exclusion — but curated opportunity/job data references a couple of
// smaller Snohomish towns (Monroe, Sultan) outside PILOT_CITIES too.
const KING_COUNTY_CITIES = new Set(
  [
    'Seattle', 'Bellevue', 'Redmond', 'Kirkland', 'Renton', 'Kent',
    'Sammamish', 'Issaquah', 'Kenmore', 'Tukwila', 'Burien', 'SeaTac',
    'Mercer Island', 'Shoreline', 'Woodinville', 'Bothell',
    'Federal Way', 'Des Moines', 'Auburn',
  ].map((c) => c.toLowerCase())
);
const SNOHOMISH_COUNTY_CITIES = new Set(
  [
    'Lynnwood', 'Mill Creek', 'Mountlake Terrace', 'Edmonds', 'Everett',
    'Snohomish', 'Monroe', 'Sultan', 'Granite Falls', 'Marysville',
  ].map((c) => c.toLowerCase())
);

function countyForCity(city) {
  const key = (city ?? '').trim().toLowerCase();
  if (KING_COUNTY_CITIES.has(key)) return 'King';
  if (SNOHOMISH_COUNTY_CITIES.has(key)) return 'Snohomish';
  return 'Other';
}

// NTEE major-group letter -> friendly front-page cause bundle.
const NTEE_LETTER_TO_BUNDLE = {
  B: 'Education',
  E: 'Health', F: 'Health', G: 'Health', H: 'Health',
  C: 'Environment',
  D: 'Animals',
  O: 'Youth Development',
  K: 'Food & Housing', L: 'Food & Housing',
  A: 'Arts & Culture',
  P: 'Human Services', I: 'Human Services', J: 'Human Services',
  S: 'Community Improvement', R: 'Community Improvement', W: 'Community Improvement',
};

function causeBundleFor(nteeCode) {
  if (!nteeCode) return 'Other';
  const letter = nteeCode.trim().charAt(0).toUpperCase();
  return NTEE_LETTER_TO_BUNDLE[letter] ?? 'Other';
}

function volunteerSearchUrl(name, city) {
  const q = encodeURIComponent(`${name} ${city} WA volunteer opportunities`);
  return `https://www.google.com/search?q=${q}`;
}

// Once we know an org's real website (see verified-websites.json), scope
// the fallback search to that domain — much more likely to surface their
// actual volunteer page than a generic name+city search.
function siteScopedVolunteerSearchUrl(website) {
  let host;
  try {
    host = new URL(website).hostname;
  } catch {
    return null;
  }
  const q = encodeURIComponent(`site:${host} volunteer`);
  return `https://www.google.com/search?q=${q}`;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'nonprofit-match-finder-pilot (contact: repo owner via GitHub)' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function loadVerifiedWebsites() {
  try {
    const raw = await readFile(VERIFIED_WEBSITES_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function fetchProPublicaOrgs(verifiedWebsites) {
  const byEin = new Map();

  for (const groupId of NTEE_SEARCH_GROUPS) {
    let countThisGroup = 0;
    for (let page = 0; page < PAGES_PER_GROUP; page++) {
      const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?state%5Bid%5D=WA&ntee%5Bid%5D=${groupId}&page=${page}`;
      let data;
      try {
        data = await fetchJson(url);
      } catch (err) {
        console.warn(`[propublica] skip group=${groupId} page=${page}: ${err.message}`);
        break;
      }
      const orgs = data.organizations ?? [];
      if (orgs.length === 0) break;

      for (const org of orgs) {
        if (!PILOT_CITIES.has((org.city ?? '').toLowerCase())) continue;
        if (EXCLUDED_IDS.has(`pp-${org.ein}`)) continue;
        if (byEin.has(org.ein)) continue;
        byEin.set(org.ein, org);
        countThisGroup++;
        if (countThisGroup >= MAX_ORGS_PER_GROUP) break;
      }
      if (countThisGroup >= MAX_ORGS_PER_GROUP) break;
      // be a polite API citizen
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  const results = [];
  for (const org of byEin.values()) {
    const nteeCode = org.ntee_code ?? org.raw_ntee_code ?? null;
    let address = null;
    try {
      const detail = await fetchJson(
        `https://projects.propublica.org/nonprofits/api/v2/organizations/${org.ein}.json`
      );
      address = detail.organization?.address ?? null;
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      console.warn(`[propublica] detail lookup failed for ein=${org.ein}: ${err.message}`);
    }

    const id = `pp-${org.ein}`;
    // Manually verified via web search (see verified-websites.json) —
    // ProPublica itself has no website field, this is the closing of that
    // gap for orgs someone has actually confirmed. Not available for most
    // orgs yet; falls back to the generic search link when absent.
    const verifiedWebsite = verifiedWebsites[id] ?? null;

    results.push({
      id,
      name: org.name,
      mission: null, // not available from ProPublica — see header comment
      causeBundle: causeBundleFor(nteeCode),
      nteeCode,
      city: org.city,
      county: countyForCity(org.city),
      state: org.state,
      address,
      website: verifiedWebsite,
      volunteerUrl: verifiedWebsite
        ? (siteScopedVolunteerSearchUrl(verifiedWebsite) ?? volunteerSearchUrl(org.name, org.city))
        : volunteerSearchUrl(org.name, org.city),
      source: 'propublica',
    });
  }
  return results;
}

async function fetchDataGovSupplement() {
  // Best-effort: look for a WA-specific volunteer-opportunity dataset.
  // If nothing relevant turns up, contribute nothing — do not block the
  // pipeline on this source.
  try {
    const data = await fetchJson(
      'https://catalog.data.gov/api/3/action/package_search?q=volunteer%20Washington%20opportunities&rows=5'
    );
    const count = data.result?.count ?? 0;
    console.log(`[data.gov] found ${count} loosely-matching dataset(s); not auto-ingested in v0 (needs per-dataset review before use).`);
  } catch (err) {
    // Verified during implementation: catalog.data.gov's CKAN API returns
    // 404 even on basic status checks — the endpoint appears retired, not
    // just empty. Left as best-effort/non-blocking rather than removed, in
    // case data.gov restores or replaces it.
    console.warn(`[data.gov] lookup skipped (endpoint unreachable): ${err.message}`);
  }
  return [];
}

async function loadJsonWithCounty(filePath) {
  const raw = await readFile(filePath, 'utf-8');
  const items = JSON.parse(raw);
  return items.map((item) => ({ ...item, county: item.county ?? countyForCity(item.city) }));
}

async function main() {
  console.log('Fetching Washington nonprofit directory from ProPublica...');
  const verifiedWebsites = await loadVerifiedWebsites();
  const scraped = await fetchProPublicaOrgs(verifiedWebsites);
  await fetchDataGovSupplement();
  // Hand-verified entries (real name, mission, and — critically — a real
  // direct volunteer-page URL, unlike the ProPublica-derived search-link
  // fallback). Always merged in, so re-running the scraper never drops them.
  const curated = await loadJsonWithCounty(CURATED_PATH);

  // Dedup by normalized name, not just id — a curated org and its
  // ProPublica-scraped counterpart have different ids (e.g. "curated-bgcsc"
  // vs "pp-910549511") but are the same real organization. Found via
  // Boys & Girls Clubs of Snohomish County appearing twice in the directory.
  const normalizeName = (name) =>
    name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
  const curatedIds = new Set(curated.map((o) => o.id));
  const curatedNames = new Set(curated.map((o) => normalizeName(o.name)));
  const orgs = [
    ...curated,
    ...scraped.filter((o) => !curatedIds.has(o.id) && !curatedNames.has(normalizeName(o.name))),
  ];
  orgs.sort((a, b) => a.name.localeCompare(b.name));

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(orgs, null, 2) + '\n');
  console.log(`Wrote ${orgs.length} orgs (${curated.length} curated + ${orgs.length - curated.length} scraped) to ${path.relative(process.cwd(), OUT_PATH)}`);

  // Individual opportunity/job listings are hand-curated only for now (pulled
  // directly from each org's real volunteer/careers page) — no automated
  // scraper for these yet, deliberately: most nonprofit sites have no
  // consistent structure to scrape reliably. See RESEARCH.md.
  const opportunities = await loadJsonWithCounty(CURATED_OPPORTUNITIES_PATH);
  await writeFile(OPPORTUNITIES_OUT_PATH, JSON.stringify(opportunities, null, 2) + '\n');
  console.log(`Wrote ${opportunities.length} opportunities to ${path.relative(process.cwd(), OPPORTUNITIES_OUT_PATH)}`);

  const jobs = await loadJsonWithCounty(CURATED_JOBS_PATH);
  await writeFile(JOBS_OUT_PATH, JSON.stringify(jobs, null, 2) + '\n');
  console.log(`Wrote ${jobs.length} jobs to ${path.relative(process.cwd(), JOBS_OUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
