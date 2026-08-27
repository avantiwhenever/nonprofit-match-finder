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

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'nonprofit-match-finder-pilot (contact: repo owner via GitHub)' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function fetchProPublicaOrgs() {
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

    results.push({
      id: `pp-${org.ein}`,
      name: org.name,
      mission: null, // not available from ProPublica — see header comment
      causeBundle: causeBundleFor(nteeCode),
      nteeCode,
      city: org.city,
      state: org.state,
      address,
      website: null, // not available from ProPublica — see header comment
      volunteerUrl: volunteerSearchUrl(org.name, org.city),
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

async function loadCuratedOrgs() {
  // Hand-verified entries (real name, mission, and — critically — a real
  // direct volunteer-page URL, unlike the ProPublica-derived search-link
  // fallback). Always merged in, so re-running the scraper never drops them.
  const raw = await readFile(CURATED_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function main() {
  console.log('Fetching Washington nonprofit directory from ProPublica...');
  const scraped = await fetchProPublicaOrgs();
  await fetchDataGovSupplement();
  const curated = await loadCuratedOrgs();

  const curatedIds = new Set(curated.map((o) => o.id));
  const orgs = [...curated, ...scraped.filter((o) => !curatedIds.has(o.id))];
  orgs.sort((a, b) => a.name.localeCompare(b.name));

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(orgs, null, 2) + '\n');
  console.log(`Wrote ${orgs.length} orgs (${curated.length} curated + ${orgs.length - curated.length} scraped) to ${path.relative(process.cwd(), OUT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
