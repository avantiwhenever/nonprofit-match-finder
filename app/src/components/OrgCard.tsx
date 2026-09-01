import type { Org } from '../types';
import { CAUSE_ICONS } from '../lib/causeIcons';
import { CardLink } from './CardLink';

interface OrgCardProps {
  org: Org;
}

export function OrgCard({ org }: OrgCardProps) {
  const CauseIcon = CAUSE_ICONS[org.causeBundle];

  return (
    <article className="org-card">
      <div className="org-card-header">
        <h3>{org.name}</h3>
        <span className="cause-tag">
          <CauseIcon size={11} strokeWidth={2.5} aria-hidden="true" />
          {org.causeBundle}
        </span>
      </div>
      <p className="org-city">{org.city}, {org.state} · {org.county} County</p>
      {org.address && <p className="org-address">{org.address}</p>}
      <div className="org-card-actions">
        {org.website && <CardLink href={org.website}>Visit website</CardLink>}
        {org.volunteerUrl && (
          <CardLink href={org.volunteerUrl} primary>
            Volunteer page
          </CardLink>
        )}
      </div>
    </article>
  );
}
