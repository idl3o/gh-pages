/**
 * Upload Manager for StreamChain Creator Dashboard
 *
 * Manages the file upload process including:
 * - Local file validation and processing
 * - IPFS upload integration with progress tracking
 * - Support for different storage options (IPFS, centralized, hybrid)
 */

import ipfsService from './ipfs-service.js';

class UploadManager {
  constructor() {
    // Upload configuration
    this.config = {
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
      acceptedFileTypes: {
        video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        document: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      },
      thumbnailSizes: {
        small: { width: 320, height: 180 },
        medium: { width: 640, height: 360 },
        large: { width: 1280, height: 720 }
      },
      uploadQuality: 'medium', // 'high', 'medium', 'low'
      storageType: 'ipfs', // 'ipfs', 'standard', 'hybrid'
      ipfsGateway: 'https://ipfs.io/ipfs/'
    };

    // Upload state
    this.state = {
      selectedFiles: [],
      uploadTasks: [],
      currentUpload: null,
      isUploading: false,
      uploadProgress: 0,
      completedUploads: [],
      failedUploads: []
    };

    // IPFS credentials - should be loaded from secure config
    this.ipfsCredentials = {
      projectId: '',
      projectSecret: ''
    };

    // Initialize IPFS service
    this._initializeIpfsService();
  }

  /**
   * Initialize the IPFS service with credentials if available
   * @private
   */
  async _initializeIpfsService() {
    try {
      // Check for stored credentials in local storage (for testing only, in production use secure storage)
      const storedCredentials = localStorage.getItem('ipfsCredentials');
      if (storedCredentials) {
        this.ipfsCredentials = JSON.parse(storedCredentials);
      }

      // Initialize IPFS service
      const connected = await ipfsService.initialize(
        null, // Use default config
        this.ipfsCredentials.projectId,
        this.ipfsCredentials.projectSecret
      );

      return connected;
    } catch (error) {
      console.error('Failed to initialize IPFS service:', error);
      return false;
    }
  }

  /**
   * Set IPFS credentials and reinitialize the service
   * @param {String} projectId - Infura IPFS project ID
   * @param {String} projectSecret - Infura IPFS project secret
   */
  async setIpfsCredentials(projectId, projectSecret) {
    this.ipfsCredentials = { projectId, projectSecret };

    // Store credentials (for testing only - in production use secure storage)
    localStorage.setItem('ipfsCredentials', JSON.stringify(this.ipfsCredentials));

    // Reinitialize IPFS service
    return await this._initializeIpfsService();
  }

  /**
   * Update upload configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Add files to the upload queue
   * @param {FileList|Array} files - Files to add to the queue
   * @returns {Array} Array of processed file objects
   */
  addFiles(files) {
    const processedFiles = [];

    // Convert FileList to array if needed
    const filesArray = Array.from(files);

    for (const file of filesArray) {
      // Validate file
      const validationResult = this._validateFile(file);
      if (!validationResult.valid) {
        this.state.failedUploads.push({
          file,
          error: validationResult.error
        });
        continue;
      }

      // Add file type category
      const fileType = this._getFileTypeCategory(file.type);

      // Create processed file object
      const processedFile = {
        file,
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        typeCategory: fileType,
        lastModified: file.lastModified,
        progress: 0,
        status: 'pending',
        uploadTime: null,
        cid: null
      };

      // Add preview URL if it's an image
      if (fileType === 'image') {
        processedFile.previewUrl = URL.createObjectURL(file);
      }

      processedFiles.push(processedFile);
      this.state.selectedFiles.push(processedFile);
    }

    return processedFiles;
  }

  /**
   * Remove a file from the upload queue
   * @param {String} fileId - ID of the file to remove
   * @returns {Boolean} Success status
   */
  removeFile(fileId) {
    const index = this.state.selectedFiles.findIndex(f => f.id === fileId);
    if (index === -1) return false;

    const file = this.state.selectedFiles[index];

    // Revoke object URL if it exists
    if (file.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }

    // Remove file from queue
    this.state.selectedFiles.splice(index, 1);
    return true;
  }

  /**
   * Clear all files from the upload queue
   */
  clearFiles() {
    // Revoke all object URLs
    for (const file of this.state.selectedFiles) {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    }

    // Clear arrays
    this.state.selectedFiles = [];
    this.state.completedUploads = [];
    this.state.failedUploads = [];
  }

  /**
   * Start uploading all files in the queue
   * @param {Object} options - Upload options
   * @param {String} options.uploadQuality - Quality level ('high', 'medium', 'low')
   * @param {String} options.storageType - Storage type ('ipfs', 'standard', 'hybrid')
   * @param {Function} options.onProgress - Progress callback
   * @param {Function} options.onFileComplete - File completion callback
   * @param {Function} options.onAllComplete - All files completion callback
   * @param {Function} options.onError - Error callback
   */
  async startUpload(options = {}) {
    // Update config with options
    if (options.uploadQuality) this.config.uploadQuality = options.uploadQuality;
    if (options.storageType) this.config.storageType = options.storageType;

    // Check if already uploading
    if (this.state.isUploading) {
      if (options.onError) options.onError(new Error('Upload already in progress'));
      return;
    }

    // Check if there are files to upload
    if (this.state.selectedFiles.length === 0) {
      if (options.onError) options.onError(new Error('No files selected for upload'));
      return;
    }

    // Set uploading state
    this.state.isUploading = true;
    this.state.uploadProgress = 0;

    try {
      // Filter files that are ready to upload (pending status)
      const filesToUpload = this.state.selectedFiles.filter(f => f.status === 'pending');

      if (filesToUpload.length === 0) {
        this.state.isUploading = false;
        if (options.onAllComplete) options.onAllComplete([]);
        return;
      }

      // Update file statuses to 'uploading'
      for (const file of filesToUpload) {
        file.status = 'uploading';
      }

      // Get just the File objects
      const fileObjects = filesToUpload.map(f => f.file);

      // Progress callback wrapper to update our internal state
      const onProgress = (progress, bytesUploaded, totalBytes, fileIndex) => {
        this.state.uploadProgress = progress;

        // Update progress for the current file
        if (fileIndex !== undefined && filesToUpload[fileIndex]) {
          filesToUpload[fileIndex].progress = progress;
        }

        // Call user-provided callback
        if (options.onProgress) {
          options.onProgress(progress, bytesUploaded, totalBytes, fileIndex);
        }
      };

      // File complete callback wrapper
      const onFileComplete = (cid, metadata, fileIndex, totalFiles) => {
        if (fileIndex !== undefined && filesToUpload[fileIndex]) {
          const file = filesToUpload[fileIndex];
          file.status = 'completed';
          file.progress = 100;
          file.cid = cid;
          file.ipfsUri = metadata.ipfsUri;
          file.gateway = metadata.gateway;
          file.uploadTime = metadata.uploadEndTime - metadata.uploadStartTime;

          // Add to completed uploads
          this.state.completedUploads.push(file);
        }

        // Call user-provided callback
        if (options.onFileComplete) {
          options.onFileComplete(cid, metadata, fileIndex, totalFiles);
        }
      };

      // All complete callback wrapper
      const onAllComplete = results => {
        this.state.isUploading = false;

        // Call user-provided callback
        if (options.onAllComplete) {
          options.onAllComplete(results);
        }
      };

      // Error callback wrapper
      const onError = (error, file) => {
        if (file) {
          // Find the file in our array and mark as failed
          const failedFile = filesToUpload.find(f => f.file === file);
          if (failedFile) {
            failedFile.status = 'failed';
            failedFile.error = error;

            // Add to failed uploads
            this.state.failedUploads.push(failedFile);
          }
        }

        // Call user-provided callback
        if (options.onError) {
          options.onError(error, file);
        }
      };

      // Choose upload method based on storage type
      switch (this.config.storageType) {
        case 'ipfs':
          // Upload to IPFS
          this.state.uploadTasks = await ipfsService.uploadMultipleFiles(
            fileObjects,
            onProgress,
            onFileComplete,
            onAllComplete,
            onError
          );
          break;

        case 'standard':
          // Upload to standard centralized storage (not implemented)
          throw new Error('Standard storage upload not implemented');

        case 'hybrid':
          // Upload to both IPFS and standard storage (not implemented)
          throw new Error('Hybrid storage upload not implemented');

        default:
          throw new Error(`Unknown storage type: ${this.config.storageType}`);
      }
    } catch (error) {
      this.state.isUploading = false;
      console.error('Upload failed:', error);

      // Call user-provided error callback
      if (options.onError) {
        options.onError(error);
      }
    }
  }

  /**
   * Pause the current upload (if supported by the storage method)
   * @returns {Boolean} Success status
   */
  pauseUpload() {
    // IPFS HTTP client doesn't support pausing uploads
    return false;
  }

  /**
   * Resume a paused upload (if supported by the storage method)
   * @returns {Boolean} Success status
   */
  resumeUpload() {
    // IPFS HTTP client doesn't support resuming uploads
    return false;
  }

  /**
   * Cancel the current upload
   * @returns {Boolean} Success status
   */
  cancelUpload() {
    // Cancel all tasks
    for (const task of this.state.uploadTasks) {
      if (task && task.id) {
        ipfsService.cancelTask(task.id);
      }
    }

    // Reset state
    this.state.isUploading = false;
    this.state.uploadProgress = 0;

    // Update status of uploading files to 'pending'
    for (const file of this.state.selectedFiles) {
      if (file.status === 'uploading') {
        file.status = 'pending';
        file.progress = 0;
      }
    }

    return true;
  }

  /**
   * Generate a thumbnail from a video file
   * @param {File} videoFile - Video file
   * @param {Number} timeInSeconds - Time position for thumbnail (default: 0)
   * @param {String} size - Thumbnail size ('small', 'medium', 'large')
   * @returns {Promise<Blob>} Thumbnail as a blob
   */
  async generateThumbnail(videoFile, timeInSeconds = 0, size = 'medium') {
    return new Promise((resolve, reject) => {
      try {
        // Check if file is a video
        if (!videoFile.type.startsWith('video/')) {
          reject(new Error('File is not a video'));
          return;
        }

        // Create video element
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        // Set up video events
        video.onloadedmetadata = () => {
          // Seek to the specified time
          video.currentTime = Math.min(timeInSeconds, video.duration);
        };

        video.onseeked = () => {
          // Get the dimensions
          const { width, height } =
            this.config.thumbnailSizes[size] || this.config.thumbnailSizes.medium;

          // Create canvas and draw video frame
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, width, height);

          // Convert canvas to blob
          canvas.toBlob(
            blob => {
              // Clean up
              URL.revokeObjectURL(video.src);
              resolve(blob);
            },
            'image/jpeg',
            0.85 // JPEG quality
          );
        };

        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          reject(new Error('Failed to load video'));
        };

        // Start loading the video
        video.src = URL.createObjectURL(videoFile);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Validate a file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result with valid flag and error message if invalid
   * @private
   */
  _validateFile(file) {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File "${file.name}" is too large. Maximum file size is ${this._formatFileSize(this.config.maxFileSize)}.`
      };
    }

    // Check file type
    const typeCategory = this._getFileTypeCategory(file.type);
    if (!typeCategory) {
      return {
        valid: false,
        error: `File "${file.name}" has unsupported type: ${file.type}`
      };
    }

    return { valid: true };
  }

  /**
   * Get file type category based on MIME type
   * @param {String} mimeType - MIME type
   * @returns {String|null} File type category or null if not supported
   * @private
   */
  _getFileTypeCategory(mimeType) {
    for (const [category, types] of Object.entries(this.config.acceptedFileTypes)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return null;
  }

  /**
   * Format file size to human-readable format
   * @param {Number} bytes - Size in bytes
   * @returns {String} Formatted size (e.g., "1.5 MB")
   * @private
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
const uploadManager = new UploadManager();
export default uploadManager;
