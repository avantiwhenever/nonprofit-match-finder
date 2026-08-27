interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="search"
      className="search-bar"
      placeholder="Search by name, cause, or city…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search nonprofits"
    />
  );
}
