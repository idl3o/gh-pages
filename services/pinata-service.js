/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Pinata Service
 * 
 * Integration with the Pinata IPFS pinning service
 * to ensure content persistence and availability
 */

const axios = require('axios');
const FormData = require('form-data');
const CacheService = require('./cache-service');
const fs = require('fs');

// Pinata API configuration
const PINATA_CONFIG = {
  apiUrl: 'https://api.pinata.cloud',
  endpoints: {
    pinFile: '/pinning/pinFileToIPFS',
    pinByHash: '/pinning/pinByHash',
    unpin: '/pinning/unpin',
    pinList: '/pinning/pinList',
    pinJobs: '/pinning/pinJobs'
  },
  headers: {
    pinata_api_key: process.env.PINATA_API_KEY,
    pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
  }
};

class PinataService {
  /**
   * Check if Pinata API credentials are configured
   * @returns {boolean} True if credentials are available
   */
  static isConfigured() {
    return PINATA_CONFIG.headers.pinata_api_key && 
           PINATA_CONFIG.headers.pinata_secret_api_key;
  }

  /**
   * Get authorization headers for API requests
   * @returns {Object} Headers object
   */
  static getHeaders() {
    if (!this.isConfigured()) {
      throw new Error('Pinata API credentials not configured');
    }
    
    return PINATA_CONFIG.headers;
  }
  
  /**
   * Upload and pin a file to IPFS through Pinata
   * @param {Buffer|fs.ReadStream} file File content or stream
   * @param {Object} options Pin options
   * @returns {Promise<Object>} Pin result with IPFS hash
   */
  static async pinFile(file, options = {}) {
    try {
      const formData = new FormData();
      
      // Add file to form data
      if (Buffer.isBuffer(file)) {
        formData.append('file', file, {
          filename: options.filename || 'file',
          contentType: options.contentType
        });
      } else if (typeof file === 'string') {
        // Assume it's a file path
        formData.append('file', fs.createReadStream(file));
      } else {
        // Assume it's a ReadStream
        formData.append('file', file);
      }
      
      // Add metadata if provided
      if (options.metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: options.metadata.name || options.filename || 'Web3 Streaming Content',
          keyvalues: options.metadata.keyvalues || {}
        }));
      }
      
      // Add pinning options if provided
      if (options.pinataOptions) {
        formData.append('pinataOptions', JSON.stringify(options.pinataOptions));
      }
      
      // Make API request to Pinata
      const response = await axios({
        method: 'post',
        url: `${PINATA_CONFIG.apiUrl}${PINATA_CONFIG.endpoints.pinFile}`,
        data: formData,
        maxBodyLength: 'Infinity', // For large files
        headers: {
          ...this.getHeaders(),
          ...formData.getHeaders()
        }
      });
      
      // Return pin result
      return {
        cid: response.data.IpfsHash,
        size: response.data.PinSize,
        timestamp: response.data.Timestamp,
        isDuplicate: response.data.isDuplicate || false
      };
    } catch (error) {
      console.error('Pinata pin file error:', error.response?.data || error.message);
      throw new Error(`Failed to pin file: ${error.response?.data?.error || error.message}`);
    }
  }
  
  /**
   * Pin content by IPFS hash
   * @param {string} cid IPFS content hash to pin
   * @param {Object} options Pin options
   * @returns {Promise<Object>} Pin result
   */
  static async pinByHash(cid, options = {}) {
    try {
      const response = await axios({
        method: 'post',
        url: `${PINATA_CONFIG.apiUrl}${PINATA_CONFIG.endpoints.pinByHash}`,
        headers: this.getHeaders(),
        data: {
          hashToPin: cid,
          pinataMetadata: {
            name: options.name || `Pinned Content ${cid}`,
            keyvalues: options.keyvalues || {}
          }
        }
      });
      
      return {
        success: true,
        cid: cid,
        status: response.data
      };
    } catch (error) {
      console.error('Pinata pin by hash error:', error.response?.data || error.message);
      
      // Special handling for already pinned content
      if (error.response?.data?.error?.includes('already pinned')) {
        return {
          success: true,
          cid: cid,
          alreadyPinned: true
        };
      }
      
      throw new Error(`Failed to pin hash: ${error.response?.data?.error || error.message}`);
    }
  }
  
  /**
   * Unpin content by IPFS hash
   * @param {string} cid IPFS content hash to unpin
   * @returns {Promise<Object>} Result of unpin operation
   */
  static async unpin(cid) {
    try {
      const response = await axios({
        method: 'delete',
        url: `${PINATA_CONFIG.apiUrl}${PINATA_CONFIG.endpoints.unpin}/${cid}`,
        headers: this.getHeaders()
      });
      
      return {
        success: true,
        cid: cid
      };
    } catch (error) {
      console.error('Pinata unpin error:', error.response?.data || error.message);
      
      // If content is not pinned, consider it a success
      if (error.response?.data?.error?.includes('not pinned')) {
        return {
          success: true,
          cid: cid,
          notPinned: true
        };
      }
      
      throw new Error(`Failed to unpin hash: ${error.response?.data?.error || error.message}`);
    }
  }
  
  /**
   * Get list of pinned content
   * @param {Object} filters Filter options
   * @returns {Promise<Object>} List of pins
   */
  static async listPins(filters = {}) {
    try {
      // Check cache if no specific filters
      const shouldCache = Object.keys(filters).length === 0;
      const cacheKey = 'pinata_pins_list';
      
      if (shouldCache) {
        const cachedList = CacheService.get(cacheKey);
        if (cachedList) return cachedList;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.hashContains) params.append('hashContains', filters.hashContains);
      if (filters.pinStartDate) params.append('pinStart', filters.pinStartDate);
      if (filters.pinEndDate) params.append('pinEnd', filters.pinEndDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.pageLimit) params.append('pageLimit', filters.pageLimit);
      if (filters.pageOffset) params.append('pageOffset', filters.pageOffset);
      
      // Make API request
      const response = await axios({
        method: 'get',
        url: `${PINATA_CONFIG.apiUrl}${PINATA_CONFIG.endpoints.pinList}?${params}`,
        headers: this.getHeaders()
      });
      
      const result = {
        count: response.data.count,
        pins: response.data.rows,
      };
      
      // Cache result if no filters
      if (shouldCache) {
        CacheService.set(cacheKey, result, 300); // 5 minutes cache
      }
      
      return result;
    } catch (error) {
      console.error('Pinata list pins error:', error.response?.data || error.message);
      throw new Error(`Failed to list pins: ${error.response?.data?.error || error.message}`);
    }
  }
  
  /**
   * Check if a specific CID is pinned
   * @param {string} cid IPFS CID to check
   * @returns {Promise<boolean>} True if pinned
   */
  static async isPinned(cid) {
    try {
      const result = await this.listPins({ hashContains: cid, pageLimit: 1 });
      return result.count > 0 && result.pins.some(pin => pin.ipfs_pin_hash === cid);
    } catch (error) {
      console.error('Error checking pinned status:', error);
      return false;
    }
  }
  
  /**
   * Get the status of a specific pinned CID
   * @param {string} cid IPFS CID to check
   * @returns {Promise<Object|null>} Pin status or null if not found
   */
  static async getPinStatus(cid) {
    try {
      const result = await this.listPins({ hashContains: cid, pageLimit: 10 });
      const pin = result.pins.find(p => p.ipfs_pin_hash === cid);
      
      return pin || null;
    } catch (error) {
      console.error(`Error getting pin status for ${cid}:`, error);
      return null;
    }
  }
}

module.exports = PinataService;