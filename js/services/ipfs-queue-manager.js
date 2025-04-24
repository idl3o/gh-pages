/**
 * IPFS Queue Manager
 * Handles prioritization and queuing of IPFS operations to prevent "No lowest priority node found" errors
 */

class IPFSQueueManager {
  constructor() {
    this.queue = [];
    this.activeRequests = 0;
    this.maxConcurrentRequests = 3; // Default max concurrent IPFS requests
    this.isProcessing = false;
    this.requestMap = new Map(); // Track request status by ID
    this.memoryPressure = 0; // Track memory pressure (0-100)
    this.lastMemoryCheck = 0;
    this.memoryCheckInterval = 5000; // Check memory every 5 seconds
    this.adaptiveMode = true; // Enable adaptive concurrency
    this.failureCount = 0; // Track recent failures for backpressure
    this.successCount = 0; // Track recent successes

    // Initialize memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Start background memory monitoring
   */
  startMemoryMonitoring() {
    setInterval(() => {
      this.checkMemoryPressure();
    }, this.memoryCheckInterval);
  }

  /**
   * Check current memory pressure and adjust concurrency
   */
  checkMemoryPressure() {
    try {
      this.lastMemoryCheck = Date.now();

      // Use performance API if available to estimate memory pressure
      if (window.performance && window.performance.memory) {
        const memoryInfo = window.performance.memory;
        // Calculate percentage of heap used
        const usedHeapPercentage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
        this.memoryPressure = usedHeapPercentage;
      } else {
        // Fallback: use queue size and active requests as a proxy for memory pressure
        const queuePressure = Math.min(100, (this.queue.length / 10) * 30);
        const activePressure = (this.activeRequests / this.maxConcurrentRequests) * 70;
        this.memoryPressure = Math.min(100, queuePressure + activePressure);
      }

      if (this.adaptiveMode) {
        this.adjustConcurrency();
      }
    } catch (error) {
      console.warn('Error checking memory pressure:', error);
    }
  }

  /**
   * Adaptively adjust concurrency based on system conditions
   */
  adjustConcurrency() {
    const prevMax = this.maxConcurrentRequests;

    // Adjust based on memory pressure
    if (this.memoryPressure > 80) {
      // High memory pressure - reduce concurrency
      this.maxConcurrentRequests = Math.max(1, this.maxConcurrentRequests - 1);
    } else if (this.memoryPressure < 30 && this.successCount > 5) {
      // Low memory pressure and recent successes - can increase concurrency
      this.maxConcurrentRequests = Math.min(6, this.maxConcurrentRequests + 1);
      this.successCount = 0; // Reset counter
    }

    // Adjust based on failures
    if (this.failureCount >= 3) {
      // Multiple failures - reduce concurrency
      this.maxConcurrentRequests = Math.max(1, this.maxConcurrentRequests - 1);
      this.failureCount = 0; // Reset counter
    }

    if (prevMax !== this.maxConcurrentRequests) {
      console.log(
        `Adjusted IPFS concurrency: ${prevMax} → ${this.maxConcurrentRequests} (Memory: ${Math.round(this.memoryPressure)}%)`
      );
    }
  }

  /**
   * Add a request to the IPFS operation queue
   * @param {Function} operation Function that returns a Promise for the IPFS operation
   * @param {Number} priority Priority level (lower number = higher priority)
   * @param {String} type Operation type (e.g., 'upload', 'pin', 'get')
   * @returns {Promise} Promise that resolves with the operation result
   */
  enqueue(operation, priority = 5, type = 'generic') {
    return new Promise((resolve, reject) => {
      const requestId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create queue item
      const queueItem = {
        id: requestId,
        operation,
        priority,
        type,
        status: 'queued',
        enqueueTime: Date.now(),
        resolve,
        reject
      };

      // Check if we should throttle based on memory pressure
      if (this.memoryPressure > 90 && type === 'upload' && priority > 2) {
        // For non-critical uploads during high memory pressure, delay entry
        setTimeout(() => {
          this.addQueueItem(queueItem);
        }, 2000);
      } else {
        this.addQueueItem(queueItem);
      }
    });
  }

  /**
   * Add item to queue and start processing
   */
  addQueueItem(queueItem) {
    // Add to request map
    this.requestMap.set(queueItem.id, queueItem);

    // Add to priority queue
    this.addToQueue(queueItem);

    // Start processing the queue if not already
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Add item to queue, maintaining priority order
   * @param {Object} item The queue item to add
   */
  addToQueue(item) {
    // Find insertion position based on priority
    let insertIndex = this.queue.findIndex(qItem => qItem.priority > item.priority);

    if (insertIndex === -1) {
      // If no higher priority items, add to end
      this.queue.push(item);
    } else {
      // Insert at the correct priority position
      this.queue.splice(insertIndex, 0, item);
    }
  }

  /**
   * Process queued operations based on priority
   */
  async processQueue() {
    if (this.queue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        // Check if we've reached max concurrent requests
        if (this.activeRequests >= this.maxConcurrentRequests) {
          // Wait for some requests to complete with exponential backoff
          const baseDelay = Math.min(200, 50 * Math.pow(1.5, this.memoryPressure / 20));
          await new Promise(resolve => setTimeout(resolve, baseDelay));
          continue;
        }

        // Get next item from queue but ensure we don't process items that are too large during high memory pressure
        let item = null;
        let skippedLarge = false;

        // During high memory pressure, prioritize small operations
        if (this.memoryPressure > 70) {
          // Find a suitable item based on current conditions
          const normalIdx = this.queue.findIndex(
            i => i.type !== 'upload-batch' && i.type !== 'upload-large'
          );

          if (normalIdx >= 0) {
            item = this.queue.splice(normalIdx, 1)[0];
            skippedLarge = true;
          } else {
            item = this.queue.shift();
          }
        } else {
          item = this.queue.shift();
        }

        if (!item) continue;

        // Update status
        item.status = 'processing';
        item.startTime = Date.now();
        this.activeRequests++;

        // Process the operation
        this.processOperation(item);
      }
    } finally {
      this.isProcessing = false;

      // Check if new items were added during processing
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Process a single operation
   */
  async processOperation(item) {
    try {
      // Execute operation
      const result = await item.operation();

      // Update status and resolve promise
      item.status = 'completed';
      item.endTime = Date.now();
      item.resolve(result);

      // Track success for adaptive concurrency
      this.successCount++;
    } catch (error) {
      console.error(`IPFS queue operation failed (${item.type}):`, error);

      // Track failure for adaptive concurrency
      this.failureCount++;

      // Check if error contains "No lowest priority node found"
      if (
        error.message &&
        (error.message.includes('No lowest priority node found') ||
          error.message.includes('stream ended unexpectedly') ||
          error.message.includes('buffer'))
      ) {
        console.warn('Detected priority or buffer error, requeuing with delay...');

        // Requeue with backoff if it's a priority error
        item.status = 'requeued';
        item.retryCount = (item.retryCount || 0) + 1;

        if (item.retryCount <= 3) {
          // Add back to queue with delay and increased priority
          setTimeout(
            () => {
              // Increase priority slightly on retry (lower number = higher priority)
              item.priority = Math.max(1, item.priority - 1);
              this.addToQueue(item);
            },
            2000 * Math.pow(2, item.retryCount - 1)
          ); // Exponential backoff
        } else {
          // Too many retries, reject with error
          item.status = 'failed';
          item.endTime = Date.now();
          item.reject(error);
        }
      } else {
        // Other error, reject immediately
        item.status = 'failed';
        item.endTime = Date.now();
        item.reject(error);
      }
    } finally {
      this.activeRequests--;

      // Remove from request map if completed or failed (not if requeued)
      if (item.status === 'completed' || item.status === 'failed') {
        this.requestMap.delete(item.id);
      }
    }
  }

  /**
   * Get status of all requests
   * @returns {Array} Array of request status objects
   */
  getRequestStatus() {
    return Array.from(this.requestMap.values()).map(item => ({
      id: item.id,
      type: item.type,
      priority: item.priority,
      status: item.status,
      enqueueTime: item.enqueueTime,
      startTime: item.startTime,
      endTime: item.endTime,
      waitTime: item.startTime ? item.startTime - item.enqueueTime : Date.now() - item.enqueueTime,
      processTime: item.startTime && item.endTime ? item.endTime - item.startTime : null,
      retryCount: item.retryCount || 0
    }));
  }

  /**
   * Get the current queue length
   * @returns {Number} Number of items in queue
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Get number of active requests
   * @returns {Number} Number of active requests
   */
  getActiveRequestCount() {
    return this.activeRequests;
  }

  /**
   * Get current memory pressure (0-100)
   * @returns {Number} Memory pressure percentage
   */
  getMemoryPressure() {
    return this.memoryPressure;
  }

  /**
   * Clear the queue (cancels pending operations)
   * @returns {Number} Number of items cleared
   */
  clearQueue() {
    const count = this.queue.length;

    // Reject all pending operations
    this.queue.forEach(item => {
      item.status = 'cancelled';
      item.reject(new Error('Operation cancelled'));
      this.requestMap.delete(item.id);
    });

    this.queue = [];
    return count;
  }
}

// Export singleton instance
const ipfsQueueManager = new IPFSQueueManager();
export default ipfsQueueManager;
