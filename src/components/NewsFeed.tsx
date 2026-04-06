import type { NewsItem } from '../types';
import { FiExternalLink, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';

interface NewsFeedProps {
  news: NewsItem[];
}

const NewsFeed = ({ news }: NewsFeedProps) => {

  if (news.length === 0) {
    return (
      <div className="empty-state animated-fade">
        <FiFileText size={64} color="var(--panel-border)" />
        <h3 className="text-gradient">No News Found</h3>
        <p>Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <div className="news-grid animated-fade" style={{animationDelay: '0.3s'}}>
      {news.map(item => (
        <div key={item.id} className="news-card glass-panel">
          <div className="news-header">
            <div className="news-ticker">
              {item.Ticker}
            </div>
            <div className="news-date">
              <FiCalendar /> {item.Date}
            </div>
          </div>
          
          <div>
            <span className="news-category-badge">
              {item.Category.replace('_', ' ')}
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {item.Industry}
            </div>
          </div>

          <div className="news-title">
            {item.News_Title}
          </div>

          <div className="news-text">
            {item.News_Text.length > 150 ? item.News_Text.substring(0, 150) + '...' : item.News_Text}
          </div>

          <div className="news-footer">
            <div className="news-value">
              {item.Standardized_Value_Tk_Cr > 0 ? (
                <>
                  <FiDollarSign style={{ fontSize: '1rem', marginRight: '4px', verticalAlign: 'middle' }}/>
                  Tk {item.Standardized_Value_Tk_Cr} Cr
                </>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>N/A</span>
              )}
            </div>
            
            <a href={item.Source_URL} target="_blank" rel="noopener noreferrer" className="news-link">
              Read More <FiExternalLink />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;
