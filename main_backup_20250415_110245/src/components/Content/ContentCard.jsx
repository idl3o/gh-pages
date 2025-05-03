import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ContentTiers } from '../../services/freebaseService';

const ContentCard = ({ content, compact = false }) => {
  const { id, title, creator, thumbnailUrl, duration, tier, views } = content;
  
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine badge style based on content tier
  const getBadge = () => {
    switch(tier) {
      case ContentTiers.FREE:
        return <span className="content-badge free">Free</span>;
      case ContentTiers.BASIC:
        return <span className="content-badge basic">Basic</span>;
      case ContentTiers.PREMIUM:
        return <span className="content-badge premium">Premium</span>;
      case ContentTiers.EXCLUSIVE:
        return <span className="content-badge exclusive">Exclusive</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className={`content-card ${tier}`}>
      <Link to={`/watch/${id}`} className="content-thumbnail">
        <img src={thumbnailUrl} alt={title} />
        {duration && <span className="duration">{formatDuration(duration)}</span>}
        {getBadge()}
      </Link>
      
      <div className="content-details">
        <h3 className="content-title">
          <Link to={`/watch/${id}`}>{title}</Link>
        </h3>
        
        {!compact && (
          <>
            <div className="creator-info">
              <Link to={`/creator/${creator.id}`} className="creator-link">
                <img src={creator.avatarUrl} alt={creator.name} className="creator-avatar" />
                <span className="creator-name">{creator.name}</span>
              </Link>
            </div>
            <div className="content-meta">
              <span className="views">{views} views</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

ContentCard.propTypes = {
  content: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    creator: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string.isRequired
    }).isRequired,
    thumbnailUrl: PropTypes.string.isRequired,
    duration: PropTypes.number,
    tier: PropTypes.oneOf(Object.values(ContentTiers)),
    views: PropTypes.number
  }).isRequired,
  compact: PropTypes.bool
};

export default ContentCard;
