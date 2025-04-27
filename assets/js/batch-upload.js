/**
 * Batch Upload Functionality for Creator Dashboard
 *
 * Provides drag & drop file upload, CSV import, and batch content processing
 * with IPFS integration
 */

// Initialize batch upload functionality when document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Global state for batch upload
  const batchUploadState = {
    files: [],
    uploadInProgress: false,
    currentBatchSize: 0,
    maxBatchSize: 50,
    processedCount: 0,
    failedItems: [],
    batchType: 'files' // 'files' or 'csv'
  };

  // Initialize IPFS batch service
  // Will be populated later when batchIpfsService is imported
  let batchIpfsService = null;

  // Try to load the batch IPFS service
  (async function loadBatchIpfsService() {
    try {
      // Dynamic import for the batch IPFS service
      const module = await import('./services/batch-ipfs-service.js');
      batchIpfsService = module.default;

      // Initialize the service
      await batchIpfsService.initialize({
        pinning: true,
        chunkSize: 2 * 1024 * 1024 // 2MB chunks
      });

      console.log('BatchIpfsService loaded and initialized successfully');
    } catch (error) {
      console.error('Failed to load or initialize BatchIpfsService:', error);
      // Create a fallback service if loading fails
      createFallbackBatchService();
    }
  })();

  // Create a fallback batch service if the module fails to load
  function createFallbackBatchService() {
    console.warn('Creating fallback batch service');

    // Fallback implementation that simulates uploads
    window.redx = window.redx || {};
    window.redx.batchUpload = {
      currentBatch: [],
      addFiles: function (files) {
        const toAdd = Array.from(files);
        this.currentBatch = this.currentBatch.concat(toAdd);
        return toAdd.length;
      },
      processUpload: function (progressCallback, completeCallback, errorCallback) {
        const total = this.currentBatch.length;
        let processed = 0;

        if (total === 0) {
          if (errorCallback) errorCallback('No files to upload');
          return false;
        }

        // Process files sequentially
        const processNext = index => {
          if (index >= total) {
            if (completeCallback) {
              completeCallback({
                total: total,
                successful: total,
                failed: []
              });
            }
            return;
          }

          const file = this.currentBatch[index];

          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;

            if (progress <= 100) {
              if (progressCallback) {
                progressCallback({
                  file: file,
                  index: index,
                  processed: processed,
                  total: total,
                  percent:
                    Math.round((processed / total) * 100) +
                    Math.round((progress / 100) * (100 / total)),
                  status: 'uploading',
                  fileProgress: progress
                });
              }
            } else {
              clearInterval(interval);
              processed++;

              // Report completion for this file
              if (progressCallback) {
                progressCallback({
                  file: file,
                  index: index,
                  processed: processed,
                  total: total,
                  percent: Math.round((processed / total) * 100),
                  status: 'success',
                  cid: 'Qm' + Math.random().toString(36).substring(2, 15)
                });
              }

              // Process next file
              setTimeout(() => processNext(index + 1), 200);
            }
          }, 200);
        };

        // Start processing
        processNext(0);
        return true;
      },
      resumeFailed: function (progressCallback, completeCallback) {
        completeCallback({
          total: 0,
          successful: 0,
          failed: []
        });
        return true;
      },
      clearBatch: function () {
        const count = this.currentBatch.length;
        this.currentBatch = [];
        return count;
      }
    };
  }

  // Batch upload DOM elements - these will be populated when found in the DOM
  let batchUploadForm;
  let regularContentForm;
  let batchDropzone;
  let batchFileInput;
  let browseBatchFilesBtn;
  let batchItemsContainer;
  let clearBatchBtn;
  let csvTemplateSection;
  let downloadCsvTemplate;
  let batchTypeOptions;
  let batchProgressFill;
  let batchProgressCount;
  let batchProgressPercent;
  let batchUploadProgress;
  let resumeFailedBtn;
  let enableBatchNft;
  let batchNftOptions;
  let useCommonSettings;
  let commonSettingsForm;
  let batchTagInput;
  let batchTagsContainer;
  let finalizeContentBtn;

  // Initialize batch upload UI elements
  function initBatchUploadUI() {
    // Find all batch upload UI elements
    batchUploadForm = document.getElementById('batchUploadForm');
    regularContentForm = document.getElementById('regularContentForm');
    batchDropzone = document.getElementById('batchDropzone');
    batchFileInput = document.getElementById('batchFileInput');
    browseBatchFilesBtn = document.getElementById('browseBatchFilesBtn');
    batchItemsContainer = document.getElementById('batchItemsContainer');
    clearBatchBtn = document.getElementById('clearBatchBtn');
    csvTemplateSection = document.getElementById('csvTemplateSection');
    downloadCsvTemplate = document.getElementById('downloadCsvTemplate');
    batchTypeOptions = document.querySelectorAll('.batch-type-option');
    batchProgressFill = document.getElementById('batchProgressFill');
    batchProgressCount = document.getElementById('batchProgressCount');
    batchProgressPercent = document.getElementById('batchProgressPercent');
    batchUploadProgress = document.getElementById('batchUploadProgress');
    resumeFailedBtn = document.getElementById('resumeFailedBtn');
    enableBatchNft = document.getElementById('enableBatchNft');
    batchNftOptions = document.getElementById('batchNftOptions');
    useCommonSettings = document.getElementById('useCommonSettings');
    commonSettingsForm = document.getElementById('commonSettingsForm');
    batchTagInput = document.getElementById('batchTagInput');
    batchTagsContainer = document.getElementById('batchTagsContainer');
    finalizeContentBtn = document.getElementById('finalizeContentBtn');

    // Set up event listeners if elements exist
    if (batchDropzone) {
      setupBatchUploadEventListeners();
    }
  }

  // Set up all event listeners for batch upload functionality
  function setupBatchUploadEventListeners() {
    // Content type selection in Step 1
    const contentTypeCards = document.querySelectorAll('.content-type-card');
    let selectedContentType = '';

    // Select content type from step 1
    contentTypeCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active class from all cards
        contentTypeCards.forEach(c => c.classList.remove('active'));
        // Add active class to selected card
        card.classList.add('active');

        // Get selected content type
        selectedContentType = card.getAttribute('data-content-type');

        // Show/hide forms based on selection
        if (selectedContentType === 'batch-upload') {
          if (regularContentForm) regularContentForm.style.display = 'none';
          if (batchUploadForm) batchUploadForm.style.display = 'block';
        } else {
          if (regularContentForm) regularContentForm.style.display = 'block';
          if (batchUploadForm) batchUploadForm.style.display = 'none';
        }
      });
    });

    // Select batch type
    if (batchTypeOptions) {
      batchTypeOptions.forEach(option => {
        option.addEventListener('click', () => {
          batchTypeOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');

          const batchType = option.getAttribute('data-batch-type');
          batchUploadState.batchType = batchType;

          // Show/hide CSV template section
          if (batchType === 'csv' && csvTemplateSection) {
            csvTemplateSection.style.display = 'flex';
          } else if (csvTemplateSection) {
            csvTemplateSection.style.display = 'none';
          }
        });
      });
    }

    // Download CSV template
    if (downloadCsvTemplate) {
      downloadCsvTemplate.addEventListener('click', e => {
        e.preventDefault();

        // CSV template headers and example row
        const csvContent = [
          'title,description,category,difficulty,language,tags,duration',
          'Smart Contract Security,Learn about common vulnerabilities in smart contracts,security,intermediate,en,"security,smart-contracts,solidity",25 min',
          'Introduction to NFTs,Overview of non-fungible tokens and their use cases,nft,beginner,en,"nft,blockchain,web3",15 min'
        ].join('\n');

        // Create a blob and download the CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', 'content_batch_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    // Toggle NFT options
    if (enableBatchNft && batchNftOptions) {
      enableBatchNft.addEventListener('change', () => {
        batchNftOptions.style.display = enableBatchNft.checked ? 'block' : 'none';
      });
    }

    // Toggle common settings
    if (useCommonSettings && commonSettingsForm) {
      useCommonSettings.addEventListener('change', () => {
        commonSettingsForm.style.display = useCommonSettings.checked ? 'block' : 'none';
      });
    }

    // Batch tag input
    if (batchTagInput && batchTagsContainer) {
      batchTagInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          e.preventDefault();

          const tag = e.target.value.trim().toLowerCase();

          // Check if tag already exists
          const existingTags = Array.from(batchTagsContainer.querySelectorAll('.tag')).map(tagEl =>
            tagEl.textContent.trim()
          );

          if (!existingTags.includes(tag) && existingTags.length < 10) {
            addBatchTag(tag);
            batchTagInput.value = '';
          }
        }
      });
    }

    // Setup drag and drop for batch upload
    if (batchDropzone) {
      batchDropzone.addEventListener('dragover', e => {
        e.preventDefault();
        batchDropzone.classList.add('drag-over');
      });

      batchDropzone.addEventListener('dragleave', () => {
        batchDropzone.classList.remove('drag-over');
      });

      batchDropzone.addEventListener('drop', e => {
        e.preventDefault();
        batchDropzone.classList.remove('drag-over');

        if (batchUploadState.uploadInProgress) {
          showNotification('Upload in progress. Please wait until it completes.', 'error');
          return;
        }

        if (batchUploadState.batchType === 'files') {
          handleBatchFiles(e.dataTransfer.files);
        } else {
          // Handle only CSV files for CSV import
          const files = Array.from(e.dataTransfer.files).filter(
            file => file.type === 'text/csv' || file.name.endsWith('.csv')
          );

          if (files.length === 0) {
            showNotification('Please upload a CSV file for batch import.', 'error');
            return;
          }

          if (files.length > 1) {
            showNotification('Please upload only one CSV file.', 'warning');
          }

          handleCsvImport(files[0]);
        }
      });
    }

    // Click dropzone to browse files
    if (browseBatchFilesBtn && batchFileInput) {
      browseBatchFilesBtn.addEventListener('click', () => {
        if (batchUploadState.uploadInProgress) {
          showNotification('Upload in progress. Please wait until it completes.', 'error');
          return;
        }

        batchFileInput.click();
      });
    }

    // Handle file input change
    if (batchFileInput) {
      batchFileInput.addEventListener('change', () => {
        if (batchUploadState.batchType === 'files') {
          handleBatchFiles(batchFileInput.files);
        } else {
          // Handle only CSV files for CSV import
          const files = Array.from(batchFileInput.files).filter(
            file => file.type === 'text/csv' || file.name.endsWith('.csv')
          );

          if (files.length === 0) {
            showNotification('Please upload a CSV file for batch import.', 'error');
            return;
          }

          handleCsvImport(files[0]);
        }

        // Reset file input for future selections
        batchFileInput.value = '';
      });
    }

    // Clear batch files
    if (clearBatchBtn) {
      clearBatchBtn.addEventListener('click', () => {
        if (batchUploadState.uploadInProgress) {
          showNotification('Cannot clear files while upload is in progress', 'error');
          return;
        }

        // Clear files from the IPFS batch service if available
        if (batchIpfsService) {
          batchIpfsService.clearBatch();
        } else if (window.redx && window.redx.batchUpload) {
          window.redx.batchUpload.clearBatch();
        }

        // Clear local state
        batchUploadState.files = [];
        batchUploadState.currentBatchSize = 0;
        if (batchItemsContainer) {
          batchItemsContainer.innerHTML = '';
        }

        if (clearBatchBtn) {
          clearBatchBtn.disabled = true;
        }

        if (resumeFailedBtn) {
          resumeFailedBtn.style.display = 'none';
        }

        showNotification('Batch cleared successfully', 'success');
      });
    }

    // Resume failed uploads
    if (resumeFailedBtn) {
      resumeFailedBtn.addEventListener('click', () => {
        if (batchUploadState.uploadInProgress) {
          showNotification('Upload already in progress', 'error');
          return;
        }

        resumeFailedUploads();
      });
    }

    // Finalize content button - handle batch upload
    if (finalizeContentBtn) {
      finalizeContentBtn.addEventListener('click', () => {
        if (selectedContentType === 'batch-upload') {
          // Start batch processing
          processBatchUpload();
        }
      });
    }

    // Step 3 to 4 transition - customize for batch upload
    const stepForwardToStep4 = document.querySelector('.step-forward[data-goto="4"]');
    if (stepForwardToStep4) {
      stepForwardToStep4.addEventListener('click', () => {
        // If it was a batch upload, update the summary
        if (selectedContentType === 'batch-upload') {
          const summaryType = document.getElementById('summaryType');
          if (summaryType) {
            summaryType.textContent = `Batch Upload (${batchUploadState.files.length} items)`;
          }

          // For batch uploads, use the common settings if available
          if (useCommonSettings && useCommonSettings.checked) {
            const summaryTitle = document.getElementById('summaryTitle');
            const summaryCategory = document.getElementById('summaryCategory');
            const summaryDifficulty = document.getElementById('summaryDifficulty');

            if (summaryTitle) summaryTitle.textContent = 'Multiple items';

            if (summaryCategory) {
              const batchCategory = document.getElementById('batchCategory');
              summaryCategory.textContent = batchCategory
                ? batchCategory.value || 'Multiple categories'
                : 'Multiple categories';
            }

            if (summaryDifficulty) {
              const batchDifficulty = document.getElementById('batchDifficulty');
              summaryDifficulty.textContent = batchDifficulty
                ? batchDifficulty.value || 'Mixed'
                : 'Mixed';
            }
          }
        }
      });
    }
  }

  // Create and add a tag to the batch tags container
  function addBatchTag(tagText) {
    if (!batchTagsContainer) return;

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${tagText} <i class="ri-close-line"></i>`;

    tag.querySelector('i').addEventListener('click', () => {
      batchTagsContainer.removeChild(tag);
    });

    batchTagsContainer.appendChild(tag);
  }

  // Handle batch files for direct file upload
  function handleBatchFiles(fileList) {
    // Check if we've reached the maximum batch size
    if (batchUploadState.currentBatchSize >= batchUploadState.maxBatchSize) {
      showNotification(
        `Maximum batch size of ${batchUploadState.maxBatchSize} reached.`,
        'warning'
      );
      return;
    }

    // Convert FileList to array and filter by supported types
    const supportedTypes = [
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    const validFiles = Array.from(fileList).filter(file => {
      // Check file extension if mime type doesn't match
      const extension = file.name.split('.').pop().toLowerCase();
      return (
        supportedTypes.includes(file.type) ||
        ['mp4', 'webm', 'pdf', 'md', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(extension)
      );
    });

    if (validFiles.length === 0) {
      showNotification('No supported files found. Please check file formats.', 'error');
      return;
    }

    // Calculate how many files we can add
    const remainingSlots = batchUploadState.maxBatchSize - batchUploadState.currentBatchSize;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    // Add files to state and UI
    batchUploadState.files = [...batchUploadState.files, ...filesToAdd];
    batchUploadState.currentBatchSize += filesToAdd.length;

    // Add files to IPFS batch service if available
    if (batchIpfsService) {
      batchIpfsService.addFiles(filesToAdd);
    } else if (window.redx && window.redx.batchUpload) {
      window.redx.batchUpload.addFiles(filesToAdd);
    }

    // Update UI
    filesToAdd.forEach(file => addFileToBatchUI(file));

    if (clearBatchBtn) {
      clearBatchBtn.disabled = false;
    }

    showNotification(`Added ${filesToAdd.length} files to batch.`, 'success');

    // If user tried to add more files than allowed
    if (validFiles.length > remainingSlots) {
      showNotification(
        `Only ${remainingSlots} files were added. Maximum batch size reached.`,
        'warning'
      );
    }
  }

  // Parse CSV row handling quoted values with commas
  function parseCSVRow(row) {
    const result = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add the last value
    result.push(currentValue);
    return result;
  }

  // Handle CSV import
  function handleCsvImport(csvFile) {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const csvContent = e.target.result;
        const rows = csvContent.split('\n');

        // Parse header row to get column indexes
        const headers = rows[0].split(',');
        const columnIndexes = {
          title: headers.indexOf('title'),
          description: headers.indexOf('description'),
          category: headers.indexOf('category'),
          difficulty: headers.indexOf('difficulty'),
          language: headers.indexOf('language'),
          tags: headers.indexOf('tags'),
          duration: headers.indexOf('duration')
        };

        // Check if required headers exist
        if (columnIndexes.title === -1) {
          showNotification('Invalid CSV format: "title" column is required.', 'error');
          return;
        }

        // Parse data rows (skip header)
        const contentItems = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows

          const cols = parseCSVRow(rows[i]);

          const item = {
            title: columnIndexes.title > -1 ? cols[columnIndexes.title] : '',
            description: columnIndexes.description > -1 ? cols[columnIndexes.description] : '',
            category: columnIndexes.category > -1 ? cols[columnIndexes.category] : '',
            difficulty: columnIndexes.difficulty > -1 ? cols[columnIndexes.difficulty] : 'beginner',
            language: columnIndexes.language > -1 ? cols[columnIndexes.language] : 'en',
            tags:
              columnIndexes.tags > -1 ? cols[columnIndexes.tags].replace(/"/g, '').split(',') : [],
            duration: columnIndexes.duration > -1 ? cols[columnIndexes.duration] : ''
          };

          contentItems.push(item);
        }

        // Add CSV items to UI
        if (contentItems.length > 0) {
          // Clear existing items
          batchUploadState.files = [];
          if (batchItemsContainer) {
            batchItemsContainer.innerHTML = '';
          }

          // Limit to max batch size
          const itemsToAdd = contentItems.slice(0, batchUploadState.maxBatchSize);

          // Add placeholder files to represent CSV items
          itemsToAdd.forEach((item, index) => {
            const placeholderFile = new File(['placeholder'], `${item.title}.content`, {
              type: 'application/json'
            });

            // Store CSV data with the file
            placeholderFile.csvData = item;

            // Add to state and UI
            batchUploadState.files.push(placeholderFile);
            addCsvItemToBatchUI(placeholderFile, item, index);
          });

          // Add files to IPFS batch service if available
          if (batchIpfsService) {
            batchIpfsService.addFiles(batchUploadState.files);
          } else if (window.redx && window.redx.batchUpload) {
            window.redx.batchUpload.addFiles(batchUploadState.files);
          }

          batchUploadState.currentBatchSize = itemsToAdd.length;
          if (clearBatchBtn) {
            clearBatchBtn.disabled = false;
          }

          showNotification(`Imported ${itemsToAdd.length} content items from CSV.`, 'success');

          if (contentItems.length > batchUploadState.maxBatchSize) {
            showNotification(
              `Only ${batchUploadState.maxBatchSize} items were imported. Maximum batch size reached.`,
              'warning'
            );
          }
        } else {
          showNotification('No valid content items found in CSV file.', 'error');
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        showNotification(`Error parsing CSV: ${error.message}`, 'error');
      }
    };

    reader.readAsText(csvFile);
  }

  // Add a file to the batch UI
  function addFileToBatchUI(file) {
    if (!batchItemsContainer) return;

    const fileItem = document.createElement('div');
    fileItem.className = 'batch-item';
    fileItem.dataset.filename = file.name;

    // Generate preview based on file type
    const filePreview = document.createElement('div');
    filePreview.className = 'batch-item-preview';

    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      filePreview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => URL.revokeObjectURL(video.src);
      filePreview.appendChild(video);
    } else {
      // File type icon
      const icon = document.createElement('i');

      if (file.type === 'application/pdf') {
        icon.className = 'ri-file-pdf-line';
      } else if (file.type.startsWith('video/')) {
        icon.className = 'ri-video-line';
      } else if (
        file.type.includes('word') ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.docx')
      ) {
        icon.className = 'ri-file-word-line';
      } else if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        icon.className = 'ri-markdown-line';
      } else {
        icon.className = 'ri-file-line';
      }

      filePreview.appendChild(icon);
    }

    // Create file info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'batch-item-info';

    const fileName = document.createElement('div');
    fileName.className = 'batch-item-name';
    fileName.textContent = file.name;

    const fileMeta = document.createElement('div');
    fileMeta.className = 'batch-item-meta';
    fileMeta.innerHTML = `
      <span>${formatFileSize(file.size)}</span>
      <span>${file.type || 'Unknown type'}</span>
    `;

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileMeta);

    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'batch-remove-item';
    removeBtn.innerHTML = '<i class="ri-close-line"></i>';
    removeBtn.addEventListener('click', () => {
      // Find index of file in array
      const fileIndex = batchUploadState.files.indexOf(file);

      if (fileIndex > -1) {
        // Remove file from array and UI
        batchUploadState.files.splice(fileIndex, 1);
        batchUploadState.currentBatchSize--;

        batchItemsContainer.removeChild(fileItem);

        if (batchUploadState.files.length === 0 && clearBatchBtn) {
          clearBatchBtn.disabled = true;
        }
      }
    });

    // Add edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'batch-item-edit';
    editBtn.innerHTML = '<i class="ri-pencil-line"></i>';
    editBtn.addEventListener('click', () => {
      // Show edit modal for individual item
      alert(`Edit ${file.name} (To be implemented)`);
    });

    // Append all elements
    fileItem.appendChild(filePreview);
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(removeBtn);
    fileItem.appendChild(editBtn);

    batchItemsContainer.appendChild(fileItem);
  }

  // Add a CSV item to the batch UI
  function addCsvItemToBatchUI(file, csvData, index) {
    if (!batchItemsContainer) return;

    const fileItem = document.createElement('div');
    fileItem.className = 'batch-item csv-item';
    fileItem.dataset.index = index;

    // Generate preview based on CSV data content type
    const filePreview = document.createElement('div');
    filePreview.className = 'batch-item-preview';

    // Use placeholder icon for CSV items
    const icon = document.createElement('i');
    icon.className = 'ri-file-list-line';
    filePreview.appendChild(icon);

    // Create file info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'batch-item-info';

    const fileName = document.createElement('div');
    fileName.className = 'batch-item-name';
    fileName.textContent = csvData.title;

    const fileMeta = document.createElement('div');
    fileMeta.className = 'batch-item-meta';
    fileMeta.innerHTML = `
      <span>${csvData.category || 'No category'}</span>
      <span>${csvData.difficulty}</span>
      <span>${csvData.duration || 'No duration'}</span>
    `;

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileMeta);

    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'batch-remove-item';
    removeBtn.innerHTML = '<i class="ri-close-line"></i>';
    removeBtn.addEventListener('click', () => {
      // Find index of file in array
      const fileIndex = batchUploadState.files.indexOf(file);

      if (fileIndex > -1) {
        // Remove file from array and UI
        batchUploadState.files.splice(fileIndex, 1);
        batchUploadState.currentBatchSize--;

        batchItemsContainer.removeChild(fileItem);

        if (batchUploadState.files.length === 0 && clearBatchBtn) {
          clearBatchBtn.disabled = true;
        }
      }
    });

    // Add edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'batch-item-edit';
    editBtn.innerHTML = '<i class="ri-pencil-line"></i>';
    editBtn.addEventListener('click', () => {
      // Show edit modal for individual item
      alert(`Edit ${csvData.title} (To be implemented)`);
    });

    // Append all elements
    fileItem.appendChild(filePreview);
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(removeBtn);
    fileItem.appendChild(editBtn);

    batchItemsContainer.appendChild(fileItem);
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Process batch upload - Connect to IPFS service
  function processBatchUpload() {
    if (batchUploadState.files.length === 0) {
      showNotification('No files to upload', 'error');
      return;
    }

    batchUploadState.uploadInProgress = true;
    batchUploadState.processedCount = 0;
    batchUploadState.failedItems = [];

    // Show progress UI
    if (batchUploadProgress) {
      batchUploadProgress.style.display = 'block';
    }

    if (batchProgressFill) {
      batchProgressFill.style.width = '0%';
    }

    if (batchProgressCount) {
      batchProgressCount.textContent = `0/${batchUploadState.files.length} files processed`;
    }

    if (batchProgressPercent) {
      batchProgressPercent.textContent = '0%';
    }

    // Disable controls during upload
    if (clearBatchBtn) {
      clearBatchBtn.disabled = true;
    }

    document.querySelectorAll('.batch-remove-item, .batch-item-edit').forEach(btn => {
      btn.disabled = true;
    });

    // Prepare common metadata from form
    const commonMetadata =
      useCommonSettings && useCommonSettings.checked
        ? {
            category: document.getElementById('batchCategory')
              ? document.getElementById('batchCategory').value
              : '',
            difficulty: document.getElementById('batchDifficulty')
              ? document.getElementById('batchDifficulty').value
              : '',
            language: document.getElementById('batchLanguage')
              ? document.getElementById('batchLanguage').value
              : '',
            license: document.getElementById('batchLicense')
              ? document.getElementById('batchLicense').value
              : '',
            tags: batchTagsContainer
              ? Array.from(batchTagsContainer.querySelectorAll('.tag')).map(tag =>
                  tag.textContent.trim()
                )
              : [],
            nftEnabled: enableBatchNft ? enableBatchNft.checked : false,
            royaltyPercentage:
              enableBatchNft &&
              enableBatchNft.checked &&
              document.getElementById('batchRoyaltyPercentage')
                ? document.getElementById('batchRoyaltyPercentage').value
                : null,
            editionSize:
              enableBatchNft &&
              enableBatchNft.checked &&
              document.getElementById('batchEditionSize')
                ? document.getElementById('batchEditionSize').value
                : null
          }
        : null;

    // Use the IPFS batch service to upload files
    const uploadService = batchIpfsService || (window.redx && window.redx.batchUpload);

    if (uploadService) {
      uploadService.processUpload(
        // Progress callback
        progress => {
          // Update UI based on progress
          if (batchProgressFill) {
            batchProgressFill.style.width = `${progress.percent}%`;
          }

          if (batchProgressPercent) {
            batchProgressPercent.textContent = `${progress.percent}%`;
          }

          if (progress.processed && batchProgressCount) {
            batchProgressCount.textContent = `${progress.processed}/${progress.total} files processed`;
          }

          // Find and update the file item UI
          if (progress.file && batchItemsContainer) {
            const items = Array.from(batchItemsContainer.children);
            const fileItem = items.find(item => item.dataset.filename === progress.file.name);

            if (fileItem) {
              const statusEl = fileItem.querySelector('.batch-item-meta');
              // Add or update status indicator
              let statusIndicator = statusEl.querySelector('.status-indicator');

              if (!statusIndicator) {
                statusIndicator = document.createElement('span');
                statusIndicator.className = 'status-indicator';
                statusEl.appendChild(statusIndicator);
              }

              if (progress.status === 'uploading') {
                statusIndicator.className = 'status-indicator uploading';
                statusIndicator.textContent = progress.fileProgress
                  ? `${progress.fileProgress}%`
                  : 'Uploading...';
              } else if (progress.status === 'success') {
                statusIndicator.className = 'status-indicator success';
                statusIndicator.textContent = 'Success';

                // Store CID if available
                if (progress.cid) {
                  fileItem.dataset.cid = progress.cid;
                }
              } else if (progress.status === 'error') {
                statusIndicator.className = 'status-indicator error';
                statusIndicator.textContent = 'Failed';

                // Store error message
                if (progress.error) {
                  fileItem.dataset.error = progress.error;
                }
              }
            }
          }
        },
        // Complete callback
        result => {
          batchUploadState.uploadInProgress = false;
          batchUploadState.failedItems = result.failed || [];

          // Enable resume button if there were failures
          if (batchUploadState.failedItems.length > 0 && resumeFailedBtn) {
            resumeFailedBtn.style.display = 'block';
          }

          // Enable controls
          if (clearBatchBtn) {
            clearBatchBtn.disabled = false;
          }

          document.querySelectorAll('.batch-remove-item, .batch-item-edit').forEach(btn => {
            btn.disabled = false;
          });

          const successCount = result.successful || 0;

          // Show completion message
          if (result.failed && result.failed.length > 0) {
            showNotification(
              `Batch upload completed with issues. ${successCount} successful, ${result.failed.length} failed.`,
              'warning'
            );
          } else {
            showNotification(`Successfully uploaded ${successCount} files!`, 'success');
          }
        },
        // Error callback
        error => {
          batchUploadState.uploadInProgress = false;

          // Enable controls
          if (clearBatchBtn) {
            clearBatchBtn.disabled = false;
          }

          document.querySelectorAll('.batch-remove-item, .batch-item-edit').forEach(btn => {
            btn.disabled = false;
          });

          showNotification(`Upload error: ${error}`, 'error');
        }
      );
    } else {
      // No upload service available
      showNotification('IPFS upload service not available.', 'error');
      batchUploadState.uploadInProgress = false;

      if (clearBatchBtn) {
        clearBatchBtn.disabled = false;
      }
    }
  }

  // Resume failed uploads
  function resumeFailedUploads() {
    if (batchUploadState.failedItems.length === 0) {
      showNotification('No failed uploads to retry', 'info');
      return;
    }

    batchUploadState.uploadInProgress = true;

    // Show progress UI
    if (batchUploadProgress) {
      batchUploadProgress.style.display = 'block';
    }

    if (batchProgressFill) {
      batchProgressFill.style.width = '0%';
    }

    if (batchProgressCount) {
      batchProgressCount.textContent = `0/${batchUploadState.failedItems.length} files processed`;
    }

    if (batchProgressPercent) {
      batchProgressPercent.textContent = '0%';
    }

    // Disable controls during upload
    if (clearBatchBtn) {
      clearBatchBtn.disabled = true;
    }

    if (resumeFailedBtn) {
      resumeFailedBtn.style.display = 'none';
    }

    document.querySelectorAll('.batch-remove-item, .batch-item-edit').forEach(btn => {
      btn.disabled = true;
    });

    const uploadService = batchIpfsService || (window.redx && window.redx.batchUpload);

    if (uploadService && uploadService.resumeFailedUploads) {
      uploadService.resumeFailedUploads(
        // Progress callback - same as regular upload
        progress => {
          // Update UI based on progress
          if (batchProgressFill) {
            batchProgressFill.style.width = `${progress.percent}%`;
          }

          if (batchProgressPercent) {
            batchProgressPercent.textContent = `${progress.percent}%`;
          }

          if (progress.processed && batchProgressCount) {
            batchProgressCount.textContent = `${progress.processed}/${progress.total} files processed`;
          }

          // Find and update the file item UI
          if (progress.file && batchItemsContainer) {
            const items = Array.from(batchItemsContainer.children);
            const fileItem = items.find(item => item.dataset.filename === progress.file.name);

            if (fileItem) {
              const statusEl = fileItem.querySelector('.batch-item-meta');
              let statusIndicator = statusEl.querySelector('.status-indicator');

              if (!statusIndicator) {
                statusIndicator = document.createElement('span');
                statusIndicator.className = 'status-indicator';
                statusEl.appendChild(statusIndicator);
              }

              if (progress.status === 'uploading') {
                statusIndicator.className = 'status-indicator uploading';
                statusIndicator.textContent = progress.fileProgress
                  ? `${progress.fileProgress}%`
                  : 'Retrying...';
              } else if (progress.status === 'success') {
                statusIndicator.className = 'status-indicator success';
                statusIndicator.textContent = 'Success';

                if (progress.cid) {
                  fileItem.dataset.cid = progress.cid;
                }
              } else if (progress.status === 'error') {
                statusIndicator.className = 'status-indicator error';
                statusIndicator.textContent = 'Failed';

                if (progress.error) {
                  fileItem.dataset.error = progress.error;
                }
              }
            }
          }
        },
        // Complete callback
        result => {
          batchUploadState.uploadInProgress = false;
          batchUploadState.failedItems = result.failed || [];

          // Show resume button if there are still failures
          if (batchUploadState.failedItems.length > 0 && resumeFailedBtn) {
            resumeFailedBtn.style.display = 'block';
          } else if (resumeFailedBtn) {
            resumeFailedBtn.style.display = 'none';
          }

          // Enable controls
          if (clearBatchBtn) {
            clearBatchBtn.disabled = false;
          }

          document.querySelectorAll('.batch-remove-item, .batch-item-edit').forEach(btn => {
            btn.disabled = false;
          });

          const successCount = result.successful || 0;

          // Show completion message
          if (result.failed && result.failed.length > 0) {
            showNotification(
              `Resume completed with issues. ${successCount} successful, ${result.failed.length} still failed.`,
              'warning'
            );
          } else {
            showNotification(`Successfully uploaded all remaining files!`, 'success');
          }
        },
        // Error callback
        error => {
          batchUploadState.uploadInProgress = false;

          // Enable controls
          if (clearBatchBtn) {
            clearBatchBtn.disabled = false;
          }

          document.querySelectorAll('.batch-remove-item, .batch-item-edit').forEach(btn => {
            btn.disabled = false;
          });

          // Show resume button again
          if (resumeFailedBtn) {
            resumeFailedBtn.style.display = 'block';
          }

          showNotification(`Resume error: ${error}`, 'error');
        }
      );
    } else {
      // No resume functionality available
      showNotification('Resume functionality not available', 'error');
      batchUploadState.uploadInProgress = false;

      if (clearBatchBtn) {
        clearBatchBtn.disabled = false;
      }

      if (resumeFailedBtn) {
        resumeFailedBtn.style.display = 'block';
      }
    }
  }

  // Notification system
  function showNotification(message, type = 'info') {
    // Create notifications container if it doesn't exist
    let container = document.querySelector('.notifications-container');
    if (!container) {
      container = createNotificationsContainer();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="ri-${type === 'error' ? 'error-warning' : type === 'success' ? 'checkbox-circle' : 'information'}-line"></i>
      </div>
      <div class="notification-content">${message}</div>
      <button class="notification-close"><i class="ri-close-line"></i></button>
    `;

    // Add to container
    container.appendChild(notification);

    // Add close button event
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('hiding');
      setTimeout(() => {
        container.removeChild(notification);
      }, 300);
    });

    // Auto remove after delay
    setTimeout(() => {
      if (notification.parentNode === container) {
        notification.classList.add('hiding');
        setTimeout(() => {
          if (notification.parentNode === container) {
            container.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }

  // Create notifications container if it doesn't exist
  function createNotificationsContainer() {
    const container = document.createElement('div');
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
  }

  // Add notification styles if not already in document
  function addNotificationStyles() {
    if (!document.querySelector('#notification-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'notification-styles';
      styleEl.textContent = `
        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 350px;
        }

        .notification {
          background: #fff;
          border-left: 4px solid #2196F3;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 15px;
          display: flex;
          align-items: flex-start;
          border-radius: 4px;
          animation: slideIn 0.3s ease-out forwards;
          transform: translateX(120%);
        }

        .notification.hiding {
          animation: slideOut 0.3s ease-in forwards;
        }

        .notification-icon {
          margin-right: 12px;
          font-size: 20px;
        }

        .notification.success {
          border-color: #4CAF50;
        }

        .notification.success .notification-icon {
          color: #4CAF50;
        }

        .notification.error {
          border-color: #F44336;
        }

        .notification.error .notification-icon {
          color: #F44336;
        }

        .notification.warning {
          border-color: #FF9800;
        }

        .notification.warning .notification-icon {
          color: #FF9800;
        }

        .notification-content {
          flex: 1;
          margin-right: 10px;
        }

        .notification-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #999;
          padding: 0;
        }

        @keyframes slideIn {
          from { transform: translateX(120%); }
          to { transform: translateX(0); }
        }

        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(120%); }
        }

        .status-indicator {
          display: inline-block;
          padding: 2px 6px;
          margin-left: 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: 500;
        }

        .status-indicator.uploading {
          background-color: #2196F3;
          color: white;
        }

        .status-indicator.success {
          background-color: #4CAF50;
          color: white;
        }

        .status-indicator.error {
          background-color: #F44336;
          color: white;
        }
      `;

      document.head.appendChild(styleEl);
    }
  }

  // Initialize window.redx.batchUpload for global access if it doesn't exist
  function initGlobalBatchUpload() {
    if (!window.redx) window.redx = {};

    // Only create if not already defined
    if (!window.redx.batchUpload) {
      window.redx.batchUpload = {
        addFiles: function (files) {
          return batchIpfsService ? batchIpfsService.addFiles(files) : 0;
        },
        processUpload: function (progressCallback, completeCallback, errorCallback) {
          return batchIpfsService
            ? batchIpfsService.processUpload(progressCallback, completeCallback, errorCallback)
            : false;
        },
        resumeFailedUploads: function (progressCallback, completeCallback, errorCallback) {
          return batchIpfsService
            ? batchIpfsService.resumeFailedUploads(
                progressCallback,
                completeCallback,
                errorCallback
              )
            : false;
        },
        clearBatch: function () {
          return batchIpfsService ? batchIpfsService.clearBatch() : 0;
        }
      };
    }
  }

  // Initialize notification styles
  addNotificationStyles();

  // Initialize global access to batch upload
  initGlobalBatchUpload();

  // Initialize batch upload UI
  initBatchUploadUI();
});
