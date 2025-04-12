/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Cache Service
 * 
 * Provides caching functionality for expensive operations,
 * particularly blockchain queries and API responses
 */

// In-memory cache store (use Redis in production)
const cacheStore = new Map();

class CacheService {
  /**
   * Get an item from the cache
   * @param {string} key Cache key
   * @returns {any} Cached value or null if not found/expired
   */
  static get(key) {
    const item = cacheStore.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (item.expiry && item.expiry < Date.now()) {
      cacheStore.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Store an item in the cache
   * @param {string} key Cache key
   * @param {any} value Value to cache
   * @param {number} ttl Time to live in seconds (0 for no expiry)
   */
  static set(key, value, ttl = 300) {
    const item = {
      value,
      expiry: ttl > 0 ? Date.now() + (ttl * 1000) : null
    };
    
    cacheStore.set(key, item);
  }
  
  /**
   * Remove an item from the cache
   * @param {string} key Cache key
   */
  static delete(key) {
    cacheStore.delete(key);
  }
  
  /**
   * Clear all items from the cache or items with a specific prefix
   * @param {string} prefix Optional prefix to clear only matching items
   */
  static clear(prefix = '') {
    if (!prefix) {
      cacheStore.clear();
      return;
    }
    
    // Clear items with matching prefix
    for (const key of cacheStore.keys()) {
      if (key.startsWith(prefix)) {
        cacheStore.delete(key);
      }
    }
  }
  
  /**
   * Get or compute a cached value
   * @param {string} key Cache key
   * @param {Function} fn Function to compute value if not cached
   * @param {number} ttl Time to live in seconds
   * @returns {Promise<any>} Cached or computed value
   */
  static async getOrCompute(key, fn, ttl = 300) {
    const cachedValue = this.get(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }
  
  /**
   * Clean expired items from the cache
   * Called internally on a schedule
   */
  static _cleanExpired() {
    const now = Date.now();
    
    for (const [key, item] of cacheStore.entries()) {
      if (item.expiry && item.expiry < now) {
        cacheStore.delete(key);
      }
    }
  }
}

// Clean expired items every 5 minutes
setInterval(() => CacheService._cleanExpired(), 5 * 60 * 1000);

module.exports = CacheService;