import { FiFilter, FiClock, FiGrid, FiList, FiDownload, FiCalendar } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import type { NewsItem } from '../types';
import DseLogo from './DseLogo';

interface FilterHeaderProps {
  industries: string[];
  categories: string[];
  selectedIndustry: string;
  setSelectedIndustry: (ind: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  dateRange: { start: Date | null; end: Date | null };
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  totalResults: number;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  filteredNews: NewsItem[];
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
  dateRange,
  setDateRange,
  totalResults,
  viewMode,
  setViewMode,
  filteredNews,
}: FilterHeaderProps) => {
  const today = new Date().toISOString().split('T')[0];

  const handleClearDates = () => setDateRange({ start: null, end: null });

  const handleExport = () => {
    const rows = filteredNews.map(item => ({
      Date: item.Date,
      Ticker: item.Ticker,
      Industry: item.Industry,
      Category: item.Category.replace(/_/g, ' '),
      'News Title': item.News_Title,
      'News Text': item.News_Text,
      'Announced Value': item.Announced_Value_Local,
      'Value (Tk Cr)': item.Standardized_Value_Tk_Cr || '',
      'Source URL': item.Source_URL,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] ?? {}).map(key => ({ wch: Math.max(key.length, 20) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DSE News');
    XLSX.writeFile(wb, `dse-news-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div
      className="glass-panel animated-fade"
      style={{ animationDelay: '0.2s', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}
    >
      {/* ── Row 1: Logo | Dropdowns | Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '14px', borderRight: '1px solid var(--panel-border)', flexShrink: 0 }}>
          <DseLogo size={28} />
          <span className="text-gradient" style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Explorer
          </span>
        </div>

        {/* Industry */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '1 1 150px', maxWidth: '200px' }}>
          <span style={labelStyle}><FiFilter size={10} /> Industry</span>
          <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)} style={selectStyle}>
            <option value="All">All Industries</option>
            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '1 1 170px', maxWidth: '240px' }}>
          <span style={labelStyle}><FiClock size={10} /> Subject</span>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={selectStyle}>
            <option value="All">All Subjects</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Records badge */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span className="text-gradient">{totalResults}</span> Records
        </div>

        {/* View toggle */}
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

        {/* Export */}
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

      {/* ── Row 2: Date range ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--panel-border)' }}>
        <span style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>
          <FiCalendar size={10} /> Date Range
        </span>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ ...labelStyle, marginBottom: '2px' }}>From</span>
          <input
            type="date"
            min="2017-01-01"
            max={today}
            value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })}
            style={dateInputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ ...labelStyle, marginBottom: '2px' }}>To</span>
          <input
            type="date"
            min="2017-01-01"
            max={today}
            value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })}
            style={dateInputStyle}
          />
        </div>

        {(dateRange.start || dateRange.end) && (
          <button
            onClick={handleClearDates}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', padding: '0 4px', alignSelf: 'flex-end', marginBottom: '1px' }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterHeader;
