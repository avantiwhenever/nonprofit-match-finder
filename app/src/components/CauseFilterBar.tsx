import type { CauseBundle } from '../types';

interface CauseFilterBarProps {
  causes: { bundle: CauseBundle; count: number }[];
  selected: CauseBundle | null;
  onSelect: (bundle: CauseBundle | null) => void;
}

export function CauseFilterBar({ causes, selected, onSelect }: CauseFilterBarProps) {
  return (
    <div className="cause-filter-bar" role="group" aria-label="Filter by cause">
      <button
        type="button"
        className={`cause-tile ${selected === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        All causes
      </button>
      {causes.map(({ bundle, count }) => (
        <button
          key={bundle}
          type="button"
          className={`cause-tile ${selected === bundle ? 'active' : ''}`}
          onClick={() => onSelect(selected === bundle ? null : bundle)}
        >
          {bundle} <span className="count">{count}</span>
        </button>
      ))}
    </div>
  );
}
