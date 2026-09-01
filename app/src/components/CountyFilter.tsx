import { MapPin } from 'lucide-react';
import type { County } from '../types';

interface CountyFilterProps {
  selected: County | null;
  onSelect: (county: County | null) => void;
}

export function CountyFilter({ selected, onSelect }: CountyFilterProps) {
  return (
    <div className="filter-select-wrap">
      <MapPin className="filter-select-icon" size={14} strokeWidth={2.25} aria-hidden="true" />
      <select
        className="filter-select"
        value={selected ?? 'both'}
        onChange={(e) => onSelect(e.target.value === 'both' ? null : (e.target.value as County))}
        aria-label="Filter by county"
      >
        <option value="both">All counties</option>
        <option value="King">King County</option>
        <option value="Snohomish">Snohomish County</option>
      </select>
    </div>
  );
}
