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
    `;
    document.head.appendChild(style);
});

// Export for module usage
if (typeof module !== 'undefined') {
    module.exports = { UploadStatusTracker };
}