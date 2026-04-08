import { useState, useMemo } from 'react';
import type { TickerInfo } from '../types';
import { FiSearch, FiCode, FiLinkedin } from 'react-icons/fi';

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

      <div className="ticker-list-container" style={{ flex: 1 }}>
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

      {/* Credit */}
      <a
        href="https://www.linkedin.com/in/syed-tareq-aziz-hoque/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--panel-border)',
          textDecoration: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          transition: 'all 0.2s',
          marginTop: '4px',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#0a66c2')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        title="View LinkedIn profile"
      >
        <FiLinkedin size={14} style={{ flexShrink: 0 }} />
        <span>A project by <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Syed Tareq Aziz Hoque</strong></span>
      </a>
    </div>
  );
};

export default TickerSidebar;
