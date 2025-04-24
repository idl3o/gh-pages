/**
 * IPFS Upload Component
 * Provides a modern UI for uploading files to IPFS with progress tracking
 */

import ipfsService from '../services/ipfs-service.js';
import ipfsConfig from '../config/ipfs-config.js';

class IPFSUploader {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container element with ID ${containerId} not found`);
    }

    // Default options
    this.options = {
      multiple: true,
      acceptedTypes: '*/*',
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      maxTotalSize: 1024 * 1024 * 1024 * 5, // 5GB
      autoStart: false,
      pinning: true,
      showPreview: true,
      previewTypes: ['image/', 'video/', 'audio/'],
      darkMode: false,
      provider: 'infura',
      ...options
    };

    // Upload state
    this.files = [];
    this.totalSize = 0;
    this.uploadedSize = 0;
    this.isUploading = false;
    this.results = [];

    // Initialize the component
    this.initialize();
  }

  /**
   * Initialize the IPFS uploader component
   */
  async initialize() {
    // Create the UI
    this.createUI();

    // Setup event listeners
    this.setupEventListeners();

    try {
      // Initialize IPFS service
      await ipfsService.initialize({
        apiUrl: ipfsConfig.getApiUrl(this.options.provider),
        authToken: ipfsConfig.getAuthForProvider(this.options.provider),
        gateway: ipfsConfig.getBestGateway(),
        pinning: this.options.pinning,
        chunkSize: ipfsConfig.uploadDefaults.chunkSize,
        timeout: ipfsConfig.uploadDefaults.timeout
      });

      // Update UI to show ready state
      this.updateStatusMessage('Ready to upload', 'success');
    } catch (error) {
      this.updateStatusMessage(`Failed to initialize IPFS: ${error.message}`, 'error');
    }
  }

  /**
   * Create the UI for the uploader
   */
  createUI() {
    // Set container styles
    this.container.className = 'ipfs-uploader';
    if (this.options.darkMode) {
      this.container.classList.add('dark-mode');
    }

    // Create HTML structure
    this.container.innerHTML = `
      <div class="ipfs-uploader__header">
        <h3>Upload to IPFS</h3>
        <div class="ipfs-uploader__status">
          <span class="ipfs-uploader__status-message">Initializing...</span>
        </div>
      </div>

      <div class="ipfs-uploader__drop-zone" id="${this.container.id}-dropzone">
        <div class="ipfs-uploader__icon">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
        </div>
        <p>Drag & drop files here or <span class="ipfs-uploader__browse">browse</span></p>
        <input type="file" id="${this.container.id}-file-input" style="display: none" ${this.options.multiple ? 'multiple' : ''} accept="${this.options.acceptedTypes}">
      </div>

      <div class="ipfs-uploader__file-list">
        <div class="ipfs-uploader__file-list-header">
          <span>Name</span>
          <span>Size</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div class="ipfs-uploader__files" id="${this.container.id}-file-list"></div>
      </div>

      <div class="ipfs-uploader__controls">
        <button class="ipfs-uploader__btn ipfs-uploader__btn--primary" id="${this.container.id}-upload-btn" disabled>
          Upload to IPFS
        </button>
        <button class="ipfs-uploader__btn" id="${this.container.id}-clear-btn">
          Clear All
        </button>
      </div>

      <div class="ipfs-uploader__results" id="${this.container.id}-results" style="display: none">
        <h4>Upload Results</h4>
        <div class="ipfs-uploader__results-content">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>CID</th>
                <th>Gateway URL</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody id="${this.container.id}-results-body">
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add CSS styles
    this.addStyles();

    // Store references to important elements
    this.dropZone = document.getElementById(`${this.container.id}-dropzone`);
    this.fileInput = document.getElementById(`${this.container.id}-file-input`);
    this.fileListElement = document.getElementById(`${this.container.id}-file-list`);
    this.uploadButton = document.getElementById(`${this.container.id}-upload-btn`);
    this.clearButton = document.getElementById(`${this.container.id}-clear-btn`);
    this.resultsContainer = document.getElementById(`${this.container.id}-results`);
    this.resultsBody = document.getElementById(`${this.container.id}-results-body`);
    this.statusMessage = this.container.querySelector('.ipfs-uploader__status-message');
    this.browseButton = this.container.querySelector('.ipfs-uploader__browse');
  }

  /**
   * Add CSS styles to the document
   */
  addStyles() {
    // Check if styles already exist
    if (document.getElementById('ipfs-uploader-styles')) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'ipfs-uploader-styles';
    styleElement.textContent = `
      .ipfs-uploader {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        padding: 20px;
        margin: 20px 0;
        background-color: #ffffff;
        color: #333;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      }

      .ipfs-uploader.dark-mode {
        background-color: #252525;
        color: #e0e0e0;
        border: 1px solid #444;
      }

      .ipfs-uploader__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .ipfs-uploader__header h3 {
        margin: 0;
        font-weight: 600;
        font-size: 18px;
      }

      .ipfs-uploader__status {
        font-size: 14px;
      }

      .ipfs-uploader__status-message.error {
        color: #d32f2f;
      }

      .ipfs-uploader__status-message.success {
        color: #388e3c;
      }

      .ipfs-uploader__status-message.warning {
        color: #f57c00;
      }

      .ipfs-uploader__drop-zone {
        border: 2px dashed #bdbdbd;
        border-radius: 8px;
        padding: 25px;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
        margin-bottom: 20px;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__drop-zone {
        border-color: #555;
      }

      .ipfs-uploader__drop-zone:hover,
      .ipfs-uploader__drop-zone.active {
        border-color: #2196f3;
        background-color: rgba(33, 150, 243, 0.04);
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__drop-zone:hover,
      .ipfs-uploader.dark-mode .ipfs-uploader__drop-zone.active {
        border-color: #64b5f6;
        background-color: rgba(33, 150, 243, 0.08);
      }

      .ipfs-uploader__icon {
        margin-bottom: 15px;
        color: #757575;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__icon {
        color: #aaa;
      }

      .ipfs-uploader__drop-zone p {
        margin: 0;
        font-size: 16px;
        color: #757575;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__drop-zone p {
        color: #bbb;
      }

      .ipfs-uploader__browse {
        color: #2196f3;
        cursor: pointer;
        text-decoration: underline;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__browse {
        color: #64b5f6;
      }

      .ipfs-uploader__file-list {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 20px;
      }

      .ipfs-uploader__file-list-header {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 0.8fr;
        gap: 10px;
        font-weight: 600;
        padding: 10px;
        border-bottom: 1px solid #e0e0e0;
        font-size: 14px;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__file-list-header {
        border-color: #444;
      }

      .ipfs-uploader__file-item {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 0.8fr;
        gap: 10px;
        padding: 12px 10px;
        border-bottom: 1px solid #f0f0f0;
        align-items: center;
        font-size: 14px;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__file-item {
        border-color: #333;
      }

      .ipfs-uploader__file-item:last-child {
        border-bottom: none;
      }

      .ipfs-uploader__file-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
      }

      .ipfs-uploader__file-icon {
        margin-right: 8px;
        color: #757575;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__file-icon {
        color: #aaa;
      }

      .ipfs-uploader__file-size {
        color: #757575;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__file-size {
        color: #aaa;
      }

      .ipfs-uploader__file-status {
        display: flex;
        align-items: center;
      }

      .ipfs-uploader__progress-container {
        flex: 1;
        height: 6px;
        background-color: #f0f0f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__progress-container {
        background-color: #444;
      }

      .ipfs-uploader__progress-bar {
        height: 100%;
        width: 0;
        background-color: #2196f3;
        transition: width 0.2s ease;
      }

      .ipfs-uploader__progress-text {
        margin-left: 8px;
        font-size: 13px;
        color: #757575;
        width: 45px;
        text-align: right;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__progress-text {
        color: #aaa;
      }

      .ipfs-uploader__file-actions button {
        border: none;
        background: none;
        color: #757575;
        cursor: pointer;
        padding: 4px;
        margin-right: 5px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__file-actions button {
        color: #aaa;
      }

      .ipfs-uploader__file-actions button:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: #333;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__file-actions button:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .ipfs-uploader__controls {
        display: flex;
        justify-content: flex-start;
        gap: 10px;
        margin-top: 20px;
      }

      .ipfs-uploader__btn {
        background-color: #f5f5f5;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 8px 16px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #333;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__btn {
        background-color: #383838;
        border-color: #555;
        color: #e0e0e0;
      }

      .ipfs-uploader__btn:hover:not(:disabled) {
        background-color: #e0e0e0;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__btn:hover:not(:disabled) {
        background-color: #444;
      }

      .ipfs-uploader__btn--primary {
        background-color: #2196f3;
        border-color: #2196f3;
        color: white;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__btn--primary {
        background-color: #1976d2;
        border-color: #1976d2;
      }

      .ipfs-uploader__btn--primary:hover:not(:disabled) {
        background-color: #1976d2;
        border-color: #1976d2;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__btn--primary:hover:not(:disabled) {
        background-color: #1565c0;
        border-color: #1565c0;
      }

      .ipfs-uploader__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ipfs-uploader__results {
        margin-top: 20px;
        border-top: 1px solid #e0e0e0;
        padding-top: 15px;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__results {
        border-color: #444;
      }

      .ipfs-uploader__results h4 {
        margin-top: 0;
        margin-bottom: 15px;
        font-weight: 600;
        font-size: 16px;
      }

      .ipfs-uploader__results table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .ipfs-uploader__results th,
      .ipfs-uploader__results td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #f0f0f0;
        word-break: break-all;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__results th,
      .ipfs-uploader.dark-mode .ipfs-uploader__results td {
        border-color: #333;
      }

      .ipfs-uploader__results th {
        font-weight: 500;
      }

      .ipfs-uploader__results a {
        color: #2196f3;
        text-decoration: none;
      }

      .ipfs-uploader.dark-mode .ipfs-uploader__results a {
        color: #64b5f6;
      }

      .ipfs-uploader__results a:hover {
        text-decoration: underline;
      }

      .ipfs-uploader__file-preview {
        max-width: 100px;
        max-height: 60px;
        margin-right: 10px;
        border-radius: 4px;
        object-fit: contain;
      }
    `;

    document.head.appendChild(styleElement);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Drop zone events
    this.dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      this.dropZone.classList.add('active');
    });

    this.dropZone.addEventListener('dragleave', e => {
      e.preventDefault();
      e.stopPropagation();
      this.dropZone.classList.remove('active');
    });

    this.dropZone.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      this.dropZone.classList.remove('active');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.addFiles(files);
      }
    });

    this.dropZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.browseButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.fileInput.click();
    });

    // File input change event
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files.length > 0) {
        this.addFiles(this.fileInput.files);
        // Reset the file input to allow selecting the same file again
        this.fileInput.value = '';
      }
    });

    // Upload button click
    this.uploadButton.addEventListener('click', () => {
      if (!this.isUploading && this.files.length > 0) {
        this.uploadFiles();
      }
    });

    // Clear button click
    this.clearButton.addEventListener('click', () => {
      if (!this.isUploading) {
        this.clearFiles();
      } else {
        this.updateStatusMessage('Cannot clear files while uploading', 'warning');
      }
    });
  }

  /**
   * Update the status message
   * @param {string} message The message to display
   * @param {string} type The message type (success, error, warning, info)
   */
  updateStatusMessage(message, type = 'info') {
    this.statusMessage.textContent = message;
    this.statusMessage.className = 'ipfs-uploader__status-message';

    if (type) {
      this.statusMessage.classList.add(type);
    }
  }

  /**
   * Add files to the uploader
   * @param {FileList} fileList The list of files to add
   */
  addFiles(fileList) {
    const newFiles = Array.from(fileList);
    let filesAdded = 0;
    let totalSize = this.totalSize;

    // Process each file
    for (const file of newFiles) {
      // Check file size
      if (file.size > this.options.maxFileSize) {
        this.updateStatusMessage(
          `File ${file.name} exceeds maximum file size (${this.formatSize(this.options.maxFileSize)})`,
          'error'
        );
        continue;
      }

      // Check if total size would exceed max
      if (totalSize + file.size > this.options.maxTotalSize) {
        this.updateStatusMessage(`Cannot add more files. Maximum total size exceeded.`, 'error');
        break;
      }

      // Add file to the list
      this.files.push(file);
      totalSize += file.size;
      filesAdded++;

      // Create and add file element to UI
      this.addFileElement(file);
    }

    // Update total size
    this.totalSize = totalSize;

    // Enable/disable upload button
    this.uploadButton.disabled = this.files.length === 0;

    // Update status
    if (filesAdded > 0) {
      this.updateStatusMessage(
        `${filesAdded} file${filesAdded !== 1 ? 's' : ''} added. Ready to upload.`,
        'success'
      );

      // Auto-start upload if enabled
      if (this.options.autoStart && !this.isUploading) {
        this.uploadFiles();
      }
    }
  }

  /**
   * Add a file element to the UI
   * @param {File} file The file to add
   */
  addFileElement(file) {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileElement = document.createElement('div');
    fileElement.className = 'ipfs-uploader__file-item';
    fileElement.dataset.fileId = fileId;
    file.id = fileId;

    // Determine file icon based on type
    const fileIcon = this.getFileIcon(file.type);

    // Create file preview if enabled and type is supported
    let preview = '';
    if (this.options.showPreview && this.shouldShowPreview(file.type)) {
      preview = `<img class="ipfs-uploader__file-preview" src="${URL.createObjectURL(file)}" alt="${file.name}">`;
    }

    fileElement.innerHTML = `
      <div class="ipfs-uploader__file-name">
        ${preview}
        <span class="ipfs-uploader__file-icon">${fileIcon}</span>
        <span title="${file.name}">${file.name}</span>
      </div>
      <div class="ipfs-uploader__file-size">${this.formatSize(file.size)}</div>
      <div class="ipfs-uploader__file-status">
        <div class="ipfs-uploader__progress-container">
          <div class="ipfs-uploader__progress-bar" style="width: 0%"></div>
        </div>
        <span class="ipfs-uploader__progress-text">0%</span>
      </div>
      <div class="ipfs-uploader__file-actions">
        <button type="button" title="Remove File">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        </button>
      </div>
    `;

    // Add remove button event
    const removeButton = fileElement.querySelector('.ipfs-uploader__file-actions button');
    removeButton.addEventListener('click', () => {
      if (!this.isUploading) {
        this.removeFile(fileId);
      } else {
        this.updateStatusMessage('Cannot remove files while uploading', 'warning');
      }
    });

    this.fileListElement.appendChild(fileElement);
  }

  /**
   * Upload all files to IPFS
   */
  async uploadFiles() {
    if (this.isUploading || this.files.length === 0) {
      return;
    }

    this.isUploading = true;
    this.results = [];
    this.updateStatusMessage('Starting upload to IPFS...', 'info');

    // Disable buttons during upload
    this.uploadButton.disabled = true;

    // Reset progress
    this.uploadedSize = 0;

    try {
      // Upload files to IPFS with progress tracking
      const results = await ipfsService.uploadFiles(
        this.files,
        { pin: this.options.pinning },
        // Progress callback for individual files
        (fileIndex, percentage, uploaded, total) => {
          this.updateFileProgress(this.files[fileIndex].id, percentage);
        },
        // Progress callback for total progress
        (percentage, uploaded, total) => {
          this.uploadedSize = uploaded;
          this.updateStatusMessage(`Uploading: ${percentage.toFixed(1)}% complete`, 'info');
        }
      );

      // Upload complete
      this.results = results;
      this.updateStatusMessage(
        `Upload complete! ${results.length} file${results.length !== 1 ? 's' : ''} uploaded to IPFS.`,
        'success'
      );

      // Display results
      this.displayResults(results);

      // Clear files from the uploader
      this.clearFiles();
    } catch (error) {
      this.updateStatusMessage(`Upload error: ${error.message}`, 'error');
      console.error('IPFS Upload error:', error);
    } finally {
      this.isUploading = false;
      this.uploadButton.disabled = false;
    }
  }

  /**
   * Update file progress in the UI
   * @param {string} fileId The file ID
   * @param {number} percentage The progress percentage
   */
  updateFileProgress(fileId, percentage) {
    const fileElement = this.fileListElement.querySelector(`[data-file-id="${fileId}"]`);
    if (fileElement) {
      const progressBar = fileElement.querySelector('.ipfs-uploader__progress-bar');
      const progressText = fileElement.querySelector('.ipfs-uploader__progress-text');

      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}%`;
    }
  }

  /**
   * Clear all files from the uploader
   */
  clearFiles() {
    this.files = [];
    this.totalSize = 0;
    this.fileListElement.innerHTML = '';
    this.uploadButton.disabled = true;
    this.updateStatusMessage('Ready to upload', 'info');
  }

  /**
   * Remove a file from the uploader
   * @param {string} fileId The file ID to remove
   */
  removeFile(fileId) {
    const fileIndex = this.files.findIndex(file => file.id === fileId);
    if (fileIndex !== -1) {
      const file = this.files[fileIndex];
      this.totalSize -= file.size;
      this.files.splice(fileIndex, 1);

      const fileElement = this.fileListElement.querySelector(`[data-file-id="${fileId}"]`);
      if (fileElement) {
        fileElement.remove();
      }

      this.uploadButton.disabled = this.files.length === 0;
      this.updateStatusMessage('File removed', 'info');
    }
  }

  /**
   * Display upload results
   * @param {Array} results Array of upload results
   */
  displayResults(results) {
    if (results.length === 0) {
      this.resultsContainer.style.display = 'none';
      return;
    }

    this.resultsContainer.style.display = 'block';
    this.resultsBody.innerHTML = '';

    results.forEach(result => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${result.filename}</td>
        <td>${result.cid}</td>
        <td><a href="${result.ipfsUrl}" target="_blank" rel="noopener noreferrer">${result.ipfsUrl}</a></td>
        <td>${this.formatSize(result.size)}</td>
      `;
      this.resultsBody.appendChild(row);
    });

    // Dispatch event with results for external handling
    this.container.dispatchEvent(
      new CustomEvent('ipfsUploadComplete', {
        detail: {
          results
        }
      })
    );
  }

  /**
   * Get a file icon based on file type
   * @param {string} fileType The file MIME type
   * @returns {string} SVG icon for the file type
   */
  getFileIcon(fileType) {
    if (fileType.startsWith('image/')) {
      return '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
    } else if (fileType.startsWith('video/')) {
      return '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
    } else if (fileType.startsWith('audio/')) {
      return '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>';
    } else if (fileType === 'application/pdf') {
      return '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>';
    } else if (fileType.includes('text/') || fileType.includes('json')) {
      return '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
    } else {
      return '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>';
    }
  }

  /**
   * Format file size in human-readable format
   * @param {number} bytes The file size in bytes
   * @returns {string} Formatted file size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Check if file type should show preview
   * @param {string} fileType The file MIME type
   * @returns {boolean} True if preview should be shown
   */
  shouldShowPreview(fileType) {
    if (!this.options.showPreview) return false;

    for (const previewType of this.options.previewTypes) {
      if (fileType.startsWith(previewType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the upload results
   * @returns {Array} The upload results
   */
  getResults() {
    return this.results;
  }
}

export default IPFSUploader;
