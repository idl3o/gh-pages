/**
 * Streaming Service
 * Handles decentralized content streaming using Web3 technologies
 */

import ipfsService from '../../../services/IPFSService.js';
import hlsService from '../../../services/HLSService.js';

class StreamingService {
  constructor() {
    this.isInitialized = false;
    this.streamingContract = null;
    this.web3 = null;
    this.currentAccount = null;
    this.contentCatalog = [];
    this.activeStream = null;
    this.streamingEvents = {};
    this.liveStreams = new Map();
    this.scheduledStreams = new Map(); // Store scheduled streams

    // Contract addresses by network
    this.contractAddresses = {
      1: '0x5678901234567890123456789012345678901234', // Ethereum Mainnet (placeholder)
      137: '0x6789012345678901234567890123456789012345', // Polygon Mainnet (placeholder)
      5: '0x7890123456789012345678901234567890123456', // Goerli Testnet (placeholder)
      80001: '0x8901234567890123456789012345678901234567' // Mumbai Testnet (placeholder)
    };

    // ABI for the streaming contract
    this.contractABI = [
      {
        inputs: [{ name: '_contentId', type: 'string' }],
        name: 'getContentMetadata',
        outputs: [
          { name: 'title', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'duration', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'isAvailable', type: 'bool' }
        ],
        stateMutability: 'view',
        type: 'function'
      },
      {
        inputs: [
          { name: '_title', type: 'string' },
          { name: '_ipfsHash', type: 'string' },
          { name: '_duration', type: 'uint256' },
          { name: '_price', type: 'uint256' }
        ],
        name: 'publishContent',
        outputs: [{ name: 'contentId', type: 'string' }],
        stateMutability: 'nonpayable',
        type: 'function'
      },
      {
        inputs: [{ name: '_contentId', type: 'string' }],
        name: 'purchaseAccess',
        outputs: [{ name: 'success', type: 'bool' }],
        stateMutability: 'payable',
        type: 'function'
      },
      {
        inputs: [{ name: '_contentId', type: 'string' }],
        name: 'hasAccess',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function'
      },
      {
        inputs: [],
        name: 'getMyContent',
        outputs: [{ name: 'contentIds', type: 'string[]' }],
        stateMutability: 'view',
        type: 'function'
      },
      {
        inputs: [],
        name: 'getCreatorDashboard',
        outputs: [
          { name: 'contentIds', type: 'string[]' },
          { name: 'earnings', type: 'uint256[]' },
          { name: 'viewCounts', type: 'uint256[]' }
        ],
        stateMutability: 'view',
        type: 'function'
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
    this.processVideoForHLS = this.processVideoForHLS.bind(this);
    this.startLiveStream = this.startLiveStream.bind(this);
    this.stopLiveStream = this.stopLiveStream.bind(this);
    this.scheduleStream = this.scheduleStream.bind(this);
    this.getScheduledStreams = this.getScheduledStreams.bind(this);
    this.updateScheduledStream = this.updateScheduledStream.bind(this);
    this.cancelScheduledStream = this.cancelScheduledStream.bind(this);
    this.getStreamAnalytics = this.getStreamAnalytics.bind(this);
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
      this.streamingContract = new this.web3.eth.Contract(this.contractABI, contractAddress);

      // Initialize IPFS service
      try {
        if (!ipfsService.isInitialized) {
          await ipfsService.initialize({
            apiUrl: 'https://ipfs.infura.io:5001',
            gateway: 'https://ipfs.io/ipfs/'
          });
        }
      } catch (error) {
        console.warn("Couldn't initialize IPFS service:", error);
        // Continue anyway - we'll use fallback gateway URLs
      }

      // Initialize HLS service
      try {
        if (!hlsService.isInitialized) {
          await hlsService.initialize({
            segmentDuration: 6,
            playlistType: 'vod',
            defaultQualities: ['360p', '720p']
          });
        }
      } catch (error) {
        console.warn("Couldn't initialize HLS service:", error);
        // Continue anyway - we'll use direct streaming as fallback
      }

      // Load initial content catalog
      await this.loadContentCatalog();

      // Load scheduled streams from storage
      this._loadScheduledStreamsFromStorage();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize streaming service:', error);
      return false;
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
        'stream-001',
        'stream-002',
        'stream-003',
        'stream-004',
        'stream-005',
        'stream-006'
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
      const result = await this.streamingContract.methods.getContentMetadata(contentId).call();

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

      // Check if this content has HLS manifests
      let contentUrl;
      let isHLS = false;

      if (metadata.hlsManifest) {
        // Use HLS manifest if available
        contentUrl = `${ipfsService.gateway}${metadata.hlsManifest}`;
        isHLS = true;
      } else {
        // Get best available IPFS gateway URL for direct file
        try {
          contentUrl = await ipfsService.getBestGatewayUrl(metadata.ipfsHash);
        } catch (error) {
          // Fallback to basic URL if gateway testing fails
          contentUrl = this.getIPFSContentUrl(metadata.ipfsHash);
        }
      }

      // Set up video player
      if (isHLS) {
        // Set up HLS player
        await this._setupHLSPlayer(videoElement, contentUrl, metadata);
      } else {
        // Set up regular video player
        videoElement.src = contentUrl;
      }

      videoElement.controls = true;

      // Track viewing session
      this.activeStream = {
        contentId,
        metadata,
        startTime: Date.now(),
        videoElement,
        contentUrl,
        isHLS
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
   * Set up HLS player with hls.js
   * @param {HTMLVideoElement} videoElement Video element
   * @param {string} manifestUrl HLS manifest URL
   * @param {Object} metadata Content metadata
   * @returns {Promise<void>}
   * @private
   */
  async _setupHLSPlayer(videoElement, manifestUrl, metadata) {
    // Check for native HLS support
    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari, iOS)
      videoElement.src = manifestUrl;
      return;
    }

    // For other browsers, use hls.js
    try {
      // Dynamically import hls.js if not available globally
      if (!window.Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Create new HLS player
      const hls = new window.Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60 MB
        maxBufferHole: 0.5,
        startLevel: -1, // Auto select initial quality
        debug: false
      });

      // Attach HLS to video element
      hls.attachMedia(videoElement);
      hls.on(window.Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(manifestUrl);

        hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
          // Add quality selection UI if multiple levels
          if (data.levels.length > 1) {
            this._addQualitySelector(videoElement, hls, data.levels);
          }
        });
      });

      // Store HLS instance for cleanup
      videoElement.hlsInstance = hls;

    } catch (error) {
      console.error('Error setting up HLS player:', error);
      // Fallback to direct URL
      videoElement.src = manifestUrl;
    }
  }

  /**
   * Add quality selector UI to video player
   * @param {HTMLVideoElement} videoElement Video element
   * @param {Object} hls HLS.js instance
   * @param {Array} levels Quality levels
   * @private
   */
  _addQualitySelector(videoElement, hls, levels) {
    // Create quality selector container
    const container = document.createElement('div');
    container.className = 'quality-selector';
    container.style.position = 'absolute';
    container.style.right = '10px';
    container.style.top = '10px';
    container.style.background = 'rgba(0,0,0,0.6)';
    container.style.color = 'white';
    container.style.padding = '5px';
    container.style.borderRadius = '3px';
    container.style.zIndex = '2';
    container.style.display = 'none'; // Hide initially

    // Create select element
    const select = document.createElement('select');
    select.style.background = 'transparent';
    select.style.color = 'white';
    select.style.border = 'none';

    // Create auto option
    const autoOption = document.createElement('option');
    autoOption.value = '-1';
    autoOption.text = 'Auto';
    autoOption.selected = true;
    select.appendChild(autoOption);

    // Add options for each quality level
    levels.forEach((level, index) => {
      const option = document.createElement('option');
      const height = level.height;
      const width = level.width;
      option.value = index.toString();
      option.text = `${height}p`;
      if (width) {
        option.text += ` (${width}x${height})`;
      }
      select.appendChild(option);
    });

    // Handle quality change
    select.addEventListener('change', (e) => {
      const levelIndex = parseInt(e.target.value, 10);
      if (levelIndex === -1) {
        hls.currentLevel = -1; // Auto
      } else {
        hls.currentLevel = levelIndex;
      }
    });

    // Add select to container
    container.appendChild(select);

    // Add container to video parent
    if (videoElement.parentNode) {
      videoElement.parentNode.style.position = 'relative';
      videoElement.parentNode.appendChild(container);

      // Show quality selector on mouse over
      videoElement.parentNode.addEventListener('mouseover', () => {
        container.style.display = 'block';
      });

      // Hide quality selector on mouse leave
      videoElement.parentNode.addEventListener('mouseleave', () => {
        container.style.display = 'none';
      });
    }
  }

  /**
   * Stop currently active stream
   * @returns {Promise<void>}
   */
  async stopStream() {
    if (!this.activeStream) return;

    try {
      const { videoElement, contentId, isHLS } = this.activeStream;

      // Remove event listeners
      if (this.streamingEvents.onEnded) {
        videoElement.removeEventListener('ended', this.streamingEvents.onEnded);
      }

      if (this.streamingEvents.onTimeUpdate) {
        videoElement.removeEventListener('timeupdate', this.streamingEvents.onTimeUpdate);
      }

      // Clean up HLS.js if used
      if (isHLS && videoElement.hlsInstance) {
        videoElement.hlsInstance.destroy();
        delete videoElement.hlsInstance;
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
    try {
      // Use the consolidated IPFS service for uploads
      const result = await ipfsService.uploadFile(file, {
        pin: true,
        wrapWithDirectory: false
      }, progressCallback);

      return result.cid;
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
    // Use the consolidated IPFS service's gateway URL
    return ipfsService.getGatewayUrl(ipfsHash);
  }

  /**
   * Process video file for HLS streaming
   * @param {File} videoFile Video file to process
   * @param {Object} options HLS processing options
   * @param {Function} progressCallback Callback for progress updates
   * @returns {Promise<Object>} HLS processing results with IPFS CIDs
   */
  async processVideoForHLS(videoFile, options = {}, progressCallback = null) {
    if (!hlsService.isInitialized) {
      throw new Error('HLS service not initialized');
    }

    try {
      // Default options
      const hlsOptions = {
        qualities: options.qualities || ['360p', '720p'],
        segmentDuration: options.segmentDuration || 6,
        playlistType: options.playlistType || 'vod',
        ...options
      };

      // Process the video file
      const result = await hlsService.convertToHLS(
        videoFile,
        hlsOptions,
        progressCallback
      );

      return {
        masterPlaylistCid: result.masterPlaylistCid,
        variantPlaylists: result.variantPlaylists,
        qualities: result.qualities,
        originalFileCid: options.originalFileCid || null,
        ipfsGateway: ipfsService.gateway,
        hlsReady: true
      };
    } catch (error) {
      console.error('Error processing video for HLS:', error);
      throw error;
    }
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
      let ipfsHash;
      let hlsManifest = null;

      // Check if we should process for HLS streaming
      if (file.type.startsWith('video/') && contentData.processHLS) {
        // First upload the original file
        const progressCallback = contentData.progressCallback ?
          (percent) => contentData.progressCallback(percent * 0.3) : // 30% for initial upload
          null;

        ipfsHash = await this.uploadToIPFS(file, progressCallback);

        // Then process for HLS
        const hlsProgressCallback = contentData.progressCallback ?
          (percent) => contentData.progressCallback(30 + percent * 0.7) : // 70% for HLS processing
          null;

        const hlsResult = await this.processVideoForHLS(
          file,
          {
            qualities: contentData.qualities || ['360p', '720p'],
            originalFileCid: ipfsHash
          },
          hlsProgressCallback
        );

        // Use HLS manifest as the primary content source
        hlsManifest = hlsResult.masterPlaylistCid;
      } else {
        // Regular upload for non-video files
        ipfsHash = await this.uploadToIPFS(file, contentData.progressCallback);
      }

      // Prepare contract call
      const priceWei = this.web3.utils.toWei(contentData.price.toString(), 'ether');

      // Additional metadata to include with content
      const metadataJson = JSON.stringify({
        title: contentData.title,
        description: contentData.description || '',
        mediaType: file.type,
        originalFilename: file.name,
        duration: contentData.duration || 0,
        hlsManifest: hlsManifest,
        qualities: contentData.qualities || [],
        thumbnailCid: contentData.thumbnailCid || null,
        createdAt: new Date().toISOString()
      });

      // Upload metadata to IPFS
      const metadataFile = new File(
        [metadataJson],
        'metadata.json',
        { type: 'application/json' }
      );

      const metadataCid = await this.uploadToIPFS(metadataFile);

      // Call contract to publish content with both the content hash and metadata hash
      const result = await this.streamingContract.methods
        .publishContent(
          contentData.title,
          ipfsHash,
          Math.floor(contentData.duration),
          priceWei,
          metadataCid,
          hlsManifest || '0x0'  // Pass HLS manifest if available
        )
        .send({ from: this.currentAccount });

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
   * Create and start a new live stream
   * @param {Object} streamOptions Live stream options
   * @returns {Promise<Object>} Live stream information
   */
  async startLiveStream(streamOptions = {}) {
    if (!hlsService.isInitialized) {
      throw new Error('HLS service not initialized');
    }

    if (!this.currentAccount) {
      throw new Error('No wallet connected');
    }

    try {
      // Create stream with options
      const stream = await hlsService.createLiveStream({
        name: streamOptions.name || 'Untitled Stream',
        description: streamOptions.description || '',
        qualities: streamOptions.qualities || ['360p', '720p'],
        persistent: true // Keep all segments
      });

      // Start the stream
      const startResult = await hlsService.startLiveStream(stream.streamId);

      // Store stream info
      this.liveStreams.set(stream.streamId, {
        ...stream,
        ...startResult,
        creator: this.currentAccount,
        createTime: Date.now()
      });

      // Return stream info with playback URL
      return {
        streamId: stream.streamId,
        ingestUrl: startResult.ingestUrl,
        playbackUrl: startResult.playbackUrl,
        status: startResult.status
      };
    } catch (error) {
      console.error('Error starting live stream:', error);
      throw error;
    }
  }

  /**
   * Stop a live stream
   * @param {string} streamId Stream identifier
   * @returns {Promise<Object>} Stream status
   */
  async stopLiveStream(streamId) {
    if (!hlsService.isInitialized) {
      throw new Error('HLS service not initialized');
    }

    if (!this.liveStreams.has(streamId)) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    try {
      // Stop the stream
      const result = await hlsService.stopLiveStream(streamId);

      // Update local stream state
      const streamInfo = this.liveStreams.get(streamId);
      streamInfo.status = 'stopped';
      streamInfo.endTime = Date.now();
      this.liveStreams.set(streamId, streamInfo);

      return result;
    } catch (error) {
      console.error(`Error stopping stream ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Get live stream info
   * @param {string} streamId Stream identifier
   * @returns {Promise<Object>} Stream information
   */
  async getLiveStreamInfo(streamId) {
    if (!hlsService.isInitialized) {
      throw new Error('HLS service not initialized');
    }

    if (!this.liveStreams.has(streamId) && !hlsService.liveStreams.has(streamId)) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    try {
      // Get info from HLS service
      const streamInfo = await hlsService.getLiveStreamInfo(streamId);
      return streamInfo;
    } catch (error) {
      console.error(`Error getting stream info for ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Add segment to a live stream
   * @param {string} streamId Stream identifier
   * @param {File|Blob} segmentData Segment data
   * @param {Object} metadata Segment metadata
   * @returns {Promise<Object>} Updated stream info
   */
  async addLiveSegment(streamId, segmentData, metadata = {}) {
    if (!hlsService.isInitialized) {
      throw new Error('HLS service not initialized');
    }

    try {
      const result = await hlsService.addLiveSegment(streamId, segmentData, metadata);
      return result;
    } catch (error) {
      console.error(`Error adding segment to stream ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Publish a completed live stream as VOD content
   * @param {string} streamId Stream identifier
   * @param {Object} contentData Additional content data
   * @returns {Promise<string>} Content ID of published VOD
   */
  async publishLiveStreamAsVOD(streamId, contentData = {}) {
    if (!this.streamingContract || !this.currentAccount) {
      throw new Error('Streaming service not initialized or no wallet connected.');
    }

    if (!this.liveStreams.has(streamId)) {
      throw new Error(`Stream not found: ${streamId}`);
    }

    try {
      // Get stream info
      const streamInfo = await this.getLiveStreamInfo(streamId);

      if (streamInfo.status !== 'stopped') {
        throw new Error('Cannot publish an active live stream');
      }

      // Prepare contract call
      const priceWei = this.web3.utils.toWei((contentData.price || '0').toString(), 'ether');

      // Additional metadata
      const metadataJson = JSON.stringify({
        title: contentData.title || streamInfo.name,
        description: contentData.description || streamInfo.description,
        mediaType: 'video/application/x-mpegURL',
        duration: contentData.duration || 0,
        hlsManifest: streamInfo.masterPlaylistCid,
        qualities: streamInfo.qualities,
        thumbnailCid: contentData.thumbnailCid || null,
        originalStreamId: streamId,
        createdAt: new Date().toISOString(),
        isFromLiveStream: true
      });

      // Upload metadata to IPFS
      const metadataFile = new File(
        [metadataJson],
        'metadata.json',
        { type: 'application/json' }
      );

      const metadataCid = await this.uploadToIPFS(metadataFile);

      // Call contract to publish content
      const result = await this.streamingContract.methods
        .publishContent(
          contentData.title || streamInfo.name,
          metadataCid, // Use metadata CID as the main reference
          Math.floor(contentData.duration || 0),
          priceWei,
          metadataCid,
          streamInfo.masterPlaylistCid // Pass HLS manifest
        )
        .send({ from: this.currentAccount });

      // Get content ID from transaction receipt
      const contentId = result.events.ContentPublished.returnValues.contentId;

      // Refresh content catalog
      await this.loadContentCatalog();

      return contentId;
    } catch (error) {
      console.error('Error publishing live stream as VOD:', error);
      throw error;
    }
  }

  /**
   * Schedule a future live stream
   * @param {Object} streamOptions Stream configuration options
   * @param {Date} scheduledTime When to start the stream (Date object)
   * @returns {Promise<Object>} Scheduled stream information
   */
  async scheduleStream(streamOptions = {}, scheduledTime) {
    if (!this.currentAccount) {
      throw new Error('No wallet connected');
    }

    if (!(scheduledTime instanceof Date) || scheduledTime <= new Date()) {
      throw new Error('Invalid scheduled time. Must be a future date.');
    }

    try {
      // Generate a unique ID for the scheduled stream
      const scheduledId = 'scheduled-' + Math.random().toString(36).substring(2, 15);

      // Store scheduled stream info
      const scheduledStream = {
        id: scheduledId,
        name: streamOptions.name || 'Untitled Stream',
        description: streamOptions.description || '',
        scheduledTime: scheduledTime,
        creator: this.currentAccount,
        qualities: streamOptions.qualities || ['360p', '720p'],
        thumbnail: streamOptions.thumbnail || null,
        status: 'scheduled',
        createdAt: new Date(),
        streamOptions: { ...streamOptions },
        notificationSent: false,
        expectedDuration: streamOptions.expectedDuration || 60, // Default 60 minutes
        category: streamOptions.category || 'General',
        tags: streamOptions.tags || []
      };

      // Save scheduled stream
      this.scheduledStreams.set(scheduledId, scheduledStream);

      // Set up notification timer for 10 minutes before stream
      const notifyTime = new Date(scheduledTime.getTime() - 10 * 60 * 1000);
      const now = new Date();

      if (notifyTime > now) {
        const timeoutMs = notifyTime.getTime() - now.getTime();
        setTimeout(() => {
          this._sendStreamNotification(scheduledId);
        }, timeoutMs);
      }

      // Optional: Save to localStorage for persistence
      this._saveScheduledStreamsToStorage();

      // Emit event
      this.emitEvent('streamScheduled', scheduledStream);

      return scheduledStream;
    } catch (error) {
      console.error('Error scheduling stream:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled streams for the current account
   * @param {Object} options Filter options
   * @returns {Array<Object>} List of scheduled streams
   */
  getScheduledStreams(options = {}) {
    if (!this.currentAccount) {
      return [];
    }

    try {
      // Filter and sort scheduled streams
      let streams = Array.from(this.scheduledStreams.values())
        .filter(stream => {
          // Filter by creator if specified
          if (options.creator && options.creator !== stream.creator) {
            return false;
          }

          // Filter by status if specified
          if (options.status && options.status !== stream.status) {
            return false;
          }

          // Filter by category if specified
          if (options.category && options.category !== stream.category) {
            return false;
          }

          // Filter by date range if specified
          if (options.startDate && stream.scheduledTime < options.startDate) {
            return false;
          }

          if (options.endDate && stream.scheduledTime > options.endDate) {
            return false;
          }

          return true;
        });

      // Sort streams by scheduled time (ascending by default)
      streams.sort((a, b) => {
        if (options.sortDescending) {
          return b.scheduledTime - a.scheduledTime;
        }
        return a.scheduledTime - b.scheduledTime;
      });

      // Limit results if specified
      if (options.limit && options.limit > 0) {
        streams = streams.slice(0, options.limit);
      }

      return streams;
    } catch (error) {
      console.error('Error getting scheduled streams:', error);
      return [];
    }
  }

  /**
   * Update a scheduled stream
   * @param {string} scheduledId Scheduled stream ID
   * @param {Object} updates Updates to apply
   * @returns {Promise<Object>} Updated stream info
   */
  async updateScheduledStream(scheduledId, updates = {}) {
    if (!this.scheduledStreams.has(scheduledId)) {
      throw new Error(`Scheduled stream not found: ${scheduledId}`);
    }

    try {
      // Get current stream info
      const streamInfo = this.scheduledStreams.get(scheduledId);

      // Check ownership
      if (streamInfo.creator !== this.currentAccount) {
        throw new Error('You do not own this scheduled stream');
      }

      // Allow updating only certain fields
      const allowedUpdates = [
        'name', 'description', 'scheduledTime', 'qualities',
        'thumbnail', 'expectedDuration', 'category', 'tags'
      ];

      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key)) {
          streamInfo[key] = value;

          // Also update in streamOptions object for some fields
          if (['name', 'description', 'qualities'].includes(key)) {
            streamInfo.streamOptions[key] = value;
          }
        }
      }

      // Update last modified time
      streamInfo.lastModified = new Date();

      // Store updated info
      this.scheduledStreams.set(scheduledId, streamInfo);

      // Update storage
      this._saveScheduledStreamsToStorage();

      // Emit event
      this.emitEvent('scheduledStreamUpdated', streamInfo);

      return streamInfo;
    } catch (error) {
      console.error(`Error updating scheduled stream ${scheduledId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled stream
   * @param {string} scheduledId Scheduled stream ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelScheduledStream(scheduledId) {
    if (!this.scheduledStreams.has(scheduledId)) {
      throw new Error(`Scheduled stream not found: ${scheduledId}`);
    }

    try {
      // Get stream info
      const streamInfo = this.scheduledStreams.get(scheduledId);

      // Check ownership
      if (streamInfo.creator !== this.currentAccount) {
        throw new Error('You do not own this scheduled stream');
      }

      // Update status
      streamInfo.status = 'cancelled';
      streamInfo.cancelledAt = new Date();

      // Store updated info
      this.scheduledStreams.set(scheduledId, streamInfo);

      // Update storage
      this._saveScheduledStreamsToStorage();

      // Emit event
      this.emitEvent('scheduledStreamCancelled', streamInfo);

      return true;
    } catch (error) {
      console.error(`Error cancelling scheduled stream ${scheduledId}:`, error);
      throw error;
    }
  }

  /**
   * Start a scheduled stream now
   * @param {string} scheduledId Scheduled stream ID
   * @returns {Promise<Object>} Live stream information
   */
  async startScheduledStream(scheduledId) {
    if (!this.scheduledStreams.has(scheduledId)) {
      throw new Error(`Scheduled stream not found: ${scheduledId}`);
    }

    try {
      // Get scheduled stream info
      const scheduledInfo = this.scheduledStreams.get(scheduledId);

      // Check ownership
      if (scheduledInfo.creator !== this.currentAccount) {
        throw new Error('You do not own this scheduled stream');
      }

      // Start the live stream with the scheduled options
      const liveStream = await this.startLiveStream(scheduledInfo.streamOptions);

      // Update the scheduled stream status
      scheduledInfo.status = 'live';
      scheduledInfo.liveStreamId = liveStream.streamId;
      scheduledInfo.actualStartTime = new Date();

      // Store updated info
      this.scheduledStreams.set(scheduledId, scheduledInfo);

      // Update storage
      this._saveScheduledStreamsToStorage();

      // Track relationship between live stream and scheduled stream
      const liveStreamInfo = this.liveStreams.get(liveStream.streamId);
      if (liveStreamInfo) {
        liveStreamInfo.scheduledId = scheduledId;
        this.liveStreams.set(liveStream.streamId, liveStreamInfo);
      }

      // Emit event
      this.emitEvent('scheduledStreamStarted', {
        scheduledId,
        liveStreamId: liveStream.streamId
      });

      return liveStream;
    } catch (error) {
      console.error(`Error starting scheduled stream ${scheduledId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification for upcoming stream
   * @param {string} scheduledId Scheduled stream ID
   * @private
   */
  _sendStreamNotification(scheduledId) {
    if (!this.scheduledStreams.has(scheduledId)) return;

    const streamInfo = this.scheduledStreams.get(scheduledId);

    // If already cancelled or notification already sent, skip
    if (streamInfo.status === 'cancelled' || streamInfo.notificationSent) return;

    // Mark notification as sent
    streamInfo.notificationSent = true;
    this.scheduledStreams.set(scheduledId, streamInfo);

    // Emit notification event
    this.emitEvent('streamNotification', {
      type: 'scheduled',
      message: `Your scheduled stream "${streamInfo.name}" starts in 10 minutes`,
      streamId: scheduledId,
      scheduledTime: streamInfo.scheduledTime
    });

    // If browser notifications are supported and permitted
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Stream Reminder', {
        body: `Your scheduled stream "${streamInfo.name}" starts in 10 minutes`,
        icon: '/assets/images/stream-icon.png'
      });
    }
  }

  /**
   * Save scheduled streams to localStorage for persistence
   * @private
   */
  _saveScheduledStreamsToStorage() {
    try {
      // Convert Map to array
      const streamsArray = Array.from(this.scheduledStreams.entries()).map(([id, stream]) => {
        return {
          ...stream,
          scheduledTime: stream.scheduledTime.toISOString(),
          createdAt: stream.createdAt.toISOString(),
          lastModified: stream.lastModified ? stream.lastModified.toISOString() : null,
          cancelledAt: stream.cancelledAt ? stream.cancelledAt.toISOString() : null
        };
      });

      // Save to localStorage
      localStorage.setItem('scheduledStreams', JSON.stringify(streamsArray));
    } catch (error) {
      console.error('Error saving scheduled streams to storage:', error);
    }
  }

  /**
   * Load scheduled streams from localStorage
   * @private
   */
  _loadScheduledStreamsFromStorage() {
    try {
      const storedStreams = localStorage.getItem('scheduledStreams');
      if (!storedStreams) return;

      const streamsArray = JSON.parse(storedStreams);

      // Convert array back to Map
      streamsArray.forEach(stream => {
        // Convert date strings back to Date objects
        stream.scheduledTime = new Date(stream.scheduledTime);
        stream.createdAt = new Date(stream.createdAt);
        if (stream.lastModified) stream.lastModified = new Date(stream.lastModified);
        if (stream.cancelledAt) stream.cancelledAt = new Date(stream.cancelledAt);

        this.scheduledStreams.set(stream.id, stream);
      });
    } catch (error) {
      console.error('Error loading scheduled streams from storage:', error);
    }
  }

  /**
   * Get analytics for a stream
   * @param {string} streamId Stream identifier (live or VOD)
   * @param {Object} options Analytics options
   * @returns {Promise<Object>} Stream analytics
   */
  async getStreamAnalytics(streamId, options = {}) {
    if (!this.currentAccount) {
      throw new Error('No wallet connected');
    }

    try {
      // Check if it's a live stream
      const isLive = this.liveStreams.has(streamId);
      const isScheduled = streamId.startsWith('scheduled-') && this.scheduledStreams.has(streamId);

      // Base analytics object
      const analytics = {
        streamId,
        type: isLive ? 'live' : (isScheduled ? 'scheduled' : 'vod'),
        viewCount: 0,
        uniqueViewers: 0,
        watchTime: 0,
        averageWatchDuration: 0,
        peakViewers: 0,
        engagementRate: 0,
        completionRate: 0,
        deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, tv: 0, other: 0 },
        viewerRetention: [],
        geographicDistribution: {},
        referralSources: {}
      };

      if (isLive) {
        // Get live stream info
        const streamInfo = this.liveStreams.get(streamId);

        // Check ownership
        if (streamInfo.creator !== this.currentAccount) {
          throw new Error('You do not own this stream');
        }

        // Get real-time analytics from HLS service
        const hlsAnalytics = await hlsService.getStreamAnalytics(streamId);

        // Merge analytics data
        analytics.viewCount = hlsAnalytics.viewCount || 0;
        analytics.uniqueViewers = hlsAnalytics.uniqueViewers || 0;
        analytics.watchTime = hlsAnalytics.totalWatchTime || 0;
        analytics.peakViewers = hlsAnalytics.peakConcurrentViewers || 0;
        analytics.deviceBreakdown = hlsAnalytics.devices || analytics.deviceBreakdown;
        analytics.viewerRetention = hlsAnalytics.retentionData || [];
        analytics.geographicDistribution = hlsAnalytics.geography || {};
        analytics.referralSources = hlsAnalytics.referrers || {};

        // Calculate averages
        if (analytics.uniqueViewers > 0) {
          analytics.averageWatchDuration = analytics.watchTime / analytics.uniqueViewers;
          analytics.engagementRate = hlsAnalytics.interactions ?
            hlsAnalytics.interactions / analytics.uniqueViewers : 0;
        }

      } else if (isScheduled) {
        // For scheduled streams that haven't started yet
        const scheduledInfo = this.scheduledStreams.get(streamId);

        // Check ownership
        if (scheduledInfo.creator !== this.currentAccount) {
          throw new Error('You do not own this scheduled stream');
        }

        // Return basic scheduled stream stats
        analytics.status = scheduledInfo.status;
        analytics.scheduledTime = scheduledInfo.scheduledTime;
        analytics.interestedCount = scheduledInfo.interestedCount || 0;
        analytics.notificationCount = scheduledInfo.notificationCount || 0;

      } else {
        // VOD content
        try {
          // Check content ownership through the contract
          const isOwner = await this._isContentCreator(streamId);
          if (!isOwner) {
            throw new Error('You do not own this content');
          }

          // Get VOD analytics from contract or API
          const contentAnalytics = await this._getContentAnalyticsFromContract(streamId);

          // Merge analytics data
          analytics.viewCount = contentAnalytics.viewCount || 0;
          analytics.uniqueViewers = contentAnalytics.uniqueViewers || 0;
          analytics.watchTime = contentAnalytics.totalWatchTime || 0;
          analytics.completions = contentAnalytics.completions || 0;
          analytics.revenue = contentAnalytics.revenue || '0';
          analytics.purchaseCount = contentAnalytics.purchases || 0;

          // Calculate derived metrics
          if (analytics.viewCount > 0) {
            analytics.completionRate = (analytics.completions / analytics.viewCount) * 100;
          }

          if (analytics.uniqueViewers > 0) {
            analytics.averageWatchDuration = analytics.watchTime / analytics.uniqueViewers;
          }

          // Additional VOD-specific analytics
          analytics.rating = contentAnalytics.rating || 0;
          analytics.reviewCount = contentAnalytics.reviews || 0;
        } catch (error) {
          console.error(`Error fetching VOD analytics for ${streamId}:`, error);
          // Return basic analytics with error flag
          analytics.error = 'Failed to fetch complete analytics';
        }
      }

      return analytics;
    } catch (error) {
      console.error(`Error getting analytics for stream ${streamId}:`, error);
      throw error;
    }
  }

  /**
   * Check if current user is the creator of content
   * @param {string} contentId Content identifier
   * @returns {Promise<boolean>} Whether user is creator
   * @private
   */
  async _isContentCreator(contentId) {
    try {
      const metadata = await this.getContentMetadata(contentId);
      return metadata.creator.toLowerCase() === this.currentAccount.toLowerCase();
    } catch (error) {
      console.error(`Error checking content ownership for ${contentId}:`, error);
      return false;
    }
  }

  /**
   * Get analytics data from the contract
   * @param {string} contentId Content identifier
   * @returns {Promise<Object>} Analytics data
   * @private
   */
  async _getContentAnalyticsFromContract(contentId) {
    try {
      // Get creator dashboard info
      const dashboardData = await this.streamingContract.methods
        .getCreatorDashboard()
        .call({ from: this.currentAccount });

      // Find the index of this content
      const contentIndex = dashboardData.contentIds.findIndex(id => id === contentId);

      if (contentIndex === -1) {
        throw new Error('Content not found in creator dashboard');
      }

      // Get analytics for this content
      return {
        viewCount: parseInt(dashboardData.viewCounts[contentIndex], 10),
        revenue: this.web3.utils.fromWei(dashboardData.earnings[contentIndex], 'ether'),
        purchases: parseInt(dashboardData.purchaseCounts ? dashboardData.purchaseCounts[contentIndex] : 0, 10)
      };
    } catch (error) {
      console.error(`Error getting content analytics from contract for ${contentId}:`, error);
      return {};
    }
  }

  // ...existing code...
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
