import Fuse from 'fuse.js';
import type { Org, Opportunity, JobListing } from '../types';

const BASE_OPTIONS = { threshold: 0.35, ignoreLocation: true };

export function createOrgSearch(orgs: Org[]) {
  return new Fuse(orgs, {
    ...BASE_OPTIONS,
    keys: [
      { name: 'name', weight: 2 },
      { name: 'mission', weight: 1 },
      { name: 'causeBundle', weight: 1 },
      { name: 'city', weight: 0.5 },
    ],
  });
}

export function createOpportunitySearch(opportunities: Opportunity[]) {
  return new Fuse(opportunities, {
    ...BASE_OPTIONS,
    keys: [
      { name: 'title', weight: 2 },
      { name: 'orgName', weight: 1.2 },
      { name: 'description', weight: 1 },
      { name: 'causeBundle', weight: 1 },
      { name: 'city', weight: 0.5 },
    ],
  });
}

export function createJobSearch(jobs: JobListing[]) {
  return new Fuse(jobs, {
    ...BASE_OPTIONS,
    keys: [
      { name: 'title', weight: 2 },
      { name: 'orgName', weight: 1.2 },
      { name: 'department', weight: 1 },
      { name: 'city', weight: 0.5 },
    ],
  });
}

export function runSearch<T>(fuse: Fuse<T>, query: string, items: T[]): T[] {
  if (!query.trim()) return items;
  return fuse.search(query).map((result) => result.item);
}
