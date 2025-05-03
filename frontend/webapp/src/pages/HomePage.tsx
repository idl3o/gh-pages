import { useState, useEffect } from 'react';
import styles from './HomePage.module.css';

interface Stream {
  id: string;
  title: string;
  description: string;
  creator: string;
  thumbnailUrl: string;
  ipfsHash: string;
  viewCount: number;
  createdAt: string;
  tags: string[];
}

const HomePage = () => {
  const [trendingStreams, setTrendingStreams] = useState<Stream[]>([]);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch trending streams from our mock API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/streams`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch streams');
        }
        
        const data = await response.json();
        
        // Sort by view count for trending
        const sortedByViews = [...data].sort((a, b) => b.viewCount - a.viewCount);
        setTrendingStreams(sortedByViews.slice(0, 6));
        
        // In a real app, we would fetch live streams separately
        // For now, just use the same data
        setLiveStreams(data.slice(0, 3));
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load streams. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.homePage}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Decentralized Streaming</h1>
          <p className={styles.heroSubtitle}>
            Watch, create, and earn with blockchain-powered content
          </p>
          <div className={styles.heroCta}>
            <button className={styles.primaryButton}>Start Watching</button>
            <button className={styles.secondaryButton}>Create Content</button>
          </div>
        </div>
      </section>

      <section className={styles.trendingSection}>
        <h2 className={styles.sectionTitle}>Trending Now</h2>
        {isLoading ? (
          <div className={styles.loadingSpinner}>Loading...</div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          <div className={styles.streamGrid}>
            {trendingStreams.map((stream) => (
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
                  <div className={styles.viewCount}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>{stream.viewCount.toLocaleString()}</span>
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
      </section>

      <section className={styles.liveSection}>
        <h2 className={styles.sectionTitle}>Live Now</h2>
        {isLoading ? (
          <div className={styles.loadingSpinner}>Loading...</div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          <div className={styles.liveStreamList}>
            {liveStreams.map((stream) => (
              <div key={stream.id} className={styles.liveStreamCard}>
                <div className={styles.liveBadge}>LIVE</div>
                <div className={styles.liveThumbnailContainer}>
                  <img
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    className={styles.liveThumbnail}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/placeholder-thumbnail.jpg';
                    }}
                  />
                </div>
                <div className={styles.liveStreamInfo}>
                  <h3 className={styles.liveStreamTitle}>{stream.title}</h3>
                  <p className={styles.liveStreamDescription}>
                    {stream.description.length > 100 
                      ? `${stream.description.substring(0, 100)}...` 
                      : stream.description}
                  </p>
                  <div className={styles.streamCreator}>
                    <span className={styles.creatorAddress}>
                      {`${stream.creator.substring(0, 6)}...${stream.creator.substring(stream.creator.length - 4)}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.featureSection}>
        <h2 className={styles.sectionTitle}>Why Web3 Streaming?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 2l-4 5-4-5"></path>
              </svg>
            </div>
            <h3>Decentralized Storage</h3>
            <p>Content is stored on IPFS, making it censorship resistant and always available.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <h3>Fair Revenue</h3>
            <p>Creators earn directly from viewers without intermediaries taking large cuts.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3>True Ownership</h3>
            <p>Take control of your content with blockchain-verified ownership.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;