/**
 * Content Controller
 * Handles content management and operations
 */

const ContentModel = require('../models/content-model');
const UserModel = require('../models/user-model');
const BetaController = require('./beta-controller');

class ContentController {
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

    console.log('Content controller initialized');
    this.initialized = true;
  }

  /**
   * Create or update content
   * @param {Object} contentData Content data
   * @param {string} authToken Authentication token
   * @returns {Object} Response with content data
   */
  async createOrUpdateContent(contentData, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Only creators can add content
      if (user.role !== 'creator') {
        return {
          success: false,
          error: 'Only creators can manage content'
        };
      }

      // Create or update content
      const content = await ContentModel.createOrUpdate(contentData, user.walletAddress);

      return {
        success: true,
        content: {
          id: content.id,
          title: content.title,
          description: content.description,
          category: content.category,
          status: content.status,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt
        }
      };
    } catch (error) {
      console.error('Content creation/update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get content by ID
   * @param {string} contentId Content ID
   * @returns {Object} Response with content data
   */
  async getContentById(contentId) {
    try {
      const content = ContentModel.getById(contentId);

      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }

      return {
        success: true,
        content
      };
    } catch (error) {
      console.error('Get content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get content by creator
   * @param {string} creatorAddress Creator's wallet address
   * @returns {Object} Response with content items
   */
  async getContentByCreator(creatorAddress) {
    try {
      const contentItems = ContentModel.getByCreator(creatorAddress);

      return {
        success: true,
        contentItems
      };
    } catch (error) {
      console.error('Get creator content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search content based on filters
   * @param {Object} filters Search filters
   * @returns {Object} Response with content items
   */
  async searchContent(filters = {}) {
    try {
      const contentItems = ContentModel.search(filters);

      return {
        success: true,
        contentItems
      };
    } catch (error) {
      console.error('Content search error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record a view for content
   * @param {string} contentId Content ID
   * @param {string} authToken Authentication token
   * @returns {Object} Response with updated view count
   */
  async recordView(contentId, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      const result = ContentModel.recordView(contentId, user.walletAddress);

      return {
        success: true,
        views: result.views
      };
    } catch (error) {
      console.error('Record view error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ContentController();
