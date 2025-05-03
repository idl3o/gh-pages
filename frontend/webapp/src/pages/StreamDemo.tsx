import { useState, useEffect } from 'react';
import VideoPlayer from '../components/player/VideoPlayer';
import TipCreator from '../components/transactions/TipCreator';
import styles from './StreamDemo.module.css';

interface StreamInfo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  creator: {
    name: string;
    address: string;
    avatarUrl: string;
  };
  views: number;
  createdAt: string;
  tags: string[];
}

const StreamDemo = () => {
  const [currentStream, setCurrentStream] = useState<StreamInfo>({
    id: 'stream-123',
    title: 'Introduction to Web3 Streaming',
    description: 'Learn how Web3 is revolutionizing content streaming platforms by enabling direct creator monetization, user ownership, and decentralized governance.',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Sample video
    thumbnailUrl: 'https://via.placeholder.com/640x360?text=Video+Thumbnail',
    creator: {
      name: 'CryptoCreator',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      avatarUrl: 'https://via.placeholder.com/150?text=CC'
    },
    views: 1240,
    createdAt: '2025-05-02T15:30:00Z',
    tags: ['Web3', 'Blockchain', 'Streaming']
  });
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [comments, setComments] = useState([
    {
      id: 'comment-1',
      text: 'Great content! Loving the Web3 integration.',
      user: 'Web3Fan',
      createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      avatarUrl: 'https://via.placeholder.com/40?text=W3F'
    },
    {
      id: 'comment-2',
      text: 'Could you explain more about token-gated content in the next video?',
      user: 'BlockchainDev',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      avatarUrl: 'https://via.placeholder.com/40?text=BD'
    }
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [relatedStreams, setRelatedStreams] = useState([
    {
      id: 'stream-456',
      title: 'Building dApps for Content Creators',
      thumbnailUrl: 'https://via.placeholder.com/240x135?text=dApps',
      creator: 'EthDev',
      views: 890
    },
    {
      id: 'stream-789',
      title: 'NFT Integration for Video Platforms',
      thumbnailUrl: 'https://via.placeholder.com/240x135?text=NFTs',
      creator: 'TokenMaster',
      views: 1530
    },
    {
      id: 'stream-101',
      title: 'Decentralized Storage Solutions',
      thumbnailUrl: 'https://via.placeholder.com/240x135?text=Storage',
      creator: 'IPFSexpert',
      views: 720
    }
  ]);
  
  const [tipSuccess, setTipSuccess] = useState<string | null>(null);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffMins / 1440);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };
  
  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: `comment-${Date.now()}`,
      text: newComment,
      user: 'CurrentUser', // In a real app, this would be the logged-in user
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://via.placeholder.com/40?text=YOU'
    };
    
    setComments([newCommentObj, ...comments]);
    setNewComment('');
  };
  
  const handleTipSuccess = (hash: string) => {
    setTipSuccess(`Transaction successful! Hash: ${hash}`);
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setTipSuccess(null);
    }, 5000);
  };

  return (
    <div className={styles.streamPage}>
      <div className={styles.mainContent}>
        <div className={styles.playerSection}>
          <VideoPlayer 
            src={currentStream.videoUrl}
            poster={currentStream.thumbnailUrl}
            title={currentStream.title}
            creatorName={currentStream.creator.name}
          />
        </div>
        
        <div className={styles.streamInfo}>
          <h1 className={styles.streamTitle}>{currentStream.title}</h1>
          
          <div className={styles.metaInfo}>
            <span className={styles.views}>{currentStream.views.toLocaleString()} views</span>
            <span className={styles.dot}>•</span>
            <span className={styles.date}>{formatDate(currentStream.createdAt)}</span>
            <div className={styles.tags}>
              {currentStream.tags.map(tag => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>
          </div>
          
          <div className={styles.creatorBar}>
            <div className={styles.creatorInfo}>
              <img 
                src={currentStream.creator.avatarUrl}
                alt={currentStream.creator.name}
                className={styles.creatorAvatar}
              />
              <div className={styles.creatorDetails}>
                <h3 className={styles.creatorName}>{currentStream.creator.name}</h3>
                <span className={styles.creatorAddress}>
                  {`${currentStream.creator.address.substring(0, 6)}...${currentStream.creator.address.substring(currentStream.creator.address.length - 4)}`}
                </span>
              </div>
            </div>
            
            <button 
              className={`${styles.subscribeButton} ${isSubscribed ? styles.subscribed : ''}`}
              onClick={handleSubscribe}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
          
          <div className={styles.streamDescription}>
            <p>{currentStream.description}</p>
          </div>
        </div>
        
        <div className={styles.supportSection}>
          <TipCreator 
            creatorAddress={currentStream.creator.address}
            creatorName={currentStream.creator.name}
            onTipSuccess={handleTipSuccess}
          />
          
          {tipSuccess && (
            <div className={styles.tipSuccessMessage}>
              {tipSuccess}
            </div>
          )}
        </div>
        
        <div className={styles.commentsSection}>
          <h3 className={styles.sectionTitle}>Comments</h3>
          
          <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
            <input 
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={styles.commentInput}
            />
            <button 
              type="submit"
              className={styles.commentButton}
              disabled={!newComment.trim()}
            >
              Post
            </button>
          </form>
          
          <div className={styles.commentsList}>
            {comments.map(comment => (
              <div key={comment.id} className={styles.commentItem}>
                <img 
                  src={comment.avatarUrl}
                  alt={comment.user}
                  className={styles.commentAvatar}
                />
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentUser}>{comment.user}</span>
                    <span className={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.sidebar}>
        <h3 className={styles.sectionTitle}>Related Streams</h3>
        
        <div className={styles.relatedList}>
          {relatedStreams.map(stream => (
            <div key={stream.id} className={styles.relatedItem}>
              <div className={styles.relatedThumbnail}>
                <img src={stream.thumbnailUrl} alt={stream.title} />
              </div>
              <div className={styles.relatedInfo}>
                <h4 className={styles.relatedTitle}>{stream.title}</h4>
                <p className={styles.relatedCreator}>{stream.creator}</p>
                <p className={styles.relatedViews}>
                  {stream.views.toLocaleString()} views
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreamDemo;