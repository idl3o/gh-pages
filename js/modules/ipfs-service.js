/**
 * IPFS Service for StreamChain Creator Dashboard
 *
 * This module provides functionality to interact with IPFS for decentralized file storage.
 * It includes methods for uploading files, tracking upload progress, and retrieving content.
 */

import { create } from 'ipfs-http-client';

class IpfsService {
  constructor() {
    // Default IPFS config points to Infura's IPFS gateway
    this.defaultConfig = {
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      apiPath: '/api/v0',
      headers: {
        authorization: ''
      }
    };

    this.ipfs = null;
    this.isConnected = false;
    this.progressCallbacks = new Map();
    this.uploadTasks = new Map();
  }

  /**
   * Initialize IPFS client with authentication if provided
   * @param {Object} config - Custom IPFS configuration (optional)
   * @param {String} projectId - Infura project ID (optional)
   * @param {String} projectSecret - Infura project secret (optional)
   * @returns {Boolean} Connection success status
   */
  async initialize(config = null, projectId = null, projectSecret = null) {
    try {
      // Apply custom config or use default
      const ipfsConfig = config || { ...this.defaultConfig };

      // Add authentication if provided
      if (projectId && projectSecret) {
        const auth = 'Basic ' + btoa(projectId + ':' + projectSecret);
        ipfsConfig.headers.authorization = auth;
      }

      // Create IPFS client instance
      this.ipfs = create(ipfsConfig);

      // Test connection by getting the node ID
      const nodeInfo = await this.ipfs.id();
      console.log('Connected to IPFS node:', nodeInfo.id);
      this.isConnected = true;

      return true;
    } catch (error) {
      console.error('Error initializing IPFS client:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Upload a single file to IPFS with progress tracking
   * @param {File} file - File object to upload
   * @param {Function} onProgress - Progress callback function(progress, bytesUploaded, totalBytes)
   * @param {Function} onComplete - Completion callback function(cid, metadata)
   * @param {Function} onError - Error callback function(error)
   * @returns {Object} Upload task object
   */
  async uploadFile(file, onProgress, onComplete, onError) {
    if (!this.isConnected) {
      const connected = await this.initialize();
      if (!connected) {
        if (onError) onError(new Error('IPFS client not connected'));
        return null;
      }
    }

    try {
      // Generate a unique task ID for this upload
      const taskId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);

      // Register callbacks
      if (onProgress) this.progressCallbacks.set(taskId, onProgress);

      // Prepare metadata
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        uploadStartTime: Date.now()
      };

      // Track this upload task
      const task = {
        id: taskId,
        file: file,
        metadata: metadata,
        progress: 0,
        bytesUploaded: 0,
        status: 'uploading'
      };

      this.uploadTasks.set(taskId, task);

      // Create readable stream from file
      const fileStream = this._createReadableStream(file, taskId);

      // Upload to IPFS
      const { cid } = await this.ipfs.add(fileStream, {
        progress: bytes => this._updateProgress(taskId, bytes, file.size)
      });

      // Update task status
      task.status = 'completed';
      task.cid = cid.toString();
      task.metadata.uploadEndTime = Date.now();
      task.metadata.ipfsUri = `ipfs://${cid}`;
      task.metadata.gateway = `https://ipfs.io/ipfs/${cid}`;

      // Trigger completion callback
      if (onComplete) onComplete(cid.toString(), task.metadata);

      return task;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      if (onError) onError(error);
      return null;
    }
  }

  /**
   * Upload multiple files to IPFS with progress tracking
   * @param {Array<File>} files - Array of File objects
   * @param {Function} onProgress - Overall progress callback function
   * @param {Function} onFileComplete - Per-file completion callback
   * @param {Function} onAllComplete - All files completion callback
   * @param {Function} onError - Error callback
   * @returns {Array} Array of upload tasks
   */
  async uploadMultipleFiles(files, onProgress, onFileComplete, onAllComplete, onError) {
    const tasks = [];
    let totalSize = 0;
    let totalUploaded = 0;
    const results = [];

    // Calculate total size of all files
    for (const file of files) {
      totalSize += file.size;
    }

    // Upload each file
    for (const [index, file] of Array.from(files).entries()) {
      try {
        // Individual file progress tracking
        const fileProgress = (progress, bytesUploaded) => {
          // Update total progress
          totalUploaded = (totalUploaded - tasks[index]?.bytesUploaded || 0) + bytesUploaded;
          const overallProgress = Math.min(Math.floor((totalUploaded / totalSize) * 100), 100);

          // Update task info
          if (tasks[index]) {
            tasks[index].bytesUploaded = bytesUploaded;
            tasks[index].progress = progress;
          }

          // Call overall progress callback
          if (onProgress) onProgress(overallProgress, totalUploaded, totalSize, index);
        };

        // Upload the file
        const task = await this.uploadFile(
          file,
          fileProgress,
          (cid, metadata) => {
            results.push({ cid, metadata, file });
            if (onFileComplete) onFileComplete(cid, metadata, index, files.length);

            // Check if all files are uploaded
            if (results.length === files.length && onAllComplete) {
              onAllComplete(results);
            }
          },
          onError
        );

        tasks.push(task);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        if (onError) onError(error, file);
      }
    }

    return tasks;
  }

  /**
   * Helper method to create a readable stream from a file with progress tracking
   * @param {File} file - File object to stream
   * @param {String} taskId - The task ID for tracking progress
   * @returns {ReadableStream} A readable stream of the file
   * @private
   */
  _createReadableStream(file, taskId) {
    // This is a simplified implementation that works with ipfs-http-client
    return {
      [Symbol.asyncIterator]: async function* () {
        // Use file.stream() if available (modern browsers)
        if (typeof file.stream === 'function') {
          const reader = file.stream().getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              yield value;
            }
          } finally {
            reader.releaseLock();
          }
        } else {
          // Fallback to FileReader for older browsers
          const chunkSize = 1024 * 1024; // 1MB chunks
          let offset = 0;

          while (offset < file.size) {
            const chunk = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = e => resolve(new Uint8Array(e.target.result));
              reader.onerror = reject;

              const slice = file.slice(offset, offset + chunkSize);
              reader.readAsArrayBuffer(slice);
            });

            offset += chunk.length;
            yield chunk;
          }
        }
      }
    };
  }

  /**
   * Update progress for a specific upload task
   * @param {String} taskId - The task ID
   * @param {Number} bytesUploaded - Bytes uploaded so far
   * @param {Number} totalBytes - Total bytes to upload
   * @private
   */
  _updateProgress(taskId, bytesUploaded, totalBytes) {
    const task = this.uploadTasks.get(taskId);
    if (!task) return;

    const progress = Math.min(Math.floor((bytesUploaded / totalBytes) * 100), 100);
    task.progress = progress;
    task.bytesUploaded = bytesUploaded;

    // Call progress callback if registered
    const progressCallback = this.progressCallbacks.get(taskId);
    if (progressCallback) {
      progressCallback(progress, bytesUploaded, totalBytes);
    }
  }

  /**
   * Get the status of an upload task
   * @param {String} taskId - The task ID
   * @returns {Object|null} Task status object or null if not found
   */
  getTaskStatus(taskId) {
    return this.uploadTasks.get(taskId) || null;
  }

  /**
   * Cancel an ongoing upload task
   * @param {String} taskId - The task ID
   * @returns {Boolean} True if successfully cancelled
   */
  cancelTask(taskId) {
    const task = this.uploadTasks.get(taskId);
    if (!task) return false;

    task.status = 'cancelled';
    this.progressCallbacks.delete(taskId);
    return true;
  }

  /**
   * Generate a gateway URL for accessing IPFS content
   * @param {String} cid - Content identifier
   * @param {String} gateway - Gateway URL (default: ipfs.io)
   * @returns {String} Gateway URL to access the content
   */
  getGatewayUrl(cid, gateway = 'https://ipfs.io/ipfs/') {
    if (!cid) return null;

    // Ensure gateway URL ends with a slash
    const baseUrl = gateway.endsWith('/') ? gateway : gateway + '/';
    return baseUrl + cid;
  }
}

// Export singleton instance
const ipfsService = new IpfsService();
export default ipfsService;
