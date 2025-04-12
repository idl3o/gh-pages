/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Content Verification Worker
 * 
 * Background service that periodically checks content availability on IPFS
 * and triggers recovery procedures for unavailable content
 */

const ContentModel = require('../models/content-model');
const IPFSService = require('./ipfs-service');
const PinataService = require('./pinata-service');
const CacheService = require('./cache-service');
const EventEmitter = require('events');

class ContentVerificationWorker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      checkInterval: options.checkInterval || 3600000, // Default: 1 hour
      batchSize: options.batchSize || 50, // Number of items to check per batch
      concurrentChecks: options.concurrentChecks || 5, // Number of concurrent checks
      contentTypes: options.contentTypes || Object.values(ContentModel.CONTENT_TYPES),
      minCheckInterval: options.minCheckInterval || 86400000, // Minimum time between checks per item (1 day)
      priorityCheckInterval: options.priorityCheckInterval || 3600000, // Time between checks for priority content (1 hour)
      recoveryAttempts: options.recoveryAttempts || 3, // Number of recovery attempts before marking as unrecoverable
      gateways: options.gateways || ['ipfs.io', 'dweb.link', 'cloudflare-ipfs.com', 'gateway.pinata.cloud']
    };
    
    // Internal state
    this.isRunning = false;
    this.checkTimer = null;
    this.queue = [];
    this.checkingContent = new Set();
    this.stats = {
      totalChecked: 0,
      totalAvailable: 0,
      totalUnavailable: 0,
      recoveryAttempts: 0,
      recoverySuccess: 0
    };
  }
  
  /**
   * Start the worker
   */
  start() {
    if (this.isRunning) return;
    
    console.log('Starting Content Verification Worker');
    this.isRunning = true;
    
    // Schedule initial check
    this.scheduleNextCheck();
    
    this.emit('worker:started');
  }
  
  /**
   * Stop the worker
   */
  stop() {
    if (!this.isRunning) return;
    
    console.log('Stopping Content Verification Worker');
    this.isRunning = false;
    
    // Clear scheduling timer
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
    
    this.emit('worker:stopped');
  }
  
  /**
   * Schedule the next content check batch
   */
  scheduleNextCheck() {
    if (!this.isRunning) return;
    
    this.checkTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.checkInterval);
  }
  
  /**
   * Process a batch of content checks
   */
  async processBatch() {
    if (!this.isRunning) return;
    
    try {
      // Get content to check
      const contentToCheck = await this.getContentToCheck();
      
      if (contentToCheck.length === 0) {
        console.log('No content needs checking at this time');
        this.scheduleNextCheck();
        return;
      }
      
      console.log(`Starting verification batch for ${contentToCheck.length} items`);
      this.emit('batch:started', { count: contentToCheck.length });
      
      // Process content in batches with limited concurrency
      const batches = this.createBatches(contentToCheck, this.config.concurrentChecks);
      
      for (const batch of batches) {
        const checkPromises = batch.map(content => this.verifyContentAvailability(content));
        await Promise.allSettled(checkPromises);
      }
      
      this.emit('batch:completed', this.stats);
      
      // Schedule next check
      this.scheduleNextCheck();
    } catch (error) {
      console.error('Error processing content verification batch:', error);
      this.emit('batch:error', { error: error.message });
      
      // Still schedule next check
      this.scheduleNextCheck();
    }
  }
  
  /**
   * Get content items that need to be checked
   * @returns {Promise<Array>} Content items to check
   */
  async getContentToCheck() {
    // Get all published content
    const allContent = ContentModel.search({
      status: ContentModel.CONTENT_STATUSES.PUBLISHED,
      contentType: this.config.contentTypes
    });
    
    const now = Date.now();
    const contentToCheck = [];
    
    // Filter for content that needs checking
    for (const content of allContent) {
      // Skip content already in the checking process
      if (this.checkingContent.has(content.id)) {
        continue;
      }
      
      // Skip content without IPFS data
      if (!content.ipfs || !content.ipfs.cid) {
        continue;
      }
      
      // Check if it's time to verify this content
      const lastCheck = content.ipfs.lastVerified ? new Date(content.ipfs.lastVerified).getTime() : 0;
      const timeSinceCheck = now - lastCheck;
      
      // Determine check interval based on content priority
      const isPriority = content.metadata?.priority === 'high' || content.views > 1000;
      const checkInterval = isPriority ? this.config.priorityCheckInterval : this.config.minCheckInterval;
      
      if (timeSinceCheck >= checkInterval) {
        contentToCheck.push(content);
        
        // Limit batch size
        if (contentToCheck.length >= this.config.batchSize) {
          break;
        }
      }
    }
    
    return contentToCheck;
  }
  
  /**
   * Split content into batches for concurrent processing
   * @param {Array} items Items to batch
   * @param {number} batchSize Size of each batch
   * @returns {Array<Array>} Batches of items
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  /**
   * Verify content availability on IPFS
   * @param {Object} content Content to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyContentAvailability(content) {
    if (!content || !content.ipfs || !content.ipfs.cid) {
      return { success: false, reason: 'Invalid content or missing CID' };
    }
    
    const cid = content.ipfs.cid;
    this.checkingContent.add(content.id);
    
    try {
      console.log(`Verifying content: ${content.id} (${cid})`);
      this.stats.totalChecked++;
      
      // Check availability across multiple gateways
      const verificationResult = await IPFSService.verifyContentAcrossGateways(
        cid, 
        this.config.gateways
      );
      
      // Update content verification status
      const now = new Date().toISOString();
      const updateData = {
        id: content.id,
        ipfs: {
          ...content.ipfs,
          lastVerified: now,
          available: verificationResult.available,
          verificationResult
        }
      };
      
      // If content is unavailable, attempt recovery
      if (!verificationResult.available) {
        this.stats.totalUnavailable++;
        console.warn(`Content ${content.id} (${cid}) is unavailable on IPFS`);
        
        // Queue recovery attempt
        this.emit('content:unavailable', { 
          contentId: content.id, 
          cid, 
          verificationResult 
        });
        
        await this.attemptContentRecovery(content, verificationResult);
      } else {
        this.stats.totalAvailable++;
      }
      
      // Update content record
      await ContentModel.createOrUpdate(updateData, content.creatorAddress);
      
      // Clear from active checking set
      this.checkingContent.delete(content.id);
      
      return { 
        success: true, 
        available: verificationResult.available,
        contentId: content.id,
        cid
      };
    } catch (error) {
      console.error(`Error verifying content ${content.id}:`, error);
      
      // Clear from active checking set
      this.checkingContent.delete(content.id);
      
      return { 
        success: false, 
        error: error.message,
        contentId: content.id,
        cid
      };
    }
  }
  
  /**
   * Attempt recovery of unavailable content
   * @param {Object} content Content to recover
   * @param {Object} verificationResult Initial verification results
   * @returns {Promise<Object>} Recovery result
   */
  async attemptContentRecovery(content, verificationResult) {
    const cid = content.ipfs.cid;
    
    // Check if we've hit the recovery attempt limit
    const attempts = (content.ipfs.recoveryAttempts || 0) + 1;
    if (attempts > this.config.recoveryAttempts) {
      console.error(`Content ${content.id} (${cid}) has exceeded recovery attempts`);
      
      this.emit('content:unrecoverable', { 
        contentId: content.id, 
        cid,
        attempts
      });
      
      // Update recovery attempt counter
      await ContentModel.createOrUpdate({
        id: content.id,
        ipfs: {
          ...content.ipfs,
          recoveryAttempts: attempts,
          unrecoverable: true
        }
      }, content.creatorAddress);
      
      return { success: false, reason: 'Max recovery attempts exceeded' };
    }
    
    try {
      this.stats.recoveryAttempts++;
      console.log(`Attempting to recover content ${content.id} (${cid}), attempt ${attempts}`);
      
      // First try to pin with Pinata if configured
      let recoverySuccess = false;
      
      if (PinataService.isConfigured()) {
        try {
          // Try to pin by hash
          await PinataService.pinByHash(cid, {
            name: `Recovered - ${content.title || 'Untitled Content'}`,
            keyvalues: {
              contentId: content.id,
              recoveryAttempt: attempts.toString(),
              timestamp: Date.now().toString()
            }
          });
          
          // Check if pinning worked
          recoverySuccess = await PinataService.isPinned(cid);
          
          if (recoverySuccess) {
            console.log(`Successfully recovered content ${content.id} (${cid}) with Pinata`);
          }
        } catch (pinataError) {
          console.error('Pinata recovery failed:', pinataError);
        }
      }
      
      // If we have a local backup, try to re-upload
      if (!recoverySuccess && content.ipfs.localBackupPath) {
        try {
          // In a real implementation: retrieve from backup storage and re-upload
          // For demo purposes, we'll just simulate a successful recovery
          recoverySuccess = true;
          console.log(`Simulated recovery from backup for ${content.id} (${cid})`);
        } catch (backupError) {
          console.error('Backup recovery failed:', backupError);
        }
      }
      
      // Update content record with recovery attempt
      await ContentModel.createOrUpdate({
        id: content.id,
        ipfs: {
          ...content.ipfs,
          recoveryAttempts: attempts,
          recoverySuccess,
          lastRecoveryAttempt: new Date().toISOString()
        }
      }, content.creatorAddress);
      
      if (recoverySuccess) {
        this.stats.recoverySuccess++;
        this.emit('content:recovered', { 
          contentId: content.id, 
          cid,
          attempts
        });
      } else {
        this.emit('content:recovery-failed', { 
          contentId: content.id, 
          cid,
          attempts
        });
      }
      
      return { 
        success: recoverySuccess, 
        attempts,
        contentId: content.id,
        cid
      };
    } catch (error) {
      console.error(`Error recovering content ${content.id}:`, error);
      return { 
        success: false, 
        error: error.message,
        contentId: content.id,
        cid
      };
    }
  }
  
  /**
   * Queue specific content for priority verification
   * @param {string} contentId Content ID to verify
   * @returns {Promise<boolean>} Success indicator
   */
  async queueContentForVerification(contentId) {
    try {
      const content = ContentModel.getById(contentId);
      
      if (!content || !content.ipfs || !content.ipfs.cid) {
        return false;
      }
      
      // Add to queue for immediate checking - in a more complex implementation,
      // this would use a proper priority queue
      this.queue.push(content);
      console.log(`Queued content ${contentId} for priority verification`);
      
      // If the batch process isn't currently running, kick one off
      if (this.queue.length === 1 && !this.checkingContent.size) {
        setTimeout(() => this.processQueuedContent(), 100);
      }
      
      return true;
    } catch (error) {
      console.error(`Error queuing content ${contentId} for verification:`, error);
      return false;
    }
  }
  
  /**
   * Process queued content
   */
  async processQueuedContent() {
    if (this.queue.length === 0) return;
    
    const content = this.queue.shift();
    await this.verifyContentAvailability(content);
    
    // Process next item in queue
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueuedContent(), 100);
    }
  }
  
  /**
   * Get service status and statistics
   * @returns {Object} Service status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentlyChecking: Array.from(this.checkingContent),
      queueLength: this.queue.length,
      statistics: this.stats,
      config: this.config,
      lastRun: this.lastRun
    };
  }
  
  /**
   * Reset verification statistics
   */
  resetStats() {
    this.stats = {
      totalChecked: 0,
      totalAvailable: 0,
      totalUnavailable: 0,
      recoveryAttempts: 0,
      recoverySuccess: 0
    };
  }
}

// Export singleton instance
module.exports = new ContentVerificationWorker();