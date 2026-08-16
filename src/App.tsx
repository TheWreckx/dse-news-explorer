import { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import './index.css';
import type { Freshness, NewsItem } from './types';
import { useArchive } from './hooks/useArchive';
import { useUrlState } from './hooks/useUrlState';
import { buildSearchIndex, searchItems } from './lib/search';
import TickerSidebar from './components/TickerSidebar';
import FilterHeader from './components/FilterHeader';
import NewsFeed from './components/NewsFeed';
import ArchiveBadge from './components/ArchiveBadge';

/** A scrape more than two days old means the pipeline is stuck, not that DSE was quiet. */
const STALE_AFTER_HOURS = 48;

function describeFreshness(lastChecked: unknown): Freshness | null {
  if (typeof lastChecked !== 'string') return null;

  const checked = new Date(lastChecked);
  if (Number.isNaN(checked.getTime())) return null;

  const hoursAgo = (Date.now() - checked.getTime()) / 3_600_000;
  const isStale = hoursAgo > STALE_AFTER_HOURS;

  return {
    label: isStale
      ? `Last updated ${format(checked, 'd MMM yyyy')}`
      : `Updated ${formatDistanceToNow(checked, { addSuffix: true })}`,
    isStale,
  };
}

function App() {
  const { tickers, material, routine, meta, loading, routineLoading, error, loadRoutine } = useArchive();
  const { view, update, reset } = useUrlState();

  const [freshness, setFreshness] = useState<Freshness | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Written by the scraper workflow on every successful run. Absent on the
    // very first deploy, so a failure here must not block the feed.
    fetch(import.meta.env.BASE_URL + 'lastChecked.json')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setFreshness(describeFreshness(data?.lastChecked)))
      .catch(() => setFreshness(null));
  }, []);

  // Requesting routine notices triggers their one-time download.
  useEffect(() => {
    if (view.showRoutine) loadRoutine();
  }, [view.showRoutine, loadRoutine]);

  const activeNews = useMemo<NewsItem[]>(
    () => (view.showRoutine ? [...material, ...routine] : material),
    [view.showRoutine, material, routine],
  );

  const searchIndex = useMemo(() => buildSearchIndex(activeNews), [activeNews]);

  const toggleTicker = (ticker: string) => {
    update({
      tickers: view.tickers.includes(ticker)
        ? view.tickers.filter(t => t !== ticker)
        : [...view.tickers, ticker],
    });
  };

  const categories = useMemo(
    () => Array.from(new Set(activeNews.map(item => item.Category))).sort(),
    [activeNews],
  );

  const industries = useMemo(
    () => Array.from(new Set(tickers.map(t => t.industry))).sort(),
    [tickers],
  );

  const filteredNews = useMemo(() => {
    // Search first: it both filters and establishes relevance order.
    const matches = searchItems(searchIndex, view.query);
    const hasQuery = view.query.trim().length > 0;

    const filtered = matches.filter(item => {
      if (view.tickers.length > 0 && !view.tickers.includes(item.Ticker)) return false;
      if (view.industry !== 'All' && item.Industry !== view.industry) return false;
      if (view.category !== 'All' && item.Category !== view.category) return false;
      if (view.from && item.Date < view.from) return false;
      if (view.to && item.Date > view.to) return false;
      return true;
    });

    // Relevance ranking only makes sense when the reader actually searched.
    return hasQuery
      ? filtered
      : filtered.sort((a, b) => b.Date.localeCompare(a.Date));
  }, [searchIndex, view]);

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h2 className="text-gradient">Loading Financial Data...</h2>
      </div>
    );
  }

  if (error && material.length === 0) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '10px' }}>
        <h2 className="text-gradient">Could not load the archive</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <TickerSidebar
        tickers={tickers}
        selectedTickers={view.tickers}
        toggleTicker={toggleTicker}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        resultCount={filteredNews.length}
      />

      <main className="main-content">
        <FilterHeader
          industries={industries}
          categories={categories}
          selectedIndustry={view.industry}
          setSelectedIndustry={industry => update({ industry })}
          selectedCategory={view.category}
          setSelectedCategory={category => update({ category })}
          query={view.query}
          setQuery={query => update({ query })}
          dateRange={{ start: view.from, end: view.to }}
          setDateRange={range => update({ from: range.start, to: range.end })}
          showRoutine={view.showRoutine}
          setShowRoutine={showRoutine => update({ showRoutine })}
          routineLoading={routineLoading}
          totalResults={filteredNews.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredNews={filteredNews}
          freshness={freshness}
          meta={meta}
          onReset={reset}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <ArchiveBadge
          meta={meta}
          onShowBeyondSource={floorDate => update({ to: floorDate, from: '', query: '' })}
        />

        <div className="content-area">
          <NewsFeed news={filteredNews} viewMode={viewMode} />
        </div>
      </main>
    </div>
  );
}

export default App;
