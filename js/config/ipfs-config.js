/**
 * IPFS Configuration
 * Manages IPFS gateway URLs and default upload settings
 */

class IPFSConfig {
  constructor() {
    // IPFS gateway URLs for retrieving content
    this.gateways = [
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.infura.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://dweb.link/ipfs/',
      'https://ipfs.eth.aragon.network/ipfs/'
    ];

    // API endpoints for IPFS nodes
    this.apiEndpoints = {
      infura: 'https://ipfs.infura.io:5001',
      pinata: 'https://api.pinata.cloud',
      local: 'http://localhost:5001',
      streamchain: 'https://ipfs.streamchain.io'
    };

    // Default IPFS upload settings
    this.uploadDefaults = {
      pinning: true,
      chunkSize: 262144, // 256KB chunks for uploads
      timeout: 300000, // 5 minutes timeout
      retryCount: 3,
      retryDelay: 1000,
      wrapWithDirectory: false
    };

    // Quality configurations for different content types
    this.qualityOptions = {
      video: {
        high: {
          resolution: '1080p',
          bitrate: '5Mbps',
          codec: 'h264',
          container: 'mp4'
        },
        medium: {
          resolution: '720p',
          bitrate: '2.5Mbps',
          codec: 'h264',
          container: 'mp4'
        },
        low: {
          resolution: '480p',
          bitrate: '1Mbps',
          codec: 'h264',
          container: 'mp4'
        }
      },
      audio: {
        high: {
          bitrate: '320kbps',
          codec: 'mp3'
        },
        medium: {
          bitrate: '192kbps',
          codec: 'mp3'
        },
        low: {
          bitrate: '128kbps',
          codec: 'mp3'
        }
      },
      image: {
        high: {
          resolution: '2048px',
          quality: 90,
          format: 'webp'
        },
        medium: {
          resolution: '1024px',
          quality: 85,
          format: 'webp'
        },
        low: {
          resolution: '512px',
          quality: 75,
          format: 'webp'
        }
      }
    };
  }

  /**
   * Get the best available IPFS gateway
   * @param {boolean} random Whether to return a random gateway or the first one
   * @returns {string} The gateway URL
   */
  getBestGateway(random = false) {
    if (random) {
      const index = Math.floor(Math.random() * this.gateways.length);
      return this.gateways[index];
    }
    return this.gateways[0];
  }

  /**
   * Get quality configuration for a specific quality level
   * @param {string} quality The quality level (high, medium, low)
   * @param {string} contentType The content type (video, audio, image)
   * @returns {Object} The quality configuration
   */
  getQualityConfig(quality = 'high', contentType = 'video') {
    return this.qualityOptions[contentType]?.[quality] || this.qualityOptions[contentType]?.medium;
  }

  /**
   * Get API URL for a specific provider
   * @param {string} provider The provider name
   * @returns {string} The API URL
   */
  getApiUrl(provider = 'infura') {
    return this.apiEndpoints[provider] || this.apiEndpoints.infura;
  }

  /**
   * Get authentication for a specific provider
   * @param {string} provider The provider name
   * @returns {string} The authentication token
   */
  getAuthForProvider(provider = 'infura') {
    // In a real app, these would be stored securely or obtained from user
    const auth = {
      infura:
        'Basic ' + btoa(process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_PROJECT_SECRET),
      pinata: 'Bearer ' + process.env.PINATA_JWT
    };

    return auth[provider] || '';
  }

  /**
   * Test gateway connectivity and sort by speed
   * @returns {Promise<Array>} The sorted gateways
   */
  async testGatewaySpeed() {
    const testResults = [];

    for (const gateway of this.gateways) {
      try {
        const start = Date.now();
        const response = await fetch(`${gateway}QmTkzDwWqPbnAh5YiV5VwcTLnGdwSNsNTn2aDxdXBFca7D`);
        const time = Date.now() - start;

        if (response.ok) {
          testResults.push({ gateway, time });
        }
      } catch (error) {
        console.warn(`Gateway ${gateway} failed:`, error);
        // Skip failed gateways
      }
    }

    // Sort by response time (fastest first)
    testResults.sort((a, b) => a.time - b.time);

    // Update gateways array with sorted gateways
    this.gateways = testResults.map(result => result.gateway);

    return this.gateways;
  }
}

// Export singleton instance
const ipfsConfig = new IPFSConfig();
export default ipfsConfig;
