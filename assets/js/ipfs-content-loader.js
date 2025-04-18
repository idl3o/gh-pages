/**
 * IPFS Content Loader
 *
 * Handles interaction with IPFS for storing and retrieving content
 * For production, it would use a real IPFS gateway or node
 * This implementation includes both real IPFS functionality and demo fallbacks
 */
class IPFSContentLoader {
  constructor(config = {}) {
    this.config = {
      demoVideoPath: 'assets/videos/',
      ipfsGateway: 'https://ipfs.io/ipfs/',
      useDemoMode: true, // For development without actual IPFS connection
      ...config
    };

    // Maps to store content metadata by ID
    this.contentCache = new Map();
    this.ipfsCidCache = new Map();

    // Demo content items (would come from blockchain/IPFS in production)
    this.setupDemoContent();
  }

  /**
   * Set up demo content for development and testing
   */
  setupDemoContent() {
    // Sample content for demo mode
    const demoContent = [
      {
        id: 'content_001',
        title: 'Blockchain Basics',
        description:
          'Learn the fundamentals of blockchain technology including distributed ledgers, consensus mechanisms, and how blocks are created and validated.',
        videoFilename: 'blockchain-basics.mp4',
        thumbnailUrl: 'assets/images/thumbnails/blockchain-basics.jpg',
        ipfsCid: 'QmV5FWwfr4akgVMbPQZgDKWjkNP4RXh8vw7NjPBwzK2B45',
        createdAt: new Date('2025-04-16T10:30:00'),
        duration: 623, // seconds
        views: 548,
        price: 1
      },
      {
        id: 'content_002',
        title: 'Smart Contract Development',
        description:
          'A comprehensive guide to creating robust and secure smart contracts for Ethereum and EVM-compatible blockchains.',
        videoFilename: 'smart-contract-dev.mp4',
        thumbnailUrl: 'assets/images/thumbnails/smart-contract-dev.jpg',
        ipfsCid: 'QmT8JNtApLYyvmQYJYxMAWFgwt7vgfJpfJ6vqXQGvHzNKY',
        createdAt: new Date('2025-04-13T14:20:00'),
        duration: 1254, // seconds
        views: 327,
        price: 2
      },
      {
        id: 'content_003',
        title: 'Web3 Integration Guide',
        description:
          'Learn how to integrate Web3 functionality into existing web applications with MetaMask, WalletConnect and more.',
        videoFilename: 'web3-integration.mp4',
        thumbnailUrl: 'assets/images/thumbnails/web3-integration.jpg',
        ipfsCid: 'QmW9cDBht1TUvCpQNJJGkq8RNvdXJ71D8XGy9FnT3MNSgT',
        createdAt: new Date('2025-04-11T09:15:00'),
        duration: 895, // seconds
        views: 209,
        price: 1
      }
    ];

    // Add demo content to caches
    demoContent.forEach(content => {
      this.contentCache.set(content.id, content);
      this.ipfsCidCache.set(content.ipfsCid, content);
    });
  }

  /**
   * Get content metadata by ID
   *
   * @param {string} contentId - The content ID
   * @returns {Object|null} Content metadata or null if not found
   */
  getContentMetadata(contentId) {
    return this.contentCache.get(contentId) || null;
  }

  /**
   * Get content by IPFS CID
   *
   * @param {string} cid - The IPFS Content Identifier
   * @returns {Object|null} Content metadata or null if not found
   */
  getContentByIpfsCid(cid) {
    return this.ipfsCidCache.get(cid) || null;
  }

  /**
   * Load a video from IPFS or fallback to demo content
   *
   * @param {string} contentIdOrCid - Content ID or IPFS CID
   * @param {Function} callback - Called with video URL when ready
   * @param {boolean} forceReload - Force reload from IPFS even if cached
   * @returns {Promise<string>} The URL to the video
   */
  loadVideo(contentIdOrCid, callback, forceReload = false) {
    // Get content data
    let contentData = this.getContentMetadata(contentIdOrCid);

    if (!contentData) {
      // Try to find by CID
      contentData = this.getContentByIpfsCid(contentIdOrCid);
    }

    if (!contentData) {
      const error = new Error(`Content not found: ${contentIdOrCid}`);
      if (callback) callback(null, error);
      return Promise.reject(error);
    }

    // In production, we'd fetch from IPFS gateway using contentData.ipfsCid
    // For development, use local demo files
    if (this.config.useDemoMode) {
      const videoUrl = `${this.config.demoVideoPath}${contentData.videoFilename}`;
      if (callback) callback(videoUrl);
      return Promise.resolve(videoUrl);
    } else {
      // Real IPFS loading logic
      return this.loadFromIPFS(contentData.ipfsCid)
        .then(url => {
          if (callback) callback(url);
          return url;
        })
        .catch(err => {
          if (callback) callback(null, err);
          throw err;
        });
    }
  }

  /**
   * Load content from IPFS (real IPFS implementation)
   *
   * @param {string} cid - The IPFS Content Identifier
   * @returns {Promise<string>} The URL to the content
   */
  async loadFromIPFS(cid) {
    try {
      // If node integrates IPFS via IPFS HTTP client, it would use that
      // For browser implementation, we just use a gateway
      return `${this.config.ipfsGateway}${cid}`;
    } catch (error) {
      console.error('IPFS loading error:', error);
      throw error;
    }
  }

  /**
   * Upload content to IPFS
   *
   * @param {File} file - The file object to upload
   * @param {Object} metadata - Content metadata
   * @returns {Promise<Object>} Uploaded content information
   */
  async uploadContent(file, metadata) {
    if (this.config.useDemoMode) {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a random CID for demo purposes
      const demoChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let cid = 'Qm';
      for (let i = 0; i < 44; i++) {
        cid += demoChars.charAt(Math.floor(Math.random() * demoChars.length));
      }

      // Create a new content entry
      const contentId = `content_${Math.floor(Math.random() * 1000)}`;
      const content = {
        id: contentId,
        title: metadata.title,
        description: metadata.description,
        videoFilename: file.name,
        thumbnailUrl: 'assets/images/thumbnails/default.jpg',
        ipfsCid: cid,
        createdAt: new Date(),
        duration: 0, // Unknown until processed
        views: 0,
        price: metadata.price || 0
      };

      // Add to caches
      this.contentCache.set(contentId, content);
      this.ipfsCidCache.set(cid, content);

      return {
        contentId,
        cid,
        url: `${this.config.ipfsGateway}${cid}`
      };
    } else {
      // Real IPFS upload logic
      try {
        // In a production environment, would use IPFS client or Web3.Storage API
        // This is a placeholder for the actual implementation
        const cid = await this.uploadToIPFS(file, metadata);

        // Create content record with actual IPFS CID
        const contentId = `content_${Date.now()}`;
        const content = {
          id: contentId,
          title: metadata.title,
          description: metadata.description,
          videoFilename: file.name,
          thumbnailUrl: metadata.thumbnail || 'assets/images/thumbnails/default.jpg',
          ipfsCid: cid,
          createdAt: new Date(),
          duration: 0, // Will be updated after processing
          views: 0,
          price: metadata.price || 0
        };

        // Add to caches
        this.contentCache.set(contentId, content);
        this.ipfsCidCache.set(cid, content);

        return {
          contentId,
          cid,
          url: `${this.config.ipfsGateway}${cid}`
        };
      } catch (error) {
        console.error('IPFS upload error:', error);
        throw error;
      }
    }
  }

  /**
   * Upload to IPFS (real implementation)
   *
   * @param {File} file - The file to upload
   * @param {Object} metadata - Content metadata
   * @returns {Promise<string>} The IPFS Content Identifier (CID)
   */
  async uploadToIPFS(file, metadata) {
    // This would connect to IPFS node or service like Web3.Storage
    // For example with Web3.Storage:
    //
    // const token = 'YOUR_WEB3_STORAGE_API_TOKEN'
    // const client = new Web3Storage({ token })
    //
    // const metadataFile = new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' })
    // const cid = await client.put([file, metadataFile])
    // return cid

    throw new Error('Real IPFS upload not implemented in demo mode');
  }

  /**
   * Get all content items (for browsing/searching)
   *
   * @param {Object} filters - Optional filters for content
   * @returns {Array} Array of content items matching filters
   */
  getAllContent(filters = {}) {
    let content = Array.from(this.contentCache.values());

    // Apply filters if provided
    if (filters.category) {
      content = content.filter(item => item.category === filters.category);
    }

    if (filters.priceMax !== undefined) {
      content = content.filter(item => item.price <= filters.priceMax);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase();
      content = content.filter(
        item =>
          item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    content.sort((a, b) => b.createdAt - a.createdAt);

    return content;
  }

  /**
   * Record a view for content (in production would interact with smart contract)
   *
   * @param {string} contentId - The content ID
   * @param {string} address - Viewer's wallet address
   * @param {number} duration - View duration in seconds
   * @returns {Promise<Object>} View transaction result
   */
  async recordView(contentId, address, duration) {
    const content = this.getContentMetadata(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    if (this.config.useDemoMode) {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update view count
      content.views += 1;

      return {
        success: true,
        transactionHash: `0x${Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join('')}`,
        viewCount: content.views
      };
    } else {
      // In production, would call smart contract to record view
      // This would interact with the StreamingContract.sol
      throw new Error('Real view recording not implemented in demo mode');
    }
  }
}

// Make available globally
window.IPFSContentLoader = IPFSContentLoader;
