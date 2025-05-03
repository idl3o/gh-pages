/**
 * Batch IPFS Service
 *
 * Provides functionality to upload multiple files to IPFS in batches
 * with progress tracking and retry capabilities
 */

class BatchIpfsService {
  constructor() {
    this.maxBatchSize = 50;
    this.currentBatch = [];
    this.failedItems = [];
    this.inProgress = false;
    this.initialized = false;
    this.config = {
      pinning: true,
      chunkSize: 1024 * 1024, // Default 1MB chunks
      timeout: 60000 // 1 minute timeout
    };
  }

  /**
   * Initialize the IPFS service for batch uploads
   * @param {Object} config - Configuration options
   * @returns {Promise<Boolean>} Initialization success status
   */
  async initialize(config = {}) {
    if (this.initialized) return true;

    try {
      // Merge provided config with defaults
      this.config = { ...this.config, ...config };

      // Check if window.redx.ipfs exists
      if (!window.redx || !window.redx.ipfs) {
        console.warn('window.redx.ipfs not found. Batch uploads may use a mock implementation.');
      } else {
        console.log('IPFS service found. Batch uploads will use existing IPFS service.');
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize BatchIpfsService:', error);
      throw error;
    }
  }

  /**
   * Add files to the batch for upload
   * @param {FileList|Array} files - Files to add to the batch
   * @returns {Number} Number of files added
   */
  addFiles(files) {
    const remaining = this.maxBatchSize - this.currentBatch.length;
    const toAdd = Array.from(files).slice(0, remaining);

    this.currentBatch = this.currentBatch.concat(toAdd);

    console.log(
      `Added ${toAdd.length} files to batch. Batch size: ${this.currentBatch.length}/${this.maxBatchSize}`
    );

    return toAdd.length;
  }

  /**
   * Process batch upload to IPFS
   * @param {Function} progressCallback - Called with progress updates
   * @param {Function} completeCallback - Called when batch is complete
   * @param {Function} errorCallback - Called if there's an error
   * @returns {Boolean} Whether upload started successfully
   */
  async processUpload(progressCallback, completeCallback, errorCallback) {
    if (this.inProgress) {
      if (errorCallback) errorCallback('Batch upload already in progress');
      return false;
    }

    if (this.currentBatch.length === 0) {
      if (errorCallback) errorCallback('No files in batch to upload');
      return false;
    }

    this.inProgress = true;
    this.failedItems = [];

    const total = this.currentBatch.length;
    let processed = 0;
    const results = [];

    // Process files one at a time
    const processNext = async index => {
      if (index >= total) {
        // All done
        this.inProgress = false;
        if (completeCallback) {
          completeCallback({
            total: total,
            successful: total - this.failedItems.length,
            failed: this.failedItems,
            results: results
          });
        }
        return;
      }

      const file = this.currentBatch[index];

      try {
        // Report start of processing for this file
        if (progressCallback) {
          progressCallback({
            file: file,
            index: index,
            processed: processed,
            total: total,
            percent: Math.round((processed / total) * 100),
            status: 'uploading'
          });
        }

        // Upload file to IPFS
        let result;

        if (window.redx && window.redx.ipfs && window.redx.ipfs.uploadFile) {
          // Use existing IPFS service
          result = await window.redx.ipfs.uploadFile(
            file,
            {},
            // Individual file progress callback
            fileProgress => {
              if (progressCallback) {
                progressCallback({
                  file: file,
                  index: index,
                  processed: processed,
                  total: total,
                  percent:
                    Math.round((processed / total) * 100) +
                    Math.round((fileProgress * 0.9) / total),
                  status: 'uploading',
                  fileProgress: Math.round(fileProgress)
                });
              }
            }
          );
        } else {
          // Simulate upload if no IPFS service exists
          await this._simulateFileUpload(file, progress => {
            if (progressCallback) {
              progressCallback({
                file: file,
                index: index,
                processed: processed,
                total: total,
                percent:
                  Math.round((processed / total) * 100) + Math.round((progress * 0.9) / total),
                status: 'uploading',
                fileProgress: Math.round(progress)
              });
            }
          });

          // Simulate CID creation
          const bytes = new Uint8Array(32);
          window.crypto.getRandomValues(bytes);
          const mockCid =
            'Qm' +
            Array.from(bytes)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');

          result = {
            cid: mockCid,
            size: file.size,
            name: file.name
          };
        }

        processed++;
        results.push({
          file: file,
          result: result,
          success: true
        });

        // Report progress
        if (progressCallback) {
          progressCallback({
            file: file,
            index: index,
            processed: processed,
            total: total,
            percent: Math.round((processed / total) * 100),
            status: 'success',
            cid: result.cid
          });
        }

        // Process next file
        processNext(index + 1);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);

        processed++;
        this.failedItems.push({
          file: file,
          index: index,
          error: error.message || 'Unknown upload error'
        });

        // Report failure
        if (progressCallback) {
          progressCallback({
            file: file,
            index: index,
            processed: processed,
            total: total,
            percent: Math.round((processed / total) * 100),
            status: 'error',
            error: error.message
          });
        }

        // Continue with next file despite error
        processNext(index + 1);
      }
    };

    // Start processing
    processNext(0);
    return true;
  }

  /**
   * Simulate a file upload with progress for testing
   * @param {File} file - The file to simulate uploading
   * @param {Function} progressCallback - Progress callback function
   * @returns {Promise} Promise that resolves when upload is complete
   * @private
   */
  _simulateFileUpload(file, progressCallback) {
    return new Promise(resolve => {
      const size = file.size;
      const chunkSize = Math.max(size / 10, 10000); // Either 1/10th of file or min 10KB
      let uploaded = 0;

      const simulateProgress = () => {
        if (uploaded < size) {
          // Simulate uploading a chunk
          uploaded += chunkSize;
          if (uploaded > size) uploaded = size;

          const progress = (uploaded / size) * 100;
          progressCallback(progress);

          if (uploaded < size) {
            // Continue simulation
            setTimeout(simulateProgress, 200);
          } else {
            // Complete simulation
            resolve();
          }
        } else {
          resolve();
        }
      };

      // Start simulation
      setTimeout(simulateProgress, 200);
    });
  }

  /**
   * Clear the current batch
   * @returns {Number} Number of files cleared
   */
  clearBatch() {
    if (this.inProgress) return 0;

    const count = this.currentBatch.length;
    this.currentBatch = [];
    this.failedItems = [];
    return count;
  }

  /**
   * Resume uploading failed items
   * @param {Function} progressCallback - Called with progress updates
   * @param {Function} completeCallback - Called when batch is complete
   * @param {Function} errorCallback - Called if there's an error
   * @returns {Boolean} Whether resume started successfully
   */
  async resumeFailedUploads(progressCallback, completeCallback, errorCallback) {
    if (this.inProgress) {
      if (errorCallback) errorCallback('Upload already in progress');
      return false;
    }

    if (this.failedItems.length === 0) {
      if (errorCallback) errorCallback('No failed uploads to retry');
      return false;
    }

    this.inProgress = true;

    // Create a new batch with just the failed items
    const filesToRetry = this.failedItems.map(item => item.file);
    const currentFailedItems = [...this.failedItems];

    this.failedItems = [];

    const total = filesToRetry.length;
    let processed = 0;
    const results = [];

    // Process files one at a time
    const processNext = async index => {
      if (index >= total) {
        // All done
        this.inProgress = false;

        // Remove successfully processed items from the currentBatch
        currentFailedItems.forEach(failedItem => {
          const fileIndex = this.currentBatch.findIndex(
            file => file.name === failedItem.file.name && file.size === failedItem.file.size
          );

          if (fileIndex !== -1) {
            if (!this.failedItems.find(item => item.file === this.currentBatch[fileIndex])) {
              this.currentBatch.splice(fileIndex, 1);
            }
          }
        });

        if (completeCallback) {
          completeCallback({
            total: total,
            successful: total - this.failedItems.length,
            failed: this.failedItems,
            results: results
          });
        }
        return;
      }

      const file = filesToRetry[index];

      try {
        // Report start of processing for this file
        if (progressCallback) {
          progressCallback({
            file: file,
            index: index,
            processed: processed,
            total: total,
            percent: Math.round((processed / total) * 100),
            status: 'uploading'
          });
        }

        // Upload file to IPFS
        let result;

        if (window.redx && window.redx.ipfs && window.redx.ipfs.uploadFile) {
          // Use existing IPFS service
          result = await window.redx.ipfs.uploadFile(
            file,
            {},
            // Individual file progress callback
            fileProgress => {
              if (progressCallback) {
                progressCallback({
                  file: file,
                  index: index,
                  processed: processed,
                  total: total,
                  percent:
                    Math.round((processed / total) * 100) +
                    Math.round((fileProgress * 0.9) / total),
                  status: 'uploading',
                  fileProgress: Math.round(fileProgress)
                });
              }
            }
          );
        } else {
          // Simulate upload if no IPFS service exists
          await this._simulateFileUpload(file, progress => {
            if (progressCallback) {
              progressCallback({
                file: file,
                index: index,
                processed: processed,
                total: total,
                percent:
                  Math.round((processed / total) * 100) + Math.round((progress * 0.9) / total),
                status: 'uploading',
                fileProgress: Math.round(progress)
              });
            }
          });

          // Simulate CID creation
          const bytes = new Uint8Array(32);
          window.crypto.getRandomValues(bytes);
          const mockCid =
            'Qm' +
            Array.from(bytes)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');

          result = {
            cid: mockCid,
            size: file.size,
            name: file.name
          };
        }

        processed++;
        results.push({
          file: file,
          result: result,
          success: true
        });

        // Report progress
        if (progressCallback) {
          progressCallback({
            file: file,
            index: index,
            processed: processed,
            total: total,
            percent: Math.round((processed / total) * 100),
            status: 'success',
            cid: result.cid
          });
        }

        // Process next file
        processNext(index + 1);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);

        processed++;
        this.failedItems.push({
          file: file,
          index: index,
          error: error.message || 'Unknown upload error'
        });

        // Report failure
        if (progressCallback) {
          progressCallback({
            file: file,
            index: index,
            processed: processed,
            total: total,
            percent: Math.round((processed / total) * 100),
            status: 'error',
            error: error.message
          });
        }

        // Continue with next file despite error
        processNext(index + 1);
      }
    };

    // Start processing
    processNext(0);
    return true;
  }

  /**
   * Set the maximum batch size
   * @param {Number} size - Maximum number of files in a batch
   */
  setMaxBatchSize(size) {
    if (size > 0 && size <= 100) {
      this.maxBatchSize = size;
    }
  }
}

// Create and export a singleton instance
const batchIpfsService = new BatchIpfsService();
export { batchIpfsService as default };
