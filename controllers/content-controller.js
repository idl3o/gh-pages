/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Content Controller
 * Handles content management and operations
 */

const ContentModel = require('../models/content-model');
const UserModel = require('../models/user-model');
const IPFSService = require('../services/ipfs-service');
const CacheService = require('../services/cache-service');

class ContentController {
  constructor() {
    this.initialized = false;
    
    // Bind event listeners
    this._setupEventListeners();
  }

  /**
   * Initialize the controller
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Test IPFS connection
      const ipfsClient = await IPFSService.getClient();
      const ipfsId = await ipfsClient.id();
      console.log(`IPFS connection established. Node ID: ${ipfsId.id}`);
      
      console.log('Content controller initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Content Controller:', error);
      // Continue anyway, as IPFS might be available later
      this.initialized = true;
    }
  }
  
  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for content events
    ContentModel.on('content:updated', this._handleContentUpdated.bind(this));
    ContentModel.on('content:viewed', this._handleContentViewed.bind(this));
    ContentModel.on('content:interaction', this._handleContentInteraction.bind(this));
    ContentModel.on('task:queued', this._handleTaskQueued.bind(this));
    ContentModel.on('task:completed', this._handleTaskCompleted.bind(this));
  }
  
  /**
   * Handle content updated event
   * @param {Object} content Updated content
   * @private
   */
  _handleContentUpdated(content) {
    console.log(`Content updated: ${content.id}`);
    
    // Clear any cached content
    CacheService.delete(`content_${content.id}`);
    
    // If content is published and has IPFS data, ensure availability
    if (content.status === ContentModel.CONTENT_STATUSES.PUBLISHED && content.ipfs?.cid) {
      this._verifyContentAvailability(content.id);
    }
  }
  
  /**
   * Handle content viewed event
   * @param {Object} viewData View event data
   * @private
   */
  _handleContentViewed(viewData) {
    // In a production environment, this would send analytics
    console.log(`Content ${viewData.contentId} viewed by ${viewData.viewerAddress}`);
  }
  
  /**
   * Handle content interaction event
   * @param {Object} interactionData Interaction event data
   * @private
   */
  _handleContentInteraction(interactionData) {
    // In a production environment, this would update analytics
    console.log(`Content ${interactionData.contentId} ${interactionData.type} by ${interactionData.userAddress}`);
  }
  
  /**
   * Handle task queued event
   * @param {Object} taskData Task data
   * @private
   */
  _handleTaskQueued(taskData) {
    console.log(`Task queued: ${taskData.taskType} for content ${taskData.contentId}`);
  }
  
  /**
   * Handle task completed event
   * @param {Object} taskData Task data
   * @private
   */
  _handleTaskCompleted(taskData) {
    console.log(`Task completed: ${taskData.taskType} for content ${taskData.contentId}`);
    
    // Update content status based on task result if needed
    if (taskData.taskType === 'transcode' && taskData.options.updateStatus) {
      this._updateContentAfterTranscode(taskData.contentId, taskData.options);
    }
  }
  
  /**
   * Verify content availability on IPFS
   * @param {string} contentId Content ID
   * @private
   */
  async _verifyContentAvailability(contentId) {
    try {
      const available = await ContentModel.verifyIPFSAvailability(contentId);
      
      if (!available) {
        console.warn(`Content ${contentId} is not available on IPFS`);
        
        // In production, this would trigger notifications and recovery procedures
      }
    } catch (error) {
      console.error(`Error verifying content ${contentId}:`, error);
    }
  }
  
  /**
   * Update content after transcoding task
   * @param {string} contentId Content ID
   * @param {Object} options Task options
   * @private
   */
  async _updateContentAfterTranscode(contentId, options) {
    try {
      const content = ContentModel.getById(contentId);
      if (!content) return;
      
      // Update content with new version
      if (options.versions && content.ipfs) {
        content.ipfs.versions = {
          ...content.ipfs.versions,
          ...options.versions
        };
        
        await ContentModel.createOrUpdate(content, content.creatorAddress);
      }
    } catch (error) {
      console.error(`Error updating content ${contentId} after transcode:`, error);
    }
  }

  /**
   * Upload a file to IPFS and create content record
   * @param {File|Buffer} file File or buffer to upload
   * @param {Object} metadata Content metadata
   * @param {string} authToken Authentication token
   * @returns {Object} Response with content data
   */
  async uploadContent(file, metadata, authToken) {
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
      
      // Upload to IPFS
      const uploadResult = await ContentModel.uploadToIPFS(file, {
        contentType: metadata.contentType,
        filename: metadata.filename
      });
      
      // Create content record
      const contentData = {
        title: metadata.title,
        description: metadata.description || '',
        category: metadata.category,
        contentType: metadata.contentType,
        status: ContentModel.CONTENT_STATUSES.PROCESSING,
        accessType: metadata.accessType || ContentModel.ACCESS_TYPES.PUBLIC,
        tags: metadata.tags || [],
        ipfsCid: uploadResult.ipfs.cid,
        ipfsPath: uploadResult.ipfs.path,
        size: uploadResult.ipfs.size,
        filename: metadata.filename,
        duration: metadata.duration,
        quality: metadata.quality || ContentModel.QUALITY_LEVELS.HIGH
      };
      
      const content = await ContentModel.createOrUpdate(contentData, user.walletAddress);
      
      // Queue processing tasks
      if (content.contentType === ContentModel.CONTENT_TYPES.VIDEO) {
        // In production: Queue video transcoding for different quality levels
        console.log(`Queueing transcoding for content ${content.id}`);
      }
      
      return {
        success: true,
        content: {
          id: content.id,
          title: content.title,
          ipfs: content.ipfs,
          status: content.status
        }
      };
    } catch (error) {
      console.error('Content upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload a thumbnail for content
   * @param {File|Buffer} thumbnail Thumbnail file or buffer
   * @param {string} contentId Content ID
   * @param {string} authToken Authentication token
   * @returns {Object} Response with updated content data
   */
  async uploadThumbnail(thumbnail, contentId, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Get content to verify ownership
      const content = ContentModel.getById(contentId);
      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }
      
      // Verify ownership
      if (content.creatorAddress !== user.walletAddress) {
        return {
          success: false,
          error: 'You do not own this content'
        };
      }
      
      // Upload thumbnail to IPFS
      const uploadResult = await IPFSService.uploadFile(thumbnail, {
        contentType: 'image/jpeg',
        wrapWithDirectory: false
      });
      
      // Update content with thumbnail
      const updatedContent = await ContentModel.createOrUpdate({
        id: contentId,
        thumbnailCid: uploadResult.cid,
        thumbnailSize: uploadResult.size
      }, user.walletAddress);
      
      return {
        success: true,
        thumbnail: {
          cid: uploadResult.cid,
          gateway: uploadResult.gateway
        },
        content: {
          id: updatedContent.id,
          title: updatedContent.title,
          ipfs: updatedContent.ipfs
        }
      };
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
          updatedAt: content.updatedAt,
          ipfs: content.ipfs
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
      // Check cache first
      const cachedContent = CacheService.get(`content_${contentId}`);
      if (cachedContent) {
        return cachedContent;
      }
      
      const content = ContentModel.getById(contentId);

      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }

      // Verify IPFS availability in the background if content is published
      if (content.status === ContentModel.CONTENT_STATUSES.PUBLISHED && content.ipfs) {
        // Don't await - let this happen in the background
        this._verifyContentAvailability(contentId);
      }
      
      const result = {
        success: true,
        content
      };
      
      // Cache result for 5 minutes
      CacheService.set(`content_${contentId}`, result, 300);
      
      return result;
    } catch (error) {
      console.error('Get content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get content by IPFS CID
   * @param {string} cid IPFS content identifier
   * @returns {Object} Response with content data
   */
  async getContentByCid(cid) {
    try {
      // Check cache first
      const cachedContent = CacheService.get(`content_cid_${cid}`);
      if (cachedContent) {
        return cachedContent;
      }
      
      const content = ContentModel.getByCid(cid);

      if (!content) {
        return {
          success: false,
          error: 'Content not found for CID'
        };
      }

      const result = {
        success: true,
        content
      };
      
      // Cache result for 5 minutes
      CacheService.set(`content_cid_${cid}`, result, 300);
      
      return result;
    } catch (error) {
      console.error('Get content by CID error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get content by creator
   * @param {string} creatorAddress Creator's wallet address
   * @param {Object} options Filtering options
   * @returns {Object} Response with content items
   */
  async getContentByCreator(creatorAddress, options = {}) {
    try {
      const contentItems = ContentModel.getByCreator(creatorAddress, options);

      return {
        success: true,
        contentItems,
        filters: options,
        count: contentItems.length
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
      // Generate cache key based on filters
      const cacheKey = `content_search_${JSON.stringify(filters)}`;
      
      // Check cache
      const cachedResults = CacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
      
      const contentItems = ContentModel.search(filters);

      const result = {
        success: true,
        contentItems,
        filters,
        count: contentItems.length
      };
      
      // Cache search results for 1 minute
      CacheService.set(cacheKey, result, 60);
      
      return result;
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

      // Clear content cache to reflect updated view count
      CacheService.delete(`content_${contentId}`);

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
  
  /**
   * Record an interaction with content (like, share)
   * @param {string} contentId Content ID
   * @param {string} type Interaction type
   * @param {string} authToken Authentication token
   * @returns {Object} Response with updated metrics
   */
  async recordInteraction(contentId, type, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      const result = ContentModel.recordInteraction(contentId, type, user.walletAddress);

      // Clear content cache to reflect updated metrics
      CacheService.delete(`content_${contentId}`);

      return {
        success: true,
        metrics: result.metrics
      };
    } catch (error) {
      console.error(`Record ${type} error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Publish content (change status to published)
   * @param {string} contentId Content ID
   * @param {string} authToken Authentication token
   * @returns {Object} Response with updated content
   */
  async publishContent(contentId, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Get content to verify ownership
      const content = ContentModel.getById(contentId);
      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }
      
      // Verify ownership
      if (content.creatorAddress !== user.walletAddress) {
        return {
          success: false,
          error: 'You do not own this content'
        };
      }
      
      // Verify content has IPFS data
      if (!content.ipfs || !content.ipfs.cid) {
        return {
          success: false,
          error: 'Content does not have required IPFS data'
        };
      }
      
      // Verify IPFS availability
      const available = await ContentModel.verifyIPFSAvailability(contentId);
      if (!available) {
        return {
          success: false,
          error: 'Content is not available on IPFS'
        };
      }
      
      // Update content status
      const updatedContent = await ContentModel.createOrUpdate({
        id: contentId,
        status: ContentModel.CONTENT_STATUSES.PUBLISHED
      }, user.walletAddress);
      
      return {
        success: true,
        content: {
          id: updatedContent.id,
          title: updatedContent.title,
          status: updatedContent.status,
          ipfs: updatedContent.ipfs
        }
      };
    } catch (error) {
      console.error('Content publish error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Delete content (change status to removed)
   * @param {string} contentId Content ID
   * @param {string} authToken Authentication token
   * @returns {Object} Response with status
   */
  async deleteContent(contentId, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }
      
      // Get content to verify ownership
      const content = ContentModel.getById(contentId);
      if (!content) {
        return {
          success: false,
          error: 'Content not found'
        };
      }
      
      // Verify ownership or admin rights
      if (content.creatorAddress !== user.walletAddress && user.role !== 'admin') {
        return {
          success: false,
          error: 'You do not have permission to delete this content'
        };
      }
      
      // Update content status
      await ContentModel.createOrUpdate({
        id: contentId,
        status: ContentModel.CONTENT_STATUSES.REMOVED
      }, user.walletAddress);
      
      // Clear cache
      CacheService.delete(`content_${contentId}`);
      if (content.ipfs?.cid) {
        CacheService.delete(`content_cid_${content.ipfs.cid}`);
      }
      
      return {
        success: true,
        message: 'Content deleted successfully'
      };
    } catch (error) {
      console.error('Content deletion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ContentController();
