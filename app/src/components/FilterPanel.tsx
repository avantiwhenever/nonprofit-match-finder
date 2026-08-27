import type { ReactNode } from 'react';

interface FilterPanelProps {
  activeCount: number;
  children: ReactNode;
}

export function FilterPanel({ activeCount, children }: FilterPanelProps) {
  return (
    <details className="filter-panel">
      <summary className="filter-panel-summary">
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </summary>
      <div className="filter-panel-body">{children}</div>
    </details>
  );
}
