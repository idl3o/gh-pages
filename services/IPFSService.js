// IPFSService.js
// Service for interacting with IPFS (InterPlanetary File System)

class IPFSService {
  constructor() {
    this.isInitialized = false;
    this.ipfs = null;
    this.gateway = 'https://ipfs.io/ipfs/';
    this.fallbackGateways = [
      'https://cloudflare-ipfs.com/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    this.retryCount = 3;
    this.useWeb3Storage = false;
    this.web3StorageToken = null;
  }

  /**
   * Initialize IPFS client
   * @param {Object} options Configuration options
   * @returns {Promise<boolean>} Initialization result
   */
  async initialize(options = {}) {
    if (this.isInitialized) return true;

    try {
      // Set options
      if (options.gateway) {
        this.gateway = options.gateway;
      }

      if (options.retryCount) {
        this.retryCount = options.retryCount;
      }

      // Initialize Web3.Storage if token provided
      if (options.web3StorageToken) {
        this.useWeb3Storage = true;
        this.web3StorageToken = options.web3StorageToken;

        // Dynamically import Web3.Storage if in browser environment
        if (typeof window !== 'undefined') {
          const { Web3Storage } = await import('https://cdn.jsdelivr.net/npm/web3.storage/dist/bundle.esm.min.js');
          this.web3Storage = new Web3Storage({ token: this.web3StorageToken });
        }
      }

      // Initialize IPFS client if in Node.js environment
      if (typeof window === 'undefined') {
        try {
          const IPFS = require('ipfs-http-client');
          this.ipfs = IPFS.create();
        } catch (error) {
          console.warn('IPFS HTTP client not available in Node environment:', error);
          // Continue with alternative storage options
        }
      } else {
        // In browser, try to use js-ipfs
        try {
          const Ipfs = (await import('https://cdn.jsdelivr.net/npm/ipfs/dist/index.min.js')).default;
          this.ipfs = await Ipfs.create({
            repo: 'ipfs-' + Math.random(),
            init: { alogorithm: 'ed25519' },
            start: true,
            relay: { enabled: true, hop: { enabled: true, active: true } },
            EXPERIMENTAL: { pubsub: true },
            config: {
              Addresses: {
                Swarm: [
                  '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
                  '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
                ]
              }
            }
          });

          console.log('IPFS browser node initialized');
        } catch (error) {
          console.warn('Browser IPFS initialization failed:', error);
          // Continue without IPFS client
        }
      }

      this.isInitialized = true;
      console.log('IPFS service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize IPFS service:', error);
      return false;
    }
  }

  /**
   * Upload text content to IPFS
   * @param {string} content The text content to upload
   * @param {string} filename Optional filename
   * @param {Object} options Upload options
   * @returns {Promise<Object>} The upload result
   */
  async uploadText(content, filename = 'file.txt', options = {}) {
    try {
      // Create a blob from the text content
      const blob = new Blob([content], { type: 'text/plain' });

      // Use the uploadBlob method to upload the content
      return await this.uploadBlob(blob, filename, options);
    } catch (error) {
      console.error('IPFS text upload error:', error);
      throw new Error(`Failed to upload text to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload a Blob to IPFS
   * @param {Blob} blob The blob to upload
   * @param {string} filename Optional filename
   * @param {Object} options Upload options
   * @returns {Promise<Object>} The upload result
   */
  async uploadBlob(blob, filename = 'file.bin', options = {}) {
    try {
      // Convert blob to array buffer
      const buffer = await blob.arrayBuffer();

      // Create file object that matches the format expected by uploadFile
      const file = {
        name: filename,
        type: blob.type,
        size: blob.size,
        arrayBuffer: () => Promise.resolve(buffer)
      };

      // Use the uploadFile method to upload the blob
      return await this.uploadFile(file, options);
    } catch (error) {
      console.error('IPFS blob upload error:', error);
      throw new Error(`Failed to upload blob to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload a file to IPFS
   * @param {File} file The file to upload
   * @param {Object} options Upload options
   * @param {Function} progressCallback Callback for upload progress
   * @returns {Promise<Object>} The IPFS response with CID
   */
  async uploadFile(file, options = {}, progressCallback = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const maxRetries = options.retryCount || this.retryCount;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Set default options
        const uploadOptions = {
          pin: options.pin !== false, // Default to pinning
          ...options
        };

        let cid = null;

        // Try IPFS client first if available
        if (this.ipfs) {
          let fileData;

          if (typeof file.arrayBuffer === 'function') {
            // Browser File object
            fileData = await file.arrayBuffer();
          } else if (Buffer.isBuffer(file)) {
            // Node.js Buffer
            fileData = file;
          } else {
            throw new Error('Invalid file format');
          }

          // Add file to IPFS
          const result = await this.ipfs.add(
            { path: file.name, content: fileData },
            { pin: uploadOptions.pin }
          );

          if (result && result.cid) {
            cid = result.cid.toString();
          } else {
            throw new Error('IPFS upload failed - No CID returned');
          }
        }
        // Try Web3.Storage if available and IPFS client failed or isn't available
        else if (this.useWeb3Storage && this.web3Storage) {
          // Create File object for Web3.Storage
          const fileObj = new File([await file.arrayBuffer()], file.name, { type: file.type });

          // Upload to Web3.Storage
          cid = await this.web3Storage.put([fileObj], {
            name: file.name,
            onRootCidReady: (rootCid) => {
              if (progressCallback) progressCallback(10);
            },
            onStoredChunk: (size) => {
              if (progressCallback) progressCallback(50);
            }
          });
        }
        // If no IPFS client or Web3.Storage, use fallback method (could be extended with any API)
        else {
          throw new Error('No IPFS upload method available');
        }

        if (!cid) {
          throw new Error('Upload failed - No CID obtained');
        }

        // Call final progress callback
        if (progressCallback) progressCallback(100);

        return {
          cid,
          filename: file.name,
          size: file.size,
          gateway: this.gateway,
          url: `${this.gateway}${cid}`
        };
      } catch (error) {
        attempt++;
        console.warn(`IPFS upload attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt >= maxRetries) {
          throw new Error(`Error uploading to IPFS after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));

        // Try with a different gateway if available
        if (this.fallbackGateways.length > 0) {
          this.gateway = this.fallbackGateways.shift();
          console.log(`Switching to fallback gateway: ${this.gateway}`);
          this.fallbackGateways.push(this.gateway); // Move to end of list for future retries
        }
      }
    }

    throw new Error(`Failed to upload file to IPFS after ${maxRetries} attempts`);
  }

  /**
   * Get file content from IPFS
   * @param {string} cid Content identifier
   * @param {Object} options Fetch options
   * @returns {Promise<Blob>} File content
   */
  async getFile(cid, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const maxRetries = options.retryCount || this.retryCount;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Try IPFS client first if available
        if (this.ipfs) {
          try {
            const chunks = [];
            for await (const chunk of this.ipfs.cat(cid)) {
              chunks.push(chunk);
            }
            return new Blob(chunks);
          } catch (error) {
            console.warn('IPFS client cat failed, falling back to gateway:', error);
            // Fall through to gateway method
          }
        }

        // Fallback to HTTP gateway
        const response = await fetch(`${this.gateway}${cid}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.blob();
      } catch (error) {
        attempt++;
        console.warn(`IPFS get attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt >= maxRetries) {
          throw new Error(`Error getting file from IPFS after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));

        // Try with a different gateway if available
        if (this.fallbackGateways.length > 0) {
          this.gateway = this.fallbackGateways.shift();
          console.log(`Switching to fallback gateway: ${this.gateway}`);
          this.fallbackGateways.push(this.gateway); // Move to end of list for future retries
        }
      }
    }

    throw new Error(`Failed to get file from IPFS after ${maxRetries} attempts`);
  }

  /**
   * Pin content on IPFS
   * @param {string} cid Content identifier
   * @param {Object} options Pinning options
   * @returns {Promise<Object>} Pin result
   */
  async pinContent(cid, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.ipfs) {
        await this.ipfs.pin.add(cid);
        return { success: true, cid };
      } else {
        throw new Error('IPFS client not available for pinning');
      }
    } catch (error) {
      console.error('Failed to pin content:', error);
      throw new Error(`Pinning failed: ${error.message}`);
    }
  }

  /**
   * Get content URL from CID
   * @param {string} cid Content identifier
   * @returns {string} Gateway URL
   */
  getContentUrl(cid) {
    return `${this.gateway}${cid}`;
  }
}

// Create and export singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
