/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * IPFS Service
 * 
 * Provides functionality for interacting with IPFS network
 * including content upload, retrieval, and pinning management
 */

const { create } = require('ipfs-http-client');
const CacheService = require('./cache-service');
const PinataService = require('./pinata-service');
const crypto = require('crypto');

// IPFS configuration with multiple fallbacks for reliability
const IPFS_NODES = [
  { url: 'https://ipfs.infura.io:5001/api/v0', projectId: process.env.INFURA_PROJECT_ID, projectSecret: process.env.INFURA_PROJECT_SECRET },
  { url: 'https://dweb.link/api/v0' }, // Public gateway as fallback
];

// Default options
const DEFAULT_OPTIONS = {
  pin: true,          // Whether to pin content by default
  wrapWithDirectory: true, // Whether to wrap content in a directory
  timeout: 60000,     // Timeout in ms
};

class IPFSService {
  /**
   * Initialize IPFS client with the first available node
   * @returns {Promise<Object>} IPFS client
   */
  static async getClient() {
    // Check cache first
    const cachedClient = CacheService.get('ipfs-client');
    if (cachedClient) {
      return cachedClient;
    }

    // Try each node until one works
    for (const node of IPFS_NODES) {
      try {
        let client;
        
        if (node.projectId && node.projectSecret) {
          // Connect with authentication
          client = create({
            url: node.url,
            headers: {
              authorization: 'Basic ' + Buffer.from(
                node.projectId + ':' + node.projectSecret
              ).toString('base64')
            }
          });
        } else {
          // Connect without authentication
          client = create({ url: node.url });
        }
        
        // Test the connection
        await client.id();
        
        // Cache the working client
        CacheService.set('ipfs-client', client, 3600); // 1 hour TTL
        return client;
      } catch (error) {
        console.error(`IPFS node ${node.url} failed:`, error.message);
        // Continue to next node
      }
    }
    
    throw new Error('Failed to connect to any IPFS node');
  }

  /**
   * Upload content to IPFS
   * @param {Buffer|string} content Content to upload
   * @param {Object} options Upload options
   * @returns {Promise<Object>} IPFS content info 
   */
  static async uploadContent(content, options = {}) {
    const client = await this.getClient();
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Convert string to Buffer if needed
      const buffer = typeof content === 'string' 
        ? Buffer.from(content) 
        : content;
      
      // Calculate content hash before upload for verification
      const contentSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      
      let result;
      let pinnedWithPinata = false;
      
      // Try using Pinata first if available for better reliability
      if (PinataService.isConfigured() && mergedOptions.pin) {
        try {
          const pinataResult = await PinataService.pinFile(buffer, {
            filename: mergedOptions.filename || 'content',
            contentType: mergedOptions.contentType,
            metadata: {
              name: mergedOptions.name || 'Web3 Streaming Content',
              keyvalues: {
                contentType: mergedOptions.contentType || 'application/octet-stream',
                contentSha256: contentSha256,
                timestamp: Date.now().toString()
              }
            }
          });
          
          result = {
            cid: pinataResult.cid,
            path: pinataResult.cid,
            size: pinataResult.size,
            isDuplicate: pinataResult.isDuplicate
          };
          
          pinnedWithPinata = true;
          console.log(`Content uploaded and pinned with Pinata: ${result.cid}`);
        } catch (pinataError) {
          console.error('Pinata upload failed, falling back to direct IPFS:', pinataError);
          // Continue to regular IPFS upload as fallback
        }
      }
      
      // If Pinata upload failed or wasn't attempted, use direct IPFS
      if (!result) {
        // Upload to IPFS
        result = await client.add(buffer, mergedOptions);
      }
      
      // Format result
      const ipfsResult = {
        cid: result.cid.toString(),
        size: result.size,
        contentType: mergedOptions.contentType || 'application/octet-stream',
        contentSha256,
        path: result.path,
        timestamp: Date.now(),
        pinnedWithPinata,
        gateway: {
          publicGateway: `https://ipfs.io/ipfs/${result.cid}`,
          infuraGateway: `https://ipfs.infura.io/ipfs/${result.cid}`,
          cloudflareGateway: `https://cloudflare-ipfs.com/ipfs/${result.cid}`,
        }
      };
      
      // Pin content if requested and not already pinned with Pinata
      if (mergedOptions.pin && !pinnedWithPinata) {
        await this.pinContent(ipfsResult.cid);
      }
      
      return ipfsResult;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  }
  
  /**
   * Upload a file to IPFS 
   * @param {File|Blob} file File to upload
   * @param {Object} options Upload options
   * @returns {Promise<Object>} IPFS content info
   */
  static async uploadFile(file, options = {}) {
    // Convert File/Blob to Buffer for Node environment
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const buffer = Buffer.from(event.target.result);
          const contentType = file.type || 'application/octet-stream';
          
          const result = await this.uploadContent(buffer, {
            ...options,
            contentType,
            filename: file.name
          });
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Retrieve content from IPFS
   * @param {string} cid IPFS content identifier
   * @param {Object} options Retrieval options
   * @returns {Promise<Buffer>} Retrieved content
   */
  static async getContent(cid, options = {}) {
    const client = await this.getClient();
    
    try {
      // Check cache first if caching is enabled
      if (options.useCache !== false) {
        const cachedContent = CacheService.get(`ipfs-content-${cid}`);
        if (cachedContent) {
          return cachedContent;
        }
      }
      
      // Get the content
      const chunks = [];
      for await (const chunk of client.cat(cid, options)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks);
      
      // Cache the content
      if (options.useCache !== false) {
        // Use a shorter TTL for large content
        const ttl = content.length > 1024 * 1024 ? 300 : 3600;
        CacheService.set(`ipfs-content-${cid}`, content, ttl);
      }
      
      return content;
    } catch (error) {
      console.error(`IPFS retrieval error for CID ${cid}:`, error);
      throw error;
    }
  }
  
  /**
   * Pin content to keep it permanently available
   * @param {string} cid Content identifier to pin
   * @param {Object} options Pinning options
   * @returns {Promise<boolean>} Success indicator
   */
  static async pinContent(cid, options = {}) {
    // Try pinning with Pinata first
    if (PinataService.isConfigured()) {
      try {
        const pinataResult = await PinataService.pinByHash(cid, {
          name: options.name || `Web3 Streaming Content ${cid}`,
          keyvalues: options.keyvalues || {}
        });
        
        if (pinataResult.success) {
          console.log(`Content ${cid} pinned successfully with Pinata`);
          return true;
        }
      } catch (pinataError) {
        console.error('Pinata pinning failed, falling back to direct IPFS:', pinataError);
        // Continue to regular IPFS pinning as fallback
      }
    }
    
    // Fallback to regular IPFS pinning
    const client = await this.getClient();
    
    try {
      await client.pin.add(cid, options);
      return true;
    } catch (error) {
      console.error(`IPFS pinning error for CID ${cid}:`, error);
      
      // If using a service without pinning support, log but don't fail
      if (error.message.includes('not implemented')) {
        console.warn('IPFS node does not support pinning, skipping');
        return false;
      }
      
      throw error;
    }
  }
  
  /**
   * Unpin content to allow garbage collection
   * @param {string} cid Content identifier to unpin
   * @returns {Promise<boolean>} Success indicator
   */
  static async unpinContent(cid) {
    let unpinnedFromPinata = false;
    
    // Try unpinning from Pinata first
    if (PinataService.isConfigured()) {
      try {
        const pinataResult = await PinataService.unpin(cid);
        if (pinataResult.success) {
          unpinnedFromPinata = true;
        }
      } catch (pinataError) {
        console.error('Pinata unpinning failed:', pinataError);
        // Continue to regular IPFS unpinning as fallback
      }
    }
    
    // Also unpin from local IPFS node if available
    const client = await this.getClient();
    
    try {
      await client.pin.rm(cid);
      return true;
    } catch (error) {
      // If already unpinned from Pinata, consider it a success
      if (unpinnedFromPinata) {
        return true;
      }
      
      console.error(`IPFS unpin error for CID ${cid}:`, error);
      throw error;
    }
  }
  
  /**
   * Get the status of content on IPFS
   * @param {string} cid Content identifier
   * @returns {Promise<Object>} Status information
   */
  static async getContentStatus(cid) {
    let pinataStatus = null;
    
    // Check Pinata status first
    if (PinataService.isConfigured()) {
      try {
        const isPinned = await PinataService.isPinned(cid);
        if (isPinned) {
          const status = await PinataService.getPinStatus(cid);
          if (status) {
            pinataStatus = {
              available: true,
              pinned: true,
              size: status.size,
              pinDate: status.date_pinned,
              pinService: 'pinata'
            };
          }
        }
      } catch (pinataError) {
        console.error('Pinata status check failed:', pinataError);
        // Continue to regular IPFS check
      }
    }
    
    // If we already have status from Pinata, return it
    if (pinataStatus) {
      return {
        cid,
        ...pinataStatus
      };
    }
    
    // Fallback to checking local IPFS node
    const client = await this.getClient();
    
    try {
      // Check if content is available
      const stat = await client.files.stat(`/ipfs/${cid}`);
      
      // Check if content is pinned
      let isPinned = false;
      try {
        const pins = await client.pin.ls({ paths: [cid] });
        isPinned = pins.length > 0;
      } catch (e) {
        // Pinning might not be supported
      }
      
      return {
        cid,
        available: true,
        size: stat.size,
        type: stat.type,
        pinned: isPinned,
        blocks: stat.blocks,
        cumSize: stat.cumulativeSize
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        return {
          cid,
          available: false,
          pinned: false
        };
      }
      
      console.error(`IPFS status check error for CID ${cid}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate a gateway URL for the given CID
   * @param {string} cid Content identifier
   * @param {string} gateway Gateway to use (default: ipfs.io)
   * @param {string} filename Optional filename for better downloads
   * @returns {string} Gateway URL
   */
  static getGatewayUrl(cid, gateway = 'ipfs.io', filename = null) {
    if (!cid) return null;
    
    let url = `https://${gateway}/ipfs/${cid}`;
    
    // Add filename if provided
    if (filename) {
      url = `${url}?filename=${encodeURIComponent(filename)}`;
    }
    
    return url;
  }
  
  /**
   * Verify content across multiple IPFS gateways
   * @param {string} cid Content identifier
   * @param {Array<string>} gateways List of gateways to check
   * @returns {Promise<Object>} Verification results
   */
  static async verifyContentAcrossGateways(cid, gateways = ['ipfs.io', 'dweb.link', 'cloudflare-ipfs.com']) {
    const results = {
      cid,
      available: false,
      gatewayResults: {},
      availableCount: 0,
      totalGateways: gateways.length
    };
    
    const checkPromises = gateways.map(async (gateway) => {
      try {
        const url = `https://${gateway}/ipfs/${cid}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        const success = response.ok;
        if (success) {
          results.availableCount++;
        }
        
        results.gatewayResults[gateway] = {
          available: success,
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        results.gatewayResults[gateway] = {
          available: false,
          error: error.name === 'AbortError' ? 'Timeout' : error.message
        };
      }
    });
    
    await Promise.allSettled(checkPromises);
    
    // Content is considered available if at least one gateway has it
    results.available = results.availableCount > 0;
    
    return results;
  }
}

module.exports = IPFSService;