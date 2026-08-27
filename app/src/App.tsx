import { useEffect, useMemo, useRef, useState } from 'react';
import orgsData from './data/orgs.json';
import opportunitiesData from './data/opportunities.json';
import jobsData from './data/jobs.json';
import type { CauseBundle, County, Org, Opportunity, JobListing } from './types';
import { createOrgSearch, createOpportunitySearch, createJobSearch, runSearch } from './lib/search';
import { SearchBar } from './components/SearchBar';
import { CauseFilterBar } from './components/CauseFilterBar';
import { CountyFilter } from './components/CountyFilter';
import { Tabs, type TabKey } from './components/Tabs';
import { OrgList } from './components/OrgList';
import { OpportunityList } from './components/OpportunityList';
import { JobList } from './components/JobList';
import { MapView } from './components/MapView';
import { Pagination } from './components/Pagination';
import { RadiusFilter } from './components/RadiusFilter';
import { FilterPanel } from './components/FilterPanel';
import { usePagination } from './lib/usePagination';
import { useGeolocation } from './lib/useGeolocation';
import { coordsForCity } from './lib/cityCoords';
import { distanceMiles } from './lib/geo';
import { readInitialTab, readInitialPage, writeUrlState } from './lib/urlState';
import './App.css';

const PAGE_SIZE = 20;
const DEFAULT_RADIUS = 10;

const orgs = orgsData as Org[];
const opportunities = opportunitiesData as Opportunity[];
const jobs = jobsData as JobListing[];

function App() {
  const [tab, setTab] = useState<TabKey>(readInitialTab);
  const initialPage = useRef(readInitialPage()).current;
  const [query, setQuery] = useState('');
  const [selectedCause, setSelectedCause] = useState<CauseBundle | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const geo = useGeolocation();

  const orgFuse = useMemo(() => createOrgSearch(orgs), []);
  const oppFuse = useMemo(() => createOpportunitySearch(opportunities), []);
  const jobFuse = useMemo(() => createJobSearch(jobs), []);

  const orgById = useMemo(() => new Map(orgs.map((o) => [o.id, o])), []);

  const withinRadius = useMemo(() => {
    return (city: string) => {
      if (!geo.coords) return true;
      const c = coordsForCity(city);
      if (!c) return false;
      return distanceMiles(geo.coords[0], geo.coords[1], c[0], c[1]) <= radius;
    };
  }, [geo.coords, radius]);

  // "PreCause" = search + county + radius applied, but not the cause filter
  // itself — used both as the base for the cause-filtered result and to
  // compute per-cause counts that reflect the other active filters.
  const orgsPreCause = useMemo(() => {
    let result = runSearch(orgFuse, query, orgs);
    if (selectedCounty) result = result.filter((o) => o.county === selectedCounty);
    result = result.filter((o) => withinRadius(o.city));
    return result;
  }, [orgFuse, query, selectedCounty, withinRadius]);

  const oppsPreCause = useMemo(() => {
    let result = runSearch(oppFuse, query, opportunities);
    if (selectedCounty) result = result.filter((o) => o.county === selectedCounty);
    result = result.filter((o) => withinRadius(o.city));
    return result;
  }, [oppFuse, query, selectedCounty, withinRadius]);

  const jobsPreCause = useMemo(() => {
    let result = runSearch(jobFuse, query, jobs);
    if (selectedCounty) result = result.filter((j) => j.county === selectedCounty);
    result = result.filter((j) => withinRadius(j.city));
    return result;
  }, [jobFuse, query, selectedCounty, withinRadius]);

  // Cause filter tiles + counts are specific to whichever tab is active, so
  // they always reflect what that tab's data actually contains.
  const causesWithCounts = useMemo(() => {
    const counts = new Map<CauseBundle, number>();
    const bump = (bundle: CauseBundle | undefined) => {
      if (!bundle) return;
      counts.set(bundle, (counts.get(bundle) ?? 0) + 1);
    };
    if (tab === 'orgs') {
      for (const o of orgsPreCause) bump(o.causeBundle);
    } else if (tab === 'opportunities') {
      for (const o of oppsPreCause) bump(o.causeBundle);
    } else {
      for (const j of jobsPreCause) bump(orgById.get(j.orgId)?.causeBundle);
    }
    return [...counts.entries()]
      .map(([bundle, count]) => ({ bundle, count }))
      .sort((a, b) => b.count - a.count);
  }, [tab, orgsPreCause, oppsPreCause, jobsPreCause, orgById]);

  const filteredOrgs = useMemo(() => {
    return selectedCause ? orgsPreCause.filter((o) => o.causeBundle === selectedCause) : orgsPreCause;
  }, [orgsPreCause, selectedCause]);

  const filteredOpportunities = useMemo(() => {
    return selectedCause ? oppsPreCause.filter((o) => o.causeBundle === selectedCause) : oppsPreCause;
  }, [oppsPreCause, selectedCause]);

  const filteredJobs = useMemo(() => {
    return selectedCause
      ? jobsPreCause.filter((j) => orgById.get(j.orgId)?.causeBundle === selectedCause)
      : jobsPreCause;
  }, [jobsPreCause, selectedCause, orgById]);

  const mapOrgs = tab === 'orgs' ? filteredOrgs : orgs;

  const orgPage = usePagination(filteredOrgs, PAGE_SIZE, tab === 'orgs' ? initialPage : 1);
  const oppPage = usePagination(filteredOpportunities, PAGE_SIZE, tab === 'opportunities' ? initialPage : 1);
  const jobPage = usePagination(filteredJobs, PAGE_SIZE, tab === 'jobs' ? initialPage : 1);

  const activePage = tab === 'orgs' ? orgPage.page : tab === 'opportunities' ? oppPage.page : jobPage.page;

  // Keep the URL's ?type=&page= in sync with what's actually showing, so a
  // deep link (e.g. shared or typed in directly) lands on the right view.
  useEffect(() => {
    writeUrlState(tab, activePage);
  }, [tab, activePage]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Find nonprofit volunteering opportunities near you</h1>
        <p className="tagline">
          Browse King &amp; Snohomish County nonprofits, volunteer roles, and
          paid jobs by cause and location. A pilot for people looking for
          community, structure, and social impact.
        </p>
        <SearchBar value={query} onChange={setQuery} />
      </header>

      <Tabs
        active={tab}
        onChange={setTab}
        counts={{ orgs: filteredOrgs.length, opportunities: filteredOpportunities.length, jobs: filteredJobs.length }}
      />

      <FilterPanel activeCount={(selectedCounty ? 1 : 0) + (selectedCause ? 1 : 0) + (geo.status === 'granted' ? 1 : 0)}>
        <CountyFilter selected={selectedCounty} onSelect={setSelectedCounty} />
        <RadiusFilter geo={geo} radius={radius} onRadiusChange={setRadius} />
        <CauseFilterBar causes={causesWithCounts} selected={selectedCause} onSelect={setSelectedCause} />
      </FilterPanel>

      {tab === 'orgs' && geo.status === 'granted' && <MapView orgs={mapOrgs} />}

      <main>
        {tab === 'orgs' && (
          <>
            <p className="result-count">{filteredOrgs.length} nonprofit{filteredOrgs.length === 1 ? '' : 's'}</p>
            <OrgList orgs={orgPage.pageItems} />
            <Pagination page={orgPage.page} totalPages={orgPage.totalPages} onChange={orgPage.setPage} />
          </>
        )}
        {tab === 'opportunities' && (
          <>
            <p className="result-count">
              {filteredOpportunities.length} volunteer opportunit{filteredOpportunities.length === 1 ? 'y' : 'ies'}
              {' — '}hand-verified from each organization's own site
            </p>
            <OpportunityList opportunities={oppPage.pageItems} />
            <Pagination page={oppPage.page} totalPages={oppPage.totalPages} onChange={oppPage.setPage} />
          </>
        )}
        {tab === 'jobs' && (
          <>
            <p className="result-count">{filteredJobs.length} paid job{filteredJobs.length === 1 ? '' : 's'}</p>
            <JobList jobs={jobPage.pageItems} />
            <Pagination page={jobPage.page} totalPages={jobPage.totalPages} onChange={jobPage.setPage} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Nonprofit directory built from the ProPublica Nonprofit Explorer
          API plus a small set of hand-verified local orgs. Volunteer
          opportunities and paid jobs are hand-curated from each
          organization's own volunteer/careers page — not yet automated at
          scale (see RECOMMENDATIONS.md). This is a discovery tool, not a
          booking system — clicking through takes you to each organization's
          own site.
        </p>
      </footer>
    </div>
  );
}

export default App;
