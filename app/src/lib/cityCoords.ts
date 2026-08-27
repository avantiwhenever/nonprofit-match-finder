// City-centroid coordinates for the pilot area. Deliberately city-level, not
// per-org street-address geocoding — avoids a fragile, rate-limited geocoding
// step in the nightly data pipeline while still giving a genuinely useful
// map view (pins clustered by city) for a v0 at this scale.
export const CITY_COORDS: Record<string, [number, number]> = {
  seattle: [47.6062, -122.3321],
  lynnwood: [47.8209, -122.3151],
  bothell: [47.7623, -122.2054],
  'mill creek': [47.8601, -122.2054],
  bellevue: [47.6101, -122.2015],
  redmond: [47.674, -122.1215],
  'mountlake terrace': [47.7906, -122.3037],
  edmonds: [47.8107, -122.3774],
  shoreline: [47.7557, -122.3415],
  kirkland: [47.6769, -122.206],
  renton: [47.4829, -122.2171],
  kent: [47.3809, -122.2348],
  everett: [47.979, -122.2021],
  woodinville: [47.754, -122.1637],
  sammamish: [47.6163, -122.0356],
  issaquah: [47.5301, -122.0326],
  kenmore: [47.7576, -122.2443],
  tukwila: [47.4744, -122.261],
  burien: [47.4704, -122.3467],
  seatac: [47.4436, -122.287],
  'mercer island': [47.5707, -122.2221],
  snohomish: [47.9129, -122.0982],
};

export const PILOT_AREA_CENTER: [number, number] = [47.72, -122.24];

export function coordsForCity(city: string): [number, number] | null {
  return CITY_COORDS[city.trim().toLowerCase()] ?? null;
}
