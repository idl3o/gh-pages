/**
 * Content Model
 * Handles content data and CRUD operations
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class ContentModel extends EventEmitter {
  constructor() {
    super();
    this.content = new Map();
    this.categories = new Set(['education', 'entertainment', 'gaming', 'music', 'tech']);
  }

  /**
   * Create or update content item
   * @param {Object} contentData Content information
   * @param {string} creatorAddress Creator's wallet address
   * @returns {Object} Created/updated content
   */
  async createOrUpdate(contentData, creatorAddress) {
    if (!contentData.title || !creatorAddress) {
      throw new Error('Title and creator address are required');
    }

    const contentId = contentData.id || `content_${crypto.randomBytes(8).toString('hex')}`;
    const existingContent = this.content.get(contentId);

    const updatedContent = {
      ...existingContent,
      ...contentData,
      id: contentId,
      creatorAddress,
      updatedAt: new Date().toISOString()
    };

    if (!existingContent) {
      updatedContent.createdAt = updatedContent.updatedAt;
      updatedContent.status = 'draft';
      updatedContent.views = 0;
      updatedContent.likes = 0;
      updatedContent.shares = 0;
    }

    this.content.set(contentId, updatedContent);
    this.emit('content:updated', updatedContent);

    return updatedContent;
  }

  /**
   * Get content by ID
   * @param {string} contentId Content ID
   * @returns {Object|null} Content or null if not found
   */
  getById(contentId) {
    return this.content.get(contentId) || null;
  }

  /**
   * Get all content by creator
   * @param {string} creatorAddress Creator's wallet address
   * @returns {Array} Array of content items
   */
  getByCreator(creatorAddress) {
    const results = [];
    this.content.forEach(item => {
      if (item.creatorAddress === creatorAddress) {
        results.push(item);
      }
    });
    return results;
  }

  /**
   * Search content
   * @param {Object} filters Search filters
   * @returns {Array} Matching content items
   */
  search(filters = {}) {
    const results = [];

    this.content.forEach(item => {
      let matches = true;

      // Apply filters
      if (filters.category && item.category !== filters.category) {
        matches = false;
      }

      if (filters.status && item.status !== filters.status) {
        matches = false;
      }

      if (filters.query) {
        const query = filters.query.toLowerCase();
        const titleMatch = item.title && item.title.toLowerCase().includes(query);
        const descMatch = item.description && item.description.toLowerCase().includes(query);

        if (!titleMatch && !descMatch) {
          matches = false;
        }
      }

      if (matches) {
        results.push(item);
      }
    });

    return results;
  }

  /**
   * Record a content view
   * @param {string} contentId Content ID
   * @param {string} viewerAddress Viewer's wallet address
   * @returns {Object} Updated content stats
   */
  recordView(contentId, viewerAddress) {
    const content = this.getById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    content.views += 1;
    content.lastViewed = new Date().toISOString();

    // Record in analytics (would store in a real database)
    this.emit('content:viewed', {
      contentId,
      viewerAddress,
      timestamp: content.lastViewed
    });

    this.content.set(contentId, content);
    return { views: content.views };
  }
}

module.exports = new ContentModel();
