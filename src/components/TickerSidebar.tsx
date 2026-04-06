import { useState, useMemo } from 'react';
import type { TickerInfo } from '../types';
import { FiSearch, FiCode } from 'react-icons/fi';

interface TickerSidebarProps {
  tickers: TickerInfo[];
  selectedTickers: string[];
  toggleTicker: (ticker: string) => void;
}

const TickerSidebar = ({ tickers, selectedTickers, toggleTicker }: TickerSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTickers = useMemo(() => {
    return tickers.filter(t => 
      t.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.industry.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tickers, searchQuery]);

  return (
    <div className="sidebar glass-panel animated-fade" style={{animationDelay: '0.1s'}}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FiCode size={24} className="text-gradient" />
        <span className="text-gradient">Tickers</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          ({selectedTickers.length}/{tickers.length})
        </span>
      </h2>
      
      <div style={{ position: 'relative' }}>
        <FiSearch style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Search 412 Tickers..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
      </div>

      <div className="ticker-list-container">
        {filteredTickers.map(t => (
          <div 
            key={t.ticker} 
            className={`ticker-item ${selectedTickers.includes(t.ticker) ? 'active' : ''}`}
            onClick={() => toggleTicker(t.ticker)}
          >
            <div>
              <div className="ticker-name">{t.ticker}</div>
              <div className="ticker-industry">{t.industry}</div>
            </div>
            
            {/* Custom Checkbox */}
            <div style={{
              width: '18px', height: '18px', 
              borderRadius: '4px',
              border: `2px solid ${selectedTickers.includes(t.ticker) ? 'var(--accent-blue)' : 'var(--panel-border)'}`,
              background: selectedTickers.includes(t.ticker) ? 'var(--accent-blue)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {selectedTickers.includes(t.ticker) && (
                <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
                  <path d="M3 7.5L5.5 10L11 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerSidebar;
