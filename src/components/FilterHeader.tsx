import { FiFilter, FiCalendar, FiClock } from 'react-icons/fi';

interface FilterHeaderProps {
  industries: string[];
  categories: string[];
  selectedIndustry: string;
  setSelectedIndustry: (ind: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  dateRange: {start: Date | null, end: Date | null};
  setDateRange: (range: {start: Date | null, end: Date | null}) => void;
  totalResults: number;
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
  totalResults
}: FilterHeaderProps) => {

  const handleClearDates = () => {
    setDateRange({start: null, end: null});
  }

  return (
    <div className="header glass-panel animated-fade" style={{animationDelay: '0.2s'}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
        <h1 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, paddingRight: '20px', borderRight: '1px solid var(--panel-border)' }}>
          DSE Explorer
        </h1>

        <div className="filter-group" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <FiFilter /> Industry:
            </div>
            <select 
              value={selectedIndustry} 
              onChange={e => setSelectedIndustry(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="All">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
        </div>

        <div className="filter-group" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <FiClock /> Subject Matter:
            </div>
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ maxWidth: '250px' }}
            >
              <option value="All">All Subjects</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)}
            </select>
        </div>

        <div className="filter-group" style={{ position: 'relative' }}>
            <div 
              onClick={handleClearDates}
              title="Clear Dates"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.1)', padding: '10px 16px', borderRadius: '8px' }}>
              <FiCalendar /> 
              {dateRange.start ? 'Custom Dates' : 'All Dates'}
            </div>
        </div>

      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
        <span className="text-gradient">{totalResults}</span> Records Found
      </div>
    </div>
  );
};

export default FilterHeader;
