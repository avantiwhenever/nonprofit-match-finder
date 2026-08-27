import { useMemo, useState } from 'react';
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
import './App.css';

const orgs = orgsData as Org[];
const opportunities = opportunitiesData as Opportunity[];
const jobs = jobsData as JobListing[];

function App() {
  const [tab, setTab] = useState<TabKey>('orgs');
  const [query, setQuery] = useState('');
  const [selectedCause, setSelectedCause] = useState<CauseBundle | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);

  const orgFuse = useMemo(() => createOrgSearch(orgs), []);
  const oppFuse = useMemo(() => createOpportunitySearch(opportunities), []);
  const jobFuse = useMemo(() => createJobSearch(jobs), []);

  const causesWithCounts = useMemo(() => {
    const counts = new Map<CauseBundle, number>();
    for (const org of orgs) {
      counts.set(org.causeBundle, (counts.get(org.causeBundle) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([bundle, count]) => ({ bundle, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const filteredOrgs = useMemo(() => {
    let result = runSearch(orgFuse, query, orgs);
    if (selectedCause) result = result.filter((o) => o.causeBundle === selectedCause);
    if (selectedCounty) result = result.filter((o) => o.county === selectedCounty);
    return result;
  }, [orgFuse, query, selectedCause, selectedCounty]);

  const filteredOpportunities = useMemo(() => {
    let result = runSearch(oppFuse, query, opportunities);
    if (selectedCause) result = result.filter((o) => o.causeBundle === selectedCause);
    if (selectedCounty) result = result.filter((o) => o.county === selectedCounty);
    return result;
  }, [oppFuse, query, selectedCause, selectedCounty]);

  const filteredJobs = useMemo(() => {
    let result = runSearch(jobFuse, query, jobs);
    if (selectedCounty) result = result.filter((j) => j.county === selectedCounty);
    return result;
  }, [jobFuse, query, selectedCounty]);

  const mapOrgs = tab === 'orgs' ? filteredOrgs : orgs;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Find nonprofit volunteering opportunities near you</h1>
        <p className="tagline">
          Browse King &amp; Snohomish County nonprofits, volunteer roles, and
          paid jobs by cause and location. A pilot for people looking for
          community, structure, and social impact — especially while job
          hunting.
        </p>
        <SearchBar value={query} onChange={setQuery} />
      </header>

      <Tabs
        active={tab}
        onChange={setTab}
        counts={{ orgs: filteredOrgs.length, opportunities: filteredOpportunities.length, jobs: filteredJobs.length }}
      />

      <CountyFilter selected={selectedCounty} onSelect={setSelectedCounty} />

      {tab !== 'jobs' && (
        <CauseFilterBar causes={causesWithCounts} selected={selectedCause} onSelect={setSelectedCause} />
      )}

      {tab === 'orgs' && <MapView orgs={mapOrgs} />}

      <main>
        {tab === 'orgs' && (
          <>
            <p className="result-count">{filteredOrgs.length} nonprofit{filteredOrgs.length === 1 ? '' : 's'}</p>
            <OrgList orgs={filteredOrgs} />
          </>
        )}
        {tab === 'opportunities' && (
          <>
            <p className="result-count">
              {filteredOpportunities.length} volunteer opportunit{filteredOpportunities.length === 1 ? 'y' : 'ies'}
              {' — '}hand-verified from each organization's own site
            </p>
            <OpportunityList opportunities={filteredOpportunities} />
          </>
        )}
        {tab === 'jobs' && (
          <>
            <p className="result-count">{filteredJobs.length} paid job{filteredJobs.length === 1 ? '' : 's'}</p>
            <JobList jobs={filteredJobs} />
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
