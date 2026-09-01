import type { TabKey } from '../components/Tabs';
import type { CauseBundle, County } from '../types';
import { CAUSE_ICONS } from './causeIcons';
import { RADIUS_OPTIONS } from './radius';

const VALID_TABS: TabKey[] = ['orgs', 'opportunities', 'jobs'];
const VALID_CAUSES = Object.keys(CAUSE_ICONS) as CauseBundle[];

export function readInitialTab(): TabKey {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  return (VALID_TABS as string[]).includes(type ?? '') ? (type as TabKey) : 'orgs';
}

export function readInitialPage(): number {
  const params = new URLSearchParams(window.location.search);
  const page = Number(params.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function readInitialQuery(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') ?? '';
}

export function readInitialCounty(): County | null {
  const params = new URLSearchParams(window.location.search);
  const county = params.get('county');
  return county === 'King' || county === 'Snohomish' ? county : null;
}

export function readInitialCause(): CauseBundle | null {
  const params = new URLSearchParams(window.location.search);
  const cause = params.get('cause');
  return cause && (VALID_CAUSES as string[]).includes(cause) ? (cause as CauseBundle) : null;
}

/** Non-null only when a saved link should try to restore "near me"
 * filtering — actually activating it still requires the browser to grant
 * geolocation, which readInitialRadius can't do by itself (see App.tsx). */
export function readInitialRadius(): number | null {
  const params = new URLSearchParams(window.location.search);
  const radius = Number(params.get('radius'));
  return RADIUS_OPTIONS.includes(radius) ? radius : null;
}

interface UrlState {
  tab: TabKey;
  page: number;
  query: string;
  county: County | null;
  cause: CauseBundle | null;
  /** null when the distance filter isn't actually active (no granted
   * geolocation), even if a radius number is selected in the UI. */
  radius: number | null;
}

// Keeps every filter that defines "what's being browsed" in the URL, so a
// saved/shared/reloaded link reproduces the same view — including distance,
// even though restoring that one still needs a fresh geolocation grant.
export function writeUrlState({ tab, page, query, county, cause, radius }: UrlState) {
  const params = new URLSearchParams(window.location.search);
  params.set('type', tab);
  if (page > 1) params.set('page', String(page)); else params.delete('page');
  if (query) params.set('q', query); else params.delete('q');
  if (county) params.set('county', county); else params.delete('county');
  if (cause) params.set('cause', cause); else params.delete('cause');
  if (radius) params.set('radius', String(radius)); else params.delete('radius');

  const search = params.toString();
  const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}
