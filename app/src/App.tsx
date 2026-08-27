import { useMemo, useState } from 'react';
import orgsData from './data/orgs.json';
import type { CauseBundle, Org } from './types';
import { createOrgSearch, searchOrgs } from './lib/search';
import { SearchBar } from './components/SearchBar';
import { CauseFilterBar } from './components/CauseFilterBar';
import { OrgList } from './components/OrgList';
import { MapView } from './components/MapView';
import './App.css';

const orgs = orgsData as Org[];

function App() {
  const [query, setQuery] = useState('');
  const [selectedCause, setSelectedCause] = useState<CauseBundle | null>(null);

  const fuse = useMemo(() => createOrgSearch(orgs), []);

  const causesWithCounts = useMemo(() => {
    const counts = new Map<CauseBundle, number>();
    for (const org of orgs) {
      counts.set(org.causeBundle, (counts.get(org.causeBundle) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([bundle, count]) => ({ bundle, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const results = useMemo(() => {
    const searched = searchOrgs(fuse, query, orgs);
    return selectedCause ? searched.filter((o) => o.causeBundle === selectedCause) : searched;
  }, [fuse, query, selectedCause]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Find a nonprofit near you</h1>
        <p className="tagline">
          Browse Seattle-area nonprofits by cause and location. A pilot for
          people looking for community, structure, and social impact —
          especially while job hunting.
        </p>
        <SearchBar value={query} onChange={setQuery} />
      </header>

      <CauseFilterBar causes={causesWithCounts} selected={selectedCause} onSelect={setSelectedCause} />

      <MapView orgs={results} />

      <main>
        <p className="result-count">{results.length} nonprofit{results.length === 1 ? '' : 's'}</p>
        <OrgList orgs={results} />
      </main>

      <footer className="app-footer">
        <p>
          Directory built from the ProPublica Nonprofit Explorer API plus a
          small set of hand-verified local orgs. This is a discovery tool,
          not a booking system — clicking through takes you to each
          organization's own site.
        </p>
      </footer>
    </div>
  );
}

export default App;
