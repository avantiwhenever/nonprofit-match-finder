import type { Opportunity } from '../types';
import { OpportunityCard } from './OpportunityCard';

interface OpportunityListProps {
  opportunities: Opportunity[];
}

export function OpportunityList({ opportunities }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return <p className="empty-state">No volunteer opportunities match that search yet — try a different cause or county.</p>;
  }

  return (
    <div className="org-list">
      {opportunities.map((o) => (
        <OpportunityCard key={o.id} opportunity={o} />
      ))}
    </div>
  );
}
