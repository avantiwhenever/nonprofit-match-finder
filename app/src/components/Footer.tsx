import { useEffect, useRef, useState } from 'react';
import { Stamp } from 'lucide-react';

const COUNTER_URL = 'https://abacus.jasoncameron.dev/hit/nonprofit-match-finder-2026/site-visits';
const LINKEDIN_URL = 'https://www.linkedin.com/in/avantipatil/';

export function Footer() {
  const [count, setCount] = useState<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode's dev-mode double effect
    // invocation double-counting a single real visit.
    if (firedRef.current) return;
    firedRef.current = true;

    fetch(COUNTER_URL)
      .then((res) => res.json())
      .then((data) => setCount(typeof data.value === 'number' ? data.value : null))
      .catch(() => setCount(null));
  }, []);

  return (
    <footer className="site-footer">
      <div className="circulation-stamp" aria-live="polite">
        <Stamp size={18} strokeWidth={2} aria-hidden="true" />
        <span className="circulation-stamp-count">{count !== null ? count.toLocaleString() : '—'}</span>
        <span className="circulation-stamp-label">Times checked out</span>
      </div>

      <p className="footer-note">
        Nonprofit listings reflect a single pull from ProPublica's Nonprofit
        Explorer API; volunteer and job listings are hand-curated directly
        from each organization's own site. To discuss keeping this current,
        connect with me on{' '}
        <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>{' '}
        and let me know what you need.
      </p>

      <p className="footer-copyright">© 2026 Nonprofit Match Finder</p>
    </footer>
  );
}
