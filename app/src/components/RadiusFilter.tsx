import type { useGeolocation } from '../lib/useGeolocation';

const RADIUS_OPTIONS = [5, 10, 25, 50];

interface RadiusFilterProps {
  geo: ReturnType<typeof useGeolocation>;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

export function RadiusFilter({ geo, radius, onRadiusChange }: RadiusFilterProps) {
  const value = geo.status === 'granted' ? String(radius) : 'off';

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === 'off') {
      geo.clear();
      return;
    }
    onRadiusChange(Number(v));
    if (geo.status !== 'granted') {
      geo.request();
    }
  }

  return (
    <div className="radius-filter">
      <select className="filter-select" value={value} onChange={handleChange} aria-label="Filter by distance from me">
        <option value="off">Any distance</option>
        {RADIUS_OPTIONS.map((mi) => (
          <option key={mi} value={mi}>
            Within {mi} mi
          </option>
        ))}
      </select>
      {geo.status === 'loading' && <span className="radius-status">Finding you…</span>}
      {(geo.status === 'denied' || geo.status === 'error' || geo.status === 'unsupported') && (
        <span className="radius-error">Couldn't get your location</span>
      )}
    </div>
  );
}
