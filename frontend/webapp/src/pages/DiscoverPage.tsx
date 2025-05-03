import { useState, useEffect } from 'react';
import styles from './DiscoverPage.module.css';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Stream {
  id: string;
  title: string;
  description: string;
  creator: string;
  thumbnailUrl: string;
  category: string;
  viewCount: number;
  tags: string[];
}

const DiscoverPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const categories: Category[] = [
    { id: 'all', name: 'All Categories', icon: '🌐' },
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'art', name: 'Digital Art', icon: '🎨' },
    { id: 'tech', name: 'Technology', icon: '💻' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'crypto', name: 'Crypto', icon: '🪙' },
    { id: 'social', name: 'Social', icon: '👥' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch streams from API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/streams`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch streams');
        }
        
        const data = await response.json();
        
        // Filter by category if not "all"
        const filteredStreams = selectedCategory === 'all' 
          ? data 
          : data.filter((stream: Stream) => stream.category === selectedCategory);
        
        setStreams(filteredStreams);
      } catch (err) {
        console.error('Error fetching discover data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  return (
    <div className={styles.discoverPage}>
      <div className={styles.pageHeader}>
        <h1>Discover Content</h1>
        <p>Explore streams across different categories</p>
      </div>
      
      <div className={styles.categoryFilter}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className={styles.categoryIcon}>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      <div className={styles.searchAndFilters}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search streams..."
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        <div className={styles.sortContainer}>
          <select className={styles.sortSelect}>
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Viewed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading streams...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryButton} onClick={() => setSelectedCategory(selectedCategory)}>
            Try Again
          </button>
        </div>
      ) : streams.length === 0 ? (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 15h8M9 9h.01M15 9h.01"></path>
          </svg>
          <h3>No streams found</h3>
          <p>There are no streams available in this category yet.</p>
        </div>
      ) : (
        <div className={styles.streamGrid}>
          {streams.map(stream => (
            <div key={stream.id} className={styles.streamCard}>
              <div className={styles.thumbnailContainer}>
                <img
                  src={stream.thumbnailUrl} 
                  alt={stream.title}
                  className={styles.thumbnail}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/placeholder-thumbnail.jpg';
                  }}
                />
                <div className={styles.streamStats}>
                  <span className={styles.viewCount}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    {stream.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className={styles.streamInfo}>
                <h3 className={styles.streamTitle}>{stream.title}</h3>
                <p className={styles.creatorName}>
                  {`${stream.creator.substring(0, 6)}...${stream.creator.substring(stream.creator.length - 4)}`}
                </p>
                <div className={styles.tags}>
                  {stream.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;