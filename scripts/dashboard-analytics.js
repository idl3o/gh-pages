/**
 * Dashboard Analytics Generator
 *
 * This script generates sample analytics data for the StreamChain creator dashboard
 * It's used for demonstration purposes only
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Generating analytics data for StreamChain dashboard'));

// Define output directory
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper function to generate random number within range
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random trend with some variability
function generateTrend(baseValue, days, volatility = 0.1, trend = 0.05) {
  const values = [];
  let currentValue = baseValue;

  for (let i = 0; i < days; i++) {
    // Apply random variation (volatility)
    const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);

    // Apply trend factor (positive or negative)
    const trendFactor = 1 + trend * (i / days);

    // Calculate new value
    currentValue = currentValue * randomFactor * trendFactor;

    // Round to reasonable precision
    values.push(Math.round(currentValue));
  }

  return values;
}

// Generate views data (30 days)
const viewsData = {
  daily: generateTrend(5000, 30, 0.2, 0.01),
  weekly: [],
  monthly: []
};

// Calculate weekly and monthly aggregates
for (let i = 0; i < 4; i++) {
  const weekStart = i * 7;
  const weekViews = viewsData.daily.slice(weekStart, weekStart + 7).reduce((a, b) => a + b, 0);
  viewsData.weekly.push(weekViews);
}

viewsData.monthly.push(viewsData.daily.reduce((a, b) => a + b, 0));

// Generate watch time data (hours)
const watchTimeData = {
  daily: viewsData.daily.map(views => Math.round(views * (randomInRange(5, 15) / 60))),
  weekly: [],
  monthly: []
};

// Calculate weekly and monthly aggregates for watch time
for (let i = 0; i < 4; i++) {
  const weekStart = i * 7;
  const weekWatchTime = watchTimeData.daily
    .slice(weekStart, weekStart + 7)
    .reduce((a, b) => a + b, 0);
  watchTimeData.weekly.push(weekWatchTime);
}

watchTimeData.monthly.push(watchTimeData.daily.reduce((a, b) => a + b, 0));

// Generate subscribers data
const subscribersData = {
  total: 24800,
  growth: generateTrend(50, 30, 0.3, 0.02),
  churn: generateTrend(10, 30, 0.4, -0.01)
};

// Calculate net growth
subscribersData.net = subscribersData.growth.map((growth, i) => growth - subscribersData.churn[i]);

// Generate revenue data
const revenueData = {
  daily: generateTrend(100, 30, 0.25, 0.005),
  sources: {
    subscriptions: [],
    tips: [],
    nftSales: [],
    tokenValue: []
  }
};

// Generate revenue breakdown by source
for (const day of revenueData.daily) {
  const subscriptionShare = randomInRange(40, 60) / 100;
  const tipsShare = randomInRange(15, 30) / 100;
  const nftShare = randomInRange(5, 15) / 100;
  const tokenShare = 1 - subscriptionShare - tipsShare - nftShare;

  revenueData.sources.subscriptions.push(Math.round(day * subscriptionShare));
  revenueData.sources.tips.push(Math.round(day * tipsShare));
  revenueData.sources.nftSales.push(Math.round(day * nftShare));
  revenueData.sources.tokenValue.push(Math.round(day * tokenShare));
}

// Generate audience demographics
const demographicsData = {
  age: {
    '18-24': randomInRange(30, 45),
    '25-34': randomInRange(25, 35),
    '35-44': randomInRange(10, 20),
    '45+': randomInRange(5, 15)
  },
  gender: {
    male: randomInRange(55, 75),
    female: randomInRange(20, 40),
    other: randomInRange(2, 5)
  },
  location: {
    'United States': randomInRange(25, 40),
    Europe: randomInRange(20, 35),
    Asia: randomInRange(15, 25),
    Other: randomInRange(10, 20)
  },
  devices: {
    desktop: randomInRange(40, 60),
    mobile: randomInRange(30, 50),
    tablet: randomInRange(5, 10),
    tv: randomInRange(2, 8)
  }
};

// Combine all analytics into a single object
const analyticsData = {
  views: viewsData,
  watchTime: watchTimeData,
  subscribers: subscribersData,
  revenue: revenueData,
  demographics: demographicsData,
  // Add last updated timestamp
  lastUpdated: new Date().toISOString()
};

// Write to JSON file
const outputPath = path.join(dataDir, 'dashboard-analytics.json');
fs.writeFileSync(outputPath, JSON.stringify(analyticsData, null, 2));

console.log(chalk.green(`✅ Analytics data generated and saved to ${outputPath}`));

// Create a sample content data file
const contentData = {
  items: [
    {
      id: 'vid-001',
      title: 'Web3 Gaming: The Future of In-Game Economies',
      thumbnail: 'images/thumbnail1.jpg',
      duration: '45:18',
      category: 'Gaming',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      views: 12400,
      watchTime: 834,
      revenue: 421.5,
      status: 'published'
    },
    {
      id: 'vid-002',
      title: 'NFT Collections: Creating Sustainable Value',
      thumbnail: 'images/thumbnail2.jpg',
      duration: '38:22',
      category: 'NFT',
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      views: 8700,
      watchTime: 512,
      revenue: 295.2,
      status: 'published'
    },
    {
      id: 'vid-003',
      title: 'DeFi Deep Dive: Yield Farming Strategies',
      thumbnail: 'images/thumbnail3.jpg',
      duration: '52:05',
      category: 'Finance',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      views: 15200,
      watchTime: 1128,
      revenue: 587.6,
      status: 'published'
    },
    {
      id: 'vid-004',
      title: 'Blockchain Technology: Explaining Zero-Knowledge Proofs',
      thumbnail: 'images/thumbnail4.jpg',
      duration: '41:30',
      category: 'Technology',
      publishedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Future date for scheduled
      views: 0,
      watchTime: 0,
      revenue: 0,
      status: 'scheduled'
    },
    {
      id: 'vid-005',
      title: 'Creator Economy in Web3: Monetization Strategies',
      thumbnail: 'images/thumbnail5.jpg',
      duration: '35:45',
      category: 'Business',
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      views: 9300,
      watchTime: 602,
      revenue: 318.7,
      status: 'published'
    }
  ]
};

// Write content data to file
const contentOutputPath = path.join(dataDir, 'dashboard-content.json');
fs.writeFileSync(contentOutputPath, JSON.stringify(contentData, null, 2));

console.log(chalk.green(`✅ Content data generated and saved to ${contentOutputPath}`));

// Create schedule data
const scheduleData = {
  upcoming: [
    {
      id: 'event-001',
      title: 'Live AMA Session',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      startTime: '14:00',
      endTime: '15:30',
      type: 'live'
    },
    {
      id: 'event-002',
      title: 'NFT Drop: Crypto Punks 2.0',
      date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      startTime: '12:00',
      type: 'nft'
    },
    {
      id: 'event-003',
      title: 'Metaverse Tour',
      date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      startTime: '16:00',
      endTime: '17:00',
      type: 'event'
    }
  ]
};

// Write schedule data to file
const scheduleOutputPath = path.join(dataDir, 'dashboard-schedule.json');
fs.writeFileSync(scheduleOutputPath, JSON.stringify(scheduleData, null, 2));

console.log(chalk.green(`✅ Schedule data generated and saved to ${scheduleOutputPath}`));

// Generate sample token data (30 days)
const tokenData = {
  symbol: 'STRM',
  name: 'StreamChain Token',
  currentPrice: 2.47,
  historicalPrices: generateTrend(2.0, 30, 0.03, 0.008).map(price => parseFloat(price.toFixed(2))),
  marketCap: 2470000,
  dailyVolume: 187500,
  holders: 1247,
  distribution: {
    creator: 25,
    community: 45,
    investors: 15,
    treasury: 10,
    team: 5
  }
};

// Write token data to file
const tokenOutputPath = path.join(dataDir, 'dashboard-token.json');
fs.writeFileSync(tokenOutputPath, JSON.stringify(tokenData, null, 2));

console.log(chalk.green(`✅ Token data generated and saved to ${tokenOutputPath}`));

console.log(chalk.blue('🎉 All dashboard data generated successfully!'));
