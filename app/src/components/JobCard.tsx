import type { JobListing } from '../types';

interface JobCardProps {
  job: JobListing;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <article className="org-card">
      <div className="org-card-header">
        <h3>{job.title}</h3>
        {job.employmentType && <span className="cause-tag">{job.employmentType}</span>}
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
          <a href={job.applyUrl} target="_blank" rel="noreferrer" className="org-link org-link-primary">
            {job.specific ? 'View & apply →' : 'See current openings →'}
          </a>
        )}
      </div>
    </article>
  );
}
