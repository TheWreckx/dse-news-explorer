import { FiFilter, FiClock, FiGrid, FiList, FiDownload, FiCalendar, FiSearch, FiX } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import type { ArchiveMeta, Freshness, NewsItem } from '../types';
import DseLogo from './DseLogo';

interface FilterHeaderProps {
  industries: string[];
  categories: string[];
  selectedIndustry: string;
  setSelectedIndustry: (industry: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  query: string;
  setQuery: (query: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  showRoutine: boolean;
  setShowRoutine: (show: boolean) => void;
  routineLoading: boolean;
  totalResults: number;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  filteredNews: NewsItem[];
  freshness: Freshness | null;
  meta: ArchiveMeta | null;
  onReset: () => void;
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  color: '#fff',
  padding: '6px 10px',
  fontSize: '12px',
  width: '100%',
  outline: 'none',
};

const dateInputStyle: React.CSSProperties = {
  ...selectStyle,
  width: '136px',
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-secondary)',
  marginBottom: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const FilterHeader = ({
  industries,
  categories,
  selectedIndustry,
  setSelectedIndustry,
  selectedCategory,
  setSelectedCategory,
  query,
  setQuery,
  dateRange,
  setDateRange,
  showRoutine,
  setShowRoutine,
  routineLoading,
  totalResults,
  viewMode,
  setViewMode,
  filteredNews,
  freshness,
  meta,
  onReset,
}: FilterHeaderProps) => {
  const today = new Date().toISOString().split('T')[0];
  const earliest = meta?.earliestDate ?? '2024-01-01';

  const hasFilters =
    Boolean(query) ||
    selectedIndustry !== 'All' ||
    selectedCategory !== 'All' ||
    Boolean(dateRange.start) ||
    Boolean(dateRange.end);

  const handleExport = () => {
    const rows = filteredNews.map(item => ({
      Date: item.Date,
      Ticker: item.Ticker,
      Industry: item.Industry,
      Category: item.Category.replace(/_/g, ' '),
      Routine: item.Is_Routine ? 'Yes' : 'No',
      'News Title': item.News_Title,
      'News Text': item.News_Text,
      'Announced Value': item.Announced_Value_Local,
      'Value (Tk Cr)': item.Standardized_Value_Tk_Cr || '',
      'Source URL': item.Source_URL,
      'Captured At': item.Fetched_At ?? '',
      'Content Hash': item.Content_Hash ?? '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] ?? {}).map(key => ({ wch: Math.max(key.length, 20) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DSE News');
    XLSX.writeFile(wb, `dse-news-${today}.xlsx`);
  };

  return (
    <div
      className="glass-panel animated-fade"
      style={{ animationDelay: '0.2s', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}
    >
      {/* ── Row 1: Logo | Search | Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '14px', borderRight: '1px solid var(--panel-border)', flexShrink: 0 }}>
          <DseLogo size={28} />
          <span className="text-gradient" style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Explorer
          </span>
        </div>

        {/* Search — the primary way into 22,000 records */}
        <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 0, maxWidth: '520px' }}>
          <FiSearch
            size={13}
            aria-hidden="true"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}
          />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search announcements — try “dividend”, “BEXIMCO land”, “qualified opinion”"
            aria-label="Search announcements"
            style={{ ...selectStyle, padding: '8px 30px 8px 30px', fontSize: '13px' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {freshness && (
          <div
            title="When the scraper last checked dsebd.org for new announcements"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: freshness.isStale ? 'var(--warning, #e0a33e)' : 'var(--text-muted, #8b93a7)',
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: '7px', height: '7px', borderRadius: '50%', background: freshness.isStale ? 'var(--warning, #e0a33e)' : '#3fbf7f', flexShrink: 0 }}
            />
            {freshness.label}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span className="text-gradient">{totalResults.toLocaleString()}</span> Records
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '7px', border: '1px solid var(--panel-border)', flexShrink: 0 }}>
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            style={{ background: viewMode === 'grid' ? 'var(--accent-blue)' : 'transparent', border: 'none', color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', padding: '6px 9px', borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
          >
            <FiGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            style={{ background: viewMode === 'list' ? 'var(--accent-blue)' : 'transparent', border: 'none', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', padding: '6px 9px', borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
          >
            <FiList size={14} />
          </button>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredNews.length === 0}
          className="filter-btn"
          title={`Export ${totalResults} records to Excel`}
          style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: filteredNews.length === 0 ? 0.4 : 1, flexShrink: 0 }}
        >
          <FiDownload size={13} /> Export
        </button>
      </div>

      {/* ── Row 2: Filters ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--panel-border)', flexWrap: 'wrap' }}>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '0 1 180px' }}>
          <span style={labelStyle}><FiFilter size={10} /> Industry</span>
          <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)} style={selectStyle}>
            <option value="All">All Industries</option>
            {industries.map(industry => <option key={industry} value={industry}>{industry}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '0 1 210px' }}>
          <span style={labelStyle}><FiClock size={10} /> Subject</span>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={selectStyle}>
            <option value="All">All Subjects</option>
            {categories.map(category => <option key={category} value={category}>{category.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={labelStyle}><FiCalendar size={10} /> From</span>
          <input
            type="date"
            min={earliest}
            max={today}
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            style={dateInputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ ...labelStyle }}>To</span>
          <input
            type="date"
            min={earliest}
            max={today}
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            style={dateInputStyle}
          />
        </div>

        {/* Routine toggle — 62% of the archive is mechanical postings, off by default */}
        <label
          title="Fund NAV postings, board meeting schedules and trading-status flags. About 62% of all announcements."
          style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', paddingBottom: '7px' }}
        >
          <input
            type="checkbox"
            checked={showRoutine}
            onChange={e => setShowRoutine(e.target.checked)}
            style={{ accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
          />
          Include routine notices
          {routineLoading && <span style={{ opacity: 0.7 }}>loading…</span>}
        </label>

        {hasFilters && (
          <button
            onClick={onReset}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', padding: '0 4px', paddingBottom: '8px', textDecoration: 'underline' }}
          >
            Reset all
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterHeader;
