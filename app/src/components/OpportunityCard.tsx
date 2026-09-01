import type { Opportunity, Org } from '../types';
import { CAUSE_ICONS } from '../lib/causeIcons';
import { CardLink } from './CardLink';

interface OpportunityCardProps {
  opportunity: Opportunity;
  org?: Org;
}

export function OpportunityCard({ opportunity: o, org }: OpportunityCardProps) {
  const CauseIcon = CAUSE_ICONS[o.causeBundle];

  return (
    <article className={`org-card ${o.status === 'paused' ? 'card-paused' : ''}`}>
      <div className="org-card-header">
        <h3>{o.title}</h3>
        <span className="cause-tag">
          <CauseIcon size={11} strokeWidth={2.5} aria-hidden="true" />
          {o.causeBundle}
        </span>
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
          <CardLink href={o.signUpUrl} primary>
            Sign up
          </CardLink>
        )}
        {org?.website && <CardLink href={org.website}>Visit organization</CardLink>}
        {o.contact && <span className="org-address">{o.contact}</span>}
      </div>
    </article>
  );
}
