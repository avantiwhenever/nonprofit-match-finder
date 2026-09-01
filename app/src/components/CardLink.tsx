import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface CardLinkProps {
  href: string;
  primary?: boolean;
  children: ReactNode;
}

export function CardLink({ href, primary, children }: CardLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`org-link${primary ? ' org-link-primary' : ''}`}>
      {children}
      <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" />
    </a>
  );
}
