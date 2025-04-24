/**
 * StreamChain Upload Modal
 * Enhanced creator dashboard upload experience with multi-stage process and IPFS integration
 */

import ipfsService from './services/ipfs-service.js';
import IPFSConfig from './config/ipfs-config.js';

class StreamChainUploader {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.selectedFiles = [];
    this.thumbnailFile = null;
    this.uploadedIPFSResults = [];
    this.uploadData = {
      title: '',
      description: '',
      category: '',
      language: 'en',
      tags: [],
      type: 'video',
      monetization: {
        enabled: true,
        pricingModel: 'free',
        price: 5.0,
        isNFT: false,
        editionSize: 1,
        royaltyPercent: 10,
        mintingMethod: 'lazy'
      },
      distribution: {
        visibility: 'public',
        scheduled: false,
        scheduleDate: null,
        scheduleTime: null,
        notifications: {
          subscribers: true,
          feed: true,
          tokenHolders: true
        },
        crosspost: {
          discord: false,
          twitter: false,
          snapshot: false
        }
      },
      collaborators: []
    };

    this.initElements();
    this.setupEventListeners();
    this.initIPFSService();
  }

  /**
   * Initialize IPFS service
   */
  async initIPFSService() {
    try {
      // Initialize IPFS with our configuration
      await ipfsService.initialize({
        apiUrl: IPFSConfig.primaryApi,
        gateway: IPFSConfig.getBestGateway(),
        pinning: IPFSConfig.uploadDefaults.pinning,
        authToken: IPFSConfig.getAuthForProvider('infura')
      });
      console.log('IPFS service initialized');
    } catch (error) {
      console.error('Failed to initialize IPFS service:', error);
      // We'll show errors when they try to upload
    }
  }

  /**
   * Initialize element references
   */
  initElements() {
    // Modal elements
    this.modal = document.getElementById('uploadModal');
    this.progressSteps = this.modal.querySelectorAll('.upload-progress-steps .step');
    this.uploadSteps = this.modal.querySelectorAll('.upload-step');

    // Navigation buttons
    this.nextBtn = document.getElementById('nextStepBtn');
    this.prevBtn = document.getElementById('prevStepBtn');
    this.publishBtn = document.getElementById('publishContentBtn');
    this.saveAsDraftBtn = document.getElementById('saveAsDraftBtn');
    this.cancelBtn = document.getElementById('cancelUploadBtn');

    // Step 1: File Selection
    this.dropzone = document.getElementById('dropzone');
    this.fileInput = document.getElementById('fileInput');
    this.browseFilesBtn = document.getElementById('browseFilesBtn');
    this.selectedFilesContainer = document.getElementById('selectedFiles');
    this.fileList = document.getElementById('fileList');

    // Step 2: Content Details
    this.contentTitle = document.getElementById('contentTitle');
    this.contentDescription = document.getElementById('contentDescription');
    this.titleCounter = document.getElementById('titleCounter');
    this.descCounter = document.getElementById('descCounter');
    this.thumbnailPreview = document.getElementById('thumbnailPreview');
    this.uploadThumbnailBtn = document.getElementById('uploadThumbnailBtn');
    this.extractThumbnailBtn = document.getElementById('extractThumbnailBtn');
    this.thumbnailInput = document.getElementById('thumbnailInput');
    this.contentCategory = document.getElementById('contentCategory');
    this.contentLanguage = document.getElementById('contentLanguage');
    this.contentTags = document.getElementById('contentTags');

    // Step 3: Monetization
    this.enableMonetization = document.getElementById('enableMonetization');
    this.monetizationOptions = document.getElementById('monetizationOptions');
    this.pricingModel = document.getElementById('pricingModel');
    this.priceInputGroup = document.getElementById('priceInputGroup');
    this.contentPrice = document.getElementById('contentPrice');
    this.createAsNFT = document.getElementById('createAsNFT');
    this.nftOptions = document.getElementById('nftOptions');
    this.editionSize = document.getElementById('editionSize');
    this.royaltyPercent = document.getElementById('royaltyPercent');
    this.mintingMethod = document.getElementById('mintingMethod');
    this.collaboratorList = document.getElementById('collaboratorList');
    this.addCollaboratorBtn = document.getElementById('addCollaboratorBtn');
    this.primaryShare = document.getElementById('primaryShare');

    // Step 4: Distribution
    this.contentVisibility = document.getElementById('contentVisibility');
    this.scheduleContent = document.getElementById('scheduleContent');
    this.scheduleOptions = document.getElementById('scheduleOptions');
    this.scheduleDate = document.getElementById('scheduleDate');
    this.scheduleTime = document.getElementById('scheduleTime');
    this.notifySubscribers = document.getElementById('notifySubscribers');
    this.postToFeed = document.getElementById('postToFeed');
    this.notifyTokenHolders = document.getElementById('notifyTokenHolders');
    this.crosspostDiscord = document.getElementById('crosspostDiscord');
    this.crosspostTwitter = document.getElementById('crosspostTwitter');
    this.crosspostSnapshot = document.getElementById('crosspostSnapshot');

    // Step 5: Review
    this.reviewPreview = document.getElementById('reviewPreview');
    this.reviewTitle = document.getElementById('reviewTitle');
    this.reviewType = document.getElementById('reviewType');
    this.reviewVisibility = document.getElementById('reviewVisibility');
    this.reviewMonetization = document.getElementById('reviewMonetization');
    this.reviewNFT = document.getElementById('reviewNFT');
    this.reviewPublishing = document.getElementById('reviewPublishing');
    this.agreeTerms = document.getElementById('agreeTerms');

    // Upload Progress
    this.uploadProgress = document.getElementById('uploadProgress');
    this.progressFill = document.getElementById('progressFill');
    this.progressStatus = document.getElementById('progressStatus');
    this.progressPercentage = document.getElementById('progressPercentage');
    this.uploadStepElements = document
      .getElementById('uploadSteps')
      .querySelectorAll('.upload-step-progress');
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Navigation buttons
    this.nextBtn.addEventListener('click', () => this.nextStep());
    this.prevBtn.addEventListener('click', () => this.prevStep());
    this.publishBtn.addEventListener('click', () => this.publishContent());
    this.saveAsDraftBtn.addEventListener('click', () => this.saveAsDraft());
    this.cancelBtn.addEventListener('click', () => this.closeModal());

    // File selection
    this.browseFilesBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', e => this.handleFileSelection(e));

    // Drag and drop
    this.dropzone.addEventListener('dragover', e => this.handleDragOver(e));
    this.dropzone.addEventListener('dragleave', e => this.handleDragLeave(e));
    this.dropzone.addEventListener('drop', e => this.handleDrop(e));

    // Content details
    this.contentTitle.addEventListener('input', e => this.handleTitleInput(e));
    this.contentDescription.addEventListener('input', e => this.handleDescriptionInput(e));
    this.uploadThumbnailBtn.addEventListener('click', () => this.thumbnailInput.click());
    this.thumbnailInput.addEventListener('change', e => this.handleThumbnailSelection(e));
    this.extractThumbnailBtn.addEventListener('click', () => this.extractThumbnailFromVideo());

    // Monetization
    this.enableMonetization.addEventListener('change', () => this.toggleMonetizationOptions());
    this.createAsNFT.addEventListener('change', () => this.toggleNFTOptions());
    this.pricingModel.addEventListener('change', () => this.updatePricingVisibility());
    this.addCollaboratorBtn.addEventListener('click', () => this.addCollaborator());

    // Distribution
    this.scheduleContent.addEventListener('change', () => this.toggleScheduleOptions());

    // Review
    this.agreeTerms.addEventListener('change', () => this.updatePublishButton());
  }

  /**
   * Handle file selection through file dialog
   */
  handleFileSelection(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    this.addFilesToSelection(files);
  }

  /**
   * Handle drag over event for dropzone
   */
  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropzone.classList.add('drag-active');
  }

  /**
   * Handle drag leave event for dropzone
   */
  handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropzone.classList.remove('drag-active');
  }

  /**
   * Handle drop event for file dropzone
   */
  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropzone.classList.remove('drag-active');

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    this.addFilesToSelection(files);
  }

  /**
   * Add files to the selection and update UI
   */
  addFilesToSelection(files) {
    for (const file of files) {
      // Check if file is already in selection
      if (this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) continue;

      this.selectedFiles.push(file);
    }

    this.updateFileList();
  }

  /**
   * Update the file list UI
   */
  updateFileList() {
    this.fileList.innerHTML = '';

    if (this.selectedFiles.length > 0) {
      this.selectedFilesContainer.classList.remove('hidden');

      this.selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        // Determine file icon based on type
        let fileIcon = 'ri-file-line';
        if (file.type.includes('video')) fileIcon = 'ri-video-line';
        else if (file.type.includes('audio')) fileIcon = 'ri-music-line';
        else if (file.type.includes('image')) fileIcon = 'ri-image-line';
        else if (file.type.includes('pdf')) fileIcon = 'ri-file-pdf-line';

        fileItem.innerHTML = `
          <div class="file-info">
            <i class="${fileIcon} file-icon"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${this.formatFileSize(file.size)}</span>
          </div>
          <div class="file-actions">
            <button class="remove-file" data-index="${index}">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        `;

        this.fileList.appendChild(fileItem);

        // Add event listener to remove button
        fileItem.querySelector('.remove-file').addEventListener('click', e => {
          const idx = parseInt(e.currentTarget.dataset.index);
          this.removeFile(idx);
        });
      });
    } else {
      this.selectedFilesContainer.classList.add('hidden');
    }

    // Enable/disable next button based on file selection
    this.nextBtn.disabled = this.selectedFiles.length === 0;
  }

  /**
   * Remove a file from selection
   */
  removeFile(index) {
    this.selectedFiles.splice(index, 1);
    this.updateFileList();
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Handle thumbnail selection
   */
  handleThumbnailSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      alert('Please select an image file for the thumbnail.');
      return;
    }

    this.thumbnailFile = file;
    this.updateThumbnailPreview();
  }

  /**
   * Update thumbnail preview image
   */
  updateThumbnailPreview() {
    if (!this.thumbnailFile) {
      this.thumbnailPreview.innerHTML = `
        <div class="no-thumbnail">
          <i class="ri-image-add-line"></i>
          <span>Upload thumbnail</span>
        </div>
      `;
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      this.thumbnailPreview.innerHTML = `<img src="${e.target.result}" alt="Thumbnail preview">`;
    };
    reader.readAsDataURL(this.thumbnailFile);
  }

  /**
   * Extract thumbnail from video file
   */
  extractThumbnailFromVideo() {
    // Find the first video file in selection
    const videoFile = this.selectedFiles.find(file => file.type.includes('video'));

    if (!videoFile) {
      alert('No video file found to extract thumbnail from.');
      return;
    }

    // Create a video element to extract thumbnail
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      // Seek to a position (25% of the video)
      video.currentTime = video.duration * 0.25;
    };

    video.onseeked = () => {
      // Create a canvas to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(
        blob => {
          const thumbnailFile = new File([blob], `${videoFile.name.split('.')[0]}-thumbnail.jpg`, {
            type: 'image/jpeg'
          });

          // Update thumbnail
          this.thumbnailFile = thumbnailFile;
          this.updateThumbnailPreview();
        },
        'image/jpeg',
        0.8
      );
    };

    // Load the video file
    video.src = URL.createObjectURL(videoFile);
  }

  /**
   * Handle title input and character count
   */
  handleTitleInput(event) {
    const value = event.target.value;
    const maxLength = 100;

    this.titleCounter.textContent = value.length;
    this.uploadData.title = value;

    // Limit length
    if (value.length > maxLength) {
      event.target.value = value.substring(0, maxLength);
      this.titleCounter.textContent = maxLength;
      this.uploadData.title = event.target.value;
    }
  }

  /**
   * Handle description input and character count
   */
  handleDescriptionInput(event) {
    const value = event.target.value;
    const maxLength = 5000;

    this.descCounter.textContent = value.length;
    this.uploadData.description = value;

    // Limit length
    if (value.length > maxLength) {
      event.target.value = value.substring(0, maxLength);
      this.descCounter.textContent = maxLength;
      this.uploadData.description = event.target.value;
    }
  }

  /**
   * Toggle monetization options based on checkbox
   */
  toggleMonetizationOptions() {
    const enabled = this.enableMonetization.checked;
    this.uploadData.monetization.enabled = enabled;

    if (enabled) {
      this.monetizationOptions.style.display = 'block';
    } else {
      this.monetizationOptions.style.display = 'none';
    }
  }

  /**
   * Toggle NFT options based on checkbox
   */
  toggleNFTOptions() {
    const isNFT = this.createAsNFT.checked;
    this.uploadData.monetization.isNFT = isNFT;

    if (isNFT) {
      this.nftOptions.classList.remove('hidden');
    } else {
      this.nftOptions.classList.add('hidden');
    }
  }

  /**
   * Update pricing input visibility based on pricing model
   */
  updatePricingVisibility() {
    const model = this.pricingModel.value;
    this.uploadData.monetization.pricingModel = model;

    if (model === 'free') {
      this.priceInputGroup.style.display = 'none';
    } else {
      this.priceInputGroup.style.display = 'block';
    }
  }

  /**
   * Add a collaborator to revenue splitting
   */
  addCollaborator() {
    // For demonstration, we'll add a sample collaborator
    const collaboratorId = Date.now(); // Temporary unique ID
    const collaborator = {
      id: collaboratorId,
      name: 'Collaborator',
      walletAddress: '0x...', // Would come from user input or search
      sharePercent: 0
    };

    this.uploadData.collaborators.push(collaborator);
    this.updateCollaboratorList();
  }

  /**
   * Update the collaborator list UI
   */
  updateCollaboratorList() {
    // Calculate remaining share percentage
    let totalCollaboratorShare = this.uploadData.collaborators.reduce(
      (total, collaborator) => total + (collaborator.sharePercent || 0),
      0
    );

    // Update primary creator share
    this.primaryShare.value = 100 - totalCollaboratorShare;

    // Add collaborator items to the list (would be implemented for a real feature)
    // This is simplified for demonstration
  }

  /**
   * Toggle schedule options based on checkbox
   */
  toggleScheduleOptions() {
    const scheduled = this.scheduleContent.checked;
    this.uploadData.distribution.scheduled = scheduled;

    if (scheduled) {
      this.scheduleOptions.classList.remove('hidden');
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.scheduleDate.value = tomorrow.toISOString().split('T')[0];
      this.scheduleTime.value = '12:00';
    } else {
      this.scheduleOptions.classList.add('hidden');
    }
  }

  /**
   * Update review step with current data
   */
  updateReviewStep() {
    // Preview
    if (this.thumbnailFile) {
      const reader = new FileReader();
      reader.onload = e => {
        this.reviewPreview.innerHTML = `<img src="${e.target.result}" alt="Content preview">`;
      };
      reader.readAsDataURL(this.thumbnailFile);
    } else if (this.selectedFiles[0] && this.selectedFiles[0].type.includes('video')) {
      this.reviewPreview.innerHTML = `<video src="${URL.createObjectURL(this.selectedFiles[0])}" poster controls></video>`;
    } else {
      this.reviewPreview.innerHTML = `<div class="no-preview">No preview available</div>`;
    }

    // Content details
    this.reviewTitle.textContent = this.uploadData.title || 'Untitled';

    // Get selected content type
    const typeRadios = document.querySelectorAll('input[name="contentType"]');
    let selectedType = 'Video';
    for (const radio of typeRadios) {
      if (radio.checked) {
        selectedType = radio.nextElementSibling.nextElementSibling.textContent;
        break;
      }
    }
    this.reviewType.textContent = selectedType;

    // Visibility
    this.reviewVisibility.textContent =
      this.contentVisibility.options[this.contentVisibility.selectedIndex].text;

    // Monetization
    let monetizationText = 'Free';
    if (this.enableMonetization.checked) {
      if (this.pricingModel.value !== 'free') {
        monetizationText = `${this.contentPrice.value} STREAM tokens`;
      }
    }
    this.reviewMonetization.textContent = monetizationText;

    // NFT
    this.reviewNFT.textContent = this.createAsNFT.checked ? 'Yes' : 'No';

    // Publishing
    if (this.scheduleContent.checked) {
      this.reviewPublishing.textContent = `Scheduled for ${this.scheduleDate.value} at ${this.scheduleTime.value}`;
    } else {
      this.reviewPublishing.textContent = 'Immediate';
    }
  }

  /**
   * Update publish button state based on terms agreement
   */
  updatePublishButton() {
    this.publishBtn.disabled = !this.agreeTerms.checked;
  }

  /**
   * Navigate to the next step
   */
  nextStep() {
    // Validate current step
    if (!this.validateStep(this.currentStep)) return;

    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  /**
   * Navigate to the previous step
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  /**
   * Go to a specific step
   */
  goToStep(stepNumber) {
    // Hide all steps
    for (let i = 0; i < this.uploadSteps.length; i++) {
      this.uploadSteps[i].classList.remove('active');
      this.progressSteps[i].classList.remove('active', 'completed');
    }

    // Mark completed steps
    for (let i = 0; i < stepNumber - 1; i++) {
      this.progressSteps[i].classList.add('completed');
    }

    // Show current step
    this.uploadSteps[stepNumber - 1].classList.add('active');
    this.progressSteps[stepNumber - 1].classList.add('active');

    // Update navigation buttons
    this.prevBtn.classList.toggle('hidden', stepNumber === 1);
    this.nextBtn.classList.toggle('hidden', stepNumber === this.totalSteps);
    this.publishBtn.classList.toggle('hidden', stepNumber !== this.totalSteps);

    // If this is step 5 (review), update the review screen
    if (stepNumber === 5) {
      this.updateReviewStep();
      this.updatePublishButton();
    }

    this.currentStep = stepNumber;
  }

  /**
   * Validate the current step
   */
  validateStep(step) {
    switch (step) {
      case 1: // File Selection
        return this.selectedFiles.length > 0;

      case 2: // Content Details
        if (!this.contentTitle.value.trim()) {
          alert('Please enter a title for your content.');
          this.contentTitle.focus();
          return false;
        }
        return true;

      case 3: // Monetization
        return true; // No required fields

      case 4: // Distribution
        if (this.scheduleContent.checked) {
          if (!this.scheduleDate.value) {
            alert('Please select a date for scheduled publishing.');
            return false;
          }
          if (!this.scheduleTime.value) {
            alert('Please select a time for scheduled publishing.');
            return false;
          }
        }
        return true;

      case 5: // Review
        return true; // Validation happens on publish click
    }

    return true;
  }

  /**
   * Collect all form data into uploadData object
   */
  collectFormData() {
    // Content details
    this.uploadData.title = this.contentTitle.value;
    this.uploadData.description = this.contentDescription.value;
    this.uploadData.category = this.contentCategory.value;
    this.uploadData.language = this.contentLanguage.value;
    this.uploadData.tags = this.contentTags.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    // Content type
    const typeRadios = document.querySelectorAll('input[name="contentType"]');
    for (const radio of typeRadios) {
      if (radio.checked) {
        this.uploadData.type = radio.value;
        break;
      }
    }

    // Monetization
    this.uploadData.monetization = {
      enabled: this.enableMonetization.checked,
      pricingModel: this.pricingModel.value,
      price: parseFloat(this.contentPrice.value),
      isNFT: this.createAsNFT.checked,
      editionSize: parseInt(this.editionSize.value),
      royaltyPercent: parseInt(this.royaltyPercent.value),
      mintingMethod: this.mintingMethod.value
    };

    // Distribution
    this.uploadData.distribution = {
      visibility: this.contentVisibility.value,
      scheduled: this.scheduleContent.checked,
      scheduleDate: this.scheduleContent.checked ? this.scheduleDate.value : null,
      scheduleTime: this.scheduleContent.checked ? this.scheduleTime.value : null,
      notifications: {
        subscribers: this.notifySubscribers.checked,
        feed: this.postToFeed.checked,
        tokenHolders: this.notifyTokenHolders.checked
      },
      crosspost: {
        discord: this.crosspostDiscord.checked,
        twitter: this.crosspostTwitter.checked,
        snapshot: this.crosspostSnapshot.checked
      }
    };

    return this.uploadData;
  }

  /**
   * Save the current state as a draft
   */
  saveAsDraft() {
    const data = this.collectFormData();
    data.status = 'draft';

    // In a real app, this would save to backend or local storage
    console.log('Saving draft:', data);

    // Show success message
    alert('Content saved as draft.');
  }

  /**
   * Publish the content
   */
  publishContent() {
    if (!this.agreeTerms.checked) {
      alert('Please agree to the creator terms before publishing.');
      return;
    }

    const data = this.collectFormData();
    data.status = 'publishing';

    // Hide the steps and show progress UI
    for (const step of this.uploadSteps) {
      step.classList.remove('active');
    }
    this.nextBtn.classList.add('hidden');
    this.prevBtn.classList.add('hidden');
    this.publishBtn.classList.add('hidden');
    this.saveAsDraftBtn.classList.add('hidden');
    this.cancelBtn.classList.add('hidden');

    this.uploadProgress.classList.remove('hidden');

    // Start the upload process
    this.startUpload();
  }

  /**
   * Start the upload process with progress indication
   */
  startUpload() {
    // Start with file preparation
    this.updateProgress(0, 'Preparing files...');
    this.updateProgressStep('preparation', 'in-progress', 'Processing...');

    try {
      // Pre-process files if needed (e.g., validate, compress)
      const processedFiles = this.preProcessFiles();

      setTimeout(() => {
        this.updateProgress(10, 'Files prepared');
        this.updateProgressStep('preparation', 'completed', 'Completed');

        // Start IPFS upload
        this.updateProgressStep('ipfs', 'in-progress', 'Uploading to IPFS...');
        this.uploadToIPFS(processedFiles);
      }, 1000);
    } catch (error) {
      this.updateProgressStep('preparation', 'error', 'Failed');
      this.updateProgress(0, `Error: ${error.message}`);
      console.error('Error preparing files:', error);
    }
  }

  /**
   * Pre-process files before upload (validate, compress if needed)
   * @returns {Array} Processed files
   */
  preProcessFiles() {
    // Apply selected quality settings
    const storageType = document.getElementById('storageType').value;
    const quality = document.getElementById('uploadQuality').value;
    const qualityConfig = IPFSConfig.getQualityConfig(quality);

    // In a real implementation, you would compress videos/audio based on qualityConfig
    // For now, we'll just return the files as they are
    return [...this.selectedFiles];
  }

  /**
   * Upload files to IPFS with progress tracking
   * @param {Array} files The files to upload
   */
  async uploadToIPFS(files) {
    try {
      // Get upload options
      const uploadOptions = {
        pin: IPFSConfig.uploadDefaults.pinning
      };

      // Upload files to IPFS with progress tracking
      this.uploadedIPFSResults = await ipfsService.uploadFiles(
        files,
        uploadOptions,
        // Individual file progress
        (fileIndex, percentage, uploaded, total) => {
          // Update progress for individual file if needed
          const fileName = files[fileIndex].name;
          console.log(`File ${fileIndex + 1}/${files.length} (${fileName}): ${percentage}%`);
        },
        // Total progress callback
        (percentage, uploaded, total) => {
          // Calculate progress from 15% to 65% of the overall process
          const adjustedProgress = 15 + (percentage / 100) * 50;
          this.updateProgress(adjustedProgress, `Uploading to IPFS: ${Math.floor(percentage)}%`);
        }
      );

      console.log('IPFS upload results:', this.uploadedIPFSResults);

      // All files were uploaded successfully
      this.updateProgress(65, 'IPFS upload complete');
      this.updateProgressStep('ipfs', 'completed', 'Completed');

      // Move on to blockchain registration
      this.registerOnBlockchain();
    } catch (error) {
      this.updateProgressStep('ipfs', 'error', 'Failed');
      this.updateProgress(15, `IPFS upload failed: ${error.message}`);
      console.error('IPFS upload error:', error);
    }
  }

  /**
   * Register content on blockchain after IPFS upload
   */
  async registerOnBlockchain() {
    this.updateProgressStep('blockchain', 'in-progress', 'Registering on blockchain...');

    try {
      // First, prepare metadata for blockchain storage
      const metadata = this.prepareMetadata();

      this.updateProgress(75, 'Creating transaction...');

      // In a real implementation, you would:
      // 1. Connect to the user's Web3 wallet
      // 2. Create a transaction to register content
      // 3. Wait for transaction confirmation

      // For now, we'll simulate the blockchain registration
      setTimeout(() => {
        this.updateProgress(85, 'Waiting for confirmation...');

        setTimeout(() => {
          // Simulate transaction confirmation
          const txHash =
            '0x' +
            Array(64)
              .fill(0)
              .map(() => Math.floor(Math.random() * 16).toString(16))
              .join('');

          this.uploadData.blockchain = {
            txHash,
            timestamp: Date.now(),
            status: 'confirmed'
          };

          this.updateProgress(90, 'Transaction confirmed');
          this.updateProgressStep('blockchain', 'completed', 'Completed');

          // Move to finalizing step
          this.finalizeUpload();
        }, 2000);
      }, 1500);
    } catch (error) {
      this.updateProgressStep('blockchain', 'error', 'Failed');
      this.updateProgress(75, `Blockchain registration failed: ${error.message}`);
      console.error('Blockchain registration error:', error);
    }
  }

  /**
   * Prepare metadata for blockchain storage
   */
  prepareMetadata() {
    // Create a metadata object that combines user input with IPFS results
    const metadata = {
      title: this.uploadData.title,
      description: this.uploadData.description,
      category: this.uploadData.category,
      language: this.uploadData.language,
      tags: this.uploadData.tags,
      type: this.uploadData.type,
      monetization: this.uploadData.monetization,
      distribution: this.uploadData.distribution,
      creator: {
        address: '0x1a2b...3c4d', // Would come from user's wallet
        name: 'Creator Name' // Would come from user's profile
      },
      ipfs: {
        files: this.uploadedIPFSResults.map(result => ({
          cid: result.cid,
          url: result.ipfsUrl,
          filename: result.filename,
          mimeType: result.mimeType,
          size: result.size
        }))
      },
      created: Date.now()
    };

    return metadata;
  }

  /**
   * Finalize the upload process
   */
  async finalizeUpload() {
    this.updateProgressStep('finalizing', 'in-progress', 'Finalizing...');

    try {
      // In a real implementation, you would:
      // 1. Save the finalized metadata to a database
      // 2. Update user's content list
      // 3. Trigger notifications

      setTimeout(() => {
        this.updateProgress(100, 'Upload complete!');
        this.updateProgressStep('finalizing', 'completed', 'Completed');

        setTimeout(() => {
          // Show success UI
          this.uploadProgress.innerHTML += `
            <div class="upload-success">
              <i class="ri-checkbox-circle-line"></i>
              <h3>Content Successfully Published!</h3>
              <p>Your content is now available on StreamChain</p>
              <div class="ipfs-details">
                <span class="label">IPFS CID:</span>
                <span class="value">${this.uploadedIPFSResults[0]?.cid || 'N/A'}</span>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('${
                  this.uploadedIPFSResults[0]?.cid || ''
                }')">
                  <i class="ri-file-copy-line"></i>
                </button>
              </div>
              <div class="content-links">
                <a href="${this.uploadedIPFSResults[0]?.ipfsUrl || '#'}" target="_blank" class="btn-secondary">
                  <i class="ri-external-link-line"></i> View on IPFS
                </a>
                <a href="#content/${this.uploadData.blockchain?.txHash || ''}" class="btn-primary">
                  <i class="ri-film-line"></i> View Content Page
                </a>
              </div>
            </div>
          `;

          // Add button to close modal
          this.uploadProgress.innerHTML += `
            <div class="upload-actions">
              <button class="btn-secondary" onclick="document.getElementById('uploadModal').classList.remove('show')">
                Close
              </button>
            </div>
          `;
        }, 1000);
      }, 1500);
    } catch (error) {
      this.updateProgressStep('finalizing', 'error', 'Failed');
      this.updateProgress(90, `Finalization failed: ${error.message}`);
      console.error('Finalization error:', error);
    }
  }

  /**
   * Update the progress bar and status text
   */
  updateProgress(percent, status) {
    this.progressFill.style.width = `${percent}%`;
    this.progressStatus.textContent = status;
    this.progressPercentage.textContent = `${Math.round(percent)}%`;
  }

  /**
   * Update a specific progress step's status
   */
  updateProgressStep(step, state, statusText) {
    const stepElement = document.querySelector(`[data-progress-step="${step}"]`);
    if (stepElement) {
      // Remove existing state classes
      stepElement.classList.remove('waiting', 'in-progress', 'completed', 'error');
      // Add new state class
      stepElement.classList.add(state);
      // Update status text
      stepElement.querySelector('.step-status').textContent = statusText;
    }
  }

  /**
   * Close the modal and reset the form
   */
  closeModal() {
    this.modal.classList.remove('show');
    document.body.classList.remove('modal-open');

    // Reset form after animation completes
    setTimeout(() => {
      this.resetForm();
    }, 300);
  }

  /**
   * Reset the form to initial state
   */
  resetForm() {
    // Reset step
    this.goToStep(1);

    // Reset file selection
    this.selectedFiles = [];
    this.updateFileList();
    this.fileInput.value = '';

    // Reset content details
    this.contentTitle.value = '';
    this.contentDescription.value = '';
    this.titleCounter.textContent = '0';
    this.descCounter.textContent = '0';
    this.thumbnailFile = null;
    this.updateThumbnailPreview();
    this.contentCategory.selectedIndex = 0;
    this.contentLanguage.selectedIndex = 0;
    this.contentTags.value = '';

    // Reset monetization
    this.enableMonetization.checked = true;
    this.toggleMonetizationOptions();
    this.pricingModel.selectedIndex = 0;
    this.updatePricingVisibility();
    this.contentPrice.value = '5.0';
    this.createAsNFT.checked = false;
    this.toggleNFTOptions();
    this.editionSize.value = '1';
    this.royaltyPercent.value = '10';
    this.mintingMethod.selectedIndex = 0;

    // Reset distribution
    this.contentVisibility.selectedIndex = 0;
    this.scheduleContent.checked = false;
    this.toggleScheduleOptions();
    this.notifySubscribers.checked = true;
    this.postToFeed.checked = true;
    this.notifyTokenHolders.checked = true;
    this.crosspostDiscord.checked = false;
    this.crosspostTwitter.checked = false;
    this.crosspostSnapshot.checked = false;

    // Reset review
    this.agreeTerms.checked = false;
    this.updatePublishButton();

    // Reset progress
    this.uploadProgress.classList.add('hidden');
    this.progressFill.style.width = '0%';
    this.progressStatus.textContent = 'Preparing...';
    this.progressPercentage.textContent = '0%';

    // Reset progress steps
    for (const step of this.uploadStepElements) {
      step.classList.remove('in-progress', 'completed', 'error');
      step.classList.add('waiting');
      step.querySelector('.step-status').textContent = 'Waiting...';
    }

    // Reset navigation buttons
    this.nextBtn.classList.remove('hidden');
    this.prevBtn.classList.add('hidden');
    this.publishBtn.classList.add('hidden');
    this.saveAsDraftBtn.classList.remove('hidden');
    this.cancelBtn.classList.remove('hidden');

    // Also reset IPFS upload results
    this.uploadedIPFSResults = [];
  }
}

/**
 * Initialize the uploader when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function () {
  const uploader = new StreamChainUploader();

  // Store uploader instance on window for debug access
  window.streamChainUploader = uploader;
});
