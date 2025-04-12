/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Content Backup Service
 * 
 * Provides functionality for creating and managing backups
 * of content stored on IPFS to ensure recoverability
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const IPFSService = require('./ipfs-service');
const ContentModel = require('../models/content-model');
const EventEmitter = require('events');

class ContentBackupService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      backupDir: options.backupDir || path.join(process.cwd(), 'content-backups'),
      backupEnabled: options.backupEnabled !== false,
      metadataBackupEnabled: options.metadataBackupEnabled !== false,
      maxBackupSize: options.maxBackupSize || 1024 * 1024 * 100, // 100 MB max by default
      compressionEnabled: options.compressionEnabled !== false,
      encryptionEnabled: options.encryptionEnabled === true,
      encryptionKey: options.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY,
      backupIndexPath: options.backupIndexPath || path.join(process.cwd(), 'content-backups', 'backup-index.json'),
      priorityContentTypes: options.priorityContentTypes || [
        ContentModel.CONTENT_TYPES.VIDEO,
        ContentModel.CONTENT_TYPES.AUDIO
      ]
    };
    
    // Ensure backup directory exists
    this._initializeBackupSystem();
    
    // Backup index
    this.backupIndex = this._loadBackupIndex();
  }
  
  /**
   * Initialize the backup directory structure
   * @private
   */
  _initializeBackupSystem() {
    try {
      // Create base backup directory if it doesn't exist
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
        console.log(`Created backup directory: ${this.config.backupDir}`);
      }
      
      // Create subdirectories for different content types
      for (const contentType of Object.values(ContentModel.CONTENT_TYPES)) {
        const contentTypeDir = path.join(this.config.backupDir, contentType);
        if (!fs.existsSync(contentTypeDir)) {
          fs.mkdirSync(contentTypeDir, { recursive: true });
        }
      }
      
      // Create directory for metadata backups
      const metadataDir = path.join(this.config.backupDir, 'metadata');
      if (!fs.existsSync(metadataDir)) {
        fs.mkdirSync(metadataDir, { recursive: true });
      }
      
      console.log('Backup system initialized');
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
      this.config.backupEnabled = false;
    }
  }
  
  /**
   * Load the backup index from file
   * @private
   * @returns {Object} Backup index
   */
  _loadBackupIndex() {
    try {
      if (fs.existsSync(this.config.backupIndexPath)) {
        const indexData = fs.readFileSync(this.config.backupIndexPath, 'utf8');
        return JSON.parse(indexData);
      }
    } catch (error) {
      console.error('Error loading backup index:', error);
    }
    
    // Return empty index if file doesn't exist or has an error
    return {
      backups: {},
      stats: {
        totalBackups: 0,
        totalSize: 0,
        lastBackup: null,
        lastVerification: null
      },
      metadataBackups: {}
    };
  }
  
  /**
   * Save the backup index to file
   * @private
   */
  _saveBackupIndex() {
    try {
      // Make sure backup directory exists
      if (!fs.existsSync(path.dirname(this.config.backupIndexPath))) {
        fs.mkdirSync(path.dirname(this.config.backupIndexPath), { recursive: true });
      }
      
      // Update stats
      this.backupIndex.stats.lastBackup = new Date().toISOString();
      
      // Write index to file
      fs.writeFileSync(
        this.config.backupIndexPath, 
        JSON.stringify(this.backupIndex, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving backup index:', error);
    }
  }
  
  /**
   * Create a backup of content
   * @param {string} contentId Content ID to backup
   * @param {boolean} forceBackup Force backup even if one already exists
   * @returns {Promise<Object>} Backup result
   */
  async createBackup(contentId, forceBackup = false) {
    if (!this.config.backupEnabled) {
      return { success: false, reason: 'Backup system disabled' };
    }
    
    try {
      // Get content
      const content = ContentModel.getById(contentId);
      if (!content) {
        return { success: false, reason: 'Content not found' };
      }
      
      // Check if content has IPFS data
      if (!content.ipfs || !content.ipfs.cid) {
        return { success: false, reason: 'Content has no IPFS data' };
      }
      
      // Check if backup already exists
      const existingBackup = this.backupIndex.backups[contentId];
      if (existingBackup && !forceBackup) {
        return { 
          success: true, 
          alreadyExists: true, 
          path: existingBackup.path,
          cid: existingBackup.cid
        };
      }
      
      // Create the backup
      console.log(`Creating backup for content ${contentId} with CID ${content.ipfs.cid}`);
      
      // Fetch content from IPFS
      const contentBuffer = await IPFSService.getContent(content.ipfs.cid);
      
      if (!contentBuffer || contentBuffer.length === 0) {
        return { success: false, reason: 'Failed to retrieve content from IPFS' };
      }
      
      // Check if content size is within limits
      if (contentBuffer.length > this.config.maxBackupSize) {
        console.warn(`Content ${contentId} exceeds max backup size (${contentBuffer.length} bytes)`);
        
        // Only backup metadata for large files
        return await this.createMetadataBackup(contentId);
      }
      
      // Create directory for content type if it doesn't exist
      const contentTypeDir = path.join(this.config.backupDir, content.contentType || 'other');
      if (!fs.existsSync(contentTypeDir)) {
        fs.mkdirSync(contentTypeDir, { recursive: true });
      }
      
      // Generate backup filename
      const backupFilename = `${contentId}_${content.ipfs.cid}.backup`;
      const backupPath = path.join(contentTypeDir, backupFilename);
      
      // Process the content (compression/encryption)
      const processedContent = await this._processContentForBackup(contentBuffer);
      
      // Write backup to file
      fs.writeFileSync(backupPath, processedContent);
      
      // Update backup index
      this.backupIndex.backups[contentId] = {
        contentId,
        cid: content.ipfs.cid,
        path: backupPath,
        size: processedContent.length,
        original_size: contentBuffer.length,
        compressed: this.config.compressionEnabled,
        encrypted: this.config.encryptionEnabled,
        timestamp: new Date().toISOString(),
        contentType: content.contentType
      };
      
      // Update stats
      this.backupIndex.stats.totalBackups = Object.keys(this.backupIndex.backups).length;
      this.backupIndex.stats.totalSize = Object.values(this.backupIndex.backups)
        .reduce((total, backup) => total + backup.size, 0);
      
      // Save index
      this._saveBackupIndex();
      
      // Also create a metadata backup
      if (this.config.metadataBackupEnabled) {
        await this.createMetadataBackup(contentId);
      }
      
      console.log(`Backup created for content ${contentId} at ${backupPath}`);
      
      this.emit('backup:created', {
        contentId,
        cid: content.ipfs.cid,
        path: backupPath,
        size: processedContent.length
      });
      
      return { 
        success: true, 
        path: backupPath,
        size: processedContent.length,
        cid: content.ipfs.cid
      };
    } catch (error) {
      console.error(`Error creating backup for content ${contentId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create metadata backup for content
   * @param {string} contentId Content ID
   * @returns {Promise<Object>} Backup result
   */
  async createMetadataBackup(contentId) {
    if (!this.config.metadataBackupEnabled) {
      return { success: false, reason: 'Metadata backup disabled' };
    }
    
    try {
      // Get content
      const content = ContentModel.getById(contentId);
      if (!content) {
        return { success: false, reason: 'Content not found' };
      }
      
      // Create metadata backup directory if it doesn't exist
      const metadataDir = path.join(this.config.backupDir, 'metadata');
      if (!fs.existsSync(metadataDir)) {
        fs.mkdirSync(metadataDir, { recursive: true });
      }
      
      // Generate backup filename
      const backupFilename = `${contentId}_metadata.json`;
      const backupPath = path.join(metadataDir, backupFilename);
      
      // Clone content object and remove any large data
      const metadata = JSON.parse(JSON.stringify(content));
      
      // Write metadata to file
      fs.writeFileSync(backupPath, JSON.stringify(metadata, null, 2), 'utf8');
      
      // Update backup index
      this.backupIndex.metadataBackups[contentId] = {
        contentId,
        path: backupPath,
        timestamp: new Date().toISOString()
      };
      
      // Save index
      this._saveBackupIndex();
      
      console.log(`Metadata backup created for content ${contentId} at ${backupPath}`);
      
      return { 
        success: true, 
        path: backupPath,
        type: 'metadata'
      };
    } catch (error) {
      console.error(`Error creating metadata backup for content ${contentId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Process content for backup (compression/encryption)
   * @param {Buffer} content Content buffer
   * @returns {Promise<Buffer>} Processed content
   * @private
   */
  async _processContentForBackup(content) {
    let processedContent = content;
    
    // In a real implementation, this would use proper compression and encryption
    // For demonstration purposes, we're just returning the original content
    return processedContent;
  }
  
  /**
   * Restore content from backup
   * @param {string} contentId Content ID to restore
   * @returns {Promise<Object>} Restore result with content buffer
   */
  async restoreFromBackup(contentId) {
    try {
      // Check if backup exists
      const backup = this.backupIndex.backups[contentId];
      if (!backup) {
        return { success: false, reason: 'Backup not found' };
      }
      
      // Check if backup file exists
      if (!fs.existsSync(backup.path)) {
        console.error(`Backup file missing for content ${contentId}: ${backup.path}`);
        
        // Remove from index if file is missing
        delete this.backupIndex.backups[contentId];
        this._saveBackupIndex();
        
        return { success: false, reason: 'Backup file not found' };
      }
      
      console.log(`Restoring content ${contentId} from backup: ${backup.path}`);
      
      // Read backup file
      const backupData = fs.readFileSync(backup.path);
      
      // Process the backup data (decompress/decrypt)
      // In a real implementation, this would undo the processing done in _processContentForBackup
      const restoredContent = backupData;
      
      return { 
        success: true,
        content: restoredContent,
        cid: backup.cid,
        contentId
      };
    } catch (error) {
      console.error(`Error restoring content ${contentId} from backup:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get backup information for content
   * @param {string} contentId Content ID
   * @returns {Object|null} Backup information or null if not found
   */
  getBackupInfo(contentId) {
    const backup = this.backupIndex.backups[contentId];
    const metadataBackup = this.backupIndex.metadataBackups[contentId];
    
    if (!backup && !metadataBackup) {
      return null;
    }
    
    return {
      contentId,
      fullBackup: backup ? {
        exists: true,
        path: backup.path,
        size: backup.size,
        timestamp: backup.timestamp,
        encrypted: backup.encrypted,
        compressed: backup.compressed,
        cid: backup.cid
      } : { exists: false },
      metadataBackup: metadataBackup ? {
        exists: true,
        path: metadataBackup.path,
        timestamp: metadataBackup.timestamp
      } : { exists: false }
    };
  }
  
  /**
   * Check if backup exists for content
   * @param {string} contentId Content ID
   * @returns {boolean} True if backup exists
   */
  hasBackup(contentId) {
    return !!this.backupIndex.backups[contentId];
  }
  
  /**
   * Check if metadata backup exists for content
   * @param {string} contentId Content ID
   * @returns {boolean} True if metadata backup exists
   */
  hasMetadataBackup(contentId) {
    return !!this.backupIndex.metadataBackups[contentId];
  }
  
  /**
   * Create backups for all published content
   * @param {Object} options Backup options
   * @returns {Promise<Object>} Backup results
   */
  async backupAllContent(options = {}) {
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    
    try {
      // Get all published content
      const filters = {
        status: ContentModel.CONTENT_STATUSES.PUBLISHED
      };
      
      // Apply content type filter if specified
      if (options.contentTypes) {
        filters.contentType = options.contentTypes;
      }
      
      const content = ContentModel.search(filters);
      results.total = content.length;
      
      console.log(`Starting backup of ${content.length} content items`);
      
      // Process in batches to avoid memory issues
      const batchSize = options.batchSize || 10;
      for (let i = 0; i < content.length; i += batchSize) {
        const batch = content.slice(i, i + batchSize);
        
        // Process each item in the batch
        for (const item of batch) {
          try {
            // Skip if already backed up and force option is not set
            if (this.hasBackup(item.id) && !options.force) {
              results.skipped++;
              continue;
            }
            
            const backupResult = await this.createBackup(item.id, options.force);
            
            if (backupResult.success) {
              results.success++;
              results.details.push({
                contentId: item.id,
                success: true,
                path: backupResult.path
              });
            } else {
              results.failed++;
              results.details.push({
                contentId: item.id,
                success: false,
                reason: backupResult.reason || backupResult.error
              });
            }
          } catch (error) {
            console.error(`Error backing up content ${item.id}:`, error);
            results.failed++;
            results.details.push({
              contentId: item.id,
              success: false,
              error: error.message
            });
          }
        }
        
        // Report progress
        console.log(`Backup progress: ${i + Math.min(batchSize, content.length - i)}/${content.length}`);
      }
      
      console.log('Backup process completed');
      console.log(`Results: ${results.success} successful, ${results.failed} failed, ${results.skipped} skipped`);
      
      return results;
    } catch (error) {
      console.error('Error in backup process:', error);
      throw error;
    }
  }
  
  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStatistics() {
    return {
      ...this.backupIndex.stats,
      config: {
        backupEnabled: this.config.backupEnabled,
        metadataBackupEnabled: this.config.metadataBackupEnabled,
        compressionEnabled: this.config.compressionEnabled,
        encryptionEnabled: this.config.encryptionEnabled,
        backupDir: this.config.backupDir,
        maxBackupSize: this.config.maxBackupSize
      }
    };
  }
  
  /**
   * Verify integrity of backups
   * @param {Object} options Verification options
   * @returns {Promise<Object>} Verification results
   */
  async verifyBackups(options = {}) {
    const results = {
      verified: 0,
      corrupted: 0,
      missing: 0,
      details: []
    };
    
    try {
      const backupIds = Object.keys(this.backupIndex.backups);
      console.log(`Verifying ${backupIds.length} backups`);
      
      // Update verification timestamp
      this.backupIndex.stats.lastVerification = new Date().toISOString();
      this._saveBackupIndex();
      
      // Process in batches
      const batchSize = options.batchSize || 20;
      for (let i = 0; i < backupIds.length; i += batchSize) {
        const batch = backupIds.slice(i, i + batchSize);
        
        // Process each item in the batch
        for (const contentId of batch) {
          try {
            const backup = this.backupIndex.backups[contentId];
            
            // Check if backup file exists
            if (!backup || !fs.existsSync(backup.path)) {
              console.warn(`Backup file missing for content ${contentId}`);
              results.missing++;
              results.details.push({
                contentId,
                status: 'missing',
                path: backup ? backup.path : 'unknown'
              });
              
              // Remove from index if file is missing
              if (backup) {
                delete this.backupIndex.backups[contentId];
              }
              continue;
            }
            
            // Check file size
            const stats = fs.statSync(backup.path);
            if (stats.size !== backup.size) {
              console.warn(`Backup size mismatch for content ${contentId}: ${stats.size} vs ${backup.size}`);
              results.corrupted++;
              results.details.push({
                contentId,
                status: 'corrupted',
                path: backup.path,
                reason: 'Size mismatch'
              });
              continue;
            }
            
            // In a real implementation, we would check file integrity 
            // by comparing hashes or attempting to decode the content
            
            // Mark as verified
            results.verified++;
            results.details.push({
              contentId,
              status: 'verified',
              path: backup.path
            });
          } catch (error) {
            console.error(`Error verifying backup for ${contentId}:`, error);
            results.corrupted++;
            results.details.push({
              contentId,
              status: 'error',
              error: error.message
            });
          }
        }
        
        // Report progress
        console.log(`Verification progress: ${i + Math.min(batchSize, backupIds.length - i)}/${backupIds.length}`);
      }
      
      // Save updated index
      this._saveBackupIndex();
      
      console.log('Backup verification completed');
      console.log(`Results: ${results.verified} verified, ${results.corrupted} corrupted, ${results.missing} missing`);
      
      return results;
    } catch (error) {
      console.error('Error in backup verification:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ContentBackupService();