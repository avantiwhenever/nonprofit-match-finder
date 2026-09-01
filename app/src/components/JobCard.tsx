import type { JobListing, Org } from '../types';
import { mailtoSourceUrl } from '../lib/mailto';
import { CardLink } from './CardLink';

interface JobCardProps {
  job: JobListing;
  org?: Org;
}

export function JobCard({ job, org }: JobCardProps) {
  const sourceUrl = mailtoSourceUrl(job.applyUrl);

  return (
    <article className="org-card">
      <div className="org-card-header">
        <h3>{job.title}</h3>
        {job.employmentType && <span className="job-type-tag">{job.employmentType}</span>}
      </div>
      <p className="org-city">
        {job.orgName} · {job.city}, {job.county} County
        {job.department && ` · ${job.department}`}
      </p>
      {job.pay && <p className="org-mission job-pay">{job.pay}</p>}
      {!job.specific && (
        <p className="org-mission org-mission-unknown">
          Specific openings vary — this org doesn't list individual positions on their own site.
        </p>
      )}
      <div className="org-card-actions">
        {job.applyUrl && (
          <CardLink href={job.applyUrl} primary>
            {job.specific ? 'View & apply' : 'See current openings'}
          </CardLink>
        )}
        {sourceUrl && <CardLink href={sourceUrl}>Job posting source</CardLink>}
        {org?.website && <CardLink href={org.website}>Visit organization</CardLink>}
      </div>
    </article>
  );
}
