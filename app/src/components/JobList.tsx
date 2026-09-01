import type { JobListing, Org } from '../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: JobListing[];
  orgById: Map<string, Org>;
}

export function JobList({ jobs, orgById }: JobListProps) {
  if (jobs.length === 0) {
    return <p className="empty-state">No paid jobs match that search yet — try a different county.</p>;
  }

  return (
    <div className="org-list">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} org={orgById.get(job.orgId)} />
      ))}
    </div>
  );
}
