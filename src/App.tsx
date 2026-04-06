import { useState, useEffect } from 'react';
import './index.css';
import type { NewsItem, TickerInfo } from './types';
import TickerSidebar from './components/TickerSidebar';
import FilterHeader from './components/FilterHeader';
import NewsFeed from './components/NewsFeed';

const dse_event_taxonomy: Record<string, string[]> = {
  "Dividends_Earnings": [
    "Cash Dividend", "Stock Dividend", "Bonus Share", "Dividend Declaration",
    "No Dividend", "Interim Dividend", "Final Dividend", "Record Date",
    "EPS", "Earnings Per Share", "NAV", "Net Asset Value", "NOCFPS",
    "Profit", "Loss", "Financial Statements", "Quarterly Report", "Audited Financials"
  ],
  "Distress_Bankruptcy": [
    "Bankruptcy", "Insolvency", "Liquidation", "Winding Up", "Default",
    "Production Suspension", "Factory Closure", "Layoff", "Auction",
    "CIB Default", "Going Concern", "Qualified Opinion", "Asset Seizure",
    "Adverse Opinion", "Disclaimer of Opinion"
  ],
  "Restructuring_Ownership": [
    "Merger", "Acquisition", "Amalgamation", "Takeover", "Privatization",
    "Divestment", "Spin-off", "Sponsor Share", "Director Purchase",
    "Director Sale", "Pledging of Shares", "Board Reconstitution",
    "Management Change", "CFO Appointment", "Company Secretary", "Auditor Appointment"
  ],
  "Capital_Structure": [
    "Rights Issue", "Right Share", "Stock Split", "Reverse Split",
    "Share Buyback", "Par Value", "Paid-up Capital", "Authorized Capital",
    "Dilution", "Renunciation", "Subscription Period", "Capitalization of Reserve"
  ],
  "Operations_Growth": [
    "Capacity Expansion", "New Production Line", "Commercial Operation",
    "Export Order", "Joint Venture", "MoU", "Memorandum of Understanding",
    "Product Launch", "Machinery Purchase", "Land Acquisition", "Factory Building",
    "Credit Rating", "CRISL", "Surveillance Rating"
  ],
  "Regulatory_Legal": [
    "BSEC Order", "DSE Show Cause", "Fine", "Penalty", "Non-compliance",
    "Trading Suspension", "Delisting", "Category Change", "Trading Halt",
    "Writ Petition", "Litigation", "Forensic Audit", "Enforcement"
  ],
  "Asset_Events": [
    "Sale of Assets", "Disposal of Property", "Lease Agreement", "Asset Revaluation"
  ]
};

function getSubject(category: string): string {
  const formattedCat = category.replace(/_/g, ' ').toLowerCase();
  for (const [subject, events] of Object.entries(dse_event_taxonomy)) {
    if (events.some(e => {
      const el = e.toLowerCase();
      return el === formattedCat || formattedCat.includes(el) || el.includes(formattedCat);
    })) {
      return subject;
    }
  }
  return 'Other';
}

function App() {
  const [tickers, setTickers] = useState<TickerInfo[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'newsData.json')
      .then(res => res.json())
      .then(data => {
        setTickers(data.tickersList);
        setNews(data.newsList.map((item: NewsItem) => ({
          ...item,
          Subject: getSubject(item.Category)
        })));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load data", err);
        setLoading(false);
      });
  }, []);

  const toggleTicker = (ticker: string) => {
    setSelectedTickers(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    );
  };

  const filteredNews = news.filter(item => {
    if (selectedTickers.length > 0 && !selectedTickers.includes(item.Ticker)) return false;
    if (selectedIndustry !== 'All' && item.Industry !== selectedIndustry) return false;
    if (selectedSubject !== 'All' && (item as any).Subject !== selectedSubject) return false;

    if (dateRange.start || dateRange.end) {
      const itemDate = new Date(item.Date);
      if (dateRange.start && itemDate < dateRange.start) return false;
      if (dateRange.end && itemDate > dateRange.end) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

  if (loading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <h2 className="text-gradient">Loading Financial Data...</h2>
    </div>;
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
          industries={Array.from(new Set(tickers.map(t => t.industry)))}
          categories={[...Object.keys(dse_event_taxonomy), 'Other']}
          selectedIndustry={selectedIndustry}
          setSelectedIndustry={setSelectedIndustry}
          selectedCategory={selectedSubject}
          setSelectedCategory={setSelectedSubject}
          dateRange={dateRange}
          setDateRange={setDateRange}
          totalResults={filteredNews.length}
        />

        <div className="content-area">
          <NewsFeed news={filteredNews} />
        </div>
      </main>
    </div>
  );
}

export default App;
