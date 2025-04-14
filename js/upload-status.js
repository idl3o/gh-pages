/**
 * Upload Status Tracker
 * Handles upload status indicators for Web3 Crypto Streaming Service
 * Version: 1.0.0
 * Date: April 14, 2025
 */

class UploadStatusTracker {
    constructor(options = {}) {
        this.containerId = options.containerId || 'upload-status-container';
        this.uploadQueue = [];
        this.completedUploads = [];
        this.failedUploads = [];
        this.statusColors = {
            pending: '#f59e0b', // warning/amber
            uploading: '#3b82f6', // blue
            processing: '#8b5cf6', // violet
            success: '#10b981', // success/green
            failed: '#ef4444', // danger/red
            canceled: '#6b7280' // gray
        };
        
        // Initialize the UI if container exists
        this.initUI();
        
        // Bind event handlers
        this._bindEvents();
    }
    
    /**
     * Initialize the UI container and elements
     */
    initUI() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn(`Upload status container #${this.containerId} not found. UI features disabled.`);
            return;
        }
        
        // Create UI elements
        container.innerHTML = `
            <div class="upload-status-header">
                <h3>Upload Status</h3>
                <div class="upload-status-actions">
                    <button id="clear-completed-uploads" class="btn btn-sm btn-outline-secondary">Clear Completed</button>
                </div>
            </div>
            <div id="upload-items-container" class="upload-items-container"></div>
        `;
        
        // Initialize action buttons
        document.getElementById('clear-completed-uploads').addEventListener('click', () => {
            this.clearCompleted();
        });
    }
    
    /**
     * Bind event handlers for integration with other components
     */
    _bindEvents() {
        // Listen for custom events from upload components
        window.addEventListener('upload:started', (event) => {
            if (event.detail && event.detail.file) {
                this.addUpload(event.detail.file, event.detail.metadata || {});
            }
        });
        
        window.addEventListener('upload:progress', (event) => {
            if (event.detail && event.detail.id && event.detail.progress) {
                this.updateProgress(event.detail.id, event.detail.progress);
            }
        });
        
        window.addEventListener('upload:completed', (event) => {
            if (event.detail && event.detail.id) {
                this.markAsCompleted(event.detail.id, event.detail.result || {});
            }
        });
        
        window.addEventListener('upload:failed', (event) => {
            if (event.detail && event.detail.id) {
                this.markAsFailed(event.detail.id, event.detail.error || 'Upload failed');
            }
        });
    }
    
    /**
     * Add a new upload to the tracker
     * @param {File|Object} file - The file or object being uploaded
     * @param {Object} metadata - Additional metadata about the upload
     * @returns {string} - The ID of the created upload
     */
    addUpload(file, metadata = {}) {
        const id = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        
        const upload = {
            id,
            filename: file.name || 'Unknown file',
            size: file.size || 0,
            type: file.type || 'application/octet-stream',
            status: 'pending',
            progress: 0,
            startTime: Date.now(),
            metadata: {
                ...metadata,
                ipfs: metadata.ipfs || false,
                encrypted: metadata.encrypted || false,
                chainId: metadata.chainId || null
            }
        };
        
        this.uploadQueue.push(upload);
        this._renderUpload(upload);
        
        return id;
    }
    
    /**
     * Update the progress of an upload
     * @param {string} id - The upload ID
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgress(id, progress) {
        const upload = this._findUpload(id);
        if (!upload) return;
        
        upload.progress = Math.min(Math.max(progress, 0), 100);
        
        if (upload.status === 'pending' && upload.progress > 0) {
            upload.status = 'uploading';
        }
        
        if (upload.progress === 100 && upload.status === 'uploading') {
            upload.status = 'processing';
        }
        
        this._updateUploadUI(upload);
    }
    
    /**
     * Mark an upload as completed (green status)
     * @param {string} id - The upload ID
     * @param {Object} result - Result data from the upload
     */
    markAsCompleted(id, result = {}) {
        const upload = this._findUpload(id);
        if (!upload) return;
        
        upload.status = 'success';
        upload.progress = 100;
        upload.completionTime = Date.now();
        upload.result = result;
        
        // Move to completed list
        this._moveUploadToCompleted(upload);
        this._updateUploadUI(upload, true);
        
        // Dispatch action list for "green" status completion
        this._executeGreenStatusActions(upload);
        
        return upload;
    }
    
    /**
     * Mark an upload as failed
     * @param {string} id - The upload ID
     * @param {string|Object} error - Error information
     */
    markAsFailed(id, error = 'Unknown error') {
        const upload = this._findUpload(id);
        if (!upload) return;
        
        upload.status = 'failed';
        upload.error = error;
        upload.failureTime = Date.now();
        
        // Move to failed list
        this._moveUploadToFailed(upload);
        this._updateUploadUI(upload, true);
    }
    
    /**
     * Cancel an in-progress upload
     * @param {string} id - The upload ID
     */
    cancelUpload(id) {
        const upload = this._findUpload(id);
        if (!upload || ['success', 'failed', 'canceled'].includes(upload.status)) return false;
        
        upload.status = 'canceled';
        upload.cancelTime = Date.now();
        
        this._updateUploadUI(upload, true);
        
        // Dispatch canceled event for other components
        window.dispatchEvent(new CustomEvent('upload:canceled', {
            detail: { id: upload.id }
        }));
        
        return true;
    }
    
    /**
     * Clear all completed uploads from the UI
     */
    clearCompleted() {
        this.completedUploads = [];
        
        const container = document.getElementById('upload-items-container');
        if (!container) return;
        
        // Remove all success elements from DOM
        const successElements = container.querySelectorAll('.upload-item[data-status="success"]');
        successElements.forEach(el => el.remove());
    }
    
    /**
     * Get statistics about the uploads
     * @returns {Object} Upload statistics
     */
    getStatistics() {
        return {
            active: this.uploadQueue.length,
            completed: this.completedUploads.length,
            failed: this.failedUploads.length,
            totalBytes: [
                ...this.uploadQueue, 
                ...this.completedUploads, 
                ...this.failedUploads
            ].reduce((sum, upload) => sum + (upload.size || 0), 0)
        };
    }
    
    /**
     * Execute the "green status" action list when an upload completes successfully
     * @param {Object} upload - The completed upload
     */
    _executeGreenStatusActions(upload) {
        // Define the list of actions to perform when an upload reaches "green" (success) status
        const greenStatusActions = [
            // 1. Log completion to console
            () => {
                console.log(`Upload completed successfully: ${upload.filename}`, upload);
            },
            
            // 2. Update the system status indicator if needed
            () => {
                const statusIndicator = document.querySelector('#overall-status');
                if (statusIndicator) {
                    statusIndicator.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i> All Systems Operational';
                    statusIndicator.classList.add('operational');
                }
            },
            
            // 3. Notify the blockchain status if this was blockchain-related
            () => {
                if (upload.metadata && upload.metadata.chainId) {
                    const chainElement = document.getElementById(`${upload.metadata.chainId}-status`);
                    if (chainElement) {
                        const indicator = chainElement.querySelector('.status-indicator');
                        if (indicator) {
                            indicator.className = 'status-indicator status-operational';
                        }
                        const statusText = chainElement.querySelector('span:last-child');
                        if (statusText) {
                            statusText.textContent = 'Operational';
                        }
                    }
                }
            },
            
            // 4. Add to compliance monitoring (if upload requires compliance)
            () => {
                if (upload.metadata && upload.metadata.requiresCompliance) {
                    // Log compliance action
                    console.log(`Compliance verification for upload: ${upload.id}`);
                    
                    // If complianceBackupFunction exists, call it
                    if (typeof window.complianceBackupFunction === 'function') {
                        window.complianceBackupFunction(upload);
                    }
                }
            },
            
            // 5. Update statistics
            () => {
                const stats = this.getStatistics();
                // Dispatch statistics update event
                window.dispatchEvent(new CustomEvent('upload:stats-updated', {
                    detail: stats
                }));
            },
            
            // 6. Show success notification if enabled in metadata
            () => {
                if (upload.metadata && upload.metadata.showNotification !== false) {
                    this._showNotification(
                        'Upload Complete',
                        `Successfully uploaded ${upload.filename}`,
                        'success'
                    );
                }
            },
            
            // 7. Call any custom success callback if provided
            () => {
                if (upload.metadata && typeof upload.metadata.onSuccess === 'function') {
                    try {
                        upload.metadata.onSuccess(upload);
                    } catch (e) {
                        console.error('Error in custom success callback:', e);
                    }
                }
            }
        ];
        
        // Execute each action in the green status action list
        greenStatusActions.forEach(action => {
            try {
                action();
            } catch (error) {
                console.error('Error executing green status action:', error);
            }
        });
    }
    
    /**
     * Find an upload by ID in any of the upload lists
     * @param {string} id - The upload ID to find
     * @returns {Object|null} - The found upload or null
     */
    _findUpload(id) {
        return (
            this.uploadQueue.find(u => u.id === id) ||
            this.completedUploads.find(u => u.id === id) ||
            this.failedUploads.find(u => u.id === id)
        );
    }
    
    /**
     * Move an upload from the queue to completed list
     * @param {Object} upload - The upload to move
     */
    _moveUploadToCompleted(upload) {
        this.uploadQueue = this.uploadQueue.filter(u => u.id !== upload.id);
        this.completedUploads.push(upload);
    }
    
    /**
     * Move an upload from the queue to failed list
     * @param {Object} upload - The upload to move
     */
    _moveUploadToFailed(upload) {
        this.uploadQueue = this.uploadQueue.filter(u => u.id !== upload.id);
        this.failedUploads.push(upload);
    }
    
    /**
     * Show a notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    _showNotification(title, message, type = 'info') {
        // Check for browser notification support
        if ('Notification' in window) {
            // Check if permission is already granted
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: type === 'success' ? '/assets/images/success-icon.png' : '/assets/images/notification-icon.png'
                });
            } 
            // Otherwise create a simple UI notification
            else {
                this._createUINotification(title, message, type);
            }
        } else {
            // Fallback for browsers without notification support
            this._createUINotification(title, message, type);
        }
    }
    
    /**
     * Create a UI notification element
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    _createUINotification(title, message, type) {
        // Create notification element
        const notificationEl = document.createElement('div');
        notificationEl.className = `upload-notification upload-notification-${type}`;
        
        notificationEl.innerHTML = `
            <div class="upload-notification-header">
                <strong>${title}</strong>
                <button class="upload-notification-close">&times;</button>
            </div>
            <div class="upload-notification-body">
                ${message}
            </div>
        `;
        
        // Add to document
        document.body.appendChild(notificationEl);
        
        // Handle close button
        notificationEl.querySelector('.upload-notification-close').addEventListener('click', () => {
            notificationEl.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notificationEl.parentElement) {
                notificationEl.remove();
            }
        }, 5000);
    }
    
    /**
     * Render an upload item in the UI
     * @param {Object} upload - The upload to render
     */
    _renderUpload(upload) {
        const container = document.getElementById('upload-items-container');
        if (!container) return;
        
        // Check if element already exists
        let uploadEl = document.querySelector(`.upload-item[data-id="${upload.id}"]`);
        
        if (!uploadEl) {
            // Create new element
            uploadEl = document.createElement('div');
            uploadEl.className = 'upload-item';
            uploadEl.setAttribute('data-id', upload.id);
            uploadEl.setAttribute('data-status', upload.status);
            
            // Add to container
            container.prepend(uploadEl);
        }
        
        // Update content
        uploadEl.innerHTML = `
            <div class="upload-item-header">
                <div class="upload-item-filename" title="${upload.filename}">${upload.filename}</div>
                <div class="upload-item-actions">
                    ${['pending', 'uploading', 'processing'].includes(upload.status) 
                        ? '<button class="upload-item-cancel" title="Cancel upload">&times;</button>' 
                        : ''}
                </div>
            </div>
            <div class="upload-item-details">
                <div class="upload-item-progress-container">
                    <div class="upload-item-progress-bar" style="width: ${upload.progress}%; background-color: ${this.statusColors[upload.status]};"></div>
                </div>
                <div class="upload-item-status">
                    <span class="upload-status-indicator" style="background-color: ${this.statusColors[upload.status]};"></span>
                    ${upload.status.charAt(0).toUpperCase() + upload.status.slice(1)} 
                    ${upload.progress < 100 && ['uploading', 'processing'].includes(upload.status) ? `(${Math.round(upload.progress)}%)` : ''}
                    ${upload.error ? `: ${typeof upload.error === 'string' ? upload.error : 'Error'}` : ''}
                </div>
                ${upload.status === 'success' && upload.result && upload.result.url 
                    ? `<div class="upload-item-link"><a href="${upload.result.url}" target="_blank" rel="noopener noreferrer">View</a></div>` 
                    : ''}
            </div>
            ${upload.metadata.ipfs 
                ? '<div class="upload-item-tag ipfs-tag">IPFS</div>' 
                : ''}
            ${upload.metadata.encrypted 
                ? '<div class="upload-item-tag encrypted-tag">Encrypted</div>' 
                : ''}
        `;
        
        // Add event handlers
        const cancelBtn = uploadEl.querySelector('.upload-item-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelUpload(upload.id);
            });
        }
    }
    
    /**
     * Update an upload item in the UI
     * @param {Object} upload - The upload to update
     * @param {boolean} animate - Whether to animate the update
     */
    _updateUploadUI(upload, animate = false) {
        const uploadEl = document.querySelector(`.upload-item[data-id="${upload.id}"]`);
        if (!uploadEl) {
            // If element doesn't exist, render it
            this._renderUpload(upload);
            return;
        }
        
        // Update status attribute
        uploadEl.setAttribute('data-status', upload.status);
        
        // Update progress bar
        const progressBar = uploadEl.querySelector('.upload-item-progress-bar');
        if (progressBar) {
            if (animate) {
                progressBar.style.transition = 'width 0.3s ease, background-color 0.3s ease';
            }
            progressBar.style.width = `${upload.progress}%`;
            progressBar.style.backgroundColor = this.statusColors[upload.status];
        }
        
        // Update status text
        const statusEl = uploadEl.querySelector('.upload-item-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <span class="upload-status-indicator" style="background-color: ${this.statusColors[upload.status]};"></span>
                ${upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                ${upload.progress < 100 && ['uploading', 'processing'].includes(upload.status) ? `(${Math.round(upload.progress)}%)` : ''}
                ${upload.error ? `: ${typeof upload.error === 'string' ? upload.error : 'Error'}` : ''}
            `;
        }
        
        // Update actions based on status
        const actionsEl = uploadEl.querySelector('.upload-item-actions');
        if (actionsEl) {
            actionsEl.innerHTML = ['pending', 'uploading', 'processing'].includes(upload.status)
                ? '<button class="upload-item-cancel" title="Cancel upload">&times;</button>'
                : '';
                
            // Re-add event handlers
            const cancelBtn = actionsEl.querySelector('.upload-item-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.cancelUpload(upload.id);
                });
            }
        }
        
        // Add link if available
        if (upload.status === 'success' && upload.result && upload.result.url) {
            let linkEl = uploadEl.querySelector('.upload-item-link');
            if (!linkEl) {
                linkEl = document.createElement('div');
                linkEl.className = 'upload-item-link';
                uploadEl.querySelector('.upload-item-details').appendChild(linkEl);
            }
            linkEl.innerHTML = `<a href="${upload.result.url}" target="_blank" rel="noopener noreferrer">View</a>`;
        }
        
        // Add highlight effect for status change
        if (animate) {
            uploadEl.classList.add('status-changed');
            setTimeout(() => {
                uploadEl.classList.remove('status-changed');
            }, 500);
        }
    }
}

// Create global instance
window.uploadStatusTracker = new UploadStatusTracker();

// CSS for upload status components
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .upload-status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .upload-items-container {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .upload-item {
            background-color: var(--card-bg, #ffffff);
            border: 1px solid var(--border, #e5e7eb);
            border-radius: 6px;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            position: relative;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        body.dark-mode .upload-item {
            background-color: var(--dark-card-bg, #1f2937);
            border-color: var(--dark-border, #374151);
        }
        
        .upload-item.status-changed {
            animation: highlight-pulse 0.5s ease;
        }
        
        @keyframes highlight-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        
        .upload-item[data-status="success"] {
            border-left: 3px solid var(--success, #10b981);
        }
        
        .upload-item[data-status="failed"] {
            border-left: 3px solid var(--danger, #ef4444);
        }
        
        .upload-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .upload-item-filename {
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 80%;
        }
        
        .upload-item-progress-container {
            background-color: var(--border, #e5e7eb);
            height: 6px;
            border-radius: 3px;
            margin-bottom: 0.5rem;
            overflow: hidden;
        }
        
        body.dark-mode .upload-item-progress-container {
            background-color: var(--dark-border, #374151);
        }
        
        .upload-item-progress-bar {
            height: 100%;
            background-color: var(--primary, #6366f1);
            width: 0;
        }
        
        .upload-item-status {
            font-size: 0.85rem;
            color: var(--text, #374151);
            display: flex;
            align-items: center;
        }
        
        body.dark-mode .upload-item-status {
            color: var(--dark-text, #f3f4f6);
        }
        
        .upload-status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        
        .upload-item-cancel {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
            color: var(--danger, #ef4444);
            padding: 0;
            line-height: 1;
        }
        
        .upload-item-details {
            display: flex;
            flex-direction: column;
        }
        
        .upload-item-link {
            margin-top: 0.5rem;
        }
        
        .upload-item-link a {
            color: var(--primary, #6366f1);
            text-decoration: none;
            font-size: 0.85rem;
        }
        
        body.dark-mode .upload-item-link a {
            color: var(--dark-primary, #818cf8);
        }
        
        .upload-item-tag {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            font-size: 0.7rem;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-weight: 600;
        }
        
        .ipfs-tag {
            background-color: #d8b4fe;
            color: #581c87;
        }
        
        .encrypted-tag {
            background-color: #bfdbfe;
            color: #1e40af;
        }
        
        .upload-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background-color: var(--card-bg, #ffffff);
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            overflow: hidden;
        }
        
        body.dark-mode .upload-notification {
            background-color: var(--dark-card-bg, #1f2937);
            color: var(--dark-text, #f3f4f6);
        }
        
        .upload-notification-success {
            border-left: 4px solid var(--success, #10b981);
        }
        
        .upload-notification-error {
            border-left: 4px solid var(--danger, #ef4444);
        }
        
        .upload-notification-info {
            border-left: 4px solid var(--primary, #6366f1);
        }
        
        .upload-notification-header {
            padding: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border, #e5e7eb);
        }
        
        body.dark-mode .upload-notification-header {
            border-color: var(--dark-border, #374151);
        }
        
        .upload-notification-close {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0;
            line-height: 1;
        }
        
        .upload-notification-body {
            padding: 0.75rem;
        }
    `;
    document.head.appendChild(style);
});

// Export for module usage
if (typeof module !== 'undefined') {
    module.exports = { UploadStatusTracker };
}