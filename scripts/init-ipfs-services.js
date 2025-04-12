/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * IPFS Services Initialization
 * 
 * Initializes and configures IPFS-related services including:
 * - IPFS connectivity
 * - Content verification worker
 * - Backup service
 */

const IPFSService = require('../services/ipfs-service');
const PinataService = require('../services/pinata-service');
const ContentVerificationWorker = require('../services/content-verification-worker');
const ContentBackupService = require('../services/content-backup-service');
const ContentModel = require('../models/content-model');
const path = require('path');

// Configuration options
const CONFIG = {
  // Verification worker config
  verificationWorker: {
    checkInterval: process.env.VERIFICATION_CHECK_INTERVAL || 3600000, // 1 hour
    batchSize: process.env.VERIFICATION_BATCH_SIZE || 50,
    concurrentChecks: process.env.VERIFICATION_CONCURRENT_CHECKS || 5,
    priorityCheckInterval: process.env.VERIFICATION_PRIORITY_INTERVAL || 3600000, // 1 hour
    recoveryAttempts: process.env.VERIFICATION_RECOVERY_ATTEMPTS || 3
  },
  
  // Backup service config
  backupService: {
    backupDir: process.env.BACKUP_DIR || path.join(process.cwd(), 'content-backups'),
    backupEnabled: process.env.BACKUP_ENABLED !== 'false',
    metadataBackupEnabled: process.env.METADATA_BACKUP_ENABLED !== 'false',
    compressionEnabled: process.env.BACKUP_COMPRESSION_ENABLED !== 'false',
    encryptionEnabled: process.env.BACKUP_ENCRYPTION_ENABLED === 'true',
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY
  },
  
  // IPFS gateways for verification
  ipfsGateways: [
    'ipfs.io', 
    'dweb.link', 
    'cloudflare-ipfs.com'
  ]
};

// If Pinata is configured, add its gateway
if (PinataService.isConfigured()) {
  CONFIG.ipfsGateways.push('gateway.pinata.cloud');
}

/**
 * Initialize all IPFS services
 */
async function initializeIPFSServices() {
  console.log('Initializing IPFS services...');
  
  // Test IPFS connectivity
  try {
    const client = await IPFSService.getClient();
    const ipfsId = await client.id();
    console.log(`Connected to IPFS node: ${ipfsId.id}`);
    console.log(`IPFS version: ${ipfsId.agentVersion}`);
  } catch (error) {
    console.error('Failed to connect to IPFS:', error.message);
    console.log('Continuing with limited IPFS functionality.');
  }
  
  // Check Pinata configuration
  if (PinataService.isConfigured()) {
    console.log('Pinata service is configured');
    try {
      // Test Pinata connection
      const pinList = await PinataService.listPins({ pageLimit: 1 });
      console.log(`Pinata service connected. Total pins: ${pinList.count}`);
    } catch (error) {
      console.error('Failed to connect to Pinata:', error.message);
    }
  } else {
    console.log('Pinata service is not configured. IPFS pinning will use local nodes only.');
  }
  
  // Setup content verification worker with event listeners
  setupVerificationWorker();
  
  // Setup backup service with event listeners
  setupBackupService();
  
  console.log('IPFS services initialization complete');
}

/**
 * Configure and start the content verification worker
 */
function setupVerificationWorker() {
  // Set configuration
  ContentVerificationWorker.config = {
    ...ContentVerificationWorker.config,
    ...CONFIG.verificationWorker,
    gateways: CONFIG.ipfsGateways
  };
  
  // Setup event listeners
  ContentVerificationWorker.on('worker:started', () => {
    console.log('Content verification worker started');
  });
  
  ContentVerificationWorker.on('content:unavailable', (data) => {
    console.warn(`Content unavailable: ${data.contentId} (${data.cid})`);
    
    // Create backup if not already exists
    if (!ContentBackupService.hasBackup(data.contentId)) {
      console.log(`Queueing backup for unavailable content: ${data.contentId}`);
      ContentBackupService.createBackup(data.contentId)
        .catch(error => console.error(`Backup creation failed: ${error.message}`));
    }
  });
  
  ContentVerificationWorker.on('content:recovered', (data) => {
    console.log(`Content recovered: ${data.contentId} (${data.cid}) after ${data.attempts} attempts`);
  });
  
  ContentVerificationWorker.on('content:unrecoverable', (data) => {
    console.error(`Content unrecoverable: ${data.contentId} (${data.cid}) after ${data.attempts} attempts`);
    
    // Add logic for handling unrecoverable content (e.g. notifications)
    handleUnrecoverableContent(data.contentId, data.cid);
  });
  
  // Start the worker
  ContentVerificationWorker.start();
}

/**
 * Configure the backup service
 */
function setupBackupService() {
  // Add event listeners
  ContentBackupService.on('backup:created', (data) => {
    console.log(`Backup created: ${data.contentId} (${data.cid}), size: ${data.size} bytes`);
  });
}

/**
 * Handle unrecoverable content
 * @param {string} contentId Content ID
 * @param {string} cid IPFS CID
 */
async function handleUnrecoverableContent(contentId, cid) {
  // Check for backup
  if (ContentBackupService.hasBackup(contentId)) {
    console.log(`Unrecoverable content ${contentId} has backup available`);
    
    try {
      // Get content
      const content = ContentModel.getById(contentId);
      
      // Update content status
      if (content) {
        await ContentModel.createOrUpdate({
          id: contentId,
          status: ContentModel.CONTENT_STATUSES.PROCESSING, // Mark as processing for recovery
          statusMessage: 'Content unavailable on IPFS, recovery from backup required'
        }, content.creatorAddress);
        
        console.log(`Content ${contentId} marked for recovery from backup`);
      }
    } catch (error) {
      console.error(`Error handling unrecoverable content ${contentId}:`, error);
    }
  } else {
    console.error(`Unrecoverable content ${contentId} has no backup!`);
    
    try {
      // Get content
      const content = ContentModel.getById(contentId);
      
      // Update content status
      if (content) {
        await ContentModel.createOrUpdate({
          id: contentId,
          status: ContentModel.CONTENT_STATUSES.REMOVED, // Mark as removed since it's lost
          statusMessage: 'Content permanently unavailable and unrecoverable'
        }, content.creatorAddress);
        
        console.log(`Content ${contentId} marked as removed due to data loss`);
      }
    } catch (error) {
      console.error(`Error handling unrecoverable content without backup ${contentId}:`, error);
    }
  }
}

/**
 * Create initial backups for priority content
 */
async function createInitialBackups() {
  console.log('Creating initial backups for priority content...');
  
  try {
    // Get high-view content
    const highViewContent = ContentModel.search({
      status: ContentModel.CONTENT_STATUSES.PUBLISHED,
      sortBy: 'views',
      sortOrder: 'desc',
      limit: 20
    });
    
    if (highViewContent.length > 0) {
      console.log(`Creating backups for ${highViewContent.length} high-view content items`);
      
      // Process each content item
      for (const content of highViewContent) {
        if (!ContentBackupService.hasBackup(content.id) && content.ipfs?.cid) {
          try {
            await ContentBackupService.createBackup(content.id);
            console.log(`Created backup for high-view content ${content.id}`);
          } catch (error) {
            console.error(`Failed to create backup for ${content.id}:`, error);
          }
        }
      }
    }
    
    console.log('Initial backup process completed');
  } catch (error) {
    console.error('Error creating initial backups:', error);
  }
}

// If this script is run directly, initialize services
if (require.main === module) {
  initializeIPFSServices()
    .then(() => createInitialBackups())
    .catch(error => {
      console.error('Initialization error:', error);
      process.exit(1);
    });
}

module.exports = {
  initializeIPFSServices,
  setupVerificationWorker,
  setupBackupService,
  createInitialBackups
};