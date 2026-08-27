import { useState } from 'react';

export function usePagination<T>(items: T[], pageSize: number, initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  // Track the previous items reference in state (not a ref+effect) so the
  // reset-to-page-1-on-filter-change logic runs during render. This is the
  // React-recommended "adjusting state when a prop changes" pattern — it's
  // safe under StrictMode's dev-mode double effect invocation, unlike an
  // effect-based "is this the first render" ref guard, which doesn't
  // survive that double-invocation and was wiping out a page number
  // restored from the URL immediately after mount.
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { pageItems, page: clampedPage, totalPages, setPage };
}
