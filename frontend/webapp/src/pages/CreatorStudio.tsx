import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import styles from './CreatorStudio.module.css';

interface Stream {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  status: 'live' | 'recorded' | 'processing' | 'scheduled';
  category: string;
  tags: string[];
  visibility: 'public' | 'unlisted' | 'private';
}

const CreatorStudio = () => {
  const { account, connect } = useWallet();
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'monetization'>('content');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!account) return;
    
    const fetchCreatorContent = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, we would fetch from API with actual user address
        // For now, use mock data
        const response = await fetch(`${import.meta.env.VITE_API_URL}/creator-content`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch creator content');
        }
        
        const data = await response.json();
        setStreams(data);
      } catch (err) {
        console.error('Error fetching creator content:', err);
        setError('Failed to load your content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorContent();
  }, [account]);

  const filteredStreams = streams.filter(stream => {
    if (filterStatus === 'all') return true;
    return stream.status === filterStatus;
  });

  const handleStreamSelect = (streamId: string) => {
    setSelectedStreamId(streamId === selectedStreamId ? null : streamId);
  };

  const handleDeleteStream = async (streamId: string) => {
    if (!confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
      return;
    }
    
    try {
      // In a real app, send delete request to API
      // For now, update local state
      setStreams(prevStreams => prevStreams.filter(stream => stream.id !== streamId));
      
      // If the deleted stream was selected, clear selection
      if (selectedStreamId === streamId) {
        setSelectedStreamId(null);
      }
    } catch (err) {
      console.error('Error deleting stream:', err);
      alert('Failed to delete stream. Please try again later.');
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          
          // In a real app, we would add the new stream from API response
          const newStream: Stream = {
            id: `new-${Date.now()}`,
            title: 'Untitled Stream',
            description: '',
            thumbnailUrl: '/assets/thumbnails/default.jpg',
            createdAt: new Date().toISOString(),
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            status: 'processing',
            category: 'Other',
            tags: [],
            visibility: 'private'
          };
          
          setStreams(prevStreams => [newStream, ...prevStreams]);
        }, 1000);
      }
    }, 200);
  };

  if (!account) {
    return (
      <div className={styles.connectWalletContainer}>
        <h1>Creator Studio</h1>
        <p>Connect your wallet to access the creator studio and manage your content.</p>
        <button className={styles.connectWalletButton} onClick={connect}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className={styles.creatorStudio}>
      <div className={styles.header}>
        <h1 className={styles.title}>Creator Studio</h1>
        <button 
          className={styles.uploadButton} 
          onClick={handleUpload}
          disabled={isUploading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          {isUploading ? 'Uploading...' : 'Upload Content'}
        </button>
      </div>

      {isUploading && (
        <div className={styles.uploadProgressContainer}>
          <div className={styles.uploadProgressBar}>
            <div 
              className={styles.uploadProgressFill} 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className={styles.uploadProgressText}>
            {uploadProgress}% Uploaded
          </div>
        </div>
      )}

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'content' ? styles.active : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'monetization' ? styles.active : ''}`}
            onClick={() => setActiveTab('monetization')}
          >
            Monetization
          </button>
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'content' && (
          <div className={styles.contentTab}>
            <div className={styles.filterBar}>
              <div className={styles.filters}>
                <button 
                  className={`${styles.filterButton} ${filterStatus === 'all' ? styles.active : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </button>
                <button 
                  className={`${styles.filterButton} ${filterStatus === 'live' ? styles.active : ''}`}
                  onClick={() => setFilterStatus('live')}
                >
                  Live
                </button>
                <button 
                  className={`${styles.filterButton} ${filterStatus === 'recorded' ? styles.active : ''}`}
                  onClick={() => setFilterStatus('recorded')}
                >
                  Videos
                </button>
                <button 
                  className={`${styles.filterButton} ${filterStatus === 'scheduled' ? styles.active : ''}`}
                  onClick={() => setFilterStatus('scheduled')}
                >
                  Scheduled
                </button>
              </div>
              
              <div className={styles.search}>
                <input 
                  type="text" 
                  placeholder="Search your content..." 
                  className={styles.searchInput}
                />
              </div>
            </div>

            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading your content...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{error}</p>
                <button className={styles.retryButton} onClick={() => setActiveTab('content')}>
                  Try Again
                </button>
              </div>
            ) : filteredStreams.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <polyline points="10 2 14 6 18 2"></polyline>
                  </svg>
                </div>
                <h3>No content found</h3>
                <p>Upload your first stream to get started.</p>
                <button className={styles.emptyStateButton} onClick={handleUpload}>
                  Upload Content
                </button>
              </div>
            ) : (
              <div className={styles.contentList}>
                <div className={styles.contentListHeader}>
                  <div className={styles.contentThumbnailHeader}>Video</div>
                  <div className={styles.contentMetrics}>
                    <div className={styles.metricHeader}>Visibility</div>
                    <div className={styles.metricHeader}>Views</div>
                    <div className={styles.metricHeader}>Likes</div>
                    <div className={styles.metricHeader}>Status</div>
                  </div>
                  <div className={styles.contentActionsHeader}>Actions</div>
                </div>
                
                {filteredStreams.map((stream) => (
                  <div 
                    key={stream.id} 
                    className={`${styles.contentItem} ${selectedStreamId === stream.id ? styles.selected : ''}`}
                    onClick={() => handleStreamSelect(stream.id)}
                  >
                    <div className={styles.contentThumbnail}>
                      <img 
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/thumbnails/default.jpg';
                        }}
                      />
                      {stream.status === 'live' && (
                        <div className={styles.liveTag}>LIVE</div>
                      )}
                    </div>
                    
                    <div className={styles.contentDetails}>
                      <h3 className={styles.contentTitle}>{stream.title}</h3>
                      <p className={styles.contentDescription}>
                        {stream.description.length > 80
                          ? `${stream.description.substring(0, 80)}...`
                          : stream.description || 'No description'}
                      </p>
                      <div className={styles.contentDate}>
                        {new Date(stream.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className={styles.contentMetrics}>
                      <div className={styles.metric}>
                        <span className={`${styles.visibilityDot} ${styles[stream.visibility]}`}></span>
                        {stream.visibility}
                      </div>
                      <div className={styles.metric}>{stream.viewCount.toLocaleString()}</div>
                      <div className={styles.metric}>{stream.likeCount.toLocaleString()}</div>
                      <div className={`${styles.metric} ${styles.status} ${styles[stream.status]}`}>
                        {stream.status}
                      </div>
                    </div>
                    
                    <div className={styles.contentActions}>
                      <Link 
                        to={`/edit/${stream.id}`} 
                        className={styles.actionButton}
                        title="Edit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </Link>
                      <button 
                        className={styles.actionButton}
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStream(stream.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analyticsTab}>
            <div className={styles.analyticsHeader}>
              <h2>Performance Analytics</h2>
              <div className={styles.analyticsPeriodSelector}>
                <select className={styles.periodSelect} defaultValue="7days">
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="12months">Last 12 months</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>
            </div>

            <div className={styles.analyticsSummary}>
              <div className={styles.analyticCard}>
                <div className={styles.analyticValue}>12.4K</div>
                <div className={styles.analyticTitle}>Views</div>
                <div className={styles.analyticTrend positive}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  8.2%
                </div>
              </div>
              <div className={styles.analyticCard}>
                <div className={styles.analyticValue}>823</div>
                <div className={styles.analyticTitle}>Watch Time (hrs)</div>
                <div className={styles.analyticTrend positive}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  12.5%
                </div>
              </div>
              <div className={styles.analyticCard}>
                <div className={styles.analyticValue}>2.4K</div>
                <div className={styles.analyticTitle}>Likes</div>
                <div className={styles.analyticTrend positive}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  5.7%
                </div>
              </div>
              <div className={styles.analyticCard}>
                <div className={styles.analyticValue}>348</div>
                <div className={styles.analyticTitle}>Followers</div>
                <div className={styles.analyticTrend negative}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  2.1%
                </div>
              </div>
            </div>

            <div className={styles.analyticsCharts}>
              <div className={styles.analyticsChartContainer}>
                <h3>Views Over Time</h3>
                <div className={styles.chartPlaceholder}>
                  <div className={styles.chartBarContainer}>
                    {[40, 65, 75, 55, 80, 90, 100, 85, 70, 60, 75, 95].map((height, i) => (
                      <div key={i} className={styles.chartBar} style={{ height: `${height}%` }}></div>
                    ))}
                  </div>
                  <div className={styles.chartLabels}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                      <div key={i} className={styles.chartLabel}>{month}</div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className={styles.analyticsChartContainer}>
                <h3>Top Performing Content</h3>
                <div className={styles.topContentList}>
                  {streams.sort((a, b) => b.viewCount - a.viewCount).slice(0, 5).map((stream, index) => (
                    <div key={stream.id} className={styles.topContentItem}>
                      <div className={styles.topContentRank}>{index + 1}</div>
                      <div className={styles.topContentThumbnail}>
                        <img 
                          src={stream.thumbnailUrl}
                          alt={stream.title}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/assets/thumbnails/default.jpg';
                          }}
                        />
                      </div>
                      <div className={styles.topContentInfo}>
                        <div className={styles.topContentTitle}>{stream.title}</div>
                        <div className={styles.topContentMetrics}>
                          <span>{stream.viewCount.toLocaleString()} views</span>
                          <span>•</span>
                          <span>{stream.likeCount.toLocaleString()} likes</span>
                        </div>
                      </div>
                      <div className={styles.topContentPerformance}>
                        <div className={styles.performanceBar}>
                          <div className={styles.performanceFill} style={{ 
                            width: `${Math.min(100, (stream.viewCount / 1000) * 100)}%` 
                          }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.analyticsAudience}>
              <h3>Audience Demographics</h3>
              
              <div className={styles.demographicsContainer}>
                <div className={styles.demographicCard}>
                  <h4>Age Distribution</h4>
                  <div className={styles.demographicChart}>
                    <div className={styles.pieChartPlaceholder}></div>
                    <div className={styles.demographicLegend}>
                      <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.color1}`}></div>
                        <div className={styles.legendLabel}>18-24</div>
                        <div className={styles.legendValue}>32%</div>
                      </div>
                      <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.color2}`}></div>
                        <div className={styles.legendLabel}>25-34</div>
                        <div className={styles.legendValue}>45%</div>
                      </div>
                      <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.color3}`}></div>
                        <div className={styles.legendLabel}>35-44</div>
                        <div className={styles.legendValue}>18%</div>
                      </div>
                      <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.color4}`}></div>
                        <div className={styles.legendLabel}>45+</div>
                        <div className={styles.legendValue}>5%</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.demographicCard}>
                  <h4>Top Regions</h4>
                  <div className={styles.regionsList}>
                    <div className={styles.regionItem}>
                      <div className={styles.regionName}>United States</div>
                      <div className={styles.regionBar}>
                        <div className={styles.regionFill} style={{ width: '65%' }}></div>
                      </div>
                      <div className={styles.regionValue}>65%</div>
                    </div>
                    <div className={styles.regionItem}>
                      <div className={styles.regionName}>United Kingdom</div>
                      <div className={styles.regionBar}>
                        <div className={styles.regionFill} style={{ width: '12%' }}></div>
                      </div>
                      <div className={styles.regionValue}>12%</div>
                    </div>
                    <div className={styles.regionItem}>
                      <div className={styles.regionName}>Canada</div>
                      <div className={styles.regionBar}>
                        <div className={styles.regionFill} style={{ width: '8%' }}></div>
                      </div>
                      <div className={styles.regionValue}>8%</div>
                    </div>
                    <div className={styles.regionItem}>
                      <div className={styles.regionName}>Australia</div>
                      <div className={styles.regionBar}>
                        <div className={styles.regionFill} style={{ width: '6%' }}></div>
                      </div>
                      <div className={styles.regionValue}>6%</div>
                    </div>
                    <div className={styles.regionItem}>
                      <div className={styles.regionName}>Germany</div>
                      <div className={styles.regionBar}>
                        <div className={styles.regionFill} style={{ width: '4%' }}></div>
                      </div>
                      <div className={styles.regionValue}>4%</div>
                    </div>
                    <div className={styles.regionItem}>
                      <div className={styles.regionName}>Other</div>
                      <div className={styles.regionBar}>
                        <div className={styles.regionFill} style={{ width: '5%' }}></div>
                      </div>
                      <div className={styles.regionValue}>5%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monetization' && (
          <div className={styles.monetizationTab}>
            <div className={styles.monetizationHeader}>
              <h2>Earnings & Monetization</h2>
            </div>

            <div className={styles.earningsSummary}>
              <div className={`${styles.earningsCard} ${styles.totalEarnings}`}>
                <div className={styles.earningsIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </div>
                <div>
                  <div className={styles.earningsLabel}>Total Earnings</div>
                  <div className={styles.earningsAmount}>3.25 ETH</div>
                  <div className={styles.earningsFiat}>≈ $9,750</div>
                </div>
              </div>
              
              <div className={styles.earningsCard}>
                <div className={styles.earningsIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div className={styles.earningsLabel}>This Month</div>
                  <div className={styles.earningsAmount}>0.87 ETH</div>
                  <div className={styles.earningsFiat}>≈ $2,610</div>
                </div>
              </div>
              
              <div className={styles.earningsCard}>
                <div className={styles.earningsIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div>
                  <div className={styles.earningsLabel}>Last 24h</div>
                  <div className={styles.earningsAmount}>0.06 ETH</div>
                  <div className={styles.earningsFiat}>≈ $180</div>
                </div>
              </div>
            </div>

            <div className={styles.monetizationCharts}>
              <div className={styles.analyticsChartContainer}>
                <h3>Earnings Over Time</h3>
                <div className={styles.chartPlaceholder}>
                  <div className={styles.lineChartPlaceholder}></div>
                </div>
              </div>
            </div>

            <div className={styles.earningsBreakdown}>
              <h3>Revenue Sources</h3>
              
              <div className={styles.revenueSourcesList}>
                <div className={styles.revenueSourceCard}>
                  <div className={styles.revenueSourceIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 12 20 22 4 22 4 12"></polyline>
                      <rect x="2" y="7" width="20" height="5"></rect>
                      <line x1="12" y1="22" x2="12" y2="7"></line>
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                    </svg>
                  </div>
                  <div className={styles.revenueSourceName}>Creator Tips</div>
                  <div className={styles.revenueSourceValue}>1.62 ETH</div>
                  <div className={styles.revenueSourcePercentage}>50%</div>
                  <div className={styles.revenueSourceBar}>
                    <div className={styles.revenueSourceFill} style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <div className={styles.revenueSourceCard}>
                  <div className={styles.revenueSourceIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  </div>
                  <div className={styles.revenueSourceName}>Stream Subscriptions</div>
                  <div className={styles.revenueSourceValue}>0.98 ETH</div>
                  <div className={styles.revenueSourcePercentage}>30%</div>
                  <div className={styles.revenueSourceBar}>
                    <div className={styles.revenueSourceFill} style={{ width: '30%' }}></div>
                  </div>
                </div>
                
                <div className={styles.revenueSourceCard}>
                  <div className={styles.revenueSourceIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                  </div>
                  <div className={styles.revenueSourceName}>NFT Sales</div>
                  <div className={styles.revenueSourceValue}>0.65 ETH</div>
                  <div className={styles.revenueSourcePercentage}>20%</div>
                  <div className={styles.revenueSourceBar}>
                    <div className={styles.revenueSourceFill} style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.setupMonetization}>
              <h3>Monetization Settings</h3>
              
              <div className={styles.monetizationOptions}>
                <div className={styles.monetizationOption}>
                  <div className={styles.monetizationOptionHeader}>
                    <div className={styles.monetizationOptionTitle}>
                      <h4>Creator Subscription</h4>
                      <div className={styles.enabledBadge}>Enabled</div>
                    </div>
                    <button className={styles.editButton}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                  </div>
                  <p className={styles.monetizationOptionDescription}>
                    Viewers can subscribe to your channel for 0.05 ETH/month.
                  </p>
                  <div className={styles.monetizationStats}>
                    <div className={styles.monetizationStat}>
                      <div className={styles.monetizationStatLabel}>Current Subscribers</div>
                      <div className={styles.monetizationStatValue}>42</div>
                    </div>
                    <div className={styles.monetizationStat}>
                      <div className={styles.monetizationStatLabel}>Monthly Revenue</div>
                      <div className={styles.monetizationStatValue}>2.1 ETH</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.monetizationOption}>
                  <div className={styles.monetizationOptionHeader}>
                    <div className={styles.monetizationOptionTitle}>
                      <h4>NFT Content Exclusives</h4>
                      <div className={styles.enabledBadge}>Enabled</div>
                    </div>
                    <button className={styles.editButton}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                  </div>
                  <p className={styles.monetizationOptionDescription}>
                    Mint exclusive content as NFTs for your most dedicated fans.
                  </p>
                  <div className={styles.monetizationStats}>
                    <div className={styles.monetizationStat}>
                      <div className={styles.monetizationStatLabel}>Active NFT Collections</div>
                      <div className={styles.monetizationStatValue}>3</div>
                    </div>
                    <div className={styles.monetizationStat}>
                      <div className={styles.monetizationStatLabel}>Total Sales</div>
                      <div className={styles.monetizationStatValue}>12.4 ETH</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.monetizationOption}>
                  <div className={styles.monetizationOptionHeader}>
                    <div className={styles.monetizationOptionTitle}>
                      <h4>Viewer Tipping</h4>
                      <div className={styles.enabledBadge}>Enabled</div>
                    </div>
                    <button className={styles.editButton}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                  </div>
                  <p className={styles.monetizationOptionDescription}>
                    Allow viewers to send tips and donations during your streams.
                  </p>
                  <div className={styles.monetizationStats}>
                    <div className={styles.monetizationStat}>
                      <div className={styles.monetizationStatLabel}>Total Tips Received</div>
                      <div className={styles.monetizationStatValue}>528</div>
                    </div>
                    <div className={styles.monetizationStat}>
                      <div className={styles.monetizationStatLabel}>Average Tip</div>
                      <div className={styles.monetizationStatValue}>0.012 ETH</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.walletWithdraw}>
                <div className={styles.walletHeader}>
                  <h4>Your Balance</h4>
                  <div className={styles.walletBalance}>
                    <div className={styles.walletBalanceAmount}>1.24 ETH</div>
                    <div className={styles.walletBalanceFiat}>≈ $3,720</div>
                  </div>
                </div>
                <button className={styles.withdrawButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    <polyline points="16 5 21 5 21 10"></polyline>
                    <line x1="14" y1="12" x2="21" y2="5"></line>
                  </svg>
                  Withdraw to Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorStudio;