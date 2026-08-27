import type { Org } from '../types';
import { OrgCard } from './OrgCard';

interface OrgListProps {
  orgs: Org[];
}

export function OrgList({ orgs }: OrgListProps) {
  if (orgs.length === 0) {
    return <p className="empty-state">No nonprofits match that search yet — try a different cause or city.</p>;
  }

  return (
    <div className="org-list">
      {orgs.map((org) => (
        <OrgCard key={org.id} org={org} />
      ))}
    </div>
  );
}
