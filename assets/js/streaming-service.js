/**
 * Streaming Service
 * Handles decentralized content streaming using Web3 technologies
 */

class StreamingService {
  constructor() {
    this.isInitialized = false;
    this.streamingContract = null;
    this.web3 = null;
    this.ipfs = null;
    this.currentAccount = null;
    this.contentCatalog = [];
    this.activeStream = null;
    this.streamingEvents = {};
    
    // Contract addresses by network
    this.contractAddresses = {
      1: '0x5678901234567890123456789012345678901234', // Ethereum Mainnet (placeholder)
      137: '0x6789012345678901234567890123456789012345', // Polygon Mainnet (placeholder)
      5: '0x7890123456789012345678901234567890123456', // Goerli Testnet (placeholder)
      80001: '0x8901234567890123456789012345678901234567' // Mumbai Testnet (placeholder)
    };
    
    // ABI for the streaming contract
    this.contractABI = [
      // Contract functions will go here (simplified for demonstration)
      {
        "inputs": [{"name": "_contentId", "type": "string"}],
        "name": "getContentMetadata",
        "outputs": [
          {"name": "title", "type": "string"},
          {"name": "creator", "type": "address"},
          {"name": "ipfsHash", "type": "string"},
          {"name": "duration", "type": "uint256"},
          {"name": "price", "type": "uint256"},
          {"name": "isAvailable", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_title", "type": "string"},
          {"name": "_ipfsHash", "type": "string"},
          {"name": "_duration", "type": "uint256"},
          {"name": "_price", "type": "uint256"}
        ],
        "name": "publishContent",
        "outputs": [{"name": "contentId", "type": "string"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_contentId", "type": "string"}],
        "name": "purchaseAccess",
        "outputs": [{"name": "success", "type": "bool"}],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_contentId", "type": "string"}],
        "name": "hasAccess",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getMyContent",
        "outputs": [{"name": "contentIds", "type": "string[]"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getCreatorDashboard",
        "outputs": [
          {"name": "contentIds", "type": "string[]"},
          {"name": "earnings", "type": "uint256[]"},
          {"name": "viewCounts", "type": "uint256[]"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.loadContentCatalog = this.loadContentCatalog.bind(this);
    this.getContentMetadata = this.getContentMetadata.bind(this);
    this.hasContentAccess = this.hasContentAccess.bind(this);
    this.startStream = this.startStream.bind(this);
    this.stopStream = this.stopStream.bind(this);
    this.publishContent = this.publishContent.bind(this);
    this.purchaseContentAccess = this.purchaseContentAccess.bind(this);
    this.uploadToIPFS = this.uploadToIPFS.bind(this);
    this.getIPFSContentUrl = this.getIPFSContentUrl.bind(this);
  }

  /**
   * Initialize the streaming service
   * @param {Object} web3 Web3 instance
   * @param {string} account Current user account
   * @param {number} networkId Current network ID
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize(web3, account, networkId) {
    if (this.isInitialized) return true;
    if (!web3 || !account) return false;
    
    this.web3 = web3;
    this.currentAccount = account;
    
    // Get contract address for current network
    const contractAddress = this.contractAddresses[networkId];
    if (!contractAddress) {
      console.error(`Streaming contract not deployed on network ${networkId}`);
      return false;
    }
    
    try {
      // Initialize contract
      this.streamingContract = new this.web3.eth.Contract(
        this.contractABI,
        contractAddress
      );
      
      // Initialize IPFS client
      try {
        this.ipfs = await this.initializeIPFS();
      } catch (error) {
        console.warn("Couldn't initialize IPFS client:", error);
        // Continue anyway - we'll use fallback gateway URLs
      }
      
      // Load initial content catalog
      await this.loadContentCatalog();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize streaming service:', error);
      return false;
    }
  }
  
  /**
   * Initialize IPFS client
   * @returns {Object} IPFS client
   */
  async initializeIPFS() {
    if (window.Ipfs) {
      return await window.Ipfs.create();
    } else {
      // Load IPFS library dynamically if not available
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/ipfs-http-client/dist/index.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      // Use HTTP client with public gateway
      const { create } = window.IpfsHttpClient;
      return create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
      });
    }
  }

  /**
   * Load the content catalog from the contract
   * @returns {Promise<Array>} Content catalog
   */
  async loadContentCatalog() {
    if (!this.streamingContract) return [];
    
    try {
      // For demo purposes, we'll use a mix of on-chain and off-chain data
      // In a production app, you'd query content from a subgraph or backend cache
      
      const featuredContentIds = [
        'stream-001', 'stream-002', 'stream-003', 
        'stream-004', 'stream-005', 'stream-006'
      ];
      
      const contentPromises = featuredContentIds.map(id => this.getContentMetadata(id));
      const contents = await Promise.all(contentPromises);
      
      this.contentCatalog = contents.filter(content => content && content.isAvailable);
      return this.contentCatalog;
    } catch (error) {
      console.error('Error loading content catalog:', error);
      return [];
    }
  }

  /**
   * Get content metadata from the contract
   * @param {string} contentId Content identifier
   * @returns {Promise<Object>} Content metadata
   */
  async getContentMetadata(contentId) {
    if (!this.streamingContract) return null;
    
    try {
      const result = await this.streamingContract.methods
        .getContentMetadata(contentId)
        .call();
      
      return {
        id: contentId,
        title: result.title,
        creator: result.creator,
        ipfsHash: result.ipfsHash,
        duration: parseInt(result.duration, 10),
        price: this.web3.utils.fromWei(result.price, 'ether'),
        isAvailable: result.isAvailable
      };
    } catch (error) {
      console.error(`Error getting content metadata for ${contentId}:`, error);
      
      // Fallback to mock data for demonstration
      if (contentId.startsWith('stream-')) {
        const num = contentId.split('-')[1];
        return {
          id: contentId,
          title: `Sample Stream Content ${num}`,
          creator: '0x' + '1'.repeat(40),
          ipfsHash: 'QmPZMRuAMNPTFXRXe9BzVv1aEBqQXS5YpTYHE5xtXwXhTE',
          duration: 300, // 5 minutes
          price: '0.1',
          isAvailable: true
        };
      }
      
      return null;
    }
  }

  /**
   * Check if user has access to content
   * @param {string} contentId Content identifier
   * @returns {Promise<boolean>} Access status
   */
  async hasContentAccess(contentId) {
    if (!this.streamingContract || !this.currentAccount) return false;
    
    try {
      const hasAccess = await this.streamingContract.methods
        .hasAccess(contentId)
        .call({ from: this.currentAccount });
      
      return hasAccess;
    } catch (error) {
      console.error(`Error checking access for ${contentId}:`, error);
      return false;
    }
  }

  /**
   * Start streaming content
   * @param {string} contentId Content identifier
   * @param {HTMLElement} videoElement Video element to play content in
   * @returns {Promise<Object>} Stream session information
   */
  async startStream(contentId, videoElement) {
    if (this.activeStream) {
      await this.stopStream();
    }
    
    try {
      // Check access
      const hasAccess = await this.hasContentAccess(contentId);
      if (!hasAccess) {
        throw new Error('No access to this content. Please purchase access first.');
      }
      
      // Get content metadata
      const metadata = await this.getContentMetadata(contentId);
      if (!metadata || !metadata.ipfsHash) {
        throw new Error('Invalid content or missing IPFS hash.');
      }
      
      // Get content URL
      const contentUrl = this.getIPFSContentUrl(metadata.ipfsHash);
      
      // Set up video player
      videoElement.src = contentUrl;
      videoElement.controls = true;
      
      // Track viewing session
      this.activeStream = {
        contentId,
        metadata,
        startTime: Date.now(),
        videoElement
      };
      
      // Set up event listeners
      const onEnded = () => {
        this.stopStream();
      };
      
      const onTimeUpdate = () => {
        // Track progress, could be used for analytics or rewards
        const progress = videoElement.currentTime / videoElement.duration;
        
        // Emit progress event
        this.emitEvent('streamProgress', {
          contentId,
          progress: Math.floor(progress * 100),
          currentTime: videoElement.currentTime
        });
      };
      
      // Store event handlers for removal later
      this.streamingEvents = { onEnded, onTimeUpdate };
      
      // Add event listeners
      videoElement.addEventListener('ended', onEnded);
      videoElement.addEventListener('timeupdate', onTimeUpdate);
      
      // Emit event
      this.emitEvent('streamStarted', { contentId, metadata });
      
      return this.activeStream;
    } catch (error) {
      console.error(`Error starting stream for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Stop currently active stream
   * @returns {Promise<void>}
   */
  async stopStream() {
    if (!this.activeStream) return;
    
    try {
      const { videoElement, contentId } = this.activeStream;
      
      // Remove event listeners
      if (this.streamingEvents.onEnded) {
        videoElement.removeEventListener('ended', this.streamingEvents.onEnded);
      }
      
      if (this.streamingEvents.onTimeUpdate) {
        videoElement.removeEventListener('timeupdate', this.streamingEvents.onTimeUpdate);
      }
      
      // Stop video playback
      videoElement.pause();
      videoElement.src = '';
      
      // Calculate session duration
      const duration = (Date.now() - this.activeStream.startTime) / 1000;
      
      // Emit event
      this.emitEvent('streamEnded', { contentId, duration });
      
      // Clear active stream
      this.activeStream = null;
      this.streamingEvents = {};
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  }

  /**
   * Upload content to IPFS
   * @param {File} file Content file to upload
   * @param {Function} progressCallback Callback for upload progress
   * @returns {Promise<string>} IPFS content hash (CID)
   */
  async uploadToIPFS(file, progressCallback = null) {
    if (!this.ipfs) {
      throw new Error('IPFS client not initialized.');
    }
    
    try {
      const reader = new FileReader();
      const buffer = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      
      // Upload to IPFS with progress tracking
      let lastProgress = 0;
      const result = await this.ipfs.add(buffer, {
        progress: (bytesLoaded) => {
          const progress = Math.floor((bytesLoaded / file.size) * 100);
          if (progress > lastProgress && progressCallback) {
            progressCallback(progress);
            lastProgress = progress;
          }
        }
      });
      
      return result.cid.toString();
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  /**
   * Get IPFS content URL from hash
   * @param {string} ipfsHash IPFS content hash (CID)
   * @returns {string} Content URL
   */
  getIPFSContentUrl(ipfsHash) {
    // Use multiple gateways for reliability
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://ipfs.infura.io/ipfs/'
    ];
    
    // Use a random gateway to distribute load
    const gateway = gateways[Math.floor(Math.random() * gateways.length)];
    return `${gateway}${ipfsHash}`;
  }

  /**
   * Publish new content to the platform
   * @param {Object} contentData Content metadata
   * @param {File} file Content file
   * @returns {Promise<string>} Content ID
   */
  async publishContent(contentData, file) {
    if (!this.streamingContract || !this.currentAccount) {
      throw new Error('Streaming service not initialized or no wallet connected.');
    }
    
    try {
      // Upload content to IPFS
      const ipfsHash = await this.uploadToIPFS(file, contentData.progressCallback);
      
      // Prepare contract call
      const priceWei = this.web3.utils.toWei(contentData.price.toString(), 'ether');
      
      // Call contract to publish content
      const result = await this.streamingContract.methods.publishContent(
        contentData.title,
        ipfsHash,
        Math.floor(contentData.duration),
        priceWei
      ).send({ from: this.currentAccount });
      
      // Get content ID from transaction receipt
      const contentId = result.events.ContentPublished.returnValues.contentId;
      
      // Refresh content catalog
      await this.loadContentCatalog();
      
      return contentId;
    } catch (error) {
      console.error('Error publishing content:', error);
      throw error;
    }
  }

  /**
   * Purchase access to content
   * @param {string} contentId Content identifier
   * @returns {Promise<boolean>} Success status
   */
  async purchaseContentAccess(contentId) {
    if (!this.streamingContract || !this.currentAccount) {
      throw new Error('Streaming service not initialized or no wallet connected.');
    }
    
    try {
      // Get content metadata for price
      const metadata = await this.getContentMetadata(contentId);
      if (!metadata) {
        throw new Error('Content not found');
      }
      
      // Convert price to wei
      const priceWei = this.web3.utils.toWei(metadata.price.toString(), 'ether');
      
      // Purchase access
      await this.streamingContract.methods.purchaseAccess(contentId)
        .send({ 
          from: this.currentAccount,
          value: priceWei
        });
      
      return true;
    } catch (error) {
      console.error(`Error purchasing access to ${contentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Register event listener
   * @param {string} event Event name
   * @param {Function} callback Event callback function
   */
  on(event, callback) {
    if (!this._eventListeners) this._eventListeners = {};
    if (!this._eventListeners[event]) this._eventListeners[event] = [];
    this._eventListeners[event].push(callback);
  }
  
  /**
   * Remove event listener
   * @param {string} event Event name
   * @param {Function} callback Event callback function
   */
  off(event, callback) {
    if (!this._eventListeners || !this._eventListeners[event]) return;
    this._eventListeners[event] = this._eventListeners[event]
      .filter(cb => cb !== callback);
  }
  
  /**
   * Emit event to listeners
   * @param {string} event Event name
   * @param {Object} data Event data
   */
  emitEvent(event, data) {
    if (!this._eventListeners || !this._eventListeners[event]) return;
    this._eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    });
  }
}

// Create and export a singleton instance
const streamingService = new StreamingService();
window.streamingService = streamingService; // Expose to global scope

// Initialize when web3Auth is ready
if (window.web3Auth) {
  window.web3Auth.onAuthChange((isConnected, account, networkId) => {
    if (isConnected && account && networkId && window.web3Auth.web3) {
      streamingService.initialize(window.web3Auth.web3, account, networkId);
    }
  });
}