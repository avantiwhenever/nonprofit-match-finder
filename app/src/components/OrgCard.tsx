import type { Org } from '../types';

interface OrgCardProps {
  org: Org;
}

export function OrgCard({ org }: OrgCardProps) {
  const hasVerifiedLink = org.source === 'curated';

  return (
    <article className="org-card">
      <div className="org-card-header">
        <h3>{org.name}</h3>
        <span className="cause-tag">{org.causeBundle}</span>
      </div>
      <p className="org-city">{org.city}, {org.state} · {org.county} County</p>
      {org.mission ? (
        <p className="org-mission">{org.mission}</p>
      ) : (
        <p className="org-mission org-mission-unknown">
          Mission details aren't available from our data source yet.
        </p>
      )}
      {org.address && <p className="org-address">{org.address}</p>}
      <div className="org-card-actions">
        {org.website && (
          <a href={org.website} target="_blank" rel="noreferrer" className="org-link">
            Visit website →
          </a>
        )}
        {org.volunteerUrl && (
          <a href={org.volunteerUrl} target="_blank" rel="noreferrer" className="org-link org-link-primary">
            {hasVerifiedLink ? 'Volunteer page →' : 'Search for their volunteer page →'}
          </a>
        )}
      </div>
    </article>
  );
}
