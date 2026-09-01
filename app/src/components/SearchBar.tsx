import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar-wrap">
      <Search className="search-bar-icon" size={17} strokeWidth={2.25} aria-hidden="true" />
      <input
        type="search"
        className="search-bar"
        placeholder="Search by name, cause, or city…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search nonprofits"
      />
    </div>
  );
}
