/**
 * Batch IPFS Service
 *
 * Provides functionality to upload multiple files to IPFS in batches
 * with progress tracking, retry capabilities, and metadata handling
 */

// Import dependencies
import { create as ipfsCreate } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// BatchIpfsService singleton
const BatchIpfsService = (function () {
  // Private variables
  let _ipfs = null;
  let _initialized = false;
  let _config = {
    pinning: true,
    chunkSize: 1024 * 1024, // Default 1MB chunks
    endpoint: 'https://ipfs.infura.io:5001',
    concurrency: 3,
    timeout: 60000, // 1 minute timeout
    retryCount: 3,
    retryDelay: 2000 // 2 seconds
  };

  // Batch state
  const _batchState = {
    files: [],
    filesMetadata: new Map(),
    activeUploads: 0,
    totalProcessed: 0,
    successful: 0,
    failed: [],
    failedMetadata: new Map(),
    aborted: false
  };

  /**
   * Initialize the IPFS client
   * @param {Object} config - Configuration options
   * @returns {Promise<void>}
   */
  async function initialize(config = {}) {
    if (_initialized) {
      console.log('BatchIpfsService already initialized');
      return;
    }

    // Merge configs
    _config = { ..._config, ...config };

    try {
      _ipfs = await createIpfsClient();
      _initialized = true;
      console.log('BatchIpfsService initialized with IPFS client');

      // Test connection
      const nodeInfo = await _ipfs.id();
      console.log('Connected to IPFS node:', nodeInfo.id);

      return true;
    } catch (error) {
      console.error('Error initializing IPFS client:', error);
      throw new Error(`Failed to initialize IPFS client: ${error.message}`);
    }
  }

  /**
   * Create an IPFS client
   * @returns {Object} IPFS client instance
   */
  function createIpfsClient() {
    try {
      // Use the configured endpoint or default
      return ipfsCreate({
        host: _config.host || 'ipfs.infura.io',
        port: _config.port || 5001,
        protocol: _config.protocol || 'https',
        timeout: _config.timeout
      });
    } catch (error) {
      console.error('Error creating IPFS client:', error);
      throw error;
    }
  }

  /**
   * Add files to batch
   * @param {File[]} files - Array of File objects to add to the batch
   * @param {Object} metadata - Optional metadata to associate with files
   * @returns {number} Number of files added
   */
  function addFiles(files, metadata = {}) {
    if (!Array.isArray(files)) {
      throw new Error('Files must be provided as an array');
    }

    // Add each file to the batch state
    let addedCount = 0;

    for (const file of files) {
      // Store file with unique ID to avoid duplicates
      const fileId = `${file.name}_${file.size}_${Date.now()}`;
      _batchState.files.push({ file, id: fileId });

      // Store metadata associated with file
      _batchState.filesMetadata.set(fileId, {
        ...metadata,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        // If file has csvData property (from CSV import), include it
        ...(file.csvData ? { csvData: file.csvData } : {})
      });

      addedCount++;
    }

    return addedCount;
  }

  /**
   * Process the batch upload to IPFS
   * @param {Function} progressCallback - Callback for upload progress
   * @param {Function} completeCallback - Callback for upload completion
   * @param {Function} errorCallback - Callback for upload errors
   * @returns {Promise<Object>} Upload result summary
   */
  async function processUpload(
    progressCallback = () => {},
    completeCallback = () => {},
    errorCallback = () => {}
  ) {
    // Check if initialized
    if (!_initialized || !_ipfs) {
      const error = 'IPFS client not initialized. Call initialize() first';
      errorCallback(error);
      throw new Error(error);
    }

    // Reset batch state for new upload
    _batchState.totalProcessed = 0;
    _batchState.successful = 0;
    _batchState.failed = [];
    _batchState.failedMetadata.clear();
    _batchState.aborted = false;

    // Check if we have files to process
    if (_batchState.files.length === 0) {
      const error = 'No files to upload';
      errorCallback(error);
      throw new Error(error);
    }

    const totalFiles = _batchState.files.length;

    try {
      // Process files with limited concurrency
      const results = await processBatchWithConcurrency(
        _batchState.files,
        _config.concurrency,
        progressCallback,
        totalFiles
      );

      // Prepare result summary
      const resultSummary = {
        total: totalFiles,
        successful: _batchState.successful,
        failed: _batchState.failed,
        uploadedFiles: results
          .filter(r => r.success)
          .map(r => ({
            name: r.file.name,
            cid: r.cid,
            size: r.file.size,
            metadata: _batchState.filesMetadata.get(r.id) || {}
          }))
      };

      // Call complete callback with results
      completeCallback(resultSummary);

      return resultSummary;
    } catch (error) {
      console.error('Batch upload process error:', error);
      errorCallback(error.message || 'Unknown error during batch upload');
      throw error;
    }
  }

  /**
   * Process files batch with limited concurrency
   * @param {Array} files - Array of file objects to upload
   * @param {number} concurrency - Number of concurrent uploads
   * @param {Function} progressCallback - Progress callback function
   * @param {number} totalFiles - Total number of files in batch
   * @returns {Promise<Array>} Array of upload results
   */
  async function processBatchWithConcurrency(files, concurrency, progressCallback, totalFiles) {
    const results = [];
    const inProgress = new Set();
    let index = 0;

    // Process until all files are handled
    while (index < files.length || inProgress.size > 0) {
      // Check if upload was aborted
      if (_batchState.aborted) {
        break;
      }

      // Start new uploads if under concurrency limit
      while (inProgress.size < concurrency && index < files.length) {
        const fileItem = files[index];
        index++;

        // Create promise for this file upload
        const uploadPromise = uploadFileToIpfs(fileItem, progressCallback, totalFiles)
          .then(result => {
            // Update upload states
            _batchState.totalProcessed++;
            inProgress.delete(uploadPromise);

            if (result.success) {
              _batchState.successful++;
            } else {
              _batchState.failed.push(fileItem);
              _batchState.failedMetadata.set(fileItem.id, result.error);
            }

            // Update progress to 100% for this file
            progressCallback({
              file: fileItem.file,
              status: result.success ? 'success' : 'error',
              error: result.error,
              cid: result.cid,
              processed: _batchState.totalProcessed,
              total: totalFiles,
              percent: Math.round((_batchState.totalProcessed / totalFiles) * 100)
            });

            return result;
          })
          .catch(error => {
            // Handle unexpected errors
            _batchState.totalProcessed++;
            _batchState.failed.push(fileItem);
            _batchState.failedMetadata.set(fileItem.id, error.message);
            inProgress.delete(uploadPromise);

            // Report error in progress
            progressCallback({
              file: fileItem.file,
              status: 'error',
              error: error.message,
              processed: _batchState.totalProcessed,
              total: totalFiles,
              percent: Math.round((_batchState.totalProcessed / totalFiles) * 100)
            });

            return {
              file: fileItem.file,
              id: fileItem.id,
              success: false,
              error: error.message
            };
          });

        // Add to in-progress set and results array
        inProgress.add(uploadPromise);
        results.push(uploadPromise);
      }

      // Wait for any upload to complete if we've reached the concurrency limit
      if (inProgress.size >= concurrency || (index >= files.length && inProgress.size > 0)) {
        await Promise.race(inProgress);
      }
    }

    // Wait for all results to complete
    return Promise.all(results);
  }

  /**
   * Upload a single file to IPFS
   * @param {Object} fileItem - File object with id and file properties
   * @param {Function} progressCallback - Progress callback
   * @param {number} totalFiles - Total files in batch
   * @returns {Promise<Object>} Upload result
   */
  async function uploadFileToIpfs(fileItem, progressCallback, totalFiles) {
    const { file, id } = fileItem;
    const metadata = _batchState.filesMetadata.get(id) || {};

    // Notify starting upload
    progressCallback({
      file: file,
      status: 'uploading',
      fileProgress: 0,
      processed: _batchState.totalProcessed,
      total: totalFiles,
      percent: Math.round((_batchState.totalProcessed / totalFiles) * 100)
    });

    try {
      // For files larger than the chunk size, use chunked upload
      if (file.size > _config.chunkSize) {
        return await uploadLargeFileWithChunks(fileItem, progressCallback, totalFiles);
      }

      // For smaller files, use direct upload
      // Read the full file
      const buffer = await readFileAsBuffer(file);

      // Create IPFS options
      const options = {
        progress: bytes => {
          const fileProgress = Math.round((bytes / file.size) * 100);
          progressCallback({
            file: file,
            status: 'uploading',
            fileProgress,
            processed: _batchState.totalProcessed,
            total: totalFiles,
            percent: Math.round((_batchState.totalProcessed / totalFiles) * 100)
          });
        }
      };

      // Add pin option if enabled
      if (_config.pinning) {
        options.pin = true;
      }

      // Upload to IPFS with retry logic
      let result = null;
      let attempts = 0;
      let lastError = null;

      while (attempts < _config.retryCount) {
        try {
          // Add file to IPFS
          const added = await _ipfs.add(buffer, options);

          // Return success result
          result = {
            file: file,
            id: id,
            success: true,
            cid: added.cid.toString(),
            size: added.size,
            metadata
          };

          break;
        } catch (error) {
          lastError = error;
          attempts++;

          // Log retry attempt
          console.warn(
            `Upload retry ${attempts}/${_config.retryCount} for file ${file.name}: ${error.message}`
          );

          // If we have more attempts, wait before retrying
          if (attempts < _config.retryCount) {
            await new Promise(resolve => setTimeout(resolve, _config.retryDelay));
          }
        }
      }

      // If we exhausted retries, return error
      if (!result) {
        return {
          file: file,
          id: id,
          success: false,
          error: lastError ? lastError.message : 'Maximum retry attempts exceeded'
        };
      }

      return result;
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      return {
        file: file,
        id: id,
        success: false,
        error: error.message || 'Unknown error during upload'
      };
    }
  }

  /**
   * Upload a large file to IPFS using chunks
   * @param {Object} fileItem - File object with id and file properties
   * @param {Function} progressCallback - Progress callback
   * @param {number} totalFiles - Total files in batch
   * @returns {Promise<Object>} Upload result
   */
  async function uploadLargeFileWithChunks(fileItem, progressCallback, totalFiles) {
    const { file, id } = fileItem;
    const metadata = _batchState.filesMetadata.get(id) || {};

    try {
      // Calculate chunks
      const chunks = Math.ceil(file.size / _config.chunkSize);
      const fileReader = new FileReader();

      // Create IPFS DAG to build the file from chunks
      const dagNode = await _ipfs.dag.put({
        Data: new Uint8Array(0),
        Links: []
      });

      let totalBytesProcessed = 0;

      // Process each chunk
      for (let i = 0; i < chunks; i++) {
        const start = i * _config.chunkSize;
        const end = Math.min((i + 1) * _config.chunkSize, file.size);
        const chunkSize = end - start;

        // Read the chunk
        const chunk = file.slice(start, end);
        const buffer = await readFileAsBuffer(chunk);

        // Upload the chunk with retry logic
        let chunkCid = null;
        let attempts = 0;

        while (attempts < _config.retryCount && !chunkCid) {
          try {
            // Add chunk to IPFS
            const added = await _ipfs.add(buffer, { pin: _config.pinning });
            chunkCid = added.cid;
          } catch (error) {
            attempts++;

            if (attempts >= _config.retryCount) {
              throw new Error(`Failed to upload chunk ${i + 1}/${chunks}: ${error.message}`);
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, _config.retryDelay));
          }
        }

        // Add the chunk to the DAG
        dagNode.Links.push({
          Name: `chunk-${i}`,
          Hash: chunkCid,
          Size: chunkSize
        });

        // Update progress
        totalBytesProcessed += chunkSize;
        const fileProgress = Math.round((totalBytesProcessed / file.size) * 100);

        progressCallback({
          file: file,
          status: 'uploading',
          fileProgress,
          processed: _batchState.totalProcessed,
          total: totalFiles,
          percent: Math.round((_batchState.totalProcessed / totalFiles) * 100)
        });
      }

      // Update the DAG with all chunks
      const finalDagCid = await _ipfs.dag.put(dagNode);

      // Create a wrapper object with file metadata
      const fileObject = {
        path: file.name,
        content: finalDagCid,
        metadata: {
          name: file.name,
          type: file.type,
          size: file.size,
          chunks: chunks,
          ...metadata
        }
      };

      // Add the file metadata to IPFS
      const fileMetadataCid = await _ipfs.add(Buffer.from(JSON.stringify(fileObject)));

      // Return success result
      return {
        file: file,
        id: id,
        success: true,
        cid: fileMetadataCid.cid.toString(),
        size: file.size,
        metadata
      };
    } catch (error) {
      console.error(`Error uploading large file ${file.name}:`, error);
      return {
        file: file,
        id: id,
        success: false,
        error: error.message || 'Unknown error during chunked upload'
      };
    }
  }

  /**
   * Read a file as buffer
   * @param {File} file - File object to read
   * @returns {Promise<Buffer>} File buffer
   */
  function readFileAsBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const buffer = Buffer.from(reader.result);
        resolve(buffer);
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Resume failed uploads
   * @param {Function} progressCallback - Callback for upload progress
   * @param {Function} completeCallback - Callback for upload completion
   * @param {Function} errorCallback - Callback for upload errors
   * @returns {Promise<Object>} Upload result summary
   */
  async function resumeFailedUploads(
    progressCallback = () => {},
    completeCallback = () => {},
    errorCallback = () => {}
  ) {
    // Check if initialized
    if (!_initialized || !_ipfs) {
      const error = 'IPFS client not initialized. Call initialize() first';
      errorCallback(error);
      throw new Error(error);
    }

    // Check if we have failed uploads to resume
    if (_batchState.failed.length === 0) {
      const result = { total: 0, successful: 0, failed: [] };
      completeCallback(result);
      return result;
    }

    // Reset tracking state but keep failed files
    const failedFiles = [..._batchState.failed];
    _batchState.failed = [];
    _batchState.totalProcessed = 0;
    _batchState.successful = 0;
    _batchState.aborted = false;

    const totalFiles = failedFiles.length;

    try {
      // Process failed files with concurrency limit
      const results = await processBatchWithConcurrency(
        failedFiles,
        _config.concurrency,
        progressCallback,
        totalFiles
      );

      // Prepare result summary
      const resultSummary = {
        total: totalFiles,
        successful: _batchState.successful,
        failed: _batchState.failed,
        uploadedFiles: results
          .filter(r => r.success)
          .map(r => ({
            name: r.file.name,
            cid: r.cid,
            size: r.file.size,
            metadata: _batchState.filesMetadata.get(r.id) || {}
          }))
      };

      // Call complete callback with results
      completeCallback(resultSummary);

      return resultSummary;
    } catch (error) {
      console.error('Resume upload process error:', error);
      errorCallback(error.message || 'Unknown error during resuming uploads');
      throw error;
    }
  }

  /**
   * Abort ongoing upload process
   */
  function abortUpload() {
    _batchState.aborted = true;
    return {
      successful: _batchState.successful,
      failed: _batchState.failed.length,
      remaining: _batchState.files.length - _batchState.totalProcessed
    };
  }

  /**
   * Clear batch state
   */
  function clearBatch() {
    _batchState.files = [];
    _batchState.filesMetadata.clear();
    _batchState.failed = [];
    _batchState.failedMetadata.clear();
    _batchState.totalProcessed = 0;
    _batchState.successful = 0;
    _batchState.aborted = false;

    return true;
  }

  /**
   * Get batch upload statistics
   * @returns {Object} Batch statistics
   */
  function getBatchStats() {
    return {
      total: _batchState.files.length,
      processed: _batchState.totalProcessed,
      successful: _batchState.successful,
      failed: _batchState.failed.length,
      inProgress: _batchState.files.length - _batchState.totalProcessed
    };
  }

  // Public API
  return {
    initialize,
    addFiles,
    processUpload,
    resumeFailedUploads,
    abortUpload,
    clearBatch,
    getBatchStats
  };
})();

// Export as default
export default BatchIpfsService;
