import type { NewsItem } from '../types';
import { FiExternalLink, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';

interface NewsFeedProps {
  news: NewsItem[];
  viewMode: 'grid' | 'list';
}

const categoryColors: Record<string, string> = {
  Dividends_Earnings: '#10b981',
  Distress_Bankruptcy: '#ef4444',
  Restructuring_Ownership: '#f59e0b',
  Capital_Structure: '#8b5cf6',
  Operations_Growth: '#06b6d4',
  Regulatory_Legal: '#f97316',
  Asset_Events: '#64748b',
  General: '#6366f1',
};

function CategoryBadge({ category }: { category: string }) {
  const color = categoryColors[category] ?? categoryColors.General;
  return (
    <span
      className="news-category-badge"
      style={{
        background: `${color}20`,
        color,
        borderColor: `${color}50`,
      }}
    >
      {category.replace(/_/g, ' ')}
    </span>
  );
}

const NewsFeed = ({ news, viewMode }: NewsFeedProps) => {
  if (news.length === 0) {
    return (
      <div className="empty-state animated-fade">
        <FiFileText size={64} color="var(--panel-border)" />
        <h3 className="text-gradient">No News Found</h3>
        <p>Try adjusting your filters, or trigger a data sync from GitHub Actions.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="news-list animated-fade" style={{ animationDelay: '0.3s' }}>
        {news.map(item => (
          <div key={item.id} className="news-list-row glass-panel">
            <div className="news-list-meta">
              <span className="news-ticker" style={{ fontSize: '0.95rem' }}>{item.Ticker}</span>
              <span className="news-date"><FiCalendar size={11} /> {item.Date}</span>
            </div>

            <div className="news-list-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <CategoryBadge category={item.Category} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.Industry}</span>
              </div>
              <div className="news-list-title">{item.News_Title}</div>
              <div className="news-list-text">
                {item.News_Text.length > 120 ? item.News_Text.substring(0, 120) + '…' : item.News_Text}
              </div>
            </div>

            <div className="news-list-right">
              {item.Standardized_Value_Tk_Cr > 0 && (
                <div className="news-value" style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  <FiDollarSign style={{ verticalAlign: 'middle' }} />
                  Tk {item.Standardized_Value_Tk_Cr} Cr
                </div>
              )}
              <a href={item.Source_URL} target="_blank" rel="noopener noreferrer" className="news-link">
                Source <FiExternalLink size={13} />
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="news-grid animated-fade" style={{ animationDelay: '0.3s' }}>
      {news.map(item => (
        <div key={item.id} className="news-card glass-panel">
          <div className="news-header">
            <div className="news-ticker">{item.Ticker}</div>
            <div className="news-date"><FiCalendar size={12} /> {item.Date}</div>
          </div>

          <div>
            <CategoryBadge category={item.Category} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {item.Industry}
            </div>
          </div>

          <div className="news-title">{item.News_Title}</div>

          <div className="news-text">
            {item.News_Text.length > 150 ? item.News_Text.substring(0, 150) + '…' : item.News_Text}
          </div>

          <div className="news-footer">
            <div className="news-value">
              {item.Standardized_Value_Tk_Cr > 0 ? (
                <>
                  <FiDollarSign style={{ fontSize: '1rem', marginRight: '4px', verticalAlign: 'middle' }} />
                  Tk {item.Standardized_Value_Tk_Cr} Cr
                </>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>N/A</span>
              )}
            </div>
            <a href={item.Source_URL} target="_blank" rel="noopener noreferrer" className="news-link">
              Read More <FiExternalLink size={13} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;
