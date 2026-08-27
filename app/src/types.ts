export type CauseBundle =
  | 'Education'
  | 'Health'
  | 'Environment'
  | 'Youth Development'
  | 'Food & Housing'
  | 'Animals'
  | 'Arts & Culture'
  | 'Human Services'
  | 'Community Improvement'
  | 'Other';

export type County = 'King' | 'Snohomish' | 'Other';

export interface Org {
  id: string;
  name: string;
  mission: string;
  causeBundle: CauseBundle;
  nteeCode: string | null;
  city: string;
  county: County;
  state: string;
  address: string | null;
  website: string | null;
  volunteerUrl: string | null;
  source: 'propublica' | 'data.gov' | 'curated';
}

export interface Opportunity {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  description: string;
  causeBundle: CauseBundle;
  city: string;
  county: County;
  schedule: string | null;
  commitment: string | null;
  requirements: string[];
  remote: boolean;
  status: 'open' | 'paused';
  signUpUrl: string | null;
  contact: string | null;
}

export interface JobListing {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  department: string | null;
  city: string;
  county: County;
  employmentType: string | null;
  pay: string | null;
  applyUrl: string | null;
  /** false = generic "openings vary, see current listings" entry, not a specific named position */
  specific: boolean;
}
