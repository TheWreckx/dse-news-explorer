import { useState, useEffect, useMemo } from 'react';
import './index.css';
import type { NewsItem, TickerInfo } from './types';
import TickerSidebar from './components/TickerSidebar';
import FilterHeader from './components/FilterHeader';
import NewsFeed from './components/NewsFeed';

function App() {
  const [tickers, setTickers] = useState<TickerInfo[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'newsData.json')
      .then(res => res.json())
      .then(data => {
        setTickers(data.tickersList);
        // Category from scraper is already the taxonomy key — use it directly
        setNews(data.newsList);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data', err);
        setLoading(false);
      });
  }, []);

  const toggleTicker = (ticker: string) => {
    setSelectedTickers(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    );
  };

  // Derive categories from actual data so the dropdown always matches what's in the JSON
  const categories = useMemo(() =>
    Array.from(new Set(news.map(item => item.Category))).sort(),
    [news]
  );

  const industries = useMemo(() =>
    Array.from(new Set(tickers.map(t => t.industry))).sort(),
    [tickers]
  );

  const filteredNews = useMemo(() =>
    news
      .filter(item => {
        if (selectedTickers.length > 0 && !selectedTickers.includes(item.Ticker)) return false;
        if (selectedIndustry !== 'All' && item.Industry !== selectedIndustry) return false;
        if (selectedSubject !== 'All' && item.Category !== selectedSubject) return false;

        if (dateRange.start || dateRange.end) {
          const itemDate = new Date(item.Date);
          if (dateRange.start && itemDate < dateRange.start) return false;
          if (dateRange.end && itemDate > dateRange.end) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()),
    [news, selectedTickers, selectedIndustry, selectedSubject, dateRange]
  );

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h2 className="text-gradient">Loading Financial Data...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      <TickerSidebar
        tickers={tickers}
        selectedTickers={selectedTickers}
        toggleTicker={toggleTicker}
      />

      <main className="main-content">
        <FilterHeader
          industries={industries}
          categories={categories}
          selectedIndustry={selectedIndustry}
          setSelectedIndustry={setSelectedIndustry}
          selectedCategory={selectedSubject}
          setSelectedCategory={setSelectedSubject}
          dateRange={dateRange}
          setDateRange={setDateRange}
          totalResults={filteredNews.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredNews={filteredNews}
        />

        <div className="content-area">
          <NewsFeed news={filteredNews} viewMode={viewMode} />
        </div>
      </main>
    </div>
  );
}

export default App;
