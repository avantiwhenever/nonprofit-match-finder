import type { JobListing } from '../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: JobListing[];
}

export function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return <p className="empty-state">No paid jobs match that search yet — try a different county.</p>;
  }

  return (
    <div className="org-list">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
