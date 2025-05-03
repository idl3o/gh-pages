import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/video/VideoPlayer';
import styles from './ProfilePage.module.css';

interface Creator {
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  joinedDate: string;
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
    github?: string;
  };
}

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
  videoUrl: string;
}

const ProfilePage = () => {
  const { address } = useParams<{ address: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [featuredStream, setFeaturedStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'streams' | 'about'>('streams');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!address) return;
      
      try {
        setIsLoading(true);
        
        // In a real app, we would fetch from our API
        // For now, mock data
        const response = await fetch(`${import.meta.env.VITE_API_URL}/creators/${address}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch creator data');
        }
        
        const creatorData = await response.json();
        setCreator(creatorData);
        
        // Fetch creator's streams
        const streamsResponse = await fetch(`${import.meta.env.VITE_API_URL}/streams?creator=${address}`);
        
        if (!streamsResponse.ok) {
          throw new Error('Failed to fetch creator streams');
        }
        
        const streamsData = await streamsResponse.json();
        setStreams(streamsData);
        
        // Set the most viewed stream as featured
        if (streamsData.length > 0) {
          const sorted = [...streamsData].sort((a, b) => b.viewCount - a.viewCount);
          setFeaturedStream(sorted[0]);
        }
        
      } catch (err) {
        console.error('Error fetching creator data:', err);
        setError('Failed to load creator data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorData();
  }, [address]);

  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading creator profile...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className={styles.errorContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2>Creator Not Found</h2>
        <p>{error || `We couldn't find a creator with the address ${address}.`}</p>
        <button onClick={() => window.history.back()} className={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      {/* Banner */}
      <div 
        className={styles.banner}
        style={{ backgroundImage: `url(${creator.bannerUrl || '/assets/default-banner.jpg'})` }}
      />
      
      {/* Profile Info */}
      <div className={styles.profileInfo}>
        <div className={styles.avatarContainer}>
          <img 
            src={creator.avatarUrl || '/assets/default-avatar.jpg'} 
            alt={creator.displayName} 
            className={styles.avatar}
          />
          {creator.isVerified && (
            <span className={styles.verifiedBadge} title="Verified Creator">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </span>
          )}
        </div>
        
        <div className={styles.creatorDetails}>
          <h1 className={styles.displayName}>{creator.displayName}</h1>
          <div className={styles.usernameContainer}>
            <span className={styles.username}>@{creator.username}</span>
            <button 
              className={styles.copyAddress} 
              onClick={copyAddressToClipboard}
              title="Copy wallet address"
            >
              {copied ? (
                <span className={styles.copied}>Copied!</span>
              ) : (
                <>
                  <span className={styles.addressText}>{`${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </>
              )}
            </button>
          </div>
          
          <div className={styles.statsContainer}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{creator.followerCount.toLocaleString()}</span>
              <span className={styles.statLabel}>Followers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{creator.followingCount.toLocaleString()}</span>
              <span className={styles.statLabel}>Following</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{streams.length}</span>
              <span className={styles.statLabel}>Streams</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatDate(creator.joinedDate)}</span>
              <span className={styles.statLabel}>Joined</span>
            </div>
          </div>
          
          <div className={styles.socialLinks}>
            {creator.socialLinks.twitter && (
              <a href={creator.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
            )}
            {creator.socialLinks.discord && (
              <a href={creator.socialLinks.discord} target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Discord">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 9a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V9Z"></path>
                  <circle cx="9" cy="12" r="1"></circle>
                  <circle cx="15" cy="12" r="1"></circle>
                </svg>
              </a>
            )}
            {creator.socialLinks.website && (
              <a href={creator.socialLinks.website} target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Website">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </a>
            )}
            {creator.socialLinks.github && (
              <a href={creator.socialLinks.github} target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
            )}
          </div>
          
          <div className={styles.actionButtons}>
            <button className={styles.followButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Follow
            </button>
            <button className={styles.tipButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Tip Creator
            </button>
          </div>
        </div>
      </div>
      
      {/* Featured Stream */}
      {featuredStream && (
        <div className={styles.featuredStreamContainer}>
          <h2 className={styles.sectionTitle}>Featured Stream</h2>
          <div className={styles.videoPlayerWrapper}>
            <VideoPlayer 
              videoUrl={featuredStream.videoUrl}
              ipfsHash={featuredStream.ipfsHash}
              title={featuredStream.title}
              creator={featuredStream.creator}
              thumbnailUrl={featuredStream.thumbnailUrl}
            />
          </div>
          <div className={styles.featuredStreamInfo}>
            <h3 className={styles.featuredStreamTitle}>{featuredStream.title}</h3>
            <p className={styles.featuredStreamDescription}>{featuredStream.description}</p>
            <div className={styles.viewCount}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>{featuredStream.viewCount.toLocaleString()} views</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'streams' ? styles.active : ''}`}
          onClick={() => setActiveTab('streams')}
        >
          Streams
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'about' ? styles.active : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>
      
      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'streams' && (
          <div className={styles.streamsGrid}>
            {streams.length > 0 ? (
              streams.map(stream => (
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
                      <span className={styles.createdAt}>{new Date(stream.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={styles.streamInfo}>
                    <h3 className={styles.streamTitle}>{stream.title}</h3>
                    <div className={styles.tags}>
                      {stream.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <line x1="2" y1="7" x2="7" y2="7"></line>
                  <line x1="2" y1="17" x2="7" y2="17"></line>
                  <line x1="17" y1="17" x2="22" y2="17"></line>
                  <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
                <h3>No streams yet</h3>
                <p>This creator hasn't uploaded any content yet.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'about' && (
          <div className={styles.aboutSection}>
            <div className={styles.bioContainer}>
              <h3 className={styles.aboutSectionTitle}>Bio</h3>
              <p className={styles.bio}>{creator.bio || "This creator hasn't added a bio yet."}</p>
            </div>
            
            <div className={styles.joinedContainer}>
              <h3 className={styles.aboutSectionTitle}>Joined</h3>
              <p className={styles.joinedDate}>{formatDate(creator.joinedDate)}</p>
            </div>
            
            {Object.keys(creator.socialLinks).length > 0 && (
              <div className={styles.linksContainer}>
                <h3 className={styles.aboutSectionTitle}>Links</h3>
                <ul className={styles.linksList}>
                  {creator.socialLinks.twitter && (
                    <li>
                      <a href={creator.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                        </svg>
                        Twitter
                      </a>
                    </li>
                  )}
                  {creator.socialLinks.discord && (
                    <li>
                      <a href={creator.socialLinks.discord} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 9a5 5 0 0 0-5-5H7a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V9Z"></path>
                          <circle cx="9" cy="12" r="1"></circle>
                          <circle cx="15" cy="12" r="1"></circle>
                        </svg>
                        Discord
                      </a>
                    </li>
                  )}
                  {creator.socialLinks.website && (
                    <li>
                      <a href={creator.socialLinks.website} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        Website
                      </a>
                    </li>
                  )}
                  {creator.socialLinks.github && (
                    <li>
                      <a href={creator.socialLinks.github} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                        GitHub
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;