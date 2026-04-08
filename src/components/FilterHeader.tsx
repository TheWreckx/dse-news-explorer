import { FiFilter, FiClock, FiGrid, FiList, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import type { NewsItem } from '../types';

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

    // Auto-width columns
    const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
      wch: Math.max(key.length, 20),
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DSE News');

    const filename = `dse-news-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="header glass-panel animated-fade" style={{ animationDelay: '0.2s', height: 'auto', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
        <h1
          className="text-gradient"
          style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, paddingRight: '16px', borderRight: '1px solid var(--panel-border)', whiteSpace: 'nowrap' }}
        >
          DSE Explorer
        </h1>

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <FiFilter size={13} /> Industry
          </div>
          <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)} style={{ maxWidth: '180px' }}>
            <option value="All">All Industries</option>
            {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <FiClock size={13} /> Subject
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ maxWidth: '220px' }}>
            <option value="All">All Subjects</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="filter-group" style={{ gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>From</span>
            <input
              type="date"
              min="2017-01-01"
              max={today}
              value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value ? new Date(e.target.value) : null })}
              style={{ width: '140px', padding: '6px 8px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>To</span>
            <input
              type="date"
              min="2017-01-01"
              max={today}
              value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value ? new Date(e.target.value) : null })}
              style={{ width: '140px', padding: '6px 8px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={handleClearDates}
              style={{ marginTop: '14px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
          <span className="text-gradient">{totalResults}</span> Records
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            style={{
              background: viewMode === 'grid' ? 'var(--accent-blue)' : 'transparent',
              border: 'none',
              color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '7px 10px',
              borderRadius: '7px 0 0 7px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <FiGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            style={{
              background: viewMode === 'list' ? 'var(--accent-blue)' : 'transparent',
              border: 'none',
              color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '7px 10px',
              borderRadius: '0 7px 7px 0',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <FiList size={15} />
          </button>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={filteredNews.length === 0}
          className="filter-btn"
          title={`Export ${totalResults} records to Excel`}
          style={{ padding: '7px 14px', fontSize: '0.85rem', opacity: filteredNews.length === 0 ? 0.4 : 1 }}
        >
          <FiDownload size={14} /> Export
        </button>
      </div>
    </div>
  );
};

export default FilterHeader;
