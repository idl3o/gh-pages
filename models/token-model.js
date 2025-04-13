/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Token Model
 * Mock implementation for local development
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class TokenModel extends EventEmitter {
  constructor() {
    super();
    this.tokens = new Map();
    console.log('TokenModel initialized');
    this.persistenceEnabled = false;
    this.persistencePath = path.join(__dirname, '../data/tokens.json');
    this.lastPersistenceTime = null;
    this.tokenStats = {
      totalCreated: 0,
      totalAmount: 0,
      byReason: new Map()
    };
    
    // Free content collection
    this.freeContent = new Map();
    this.freeContentPath = path.join(__dirname, '../data/free-content.json');
    this.freeContentStats = {
      totalItems: 0,
      totalViews: 0,
      byCategory: new Map()
    };
    
    // Load saved tokens if available
    this.initializeDataStorage();
  }

  /**
   * Initialize data storage and load existing data if available
   * @private
   */
  async initializeDataStorage() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, '../data');
      await fs.mkdir(dataDir, { recursive: true });
      this.persistenceEnabled = true;
      
      // Try to load existing data
      await this.loadTokensFromDisk();
      await this.loadFreeContentFromDisk();
      console.log('TokenModel data storage initialized');
    } catch (error) {
      console.warn('Failed to initialize token persistence:', error.message);
    }
  }
  
  /**
   * Load tokens from disk if available
   * @private
   */
  async loadTokensFromDisk() {
    try {
      const data = await fs.readFile(this.persistencePath, 'utf8');
      const parsedData = JSON.parse(data);
      
      if (Array.isArray(parsedData.tokens)) {
        parsedData.tokens.forEach(token => {
          this.tokens.set(token.id, token);
        });
        
        // Also restore stats if available
        if (parsedData.stats) {
          this.tokenStats.totalCreated = parsedData.stats.totalCreated || 0;
          this.tokenStats.totalAmount = parsedData.stats.totalAmount || 0;
          
          if (parsedData.stats.byReason) {
            Object.entries(parsedData.stats.byReason).forEach(([reason, value]) => {
              this.tokenStats.byReason.set(reason, value);
            });
          }
        }
        
        console.log(`Loaded ${this.tokens.size} tokens from disk`);
      }
      
      this.lastPersistenceTime = new Date();
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No existing token data found, starting fresh');
      } else {
        console.error('Error loading tokens from disk:', error);
      }
    }
  }
  
  /**
   * Load free content from disk
   * @private
   */
  async loadFreeContentFromDisk() {
    try {
      const data = await fs.readFile(this.freeContentPath, 'utf8');
      const parsedData = JSON.parse(data);
      
      if (Array.isArray(parsedData.items)) {
        parsedData.items.forEach(item => {
          this.freeContent.set(item.id, item);
        });
        
        // Restore stats if available
        if (parsedData.stats) {
          this.freeContentStats.totalItems = parsedData.stats.totalItems || 0;
          this.freeContentStats.totalViews = parsedData.stats.totalViews || 0;
          
          if (parsedData.stats.byCategory) {
            Object.entries(parsedData.stats.byCategory).forEach(([category, count]) => {
              this.freeContentStats.byCategory.set(category, count);
            });
          }
        }
        
        console.log(`Loaded ${this.freeContent.size} free content items from disk`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No existing free content data found, starting fresh');
      } else {
        console.error('Error loading free content from disk:', error);
      }
    }
  }
  
  /**
   * Save tokens and free content to disk
   * @private
   */
  async persistToDisk() {
    if (!this.persistenceEnabled) return;
    
    try {
      const tokensArray = Array.from(this.tokens.values());
      
      // Convert Map to Object for JSON serialization
      const reasonStats = {};
      this.tokenStats.byReason.forEach((value, key) => {
        reasonStats[key] = value;
      });
      
      const data = {
        tokens: tokensArray,
        stats: {
          totalCreated: this.tokenStats.totalCreated,
          totalAmount: this.tokenStats.totalAmount,
          byReason: reasonStats
        },
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        this.persistencePath, 
        JSON.stringify(data, null, 2), 
        'utf8'
      );
      
      this.lastPersistenceTime = new Date();
      console.log(`Saved ${tokensArray.length} tokens to disk`);
      
      // Also save free content
      await this.persistFreeContentToDisk();
    } catch (error) {
      console.error('Error persisting tokens to disk:', error);
    }
  }
  
  /**
   * Save free content items to disk
   * @private
   */
  async persistFreeContentToDisk() {
    if (!this.persistenceEnabled) return;
    
    try {
      const contentArray = Array.from(this.freeContent.values());
      
      // Convert Map to Object for JSON serialization
      const categoryStats = {};
      this.freeContentStats.byCategory.forEach((value, key) => {
        categoryStats[key] = value;
      });
      
      const data = {
        items: contentArray,
        stats: {
          totalItems: this.freeContentStats.totalItems,
          totalViews: this.freeContentStats.totalViews,
          byCategory: categoryStats
        },
        updatedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        this.freeContentPath, 
        JSON.stringify(data, null, 2), 
        'utf8'
      );
      
      console.log(`Saved ${contentArray.length} free content items to disk`);
    } catch (error) {
      console.error('Error persisting free content to disk:', error);
    }
  }
  
  /**
   * Validate token data before creation
   * @param {Object} tokenData Token data to validate
   * @returns {Object} Validation result {valid: boolean, errors: string[]}
   */
  validateToken(tokenData) {
    const errors = [];
    
    if (!tokenData.recipientAddress) {
      errors.push('Recipient address is required');
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(tokenData.recipientAddress)) {
      errors.push('Invalid recipient address format');
    }
    
    if (tokenData.amount === undefined || tokenData.amount === null) {
      errors.push('Token amount is required');
    } else if (typeof tokenData.amount !== 'number' || tokenData.amount <= 0) {
      errors.push('Token amount must be a positive number');
    }
    
    if (!tokenData.reason) {
      errors.push('Token reason is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async createToken(tokenData) {
    // Validate token data
    const validation = this.validateToken(tokenData);
    if (!validation.valid) {
      throw new Error(`Invalid token data: ${validation.errors.join(', ')}`);
    }

    const id = `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const token = { 
      id,
      ...tokenData, 
      createdAt: new Date().toISOString(),
      status: tokenData.status || 'pending' 
    };
    
    this.tokens.set(id, token);
    
    // Update statistics
    this.tokenStats.totalCreated++;
    this.tokenStats.totalAmount += token.amount;
    
    const reasonCount = this.tokenStats.byReason.get(token.reason) || 0;
    this.tokenStats.byReason.set(token.reason, reasonCount + 1);
    
    this.emit('token:created', token);
    
    // Persist to disk every 10 tokens or if it's been more than a minute
    if (this.tokenStats.totalCreated % 10 === 0 || 
        !this.lastPersistenceTime || 
        (new Date() - this.lastPersistenceTime) > 60000) {
      this.persistToDisk();
    }
    
    return token;
  }

  async getTokenById(id) {
    return this.tokens.get(id) || null;
  }

  async getTokensByWallet(walletAddress) {
    return Array.from(this.tokens.values())
      .filter(token => token.recipientAddress === walletAddress);
  }
  
  /**
   * Get paginated tokens for a wallet address
   * @param {string} walletAddress Wallet address
   * @param {Object} options Pagination options
   * @param {number} options.page Page number (1-based)
   * @param {number} options.limit Items per page
   * @param {string} options.sortBy Property to sort by
   * @param {boolean} options.sortDesc Sort in descending order
   * @returns {Object} Paginated result
   */
  async getTokensPaginated(walletAddress, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const sortBy = options.sortBy || 'createdAt';
    const sortDesc = options.sortDesc !== false; // Default to descending
    
    // Get all tokens for this wallet
    const walletTokens = Array.from(this.tokens.values())
      .filter(token => token.recipientAddress === walletAddress);
    
    // Sort tokens
    walletTokens.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) return sortDesc ? 1 : -1;
      if (aValue > bValue) return sortDesc ? -1 : 1;
      return 0;
    });
    
    // Calculate pagination
    const totalItems = walletTokens.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      tokens: walletTokens.slice(startIndex, endIndex),
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
  
  /**
   * Create multiple tokens in a batch operation
   * @param {Array} tokenDataArray Array of token data objects
   * @returns {Array} Created tokens
   */
  async createTokensBatch(tokenDataArray) {
    if (!Array.isArray(tokenDataArray) || tokenDataArray.length === 0) {
      throw new Error('Invalid batch data: must be a non-empty array');
    }
    
    const createdTokens = [];
    const errors = [];
    
    for (const tokenData of tokenDataArray) {
      try {
        const token = await this.createToken(tokenData);
        createdTokens.push(token);
      } catch (error) {
        errors.push({
          tokenData,
          error: error.message
        });
      }
    }
    
    this.emit('tokens:batch-created', { 
      success: createdTokens, 
      failed: errors 
    });
    
    // Always persist after batch operations
    await this.persistToDisk();
    
    return {
      successCount: createdTokens.length,
      failureCount: errors.length,
      tokens: createdTokens,
      errors
    };
  }
  
  /**
   * Update token status
   * @param {string} id Token ID
   * @param {string} status New status
   * @param {Object} additionalData Additional data to update
   * @returns {Object} Updated token
   */
  async updateTokenStatus(id, status, additionalData = {}) {
    const token = this.tokens.get(id);
    
    if (!token) {
      throw new Error(`Token not found: ${id}`);
    }
    
    // Update token
    token.status = status;
    token.updatedAt = new Date().toISOString();
    
    // Add additional data
    Object.assign(token, additionalData);
    
    // Save updated token
    this.tokens.set(id, token);
    
    // Emit update event
    this.emit('token:updated', token);
    
    return token;
  }
  
  /**
   * Get token statistics
   * @param {string} walletAddress Optional wallet to filter stats for
   * @returns {Object} Token statistics
   */
  async getTokenStats(walletAddress = null) {
    // If no wallet specified, return global stats
    if (!walletAddress) {
      return {
        totalTokens: this.tokenStats.totalCreated,
        totalAmount: this.tokenStats.totalAmount,
        byReason: Object.fromEntries(this.tokenStats.byReason)
      };
    }
    
    // Calculate stats for specific wallet
    const walletTokens = Array.from(this.tokens.values())
      .filter(token => token.recipientAddress === walletAddress);
    
    const totalAmount = walletTokens.reduce((sum, token) => sum + token.amount, 0);
    
    // Group by reason
    const byReason = {};
    walletTokens.forEach(token => {
      const reason = token.reason;
      byReason[reason] = (byReason[reason] || 0) + 1;
    });
    
    // Group by status
    const byStatus = {};
    walletTokens.forEach(token => {
      const status = token.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    
    return {
      walletAddress,
      totalTokens: walletTokens.length,
      totalAmount,
      byReason,
      byStatus
    };
  }
  
  /**
   * Validate free content item before creation
   * @param {Object} contentData Free content data to validate
   * @returns {Object} Validation result {valid: boolean, errors: string[]}
   */
  validateFreeContent(contentData) {
    const errors = [];
    
    if (!contentData.title) {
      errors.push('Title is required');
    }
    
    if (!contentData.description) {
      errors.push('Description is required');
    }
    
    if (!contentData.content) {
      errors.push('Content is required');
    }
    
    if (!contentData.category) {
      errors.push('Category is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Create a new free content item
   * @param {Object} contentData Free content data
   * @returns {Object} Created content item
   */
  async createFreeContent(contentData) {
    // Validate content data
    const validation = this.validateFreeContent(contentData);
    if (!validation.valid) {
      throw new Error(`Invalid free content data: ${validation.errors.join(', ')}`);
    }
    
    const id = `free_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const contentItem = {
      id,
      ...contentData,
      createdAt: new Date().toISOString(),
      views: 0,
      featured: contentData.featured || false
    };
    
    this.freeContent.set(id, contentItem);
    
    // Update statistics
    this.freeContentStats.totalItems++;
    
    const categoryCount = this.freeContentStats.byCategory.get(contentItem.category) || 0;
    this.freeContentStats.byCategory.set(contentItem.category, categoryCount + 1);
    
    this.emit('free-content:created', contentItem);
    
    // Persist to disk
    await this.persistFreeContentToDisk();
    
    return contentItem;
  }
  
  /**
   * Get all free content items with optional filtering
   * @param {Object} options Filter options
   * @param {String} options.category Filter by category
   * @param {Boolean} options.featured Filter featured items only
   * @returns {Array} Filtered free content items
   */
  async getAllFreeContent(options = {}) {
    let items = Array.from(this.freeContent.values());
    
    // Apply filters
    if (options.category) {
      items = items.filter(item => item.category === options.category);
    }
    
    if (options.featured) {
      items = items.filter(item => item.featured === true);
    }
    
    // Default sort by newest first
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return items;
  }
  
  /**
   * Get a free content item by its ID
   * @param {string} id Content item ID
   * @param {boolean} incrementViews Whether to increment view count
   * @returns {Object} Content item or null if not found
   */
  async getFreeContentById(id, incrementViews = false) {
    const contentItem = this.freeContent.get(id);
    
    if (!contentItem) {
      return null;
    }
    
    if (incrementViews) {
      contentItem.views = (contentItem.views || 0) + 1;
      this.freeContentStats.totalViews++;
      
      // Save the updated view count
      this.freeContent.set(id, contentItem);
      
      // Don't wait for persistence to complete
      this.persistFreeContentToDisk().catch(err => {
        console.error('Error persisting view count update:', err);
      });
    }
    
    return contentItem;
  }
  
  /**
   * Update a free content item
   * @param {string} id Content item ID
   * @param {Object} updateData Data to update
   * @returns {Object} Updated content item
   */
  async updateFreeContent(id, updateData) {
    const contentItem = this.freeContent.get(id);
    
    if (!contentItem) {
      throw new Error(`Free content item not found: ${id}`);
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'content', 'featured', 'category'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        contentItem[field] = updateData[field];
      }
    });
    
    contentItem.updatedAt = new Date().toISOString();
    
    // Save updated item
    this.freeContent.set(id, contentItem);
    
    // Emit update event
    this.emit('free-content:updated', contentItem);
    
    // Persist changes
    await this.persistFreeContentToDisk();
    
    return contentItem;
  }
  
  /**
   * Delete a free content item
   * @param {string} id Content item ID
   * @returns {boolean} Success status
   */
  async deleteFreeContent(id) {
    const contentItem = this.freeContent.get(id);
    
    if (!contentItem) {
      return false;
    }
    
    // Update category stats
    if (contentItem.category) {
      const categoryCount = this.freeContentStats.byCategory.get(contentItem.category) || 0;
      if (categoryCount > 0) {
        this.freeContentStats.byCategory.set(contentItem.category, categoryCount - 1);
      }
    }
    
    // Remove from collection
    this.freeContent.delete(id);
    this.freeContentStats.totalItems--;
    
    // Emit delete event
    this.emit('free-content:deleted', { id, contentItem });
    
    // Persist changes
    await this.persistFreeContentToDisk();
    
    return true;
  }
  
  /**
   * Get free content statistics
   * @returns {Object} Free content statistics
   */
  async getFreeContentStats() {
    return {
      totalItems: this.freeContentStats.totalItems,
      totalViews: this.freeContentStats.totalViews,
      byCategory: Object.fromEntries(this.freeContentStats.byCategory),
      mostViewed: Array.from(this.freeContent.values())
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
    };
  }
  
  /**
   * Clean up resources
   */
  async cleanup() {
    // Persist tokens before shutdown
    await this.persistToDisk();
    await this.persistFreeContentToDisk();
    console.log('TokenModel cleaned up');
  }
}

module.exports = new TokenModel();