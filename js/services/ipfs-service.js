/**
 * IPFS Service
 * Handles connection to IPFS nodes and file uploads with progress tracking
 */

// Import the IPFS HTTP client
import { create } from 'https://cdn.jsdelivr.net/npm/ipfs-http-client/dist/index.min.js';
import ipfsQueueManager from './ipfs-queue-manager.js';

class IPFSService {
  constructor() {
    this.ipfs = null;
    this.isInitialized = false;
    this.gateway = 'https://ipfs.io/ipfs/';
    this.config = {
      pinning: true,
      timeout: 60000, // 60 seconds
      chunkSize: 262144 // 256KB chunks for uploads
    };
    this.fallbackNodes = [
      'https://ipfs.infura.io:5001',
      'https://cloudflare-ipfs.com',
      'https://gateway.pinata.cloud',
      'https://dweb.link'
    ];
    this.currentNodeIndex = 0;
  }

  /**
   * Initialize the IPFS service with configuration
   * @param {Object} config Configuration options
   * @returns {Promise} Resolves when initialized
   */
  async initialize(config = {}) {
    try {
      // Merge default config with provided config
      this.config = {
        ...this.config,
        ...config
      };

      // Set gateway
      if (config.gateway) {
        this.gateway = config.gateway;
      }

      // Try to create IPFS client with primary node
      await this.connectToNode(config.apiUrl || 'https://ipfs.infura.io:5001', config.authToken);

      return true;
    } catch (error) {
      console.error('Failed to initialize primary IPFS node:', error);

      // Try fallback nodes if primary fails
      return this.tryFallbackNodes(config.authToken);
    }
  }

  /**
   * Try connecting to fallback nodes if primary node fails
   * @param {String} authToken Authorization token if needed
   * @returns {Promise<boolean>} True if successful connection
   */
  async tryFallbackNodes(authToken) {
    for (let i = 0; i < this.fallbackNodes.length; i++) {
      try {
        console.log(`Trying fallback IPFS node ${i + 1}/${this.fallbackNodes.length}`);
        await this.connectToNode(this.fallbackNodes[i], authToken);
        return true;
      } catch (error) {
        console.warn(`Failed to connect to fallback node ${i + 1}:`, error);
      }
    }

    throw new Error('Failed to connect to any IPFS node. Please check your connection.');
  }

  /**
   * Connect to a specific IPFS node
   * @param {String} apiUrl The API URL of the node
   * @param {String} authToken Authorization token if needed
   * @returns {Promise<void>} Resolves when connected
   */
  async connectToNode(apiUrl, authToken) {
    // Create IPFS client
    this.ipfs = create({
      host: new URL(apiUrl).hostname,
      port: new URL(apiUrl).port || 443,
      protocol: new URL(apiUrl).protocol.replace(':', '') || 'https',
      headers: authToken
        ? {
            authorization: authToken
          }
        : {}
    });

    // Test connection by getting node info
    const nodeInfo = await this.ipfs.id();
    console.log('Connected to IPFS node:', nodeInfo.id);
    this.isInitialized = true;
    this.currentApiUrl = apiUrl;
  }

  /**
   * Switch to a different IPFS node if current one is having issues
   * @returns {Promise<boolean>} True if switched successfully
   */
  async switchNode() {
    if (this.fallbackNodes.length === 0) {
      return false;
    }

    this.currentNodeIndex = (this.currentNodeIndex + 1) % this.fallbackNodes.length;
    const newNodeUrl = this.fallbackNodes[this.currentNodeIndex];

    try {
      await this.connectToNode(newNodeUrl);
      console.log(`Switched to IPFS node: ${newNodeUrl}`);
      return true;
    } catch (error) {
      console.error(`Failed to switch to node ${newNodeUrl}:`, error);
      return this.switchNode(); // Try next node recursively
    }
  }

  /**
   * Ensure the service is initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('IPFS service not initialized. Call initialize() first.');
    }
  }

  /**
   * Upload a single file to IPFS using queue manager
   * @param {File} file The file to upload
   * @param {Object} options Upload options
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} The upload result
   */
  uploadFile(file, options = {}, onProgress = null) {
    // Calculate priority based on file size (smaller files get higher priority)
    const fileSizeMB = file.size / (1024 * 1024);
    const priority = Math.min(10, Math.max(1, Math.ceil(fileSizeMB / 5)));

    // Queue the upload operation
    return ipfsQueueManager.enqueue(
      () => this._uploadFileInternal(file, options, onProgress),
      priority,
      'upload'
    );
  }

  /**
   * Internal method for file upload (used by queue manager)
   * @param {File} file The file to upload
   * @param {Object} options Upload options
   * @param {Function} onProgress Progress callback
   * @returns {Promise<Object>} The upload result
   */
  async _uploadFileInternal(file, options = {}, onProgress = null) {
    this.ensureInitialized();

    try {
      // Prepare file for upload
      const fileData = await this.prepareFileForUpload(file);

      // Create a readable stream from the file
      const stream = this.createReadableStream(fileData, onProgress);

      let result;
      try {
        // Add file to IPFS with progress tracking
        result = await this.ipfs.add(stream, {
          pin: options.pin !== undefined ? options.pin : this.config.pinning,
          progress: onProgress
            ? bytes => {
                const percentage = Math.round((bytes / fileData.size) * 100);
                onProgress(percentage, bytes, fileData.size);
              }
            : undefined
        });
      } catch (error) {
        // Check for the priority error
        if (error.message && error.message.includes('No lowest priority node found')) {
          // Try switching nodes
          const switched = await this.switchNode();
          if (switched) {
            // Retry with the new node
            return this._uploadFileInternal(file, options, onProgress);
          }
        }
        throw error;
      }

      // Format and return result
      const formattedResult = {
        cid: result.cid.toString(),
        size: result.size,
        path: result.path,
        ipfsUrl: `${this.gateway}${result.cid.toString()}`,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream'
      };

      // Pin the file if specified
      if (
        (options.pin !== undefined ? options.pin : this.config.pinning) &&
        this.config.apiUrl &&
        this.config.apiUrl.includes('pinata')
      ) {
        try {
          await this.pinFile(formattedResult.cid);
        } catch (pinError) {
          console.warn('Failed to pin file:', pinError);
          // Continue even if pinning fails
        }
      }

      return formattedResult;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to IPFS with progress tracking
   * @param {Array<File>} files Array of files to upload
   * @param {Object} options Upload options
   * @param {Function} onFileProgress Progress callback for individual files
   * @param {Function} onTotalProgress Progress callback for overall progress
   * @returns {Promise<Array<Object>>} The upload results
   */
  uploadFiles(files, options = {}, onFileProgress = null, onTotalProgress = null) {
    // Create a single queued operation for all files
    return ipfsQueueManager.enqueue(
      () => this._uploadFilesInternal(files, options, onFileProgress, onTotalProgress),
      2, // Higher priority for batch uploads
      'upload-batch'
    );
  }

  /**
   * Internal method for uploading multiple files
   */
  async _uploadFilesInternal(files, options = {}, onFileProgress = null, onTotalProgress = null) {
    this.ensureInitialized();

    // Track total upload progress
    let totalSize = files.reduce((sum, file) => sum + file.size, 0);
    let uploadedSize = 0;

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSize = file.size;

      try {
        // Upload file directly (don't queue individual files within batch)
        const result = await this._uploadFileInternal(
          file,
          options,
          // Progress callback for individual file
          (percentage, uploaded, total) => {
            // Call file progress callback if provided
            if (onFileProgress) {
              onFileProgress(i, percentage, uploaded, total);
            }

            // Update total progress
            const newUploadedSize = uploadedSize + uploaded;
            const totalPercentage = (newUploadedSize / totalSize) * 100;

            // Call total progress callback if provided
            if (onTotalProgress) {
              onTotalProgress(totalPercentage, newUploadedSize, totalSize);
            }
          }
        );

        // Add result to results array
        results.push(result);

        // Update uploaded size for total progress calculation
        uploadedSize += fileSize;

        // Update total progress one last time to ensure 100% for this file
        if (onTotalProgress) {
          onTotalProgress((uploadedSize / totalSize) * 100, uploadedSize, totalSize);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Pin a file on IPFS
   * @param {string} cid The CID of the file to pin
   * @returns {Promise<boolean>} True if successful
   */
  pinFile(cid) {
    return ipfsQueueManager.enqueue(
      () => this._pinFileInternal(cid),
      3, // Medium priority
      'pin'
    );
  }

  /**
   * Internal method for pinning a file
   */
  async _pinFileInternal(cid) {
    this.ensureInitialized();

    try {
      await this.ipfs.pin.add(cid);
      return true;
    } catch (error) {
      // Check for priority error
      if (error.message && error.message.includes('No lowest priority node found')) {
        // Try switching nodes
        const switched = await this.switchNode();
        if (switched) {
          // Retry with the new node
          return this._pinFileInternal(cid);
        }
      }

      console.error('IPFS pin error:', error);
      throw new Error(`Failed to pin file on IPFS: ${error.message}`);
    }
  }

  /**
   * Prepare file for upload (read as array buffer)
   * @param {File} file The file to prepare
   * @returns {Promise<Object>} The prepared file data
   */
  async prepareFileForUpload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve({
          content: reader.result,
          size: file.size,
          type: file.type,
          name: file.name
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Create a readable stream from file data with progress tracking
   * @param {Object} fileData The file data object
   * @param {Function} onProgress Progress callback
   * @returns {Object} A readable stream object for IPFS
   */
  createReadableStream(fileData, onProgress = null) {
    // Create an iterator that chunks the file for upload
    const iterator = {
      [Symbol.asyncIterator]() {
        const content = new Uint8Array(fileData.content);
        const chunkSize = this.config.chunkSize || 262144; // 256KB chunks
        let position = 0;
        let bytesRead = 0;

        return {
          next: async () => {
            if (position >= content.length) {
              return { done: true };
            }

            const end = Math.min(position + chunkSize, content.length);
            const chunk = content.slice(position, end);

            position = end;
            bytesRead += chunk.length;

            // Call progress callback if provided
            if (onProgress) {
              const percentage = Math.round((bytesRead / content.length) * 100);
              onProgress(percentage, bytesRead, content.length);
            }

            // Simulate network latency to make progress visible
            if (chunk.length < chunkSize) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            return {
              done: false,
              value: chunk
            };
          }
        };
      }
    };

    return iterator;
  }

  /**
   * Get file from IPFS by CID
   * @param {string} cid The CID of the file to get
   * @returns {Promise<Uint8Array>} The file content
   */
  getFile(cid) {
    return ipfsQueueManager.enqueue(
      () => this._getFileInternal(cid),
      4, // Lower priority than uploads
      'get'
    );
  }

  /**
   * Internal method for getting a file
   */
  async _getFileInternal(cid) {
    this.ensureInitialized();

    try {
      const chunks = [];
      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }

      // Combine all chunks into a single Uint8Array
      const allChunksLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const content = new Uint8Array(allChunksLength);

      let offset = 0;
      for (const chunk of chunks) {
        content.set(chunk, offset);
        offset += chunk.length;
      }

      return content;
    } catch (error) {
      // Check for priority error
      if (error.message && error.message.includes('No lowest priority node found')) {
        // Try switching nodes
        const switched = await this.switchNode();
        if (switched) {
          // Retry with the new node
          return this._getFileInternal(cid);
        }
      }

      console.error('IPFS get file error:', error);
      throw new Error(`Failed to get file from IPFS: ${error.message}`);
    }
  }

  /**
   * Check if a CID exists in IPFS
   * @param {string} cid The CID to check
   * @returns {Promise<boolean>} True if exists
   */
  checkIfExists(cid) {
    return ipfsQueueManager.enqueue(
      () => this._checkIfExistsInternal(cid),
      5, // Lowest priority
      'check'
    );
  }

  /**
   * Internal method for checking if a CID exists
   */
  async _checkIfExistsInternal(cid) {
    this.ensureInitialized();

    try {
      // Try to get the file stat - will throw if not found
      await this.ipfs.files.stat(`/ipfs/${cid}`);
      return true;
    } catch (error) {
      if (error.message.includes('does not exist')) {
        return false;
      }

      // Check for priority error
      if (error.message && error.message.includes('No lowest priority node found')) {
        // Try switching nodes
        const switched = await this.switchNode();
        if (switched) {
          // Retry with the new node
          return this._checkIfExistsInternal(cid);
        }
      }

      throw error;
    }
  }

  /**
   * Get URL for a CID using the configured gateway
   * @param {string} cid The CID to get URL for
   * @returns {string} The IPFS gateway URL
   */
  getGatewayUrl(cid) {
    return `${this.gateway}${cid}`;
  }

  /**
   * Get queue status for IPFS operations
   * @returns {Object} Queue status information
   */
  getQueueStatus() {
    return {
      activeRequests: ipfsQueueManager.getActiveRequestCount(),
      queueLength: ipfsQueueManager.getQueueLength(),
      requests: ipfsQueueManager.getRequestStatus()
    };
  }
}

// Export singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
