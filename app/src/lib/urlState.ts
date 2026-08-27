import type { TabKey } from '../components/Tabs';

const VALID_TABS: TabKey[] = ['orgs', 'opportunities', 'jobs'];

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

export function writeUrlState(tab: TabKey, page: number) {
  const params = new URLSearchParams(window.location.search);
  params.set('type', tab);
  if (page > 1) {
    params.set('page', String(page));
  } else {
    params.delete('page');
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newUrl);
}
