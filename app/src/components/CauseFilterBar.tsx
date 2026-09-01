import { Tag } from 'lucide-react';
import type { CauseBundle } from '../types';

interface CauseFilterBarProps {
  causes: { bundle: CauseBundle; count: number }[];
  selected: CauseBundle | null;
  onSelect: (bundle: CauseBundle | null) => void;
}

export function CauseFilterBar({ causes, selected, onSelect }: CauseFilterBarProps) {
  return (
    <div className="filter-select-wrap">
      <Tag className="filter-select-icon" size={14} strokeWidth={2.25} aria-hidden="true" />
      <select
        className="filter-select"
        value={selected ?? 'all'}
        onChange={(e) => onSelect(e.target.value === 'all' ? null : (e.target.value as CauseBundle))}
        aria-label="Filter by cause"
      >
        <option value="all">All causes</option>
        {causes.map(({ bundle, count }) => (
          <option key={bundle} value={bundle}>
            {bundle} ({count})
          </option>
        ))}
      </select>
    </div>
  );
}
