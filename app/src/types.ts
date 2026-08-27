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

export interface Org {
  id: string;
  name: string;
  mission: string;
  causeBundle: CauseBundle;
  nteeCode: string | null;
  city: string;
  state: string;
  address: string | null;
  website: string | null;
  volunteerUrl: string | null;
  source: 'propublica' | 'data.gov' | 'curated';
}
