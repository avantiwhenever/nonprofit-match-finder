import type { County } from '../types';

interface CountyFilterProps {
  selected: County | null;
  onSelect: (county: County | null) => void;
}

const COUNTIES: County[] = ['King', 'Snohomish'];

export function CountyFilter({ selected, onSelect }: CountyFilterProps) {
  return (
    <div className="county-filter" role="group" aria-label="Filter by county">
      <span className="county-filter-label">County:</span>
      <button
        type="button"
        className={`county-tile ${selected === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        Both
      </button>
      {COUNTIES.map((county) => (
        <button
          key={county}
          type="button"
          className={`county-tile ${selected === county ? 'active' : ''}`}
          onClick={() => onSelect(selected === county ? null : county)}
        >
          {county}
        </button>
      ))}
    </div>
  );
}
