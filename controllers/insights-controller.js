/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Insights Controller
 * Provides advanced analytics for content, creators, and platform usage
 */

const UserModel = require('../models/user-model');
const ContentModel = require('../models/content-model');
const InsightsModel = require('../models/insights-model');
const CacheService = require('../services/cache-service');

class InsightsController {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the controller
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('Insights controller initialized');
    this.initialized = true;
  }

  /**
   * Get all available insights
   * @param {Object} filters Optional filters
   * @param {string} authToken Authentication token
   * @returns {Object} Insights result
   */
  async getInsights(filters = {}, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Get insights
      const insights = InsightsModel.getInsights(filters);

      return {
        success: true,
        insights
      };
    } catch (error) {
      console.error('Get insights error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a personalized insight for the user
   * @param {string} authToken Authentication token
   * @returns {Object} Personalized insight result
   */
  async getPersonalizedInsight(authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Generate personalized insight
      const insight = InsightsModel.generatePersonalizedInsight(user);

      return {
        success: true,
        insight
      };
    } catch (error) {
      console.error('Personalized insight error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get insight by ID
   * @param {string} insightId Insight ID
   * @param {string} authToken Authentication token
   * @returns {Object} Insight result
   */
  async getInsightById(insightId, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Get insight
      const insight = InsightsModel.getInsightById(insightId);

      if (!insight) {
        return {
          success: false,
          error: 'Insight not found'
        };
      }

      return {
        success: true,
        insight
      };
    } catch (error) {
      console.error('Get insight error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get analytics for a specific content item
   * @param {string} contentId Content ID
   * @param {string} timeframe Timeframe for analytics (daily, weekly, monthly, all)
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} Content analytics
   */
  async getContentAnalytics(contentId, timeframe = 'all', authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Get content
      const content = await ContentModel.getContent(contentId);
      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }
      
      // Check permissions (must be creator or admin)
      if (content.creatorId !== currentUser.id && currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'You do not have permission to view these analytics'
        };
      }
      
      // Use cache for frequently accessed analytics data
      const cacheKey = `content_analytics:${contentId}:${timeframe}`;
      const analytics = await CacheService.getOrCompute(
        cacheKey,
        () => InsightsModel.getContentAnalytics(contentId, timeframe),
        300 // Cache for 5 minutes
      );
      
      return {
        success: true,
        analytics
      };
    } catch (error) {
      console.error('Content analytics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get analytics for all content of a creator
   * @param {string} timeframe Timeframe for analytics (daily, weekly, monthly, all)
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} Creator analytics
   */
  async getCreatorAnalytics(timeframe = 'all', authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Only creators and admins can access this
      if (currentUser.role !== 'creator' && currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only creators can access analytics'
        };
      }
      
      // Use cache for frequently accessed analytics data
      const cacheKey = `creator_analytics:${currentUser.id}:${timeframe}`;
      const analytics = await CacheService.getOrCompute(
        cacheKey,
        () => InsightsModel.getCreatorAnalytics(currentUser.id, timeframe),
        600 // Cache for 10 minutes
      );
      
      return {
        success: true,
        analytics
      };
    } catch (error) {
      console.error('Creator analytics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get platform-wide analytics (admin only)
   * @param {string} timeframe Timeframe for analytics (daily, weekly, monthly, all)
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} Platform analytics
   */
  async getPlatformAnalytics(timeframe = 'all', authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Admin only endpoint
      if (currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Admin access required'
        };
      }
      
      // Use cache for platform analytics to reduce load
      const cacheKey = `platform_analytics:${timeframe}`;
      const analytics = await CacheService.getOrCompute(
        cacheKey,
        () => InsightsModel.getPlatformAnalytics(timeframe),
        900 // Cache for 15 minutes
      );
      
      return {
        success: true,
        analytics
      };
    } catch (error) {
      console.error('Platform analytics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get audience demographic data for a creator
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} Audience demographics
   */
  async getAudienceDemographics(authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Only creators and admins can access this
      if (currentUser.role !== 'creator' && currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only creators can access audience demographics'
        };
      }
      
      // Get demographics data
      const demographics = await InsightsModel.getAudienceDemographics(currentUser.id);
      
      return {
        success: true,
        demographics
      };
    } catch (error) {
      console.error('Audience demographics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get engagement metrics for content
   * @param {string} contentId Content ID
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} Engagement metrics
   */
  async getEngagementMetrics(contentId, authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Get content
      const content = await ContentModel.getContent(contentId);
      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }
      
      // Check permissions (must be creator or admin)
      if (content.creatorId !== currentUser.id && currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'You do not have permission to view these metrics'
        };
      }
      
      // Get engagement metrics
      const metrics = await InsightsModel.getEngagementMetrics(contentId);
      
      return {
        success: true,
        metrics
      };
    } catch (error) {
      console.error('Engagement metrics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get revenue insights
   * @param {string} timeframe Timeframe for analytics (daily, weekly, monthly, all)
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} Revenue insights
   */
  async getRevenueInsights(timeframe = 'all', authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Only creators and admins can access this
      if (currentUser.role !== 'creator' && currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only creators can access revenue insights'
        };
      }
      
      // Get revenue insights
      const insights = await InsightsModel.getRevenueInsights(currentUser.id, timeframe);
      
      return {
        success: true,
        insights
      };
    } catch (error) {
      console.error('Revenue insights error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get NFT performance metrics
   * @param {string} authToken Authentication token
   * @returns {Promise<Object>} NFT performance metrics
   */
  async getNftPerformanceMetrics(authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Only creators and admins can access this
      if (currentUser.role !== 'creator' && currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Only creators can access NFT metrics'
        };
      }
      
      // Get NFT metrics
      const metrics = await InsightsModel.getNftPerformanceMetrics(currentUser.id);
      
      return {
        success: true,
        metrics
      };
    } catch (error) {
      console.error('NFT performance metrics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new InsightsController();
