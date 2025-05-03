/**
 * Advanced Performance Optimizer
 * Enhances core platform performance through various optimization techniques
 * Created: April 26, 2025
 */

class PerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      resourcePriority: true, // Prioritize critical resources
      connectionAwareness: true, // Adapt to network conditions
      memoryManagement: true, // Implement memory management techniques
      renderOptimization: true, // Optimize rendering pipeline
      prefetchStrategy: 'smart', // 'none', 'aggressive', 'smart'
      ...options
    };

    this.metrics = {
      lastIdle: performance.now(),
      frameRate: 60,
      memoryUsage: 0,
      networkRequests: 0
    };

    this.resourcePool = new Map(); // Object pool for reusing resources
    this.initOptimizations();
  }

  /**
   * Initialize all performance optimizations
   */
  initOptimizations() {
    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    // Initialize resource prioritization
    if (this.options.resourcePriority) {
      this.initResourcePrioritization();
    }

    // Setup connection-aware loading
    if (this.options.connectionAwareness) {
      this.initConnectionAwareness();
    }

    // Setup memory management
    if (this.options.memoryManagement) {
      this.initMemoryManagement();
    }

    // Setup render optimizations
    if (this.options.renderOptimization) {
      this.initRenderOptimizations();
    }

    // Setup prefetching strategy
    this.initPrefetchStrategy();

    // Setup object pooling
    this.initObjectPooling();
  }

  /**
   * Set up performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor frame rate
    let frameCount = 0;
    let lastFrameTime = performance.now();

    const checkFrame = () => {
      frameCount++;
      const now = performance.now();

      if (now - lastFrameTime > 1000) {
        this.metrics.frameRate = frameCount;
        frameCount = 0;
        lastFrameTime = now;
      }

      requestAnimationFrame(checkFrame);
    };
    requestAnimationFrame(checkFrame);

    // Monitor memory usage if available
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024); // MB

        if (this.metrics.memoryUsage > 200) {
          // Threshold in MB
          this.performMemoryCleanup();
        }
      }, 5000);
    }

    // Monitor network requests
    if (window.PerformanceObserver) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.metrics.networkRequests++;
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Initialize resource prioritization
   */
  initResourcePrioritization() {
    // Prioritize critical assets
    document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(element => {
      if (element.dataset.priority === 'high') {
        element.setAttribute('fetchpriority', 'high');
      } else if (element.dataset.priority === 'low') {
        element.setAttribute('fetchpriority', 'low');
      }
    });

    // Defer non-critical resources
    document.querySelectorAll('img:not([loading])').forEach(img => {
      if (!img.hasAttribute('fetchpriority') && !img.closest('.hero, header')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }

  /**
   * Initialize connection-aware resource loading
   */
  initConnectionAwareness() {
    // Adapt to network connection if available
    if ('connection' in navigator) {
      const connection = navigator.connection;

      // Handle slow connections
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.applySlowConnectionOptimizations();
      }

      // Handle data saver mode
      if (connection.saveData) {
        this.applyDataSavingMode();
      }

      // Listen for connection changes
      connection.addEventListener('change', () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.applySlowConnectionOptimizations();
        } else {
          this.removeSlowConnectionOptimizations();
        }
      });
    }
  }

  /**
   * Apply optimizations for slow connections
   */
  applySlowConnectionOptimizations() {
    // Switch to low-resolution images
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.lowSrc) {
        img.setAttribute('src', img.dataset.lowSrc);
      }
    });

    // Disable animations
    document.documentElement.classList.add('reduce-motion');

    // Remove non-critical elements
    document.querySelectorAll('.low-priority').forEach(el => {
      el.style.display = 'none';
    });
  }

  /**
   * Remove slow connection optimizations
   */
  removeSlowConnectionOptimizations() {
    // Restore regular images
    document.querySelectorAll('img[data-src]').forEach(img => {
      if (img.dataset.src) {
        img.setAttribute('src', img.dataset.src);
      }
    });

    // Re-enable animations
    document.documentElement.classList.remove('reduce-motion');

    // Restore low-priority elements
    document.querySelectorAll('.low-priority').forEach(el => {
      el.style.display = '';
    });
  }

  /**
   * Apply data saving mode optimizations
   */
  applyDataSavingMode() {
    document.documentElement.classList.add('data-saving-mode');

    // Disable autoplay
    document.querySelectorAll('video[autoplay]').forEach(video => {
      video.removeAttribute('autoplay');
      video.setAttribute('preload', 'none');
    });
  }

  /**
   * Initialize memory management
   */
  initMemoryManagement() {
    // Use IntersectionObserver to unload off-screen content
    if ('IntersectionObserver' in window) {
      const options = {
        rootMargin: '100px',
        threshold: 0
      };

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && entry.target.classList.contains('unload-offscreen')) {
            this.unloadContent(entry.target);
          } else if (entry.isIntersecting && entry.target.classList.contains('unloaded')) {
            this.reloadContent(entry.target);
          }
        });
      }, options);

      document.querySelectorAll('.unload-offscreen').forEach(element => {
        observer.observe(element);
      });
    }

    // Periodic garbage collection trigger on idle
    if ('requestIdleCallback' in window) {
      const scheduleCleanup = () => {
        requestIdleCallback(
          deadline => {
            if (deadline.timeRemaining() > 50) {
              this.performMemoryCleanup();
            }
            scheduleCleanup();
          },
          { timeout: 10000 }
        );
      };
      scheduleCleanup();
    }
  }

  /**
   * Unload content from a container to save memory
   */
  unloadContent(container) {
    // Store original content
    container.dataset.originalHtml = container.innerHTML;

    // Replace with placeholder
    const height = container.offsetHeight;
    const width = container.offsetWidth;
    container.innerHTML = `<div style="width:${width}px;height:${height}px"></div>`;
    container.classList.add('unloaded');
  }

  /**
   * Reload content that was previously unloaded
   */
  reloadContent(container) {
    if (container.dataset.originalHtml) {
      container.innerHTML = container.dataset.originalHtml;
      container.classList.remove('unloaded');
      delete container.dataset.originalHtml;
    }
  }

  /**
   * Initialize render optimizations
   */
  initRenderOptimizations() {
    // Mark elements for layer promotion
    document.querySelectorAll('.promote-layer').forEach(element => {
      element.style.transform = 'translateZ(0)';
    });

    // Debounce scroll and resize handlers
    this.setupDebouncedHandlers();

    // Use requestAnimationFrame for visual updates
    this.setupAnimationFrameHandlers();
  }

  /**
   * Setup debounced event handlers
   */
  setupDebouncedHandlers() {
    // Debounce window resize
    let resizeTimeout;

    window.addEventListener('resize', () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        document.dispatchEvent(new CustomEvent('optimized-resize'));
      }, 150);
    });

    // Throttle scroll events
    let lastScrollTime = 0;
    const scrollThreshold = 100; // ms

    window.addEventListener(
      'scroll',
      () => {
        const now = performance.now();

        if (now - lastScrollTime > scrollThreshold) {
          lastScrollTime = now;
          document.dispatchEvent(new CustomEvent('optimized-scroll'));
        }
      },
      { passive: true }
    );
  }

  /**
   * Set up animation frame handlers for smoother UI updates
   */
  setupAnimationFrameHandlers() {
    // Replace animated counters with requestAnimationFrame
    document.querySelectorAll('.counter').forEach(counter => {
      const target = parseInt(counter.dataset.target, 10);
      const duration = parseInt(counter.dataset.duration, 10) || 2000;
      let startTime = null;
      let currentValue = 0;

      function updateCounter(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        currentValue = Math.floor(progress * target);
        counter.textContent = currentValue.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      }

      // Start animation when element is in view
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            requestAnimationFrame(updateCounter);
            observer.disconnect();
          }
        });
      });

      observer.observe(counter);
    });
  }

  /**
   * Initialize prefetch strategy
   */
  initPrefetchStrategy() {
    if (this.options.prefetchStrategy === 'none') {
      return;
    }

    // Prefetch visible links
    if ('IntersectionObserver' in window) {
      const prefetchObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target;

            if (this.shouldPrefetch(link.href)) {
              this.prefetchUrl(link.href);
            }

            // Stop observing this link
            prefetchObserver.unobserve(link);
          }
        });
      });

      // Observe navigation links for prefetching
      document.querySelectorAll('a[data-prefetch]').forEach(link => {
        prefetchObserver.observe(link);
      });
    }

    // Handle mouseover prefetch for aggressive mode
    if (this.options.prefetchStrategy === 'aggressive') {
      document.addEventListener(
        'mouseover',
        event => {
          const link = event.target.closest('a');
          if (link && link.href && this.shouldPrefetch(link.href)) {
            this.prefetchUrl(link.href);
          }
        },
        { passive: true }
      );
    }

    // Prefetch next page in pagination
    document.querySelectorAll('.pagination .next').forEach(link => {
      if (link.href && this.shouldPrefetch(link.href)) {
        this.prefetchUrl(link.href);
      }
    });
  }

  /**
   * Determine if a URL should be prefetched
   */
  shouldPrefetch(url) {
    // Don't prefetch the current page
    if (url === window.location.href) {
      return false;
    }

    // Only prefetch same-origin URLs
    try {
      const urlObj = new URL(url);
      if (urlObj.origin !== window.location.origin) {
        return false;
      }
    } catch (e) {
      return false;
    }

    // Don't prefetch already cached pages
    if ('caches' in window) {
      // This would ideally check the cache, but we'll simplify
      // since cache lookups are async
    }

    // Don't prefetch if on cellular and data saver enabled
    if (navigator.connection && navigator.connection.saveData) {
      return false;
    }

    // Don't prefetch in low memory situations
    if (performance.memory && performance.memory.usedJSHeapSize > 500 * 1024 * 1024) {
      return false;
    }

    return true;
  }

  /**
   * Prefetch a URL
   */
  prefetchUrl(url) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Initialize object pooling
   */
  initObjectPooling() {
    // Create pools for commonly used objects
    this.createPool(
      'listItem',
      () => {
        const li = document.createElement('li');
        li.className = 'content-list-item';
        return li;
      },
      20
    );

    this.createPool(
      'card',
      () => {
        const div = document.createElement('div');
        div.className = 'content-card';
        return div;
      },
      10
    );
  }

  /**
   * Create an object pool
   */
  createPool(name, factory, initialSize = 10) {
    const pool = [];

    // Initialize pool with objects
    for (let i = 0; i < initialSize; i++) {
      pool.push(factory());
    }

    // Store in the resource pool
    this.resourcePool.set(name, {
      objects: pool,
      factory: factory
    });
  }

  /**
   * Get an object from pool
   */
  getFromPool(name) {
    const pool = this.resourcePool.get(name);

    if (!pool) {
      return null;
    }

    // Return from pool or create new if pool is empty
    return pool.objects.pop() || pool.factory();
  }

  /**
   * Return an object to pool
   */
  returnToPool(name, object) {
    const pool = this.resourcePool.get(name);

    if (!pool) {
      return;
    }

    // Clear the object for reuse
    while (object.firstChild) {
      object.removeChild(object.firstChild);
    }

    // Remove event listeners (if any)
    object.replaceWith(object.cloneNode(false));

    // Add back to pool
    pool.objects.push(object);
  }

  /**
   * Perform memory cleanup operations
   */
  performMemoryCleanup() {
    console.log('Performing memory cleanup');

    // Clear unused cache items
    if (window.caches) {
      // This would perform cache cleanup
    }

    // Clear unused pools
    for (const [name, pool] of this.resourcePool.entries()) {
      // Limit pool size to avoid memory bloat
      const maxPoolSize = 50;
      if (pool.objects.length > maxPoolSize) {
        pool.objects.length = maxPoolSize;
      }
    }

    // Remove offscreen content
    document.querySelectorAll('.unload-offscreen:not(.unloaded)').forEach(el => {
      if (!this.isElementInViewport(el)) {
        this.unloadContent(el);
      }
    });
  }

  /**
   * Check if element is in viewport
   */
  isElementInViewport(el) {
    const rect = el.getBoundingClientRect();

    return (
      rect.top >= -100 &&
      rect.left >= -100 &&
      rect.bottom <= window.innerHeight + 100 &&
      rect.right <= window.innerWidth + 100
    );
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.performanceOptimizer = new PerformanceOptimizer();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
}
