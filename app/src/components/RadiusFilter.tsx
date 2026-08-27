import type { useGeolocation } from '../lib/useGeolocation';

const RADIUS_OPTIONS = [5, 10, 25, 50];

interface RadiusFilterProps {
  geo: ReturnType<typeof useGeolocation>;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

export function RadiusFilter({ geo, radius, onRadiusChange }: RadiusFilterProps) {
  if (geo.status === 'idle' || geo.status === 'loading') {
    return (
      <div className="radius-filter">
        <button type="button" className="radius-locate-btn" onClick={geo.request} disabled={geo.status === 'loading'}>
          {geo.status === 'loading' ? 'Finding you…' : '📍 Search near me'}
        </button>
      </div>
    );
  }

  if (geo.status === 'denied' || geo.status === 'error' || geo.status === 'unsupported') {
    return (
      <div className="radius-filter">
        <span className="radius-error">Couldn't get your location — try again?</span>
        <button type="button" className="radius-locate-btn" onClick={geo.request}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="radius-filter">
      <span className="radius-active">📍 Within</span>
      {RADIUS_OPTIONS.map((mi) => (
        <button
          key={mi}
          type="button"
          className={`radius-tile ${radius === mi ? 'active' : ''}`}
          onClick={() => onRadiusChange(mi)}
        >
          {mi} mi
        </button>
      ))}
      <button type="button" className="radius-clear-btn" onClick={geo.clear}>
        Clear
      </button>
    </div>
  );
}
