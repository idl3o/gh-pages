/**
 * Digital Asset Cache System
 *
 * Provides caching functionality for generated digital assets
 */

const fs = require('fs').promises;
const path = require('path');

class AssetCache {
  /**
   * Create a new asset cache
   * @param {Object} options Cache options
   * @param {string} options.cachePath Path to store cache files
   * @param {number} options.ttl Time to live in seconds (0 for indefinite)
   * @param {boolean} options.persistAcrossVersions Whether to persist cache across version changes
   */
  constructor(options) {
    this.cachePath = options.cachePath;
    this.ttl = options.ttl || 0; // 0 = indefinite
    this.persistAcrossVersions = options.persistAcrossVersions || false;
    this.indexFile = path.join(this.cachePath, 'cache-index.json');
    this.index = null;

    // Initialize the cache directory
    this._initCache();
  }

  /**
   * Get an asset from cache
   * @param {string} assetId Asset ID to retrieve
   * @returns {Promise<Object|null>} Asset data or null if not in cache
   */
  async get(assetId) {
    await this._loadIndex();

    // Check if asset exists in index
    if (!this.index.assets[assetId]) {
      return null;
    }

    const asset = this.index.assets[assetId];

    // Check if asset is expired
    if (this.ttl > 0) {
      const now = Date.now();
      const expiryTime = asset.timestamp + (this.ttl * 1000);

      if (now > expiryTime) {
        // Asset is expired, remove from cache
        delete this.index.assets[assetId];
        await this._saveIndex();
        return null;
      }
    }

    // Check if asset file exists
    try {
      await fs.access(asset.path);
      return asset;
    } catch (err) {
      // File doesn't exist, remove from index
      delete this.index.assets[assetId];
      await this._saveIndex();
      return null;
    }
  }

  /**
   * Put an asset into cache
   * @param {string} assetId Asset ID
   * @param {Object} asset Asset data
   * @returns {Promise<void>}
   */
  async put(assetId, asset) {
    await this._loadIndex();

    // Add to index with timestamp
    this.index.assets[assetId] = {
      ...asset,
      timestamp: Date.now()
    };

    await this._saveIndex();
    return true;
  }

  /**
   * Clear expired items from cache
   * @returns {Promise<number>} Number of items cleared
   */
  async clearExpired() {
    if (this.ttl === 0) return 0; // No expiration

    await this._loadIndex();
    const now = Date.now();
    const expiry = now - (this.ttl * 1000);
    let count = 0;

    for (const [assetId, asset] of Object.entries(this.index.assets)) {
      if (asset.timestamp < expiry) {
        try {
          // Try to delete the file
          await fs.unlink(asset.path);
        } catch (err) {
          // File may not exist, ignore
        }

        // Remove from index
        delete this.index.assets[assetId];
        count++;
      }
    }

    // Save updated index if items were removed
    if (count > 0) {
      await this._saveIndex();
    }

    return count;
  }

  /**
   * Initialize the cache directory
   * @private
   */
  async _initCache() {
    try {
      await fs.mkdir(this.cachePath, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw new Error(`Failed to create cache directory: ${err.message}`);
      }
    }
  }

  /**
   * Load the cache index
   * @private
   */
  async _loadIndex() {
    if (this.index !== null) {
      return;
    }

    try {
      const data = await fs.readFile(this.indexFile, 'utf8');
      this.index = JSON.parse(data);

      // Handle version change if not persisting across versions
      if (!this.persistAcrossVersions && this.index.version !== process.env.npm_package_version) {
        console.log(`Cache version mismatch: ${this.index.version} vs ${process.env.npm_package_version}`);
        // Clear the cache
        this.index = {
          version: process.env.npm_package_version,
          assets: {}
        };
        await this._saveIndex();
      }
    } catch (err) {
      // If file doesn't exist or is invalid, create new index
      this.index = {
        version: process.env.npm_package_version || '1.0.0',
        assets: {}
      };
      await this._saveIndex();
    }
  }

  /**
   * Save the cache index
   * @private
   */
  async _saveIndex() {
    await fs.writeFile(this.indexFile, JSON.stringify(this.index, null, 2));
  }
}

module.exports = { AssetCache };
