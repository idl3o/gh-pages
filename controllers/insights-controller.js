/**
 * Insights Controller
 * Manages predictive analytics and future insights
 */

const InsightsModel = require('../models/insights-model');
const UserModel = require('../models/user-model');
const BetaController = require('./beta-controller');

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

      // Check if user has access to future insights feature
      if (!BetaController.isFeatureEnabled('futureInsights', user)) {
        return {
          success: false,
          error: 'Future Insights feature not available for your account'
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

      // Check if user has access to future insights feature
      if (!BetaController.isFeatureEnabled('futureInsights', user)) {
        return {
          success: false,
          error: 'Future Insights feature not available for your account'
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

      // Check if user has access to future insights feature
      if (!BetaController.isFeatureEnabled('futureInsights', user)) {
        return {
          success: false,
          error: 'Future Insights feature not available for your account'
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
}

module.exports = new InsightsController();
