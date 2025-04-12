/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Insights Model
 * Handles predictive analytics and future trend forecasting
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class InsightsModel extends EventEmitter {
  constructor() {
    super();
    this.insights = new Map();
    this.predictionTypes = ['content', 'token', 'creator', 'industry'];
    this.timeframes = ['week', 'month', 'quarter', 'year'];

    // Initialize with some starter predictions
    this._generateInitialInsights();
  }

  /**
   * Get all available insights
   * @param {Object} filters Optional filters
   * @returns {Array} Array of insights
   */
  getInsights(filters = {}) {
    const results = [];

    this.insights.forEach(insight => {
      let matches = true;

      if (filters.type && insight.type !== filters.type) {
        matches = false;
      }

      if (filters.timeframe && insight.timeframe !== filters.timeframe) {
        matches = false;
      }

      if (matches) {
        results.push(insight);
      }
    });

    return results;
  }

  /**
   * Get a specific insight by ID
   * @param {string} insightId Insight ID
   * @returns {Object|null} The insight or null if not found
   */
  getInsightById(insightId) {
    return this.insights.get(insightId) || null;
  }

  /**
   * Generate a personalized insight for a user
   * @param {Object} userData User data for personalization
   * @returns {Object} Personalized insight
   */
  generatePersonalizedInsight(userData) {
    // In a real implementation, this would use ML/AI to generate personalized insights
    // For now, we'll create a simple personalized insight

    const id = `insight_${crypto.randomBytes(8).toString('hex')}`;
    const types = userData.role === 'creator' ?
      ['content', 'creator'] :
      ['content', 'token'];

    const type = types[Math.floor(Math.random() * types.length)];
    const timeframe = this.timeframes[Math.floor(Math.random() * this.timeframes.length)];

    const insight = {
      id,
      type,
      timeframe,
      title: this._generateInsightTitle(type, userData),
      description: this._generateInsightDescription(type, userData),
      confidence: Math.round(60 + Math.random() * 30), // 60-90%
      createdAt: new Date().toISOString(),
      relevanceScore: Math.round(70 + Math.random() * 30), // 70-100
      forUserId: userData.id
    };

    this.insights.set(id, insight);
    this.emit('insight:created', insight);

    return insight;
  }

  /**
   * Private method to generate initial insights
   * @private
   */
  _generateInitialInsights() {
    const insights = [
      {
        id: `insight_${crypto.randomBytes(8).toString('hex')}`,
        type: 'industry',
        timeframe: 'quarter',
        title: 'Rise of Interactive Streaming',
        description: 'Interactive content will see 45% growth in the next quarter as viewers seek more engagement.',
        confidence: 78,
        createdAt: new Date().toISOString(),
        relevanceScore: 92
      },
      {
        id: `insight_${crypto.randomBytes(8).toString('hex')}`,
        type: 'token',
        timeframe: 'month',
        title: 'STREAM Token Growth Projection',
        description: 'Our analysis predicts 30% increased adoption of STREAM token for content transactions next month.',
        confidence: 82,
        createdAt: new Date().toISOString(),
        relevanceScore: 88
      },
      {
        id: `insight_${crypto.randomBytes(8).toString('hex')}`,
        type: 'content',
        timeframe: 'week',
        title: 'Educational Content Trend',
        description: 'Educational blockchain content will be the fastest growing category this week with 22% increase in views.',
        confidence: 75,
        createdAt: new Date().toISOString(),
        relevanceScore: 85
      }
    ];

    // Add insights to the map
    insights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });
  }

  /**
   * Generate an insight title based on type and user
   * @param {string} type Insight type
   * @param {Object} userData User data
   * @returns {string} Generated title
   * @private
   */
  _generateInsightTitle(type, userData) {
    const titles = {
      content: [
        `Content Strategy for ${userData.name || 'Your'} Growth`,
        'Emerging Content Opportunity',
        'Viewer Preference Shift Prediction'
      ],
      token: [
        'Token Utility Expansion',
        'STREAM Token Value Projection',
        'Tokenomics Evolution'
      ],
      creator: [
        'Creator Monetization Outlook',
        'Creator-Viewer Engagement Forecast',
        'Collaboration Opportunity Alert'
      ],
      industry: [
        'Web3 Streaming Market Shift',
        'Technology Adoption Forecast',
        'Decentralized Media Trend'
      ]
    };

    const options = titles[type] || titles.industry;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Generate an insight description based on type and user
   * @param {string} type Insight type
   * @param {Object} userData User data
   * @returns {string} Generated description
   * @private
   */
  _generateInsightDescription(type, userData) {
    const role = userData.role || 'viewer';
    const name = userData.name || 'you';

    const descriptions = {
      content: {
        creator: `Based on your content history, we predict that ${name} could see 35% growth by focusing on interactive blockchain tutorials.`,
        viewer: `Your viewing patterns suggest emerging interest in tokenized communities - content in this area likely to grow 28% in relevance to ${name}.`
      },
      token: {
        creator: `Creator tokens similar to what ${name} might launch are projected to see 40% more utility in platform features.`,
        viewer: `Viewers like ${name} are increasingly using tokens for content access, indicating 25% growth in token-gated content consumption.`
      },
      creator: {
        creator: `${name}'s content style positions you well for the upcoming trend toward serialized Web3 educational content.`,
        viewer: `Creators making content that ${name} enjoys are likely to shift toward more community-driven production models.`
      }
    };

    return descriptions[type]?.[role] ||
      `Our predictive analytics suggest significant growth opportunities in ${type} areas related to ${name}'s interests.`;
  }
}

module.exports = new InsightsModel();
