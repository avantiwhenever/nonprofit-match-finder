import type { Opportunity, Org } from '../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  org?: Org;
}

export function OpportunityCard({ opportunity: o, org }: OpportunityCardProps) {
  return (
    <article className={`org-card ${o.status === 'paused' ? 'card-paused' : ''}`}>
      <div className="org-card-header">
        <h3>{o.title}</h3>
        <span className="cause-tag">{o.causeBundle}</span>
      </div>
      <p className="org-city">
        {o.orgName} · {o.remote ? 'Remote' : `${o.city}, ${o.county} County`}
        {o.status === 'paused' && <span className="status-badge"> · Currently paused</span>}
      </p>
      <p className="org-mission">{o.description}</p>

      <dl className="opportunity-meta">
        {o.schedule && (
          <>
            <dt>Schedule</dt>
            <dd>{o.schedule}</dd>
          </>
        )}
        {o.commitment && (
          <>
            <dt>Commitment</dt>
            <dd>{o.commitment}</dd>
          </>
        )}
        {o.requirements.length > 0 && (
          <>
            <dt>Requirements</dt>
            <dd>
              <ul className="requirements-list">
                {o.requirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>

      <div className="org-card-actions">
        {o.signUpUrl && (
          <a href={o.signUpUrl} target="_blank" rel="noreferrer" className="org-link org-link-primary">
            Sign up →
          </a>
        )}
        {org?.website && (
          <a href={org.website} target="_blank" rel="noreferrer" className="org-link">
            Visit organization →
          </a>
        )}
        {o.contact && <span className="org-address">{o.contact}</span>}
      </div>
    </article>
  );
}
