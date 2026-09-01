import type { Opportunity, Org } from '../types';
import { OpportunityCard } from './OpportunityCard';

interface OpportunityListProps {
  opportunities: Opportunity[];
  orgById: Map<string, Org>;
}

export function OpportunityList({ opportunities, orgById }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return <p className="empty-state">No volunteer opportunities match that search yet — try a different cause or county.</p>;
  }

  return (
    <div className="org-list">
      {opportunities.map((o) => (
        <OpportunityCard key={o.id} opportunity={o} org={orgById.get(o.orgId)} />
      ))}
    </div>
  );
}
