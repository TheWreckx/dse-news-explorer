import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArchiveMeta, NewsItem, TickerInfo } from '../types';

/**
 * Loads the announcement archive.
 *
 * Material announcements ship in the initial payload. Routine postings —
 * fund NAVs, meeting schedules, trading-status flags, about 62% of all
 * records — live in a second file that is only fetched if the reader turns
 * them on, which keeps the first load roughly half the size.
 */

interface ArchiveState {
  tickers: TickerInfo[];
  material: NewsItem[];
  routine: NewsItem[];
  meta: ArchiveMeta | null;
  loading: boolean;
  routineLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: ArchiveState = {
  tickers: [],
  material: [],
  routine: [],
  meta: null,
  loading: true,
  routineLoading: false,
  error: null,
};

export function useArchive() {
  const [state, setState] = useState<ArchiveState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    fetch(import.meta.env.BASE_URL + 'newsData.json')
      .then(res => {
        if (!res.ok) throw new Error(`Archive request failed (${res.status})`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setState(prev => ({
          ...prev,
          tickers: data.tickersList ?? [],
          material: data.newsList ?? [],
          meta: data.meta ?? null,
          loading: false,
        }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Could not load the archive',
        }));
      });

    return () => { cancelled = true; };
  }, []);

  // Guards against a second fetch from StrictMode's double invocation or from
  // the reader toggling routine notices off and back on.
  const routineRequested = useRef(false);

  /** Fetch the routine file once, on first request. */
  const loadRoutine = useCallback(() => {
    if (routineRequested.current) return;
    routineRequested.current = true;

    setState(prev => ({ ...prev, routineLoading: true }));

    fetch(import.meta.env.BASE_URL + 'newsRoutine.json')
      .then(res => {
        if (!res.ok) throw new Error(`Routine request failed (${res.status})`);
        return res.json();
      })
      .then(data => {
        setState(prev => ({
          ...prev,
          routine: data.newsList ?? [],
          routineLoading: false,
        }));
      })
      .catch(() => {
        routineRequested.current = false;
        setState(prev => ({
          ...prev,
          routineLoading: false,
          error: 'Could not load routine notices',
        }));
      });
  }, []);

  return { ...state, loadRoutine };
}
