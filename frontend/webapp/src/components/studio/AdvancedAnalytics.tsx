import { useState, useEffect } from 'react';
import styles from './AdvancedAnalytics.module.css';

interface AnalyticsData {
  totalViews: number;
  totalWatchTime: number;
  totalRevenue: number;
  totalSubscribers: number;
  viewsChange: number;
  watchTimeChange: number;
  revenueChange: number;
  subscribersChange: number;
  dailyViewsData: {
    date: string;
    views: number;
  }[];
  viewsBreakdown: {
    live: number;
    vod: number;
    clips: number;
  };
  audienceRetention: {
    label: string;
    value: number;
  }[];
  deviceBreakdown: {
    label: string;
    value: number;
  }[];
  geographicData: {
    country: string;
    percentage: number;
  }[];
  referralSources: {
    source: string;
    percentage: number;
  }[];
  topContent: {
    id: string;
    title: string;
    thumbnailUrl: string;
    views: number;
    watchTime: number;
    engagement: number; // percentage of people who liked, commented, or shared
    completionRate: number; // percentage of viewers who watched most of the content
  }[];
  subscriberGrowth: {
    date: string;
    subscribers: number;
    unsubscribers: number;
  }[];
  watchTimeByHour: {
    hour: number;
    watchTime: number;
  }[];
}

interface AdvancedAnalyticsProps {
  creatorId: string;
}

const AdvancedAnalytics = ({ creatorId }: AdvancedAnalyticsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedChart, setSelectedChart] = useState<'views' | 'engagement' | 'revenue'>('views');
  const [comparisonMode, setComparisonMode] = useState(false);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would be an API call
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Mock data - in production this would come from your API
        const mockData: AnalyticsData = {
          totalViews: 187543,
          totalWatchTime: 493260, // in minutes
          totalRevenue: 3458.72,
          totalSubscribers: 12485,
          viewsChange: 12.4,
          watchTimeChange: 8.7,
          revenueChange: 15.2,
          subscribersChange: 5.8,
          dailyViewsData: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            views: Math.floor(3000 + Math.random() * 4000),
          })),
          viewsBreakdown: {
            live: 43,
            vod: 52,
            clips: 5,
          },
          audienceRetention: [
            { label: '100%', value: 100 },
            { label: '75%', value: 68 },
            { label: '50%', value: 42 },
            { label: '25%', value: 31 },
            { label: '0%', value: 22 },
          ],
          deviceBreakdown: [
            { label: 'Desktop', value: 42 },
            { label: 'Mobile', value: 38 },
            { label: 'Tablet', value: 12 },
            { label: 'TV', value: 8 },
          ],
          geographicData: [
            { country: 'United States', percentage: 34 },
            { country: 'United Kingdom', percentage: 18 },
            { country: 'Canada', percentage: 12 },
            { country: 'Germany', percentage: 8 },
            { country: 'Australia', percentage: 7 },
            { country: 'Others', percentage: 21 },
          ],
          referralSources: [
            { source: 'Direct', percentage: 45 },
            { source: 'Search', percentage: 22 },
            { source: 'Social Media', percentage: 18 },
            { source: 'External Sites', percentage: 15 },
          ],
          topContent: [
            {
              id: '1',
              title: 'NFT Market Analysis - May 2025',
              thumbnailUrl: '/assets/thumbnails/nft-analysis.jpg',
              views: 38450,
              watchTime: 78930,
              engagement: 0.23,
              completionRate: 0.67,
            },
            {
              id: '2',
              title: 'Web3 Gaming Revolution',
              thumbnailUrl: '/assets/thumbnails/web3-gaming.jpg',
              views: 27834,
              watchTime: 62849,
              engagement: 0.18,
              completionRate: 0.72,
            },
            {
              id: '3',
              title: 'Crypto Market Update - Live Discussion',
              thumbnailUrl: '/assets/thumbnails/crypto-update.jpg',
              views: 24567,
              watchTime: 81234,
              engagement: 0.31,
              completionRate: 0.58,
            },
            {
              id: '4',
              title: 'How to Setup Your Crypto Wallet',
              thumbnailUrl: '/assets/thumbnails/wallet-setup.jpg',
              views: 18293,
              watchTime: 54098,
              engagement: 0.22,
              completionRate: 0.81,
            },
            {
              id: '5',
              title: 'Blockchain Gaming Tournament Finals',
              thumbnailUrl: '/assets/thumbnails/gaming-tournament.jpg',
              views: 15782,
              watchTime: 67234,
              engagement: 0.27,
              completionRate: 0.65,
            },
          ],
          subscriberGrowth: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subscribers: Math.floor(Math.random() * 100 + 50),
            unsubscribers: Math.floor(Math.random() * 20),
          })),
          watchTimeByHour: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            watchTime: Math.floor(Math.random() * 20000 + 5000),
          })),
        };
        
        setAnalyticsData(mockData);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [creatorId, timeRange]);
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };
  
  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    if (hours >= 1000) {
      return (hours / 1000).toFixed(1) + 'K hrs';
    } else {
      return hours + ' hrs';
    }
  };
  
  const formatCurrency = (num: number): string => {
    return '$' + num.toFixed(2);
  };
  
  const calculatePercentageOfMax = (value: number, max: number): number => {
    return (value / max) * 100;
  };
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => setTimeRange(timeRange)} // This will re-trigger the effect
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!analyticsData) {
    return (
      <div className={styles.emptyContainer}>
        <p>No analytics data available.</p>
      </div>
    );
  }
  
  // Find the maximum value for calculations
  const maxWatchTimeByHour = Math.max(...analyticsData.watchTimeByHour.map(item => item.watchTime));
  const maxViews = Math.max(...analyticsData.dailyViewsData.map(item => item.views));
  const maxSubscribers = Math.max(...analyticsData.subscriberGrowth.map(item => item.subscribers));
  
  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsHeader}>
        <h2>Advanced Analytics</h2>
        <div className={styles.timeRangeSelector}>
          <button 
            className={`${styles.timeRangeButton} ${timeRange === '7d' ? styles.active : ''}`} 
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={`${styles.timeRangeButton} ${timeRange === '30d' ? styles.active : ''}`} 
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={`${styles.timeRangeButton} ${timeRange === '90d' ? styles.active : ''}`} 
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
          <button 
            className={`${styles.timeRangeButton} ${timeRange === '1y' ? styles.active : ''}`} 
            onClick={() => setTimeRange('1y')}
          >
            1 Year
          </button>
        </div>
      </div>
      
      <div className={styles.overviewCards}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <div className={styles.overviewDetails}>
            <h3 className={styles.overviewValue}>{formatNumber(analyticsData.totalViews)}</h3>
            <p className={styles.overviewLabel}>Total Views</p>
            <div className={`${styles.overviewChange} ${analyticsData.viewsChange >= 0 ? styles.positive : styles.negative}`}>
              {analyticsData.viewsChange >= 0 ? '+' : ''}{analyticsData.viewsChange}%
            </div>
          </div>
        </div>
        
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className={styles.overviewDetails}>
            <h3 className={styles.overviewValue}>{formatWatchTime(analyticsData.totalWatchTime)}</h3>
            <p className={styles.overviewLabel}>Watch Time</p>
            <div className={`${styles.overviewChange} ${analyticsData.watchTimeChange >= 0 ? styles.positive : styles.negative}`}>
              {analyticsData.watchTimeChange >= 0 ? '+' : ''}{analyticsData.watchTimeChange}%
            </div>
          </div>
        </div>
        
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className={styles.overviewDetails}>
            <h3 className={styles.overviewValue}>{formatCurrency(analyticsData.totalRevenue)}</h3>
            <p className={styles.overviewLabel}>Revenue</p>
            <div className={`${styles.overviewChange} ${analyticsData.revenueChange >= 0 ? styles.positive : styles.negative}`}>
              {analyticsData.revenueChange >= 0 ? '+' : ''}{analyticsData.revenueChange}%
            </div>
          </div>
        </div>
        
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className={styles.overviewDetails}>
            <h3 className={styles.overviewValue}>{formatNumber(analyticsData.totalSubscribers)}</h3>
            <p className={styles.overviewLabel}>Subscribers</p>
            <div className={`${styles.overviewChange} ${analyticsData.subscribersChange >= 0 ? styles.positive : styles.negative}`}>
              {analyticsData.subscribersChange >= 0 ? '+' : ''}{analyticsData.subscribersChange}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <h3>Performance Over Time</h3>
          <div className={styles.chartControls}>
            <div className={styles.chartTypeSelector}>
              <button 
                className={`${styles.chartTypeButton} ${selectedChart === 'views' ? styles.active : ''}`} 
                onClick={() => setSelectedChart('views')}
              >
                Views
              </button>
              <button 
                className={`${styles.chartTypeButton} ${selectedChart === 'engagement' ? styles.active : ''}`} 
                onClick={() => setSelectedChart('engagement')}
              >
                Engagement
              </button>
              <button 
                className={`${styles.chartTypeButton} ${selectedChart === 'revenue' ? styles.active : ''}`} 
                onClick={() => setSelectedChart('revenue')}
              >
                Revenue
              </button>
            </div>
            <div className={styles.comparisonToggle}>
              <label className={styles.toggleLabel}>
                <input 
                  type="checkbox" 
                  checked={comparisonMode} 
                  onChange={() => setComparisonMode(!comparisonMode)} 
                  className={styles.toggleCheckbox}
                />
                <span className={styles.toggleSwitch}></span>
                Compare with previous period
              </label>
            </div>
          </div>
        </div>
        
        <div className={styles.mainChart}>
          {selectedChart === 'views' && (
            <div className={styles.viewsChart}>
              <div className={styles.chartContainer}>
                <div className={styles.chartBars}>
                  {analyticsData.dailyViewsData.slice(-14).map((day, index) => (
                    <div key={index} className={styles.barContainer}>
                      <div 
                        className={styles.bar} 
                        style={{ height: `${calculatePercentageOfMax(day.views, maxViews)}%` }}
                        title={`${day.date}: ${day.views} views`}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className={styles.chartLabels}>
                  {analyticsData.dailyViewsData.slice(-14).map((day, index) => (
                    <div key={index} className={styles.chartLabel}>
                      {new Date(day.date).getDate()}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.chartStats}>
                <div className={styles.chartStat}>
                  <div className={styles.chartStatValue}>
                    {formatNumber(analyticsData.dailyViewsData.reduce((sum, day) => sum + day.views, 0) / analyticsData.dailyViewsData.length)}
                  </div>
                  <div className={styles.chartStatLabel}>Avg. Daily Views</div>
                </div>
                <div className={styles.chartStat}>
                  <div className={styles.chartStatValue}>
                    {formatNumber(Math.max(...analyticsData.dailyViewsData.map(day => day.views)))}
                  </div>
                  <div className={styles.chartStatLabel}>Peak Views</div>
                </div>
              </div>
            </div>
          )}
          
          {selectedChart === 'engagement' && (
            <div className={styles.engagementChart}>
              <div className={styles.chartContainer}>
                <div className={styles.engagementMetrics}>
                  <div className={styles.retentionChart}>
                    <h4>Audience Retention</h4>
                    <div className={styles.retentionBars}>
                      {analyticsData.audienceRetention.map((segment, index) => (
                        <div key={index} className={styles.retentionBarContainer}>
                          <div 
                            className={styles.retentionBar} 
                            style={{ height: `${segment.value}%` }}
                            title={`${segment.label} watched: ${segment.value}%`}
                          ></div>
                          <div className={styles.retentionLabel}>{segment.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.deviceChart}>
                    <h4>Device Breakdown</h4>
                    <div className={styles.pieChart}>
                      <div className={styles.pieChartGraphic}>
                        {/* Pie chart visual representation */}
                        <svg viewBox="0 0 100 100" className={styles.pieChartSvg}>
                          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#6366f1" strokeWidth="10" strokeDasharray={`${analyticsData.deviceBreakdown[0].value * 2.8} 1000`} />
                          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#3b82f6" strokeWidth="10" strokeDasharray={`${analyticsData.deviceBreakdown[1].value * 2.8} 1000`} strokeDashoffset={`-${analyticsData.deviceBreakdown[0].value * 2.8}`} />
                          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f59e0b" strokeWidth="10" strokeDasharray={`${analyticsData.deviceBreakdown[2].value * 2.8} 1000`} strokeDashoffset={`-${analyticsData.deviceBreakdown[0].value * 2.8 + analyticsData.deviceBreakdown[1].value * 2.8}`} />
                          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#6b7280" strokeWidth="10" strokeDasharray={`${analyticsData.deviceBreakdown[3].value * 2.8} 1000`} strokeDashoffset={`-${analyticsData.deviceBreakdown[0].value * 2.8 + analyticsData.deviceBreakdown[1].value * 2.8 + analyticsData.deviceBreakdown[2].value * 2.8}`} />
                        </svg>
                        <div className={styles.pieChartCenter}></div>
                      </div>
                      <div className={styles.pieChartLegend}>
                        {analyticsData.deviceBreakdown.map((item, index) => (
                          <div key={index} className={styles.legendItem}>
                            <div className={`${styles.legendColor} ${styles[`color${index + 1}`]}`}></div>
                            <div className={styles.legendLabel}>{item.label}</div>
                            <div className={styles.legendValue}>{item.value}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.referralSources}>
                  <h4>Traffic Sources</h4>
                  <div className={styles.referralList}>
                    {analyticsData.referralSources.map((source, index) => (
                      <div key={index} className={styles.referralItem}>
                        <div className={styles.referralDetails}>
                          <div className={styles.referralName}>{source.source}</div>
                          <div className={styles.referralValue}>{source.percentage}%</div>
                        </div>
                        <div className={styles.referralBar}>
                          <div 
                            className={styles.referralFill} 
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedChart === 'revenue' && (
            <div className={styles.revenueChart}>
              <div className={styles.revenueGrid}>
                <div className={styles.revenueBreakdown}>
                  <h4>Revenue Breakdown</h4>
                  <div className={styles.revenueCards}>
                    <div className={styles.revenueCard}>
                      <div className={styles.revenueCardIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div className={styles.revenueCardLabel}>Super Chats</div>
                      <div className={styles.revenueCardValue}>{formatCurrency(analyticsData.totalRevenue * 0.42)}</div>
                      <div className={styles.revenueCardPercentage}>42%</div>
                    </div>
                    
                    <div className={styles.revenueCard}>
                      <div className={styles.revenueCardIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 20h.01M7 20v-4m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM15 10V6m0 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 6v4M13.1 14H12a2 2 0 1 0 0 4h2a2 2 0 1 0 0-4"></path>
                        </svg>
                      </div>
                      <div className={styles.revenueCardLabel}>Subscriptions</div>
                      <div className={styles.revenueCardValue}>{formatCurrency(analyticsData.totalRevenue * 0.31)}</div>
                      <div className={styles.revenueCardPercentage}>31%</div>
                    </div>
                    
                    <div className={styles.revenueCard}>
                      <div className={styles.revenueCardIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                          <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                      </div>
                      <div className={styles.revenueCardLabel}>NFT Sales</div>
                      <div className={styles.revenueCardValue}>{formatCurrency(analyticsData.totalRevenue * 0.27)}</div>
                      <div className={styles.revenueCardPercentage}>27%</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.revenueHistory}>
                  <h4>Revenue Trend</h4>
                  <div className={styles.trendChart}>
                    <div className={styles.trendLine}>
                      {/* Simplified representation of trend line */}
                      <svg viewBox="0 0 300 100" className={styles.trendSvg}>
                        <path
                          d="M0,80 C30,70 60,85 90,40 C120,10 150,30 180,20 C210,10 240,25 270,20 C300,15"
                          fill="none"
                          stroke="url(#trendGradient)"
                          strokeWidth="3"
                        />
                        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.6)" />
                          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.6)" />
                        </linearGradient>
                        <path
                          d="M0,80 C30,70 60,85 90,40 C120,10 150,30 180,20 C210,10 240,25 270,20 C300,15 V100 H0 Z"
                          fill="url(#areaGradient)"
                        />
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
                          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.1)" />
                        </linearGradient>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.contentPerformance}>
        <h3>Top Performing Content</h3>
        <div className={styles.topContentList}>
          {analyticsData.topContent.map((content, index) => (
            <div key={content.id} className={styles.topContentItem}>
              <div className={styles.topContentRank}>{index + 1}</div>
              <div className={styles.topContentThumbnail}>
                <img src={content.thumbnailUrl} alt={content.title} />
              </div>
              <div className={styles.topContentDetails}>
                <h4 className={styles.topContentTitle}>{content.title}</h4>
                <div className={styles.topContentMetrics}>
                  <div className={styles.topContentMetric}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    {formatNumber(content.views)} views
                  </div>
                  <div className={styles.topContentMetric}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {formatWatchTime(content.watchTime)}
                  </div>
                </div>
                <div className={styles.topContentStats}>
                  <div className={styles.topContentStat}>
                    <div className={styles.topContentStatLabel}>Engagement</div>
                    <div className={styles.topContentStatBar}>
                      <div className={styles.topContentStatFill} style={{ width: `${content.engagement * 100}%` }}></div>
                    </div>
                    <div className={styles.topContentStatValue}>{(content.engagement * 100).toFixed(1)}%</div>
                  </div>
                  <div className={styles.topContentStat}>
                    <div className={styles.topContentStatLabel}>Completion</div>
                    <div className={styles.topContentStatBar}>
                      <div className={styles.topContentStatFill} style={{ width: `${content.completionRate * 100}%` }}></div>
                    </div>
                    <div className={styles.topContentStatValue}>{(content.completionRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.insightsSection}>
        <h3>Audience Insights</h3>
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <h4>Watch Time by Hour</h4>
            <div className={styles.hourlyChart}>
              <div className={styles.hourlyBars}>
                {analyticsData.watchTimeByHour.map((hourData, index) => (
                  <div key={index} className={styles.hourlyBarContainer}>
                    <div 
                      className={styles.hourlyBar}
                      style={{ height: `${calculatePercentageOfMax(hourData.watchTime, maxWatchTimeByHour)}%` }}
                      title={`${hourData.hour}:00 - ${hourData.watchTime} minutes`}
                    ></div>
                    <div className={styles.hourlyLabel}>
                      {hourData.hour}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.hourlyLegend}>
                <div>Peak viewing hours (UTC)</div>
                <div>Recommendations based on this data:</div>
                <ul className={styles.hourlyRecommendations}>
                  <li>Schedule live streams at peak hours</li>
                  <li>Release new content during high engagement times</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className={styles.insightCard}>
            <h4>Geographic Distribution</h4>
            <div className={styles.geoDistribution}>
              {analyticsData.geographicData.map((country, index) => (
                <div key={index} className={styles.geoItem}>
                  <div className={styles.geoName}>{country.country}</div>
                  <div className={styles.geoBar}>
                    <div 
                      className={styles.geoFill} 
                      style={{ width: `${country.percentage}%` }}
                    ></div>
                  </div>
                  <div className={styles.geoValue}>{country.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.insightCard}>
            <h4>Subscriber Growth</h4>
            <div className={styles.subscriberChart}>
              <div className={styles.subscriberBars}>
                {analyticsData.subscriberGrowth.slice(-7).map((day, index) => (
                  <div key={index} className={styles.subscriberBarGroup}>
                    <div className={styles.subscriberBarContainer}>
                      <div 
                        className={`${styles.subscriberBar} ${styles.gained}`}
                        style={{ height: `${calculatePercentageOfMax(day.subscribers, maxSubscribers)}%` }}
                        title={`${day.date}: +${day.subscribers} new subscribers`}
                      ></div>
                      <div 
                        className={`${styles.subscriberBar} ${styles.lost}`}
                        style={{ height: `${calculatePercentageOfMax(day.unsubscribers, maxSubscribers/2)}%` }}
                        title={`${day.date}: -${day.unsubscribers} unsubscribers`}
                      ></div>
                    </div>
                    <div className={styles.subscriberLabel}>
                      {new Date(day.date).getDate()}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.subscriberLegend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.gainedColor}`}></div>
                  <div className={styles.legendLabel}>New Subscribers</div>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.lostColor}`}></div>
                  <div className={styles.legendLabel}>Lost Subscribers</div>
                </div>
                <div className={styles.netGrowth}>
                  <div className={styles.netGrowthLabel}>Net Growth (Last 7 days)</div>
                  <div className={styles.netGrowthValue}>+{formatNumber(analyticsData.subscriberGrowth.slice(-7).reduce((sum, day) => sum + day.subscribers - day.unsubscribers, 0))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.recommendationsSection}>
        <h3>AI-Powered Recommendations</h3>
        <div className={styles.recommendationCards}>
          <div className={styles.recommendationCard}>
            <div className={styles.recommendationIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
            <h4>Content Optimization</h4>
            <p>Your live streams have 43% more engagement than VOD content. Consider scheduling more live events during peak hours (18:00-22:00 UTC).</p>
          </div>
          
          <div className={styles.recommendationCard}>
            <div className={styles.recommendationIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
            </div>
            <h4>Audience Growth</h4>
            <p>Your completion rates are highest in educational content. Creating a tutorial series could increase subscriber growth by approximately 15%.</p>
          </div>
          
          <div className={styles.recommendationCard}>
            <div className={styles.recommendationIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v8"></path>
                <path d="m16 6-4 4-4-4"></path>
                <rect x="2" y="14" width="20" height="8" rx="2"></rect>
              </svg>
            </div>
            <h4>Revenue Optimization</h4>
            <p>NFT sales are growing at 27%. Creating limited edition collectibles tied to popular content could increase revenue by 20-30%.</p>
          </div>
        </div>
      </div>

      <div className={styles.exportSection}>
        <button className={styles.exportButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Analytics Report
        </button>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;