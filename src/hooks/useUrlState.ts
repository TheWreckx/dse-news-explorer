import { useCallback, useEffect, useState } from 'react';

/**
 * Keeps the active view in the query string.
 *
 * Without this, every result set is unshareable — a reader who finds all of a
 * company's dividend history has no way to send it to anyone. Reading the URL
 * on mount also means inbound links from search results land on the right
 * filtered view rather than the unfiltered feed.
 */

export interface ViewState {
  query: string;
  tickers: string[];
  industry: string;
  category: string;
  from: string;
  to: string;
  showRoutine: boolean;
}

export const DEFAULT_VIEW: ViewState = {
  query: '',
  tickers: [],
  industry: 'All',
  category: 'All',
  from: '',
  to: '',
  showRoutine: false,
};

function readUrl(): ViewState {
  const params = new URLSearchParams(window.location.search);
  const tickers = params.get('tickers');

  return {
    query: params.get('q') ?? DEFAULT_VIEW.query,
    tickers: tickers ? tickers.split(',').filter(Boolean) : [],
    industry: params.get('industry') ?? DEFAULT_VIEW.industry,
    category: params.get('subject') ?? DEFAULT_VIEW.category,
    from: params.get('from') ?? DEFAULT_VIEW.from,
    to: params.get('to') ?? DEFAULT_VIEW.to,
    showRoutine: params.get('routine') === '1',
  };
}

/** Only non-default values are written, keeping shared links short. */
function toSearchString(view: ViewState): string {
  const params = new URLSearchParams();

  if (view.query) params.set('q', view.query);
  if (view.tickers.length) params.set('tickers', view.tickers.join(','));
  if (view.industry !== 'All') params.set('industry', view.industry);
  if (view.category !== 'All') params.set('subject', view.category);
  if (view.from) params.set('from', view.from);
  if (view.to) params.set('to', view.to);
  if (view.showRoutine) params.set('routine', '1');

  const search = params.toString();
  return search ? `?${search}` : window.location.pathname;
}

export function useUrlState() {
  const [view, setView] = useState<ViewState>(readUrl);

  // Replace rather than push: typing in the search box should not bury the
  // reader's previous page under dozens of history entries.
  useEffect(() => {
    const next = toSearchString(view);
    const current = window.location.search || window.location.pathname;
    if (next !== current) {
      window.history.replaceState(null, '', next);
    }
  }, [view]);

  // Keep state in sync when the reader uses back/forward.
  useEffect(() => {
    const onPopState = () => setView(readUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const update = useCallback((patch: Partial<ViewState>) => {
    setView(prev => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setView(DEFAULT_VIEW), []);

  return { view, update, reset };
}
