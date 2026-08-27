import type { County } from '../types';

// King and Snohomish county cities relevant to the pilot area (and a couple
// of Snohomish towns — Monroe, Sultan — that show up in curated opportunity
// data even though they're outside the core PILOT_CITIES list used for the
// scraped org directory).
const KING_COUNTY_CITIES = new Set(
  [
    'Seattle', 'Bellevue', 'Redmond', 'Kirkland', 'Renton', 'Kent',
    'Sammamish', 'Issaquah', 'Kenmore', 'Tukwila', 'Burien', 'SeaTac',
    'Mercer Island', 'Shoreline', 'Woodinville', 'Bothell',
  ].map((c) => c.toLowerCase())
);

const SNOHOMISH_COUNTY_CITIES = new Set(
  [
    'Lynnwood', 'Mill Creek', 'Mountlake Terrace', 'Edmonds', 'Everett',
    'Snohomish', 'Monroe', 'Sultan',
  ].map((c) => c.toLowerCase())
);

export function countyForCity(city: string): County {
  const key = city.trim().toLowerCase();
  if (KING_COUNTY_CITIES.has(key)) return 'King';
  if (SNOHOMISH_COUNTY_CITIES.has(key)) return 'Snohomish';
  return 'Other';
}
