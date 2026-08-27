import Fuse from 'fuse.js';
import type { Org } from '../types';

const FUSE_OPTIONS: ConstructorParameters<typeof Fuse<Org>>[1] = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'mission', weight: 1 },
    { name: 'causeBundle', weight: 1 },
    { name: 'city', weight: 0.5 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
};

export function createOrgSearch(orgs: Org[]) {
  return new Fuse(orgs, FUSE_OPTIONS);
}

export function searchOrgs(fuse: Fuse<Org>, query: string, orgs: Org[]): Org[] {
  if (!query.trim()) return orgs;
  return fuse.search(query).map((result) => result.item);
}
