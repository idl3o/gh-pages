/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Content Model
 * Handles content data and CRUD operations
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const IPFSService = require('../services/ipfs-service');
const CacheService = require('../services/cache-service');

// Content types supported by the platform
const CONTENT_TYPES = {
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  IMAGE: 'image',
  COLLECTION: 'collection', // For bundled content
};

// Content quality levels
const QUALITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  HD: 'hd',
};

// Content statuses
const CONTENT_STATUSES = {
  DRAFT: 'draft',           // Initial creation, not published
  PROCESSING: 'processing', // Being processed (e.g. transcoding, pinning)
  PUBLISHED: 'published',   // Available to viewers
  ARCHIVED: 'archived',     // No longer actively promoted but still available
  REMOVED: 'removed',       // Not available to viewers
};

// Access types
const ACCESS_TYPES = {
  PUBLIC: 'public',         // Available to everyone
  TOKEN_GATED: 'token',     // Requires token ownership
  SUBSCRIPTION: 'subscription', // Requires subscription
  PURCHASE: 'purchase',     // One-time purchase
  PRIVATE: 'private',       // Private to creator
};

class ContentModel extends EventEmitter {
  constructor() {
    super();
    this.content = new Map();
    this.categories = new Set(['education', 'entertainment', 'gaming', 'music', 'tech', 'art', 'sports', 'science']);
    this.contentTypes = Object.values(CONTENT_TYPES);
    this.contentStatuses = Object.values(CONTENT_STATUSES);
    this.accessTypes = Object.values(ACCESS_TYPES);
    this.qualityLevels = Object.values(QUALITY_LEVELS);
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

    // Validate content type
    if (contentData.contentType && !this.contentTypes.includes(contentData.contentType)) {
      throw new Error(`Invalid content type. Must be one of: ${this.contentTypes.join(', ')}`);
    }

    // Validate category
    if (contentData.category && !this.categories.has(contentData.category)) {
      throw new Error(`Invalid category. Must be one of: ${Array.from(this.categories).join(', ')}`);
    }

    // Validate status
    if (contentData.status && !this.contentStatuses.includes(contentData.status)) {
      throw new Error(`Invalid status. Must be one of: ${this.contentStatuses.join(', ')}`);
    }

    // Validate access type
    if (contentData.accessType && !this.accessTypes.includes(contentData.accessType)) {
      throw new Error(`Invalid access type. Must be one of: ${this.accessTypes.join(', ')}`);
    }

    const contentId = contentData.id || `content_${crypto.randomBytes(8).toString('hex')}`;
    const existingContent = this.content.get(contentId);
    const now = new Date().toISOString();

    // Process IPFS-related data if present
    let ipfsData = contentData.ipfs || existingContent?.ipfs || null;

    // If content file was updated, process the IPFS data
    if (contentData.ipfsCid && contentData.ipfsCid !== existingContent?.ipfs?.cid) {
      try {
        // Get content status from IPFS
        const ipfsStatus = await IPFSService.getContentStatus(contentData.ipfsCid);
        
        ipfsData = {
          cid: contentData.ipfsCid,
          path: contentData.ipfsPath || null,
          size: ipfsStatus.size || contentData.size || 0,
          available: ipfsStatus.available,
          pinned: ipfsStatus.pinned,
          lastVerified: now,
          versions: {
            original: {
              cid: contentData.ipfsCid,
              quality: contentData.quality || QUALITY_LEVELS.HIGH,
              size: ipfsStatus.size || contentData.size || 0,
            }
          }
        };
        
        // Add additional metadata for thumbnails and previews if available
        if (contentData.thumbnailCid) {
          ipfsData.thumbnail = {
            cid: contentData.thumbnailCid,
            size: contentData.thumbnailSize || 0,
          };
        }
        
        if (contentData.previewCid) {
          ipfsData.preview = {
            cid: contentData.previewCid,
            size: contentData.previewSize || 0,
          };
        }
        
        // Add gateway URLs for convenience
        ipfsData.gatewayUrls = {
          content: IPFSService.getGatewayUrl(ipfsData.cid, 'ipfs.io', contentData.filename),
          thumbnail: contentData.thumbnailCid ? IPFSService.getGatewayUrl(contentData.thumbnailCid, 'ipfs.io', 'thumbnail.jpg') : null,
          preview: contentData.previewCid ? IPFSService.getGatewayUrl(contentData.previewCid, 'ipfs.io', 'preview.mp4') : null,
        };
        
        // Make sure it's properly pinned
        if (!ipfsStatus.pinned) {
          // Queue pinning task
          this.queueContentTask(contentId, 'pin', {
            cid: contentData.ipfsCid,
            priority: 'high',
          });
        }
      } catch (error) {
        console.error('Error processing IPFS data:', error);
        // Create basic IPFS data if we couldn't verify
        ipfsData = {
          cid: contentData.ipfsCid,
          path: contentData.ipfsPath || null,
          size: contentData.size || 0,
          available: false,
          pinned: false,
          lastVerified: now,
          gatewayUrls: {
            content: IPFSService.getGatewayUrl(contentData.ipfsCid),
            thumbnail: contentData.thumbnailCid ? IPFSService.getGatewayUrl(contentData.thumbnailCid) : null,
            preview: contentData.previewCid ? IPFSService.getGatewayUrl(contentData.previewCid) : null,
          }
        };
      }
    }

    // Build the updated content object
    const updatedContent = {
      ...existingContent,
      ...contentData,
      id: contentId,
      creatorAddress,
      updatedAt: now
    };

    // Add IPFS data if available
    if (ipfsData) {
      updatedContent.ipfs = ipfsData;
    }

    // Add default fields for new content
    if (!existingContent) {
      updatedContent.createdAt = now;
      updatedContent.status = contentData.status || CONTENT_STATUSES.DRAFT;
      updatedContent.accessType = contentData.accessType || ACCESS_TYPES.PUBLIC;
      updatedContent.contentType = contentData.contentType || CONTENT_TYPES.VIDEO;
      updatedContent.views = 0;
      updatedContent.likes = 0;
      updatedContent.shares = 0;
      updatedContent.comments = [];
      updatedContent.tags = contentData.tags || [];
      updatedContent.metadata = contentData.metadata || {};
    }

    // Update NFT details if provided
    if (contentData.nftAddress) {
      updatedContent.nft = {
        contractAddress: contentData.nftAddress,
        tokenId: contentData.nftTokenId,
        blockchain: contentData.nftBlockchain || 'ethereum',
        mintDate: contentData.nftMintDate || now,
      };
    }

    // Ensure we have licensing information
    updatedContent.license = contentData.license || existingContent?.license || {
      type: 'standard',
      attribution: true,
      commercial: false,
    };

    // Set duration for time-based content
    if (contentData.duration) {
      updatedContent.duration = contentData.duration;
    }

    // Save to storage
    this.content.set(contentId, updatedContent);
    
    // Emit event for listeners
    this.emit('content:updated', updatedContent);
    
    return updatedContent;
  }

  /**
   * Upload content file to IPFS
   * @param {File|Buffer} file Content file or buffer
   * @param {Object} metadata Content metadata
   * @returns {Promise<Object>} IPFS result and content ID
   */
  async uploadToIPFS(file, metadata = {}) {
    try {
      // Upload to IPFS
      const ipfsResult = file instanceof Buffer 
        ? await IPFSService.uploadContent(file, {
            contentType: metadata.contentType,
            filename: metadata.filename
          })
        : await IPFSService.uploadFile(file, {
            wrapWithDirectory: true
          });
      
      // Generate content ID
      const contentId = `content_${crypto.randomBytes(8).toString('hex')}`;
      
      // Return combined result
      return {
        contentId,
        ipfs: ipfsResult
      };
    } catch (error) {
      console.error('Content upload error:', error);
      throw new Error(`Failed to upload content: ${error.message}`);
    }
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
   * Get content by IPFS CID
   * @param {string} cid IPFS content identifier
   * @returns {Object|null} Content or null if not found
   */
  getByCid(cid) {
    for (const [_, content] of this.content.entries()) {
      if (content.ipfs && content.ipfs.cid === cid) {
        return content;
      }
    }
    return null;
  }

  /**
   * Get all content by creator
   * @param {string} creatorAddress Creator's wallet address
   * @param {Object} options Optional filters
   * @returns {Array} Array of content items
   */
  getByCreator(creatorAddress, options = {}) {
    const results = [];
    this.content.forEach(item => {
      if (item.creatorAddress === creatorAddress) {
        // Apply status filter if specified
        if (options.status && item.status !== options.status) {
          return;
        }
        
        // Apply content type filter if specified
        if (options.contentType && item.contentType !== options.contentType) {
          return;
        }
        
        results.push(item);
      }
    });
    
    // Sort by date if requested
    if (options.sortBy === 'date') {
      results.sort((a, b) => {
        const dateA = new Date(options.sortOrder === 'asc' ? a.createdAt : a.updatedAt);
        const dateB = new Date(options.sortOrder === 'asc' ? b.createdAt : b.updatedAt);
        return options.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }
    
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
      
      if (filters.contentType && item.contentType !== filters.contentType) {
        matches = false;
      }
      
      if (filters.accessType && item.accessType !== filters.accessType) {
        matches = false;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => item.tags && item.tags.includes(tag));
        if (!hasTag) {
          matches = false;
        }
      }

      if (filters.query) {
        const query = filters.query.toLowerCase();
        const titleMatch = item.title && item.title.toLowerCase().includes(query);
        const descMatch = item.description && item.description.toLowerCase().includes(query);
        const tagMatch = item.tags && item.tags.some(tag => tag.toLowerCase().includes(query));

        if (!titleMatch && !descMatch && !tagMatch) {
          matches = false;
        }
      }

      if (matches) {
        results.push(item);
      }
    });
    
    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      
      switch (filters.sortBy) {
        case 'date':
          results.sort((a, b) => sortOrder * (new Date(b.createdAt) - new Date(a.createdAt)));
          break;
        case 'views':
          results.sort((a, b) => sortOrder * (b.views - a.views));
          break;
        case 'likes':
          results.sort((a, b) => sortOrder * (b.likes - a.likes));
          break;
        case 'title':
          results.sort((a, b) => sortOrder * a.title.localeCompare(b.title));
          break;
      }
    }

    // Apply pagination
    if (filters.limit) {
      const start = filters.offset || 0;
      const end = start + filters.limit;
      return results.slice(start, end);
    }

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

  /**
   * Update content interaction metrics (likes, shares, etc)
   * @param {string} contentId Content ID
   * @param {string} type Interaction type (like, share, etc)
   * @param {string} userAddress User's wallet address
   * @returns {Object} Updated content stats
   */
  recordInteraction(contentId, type, userAddress) {
    const content = this.getById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    const timestamp = new Date().toISOString();
    
    switch (type) {
      case 'like':
        content.likes += 1;
        break;
      case 'share':
        content.shares += 1;
        break;
      case 'comment':
        // Implementation would require comment text
        break;
      default:
        throw new Error(`Unknown interaction type: ${type}`);
    }

    // Record in analytics
    this.emit('content:interaction', {
      contentId,
      type,
      userAddress,
      timestamp
    });

    this.content.set(contentId, content);
    
    return {
      contentId,
      metrics: {
        views: content.views,
        likes: content.likes,
        shares: content.shares,
        comments: content.comments?.length || 0
      }
    };
  }

  /**
   * Queue a task for content processing
   * @param {string} contentId Content ID
   * @param {string} taskType Type of task (transcode, pin, etc)
   * @param {Object} options Task options
   * @private
   */
  queueContentTask(contentId, taskType, options = {}) {
    // In a production setting, this would use a task queue like Bull
    // For now, we just log and emit an event for demonstration
    console.log(`Queued ${taskType} task for content ${contentId}:`, options);
    
    this.emit('task:queued', {
      contentId,
      taskType,
      options,
      queuedAt: new Date().toISOString()
    });
    
    // Simulate async processing - in production this would be handled by a worker
    setTimeout(() => {
      this.emit('task:completed', {
        contentId,
        taskType,
        options,
        completedAt: new Date().toISOString()
      });
      
      // Update content status if needed
      if (taskType === 'pin' && options.updateStatus) {
        const content = this.getById(contentId);
        if (content && content.ipfs) {
          content.ipfs.pinned = true;
          content.ipfs.lastVerified = new Date().toISOString();
          this.content.set(contentId, content);
        }
      }
    }, 2000);
  }
  
  /**
   * Verify the availability of content on IPFS
   * @param {string} contentId Content ID
   * @returns {Promise<boolean>} Availability status
   */
  async verifyIPFSAvailability(contentId) {
    const content = this.getById(contentId);
    
    if (!content || !content.ipfs || !content.ipfs.cid) {
      return false;
    }
    
    try {
      const status = await IPFSService.getContentStatus(content.ipfs.cid);
      
      // Update content with status info
      content.ipfs.available = status.available;
      content.ipfs.pinned = status.pinned;
      content.ipfs.lastVerified = new Date().toISOString();
      
      this.content.set(contentId, content);
      
      return status.available;
    } catch (error) {
      console.error(`Error verifying content ${contentId}:`, error);
      return false;
    }
  }
}

// Export constants with the module
module.exports = new ContentModel();
module.exports.CONTENT_TYPES = CONTENT_TYPES;
module.exports.CONTENT_STATUSES = CONTENT_STATUSES;
module.exports.ACCESS_TYPES = ACCESS_TYPES;
module.exports.QUALITY_LEVELS = QUALITY_LEVELS;
