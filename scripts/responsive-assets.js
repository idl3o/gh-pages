/**
 * Responsive Assets Manager
 * Handles dynamic loading of responsive assets based on viewport size
 * and implements lazy loading for performance optimization
 */

class ResponsiveAssetManager {
  constructor(options = {}) {
    this.options = {
      lazyLoadThreshold: 100,
      debounceTime: 150,
      ...options
    };

    this.breakpoints = {
      mobile: 576,
      tablet: 768,
      desktop: 992,
      large: 1200
    };

    this.init();
  }

  /**
   * Initialize the responsive asset manager
   */
  init() {
    // Set up intersection observer for lazy loading
    this.setupLazyLoading();

    // Handle responsive image loading
    this.setupResponsiveImages();

    // Listen for window resize events
    this.setupResizeListener();
  }

  /**
   * Set up lazy loading using Intersection Observer API
   */
  setupLazyLoading() {
    // Skip if IntersectionObserver is not supported
    if (!('IntersectionObserver' in window)) {
      this.loadAllLazyElements();
      return;
    }

    const options = {
      rootMargin: `${this.options.lazyLoadThreshold}px`,
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);

    document.querySelectorAll('.lazy-load').forEach(element => {
      this.observer.observe(element);
    });
  }

  /**
   * Load a single lazy element
   * @param {HTMLElement} element - The element to load
   */
  loadElement(element) {
    try {
      // Handle different element types
      if (element.tagName === 'IMG') {
        const src = element.dataset.src;
        if (src) {
          element.src = src;
          element.addEventListener('load', () => {
            element.classList.add('loaded');
          }, { once: true }); // Use once: true for cleanup
        } else {
          console.warn('Lazy load IMG element missing data-src:', element);
        }
      } else if (element.tagName === 'DIV' && element.classList.contains('responsive-img')) {
        const img = element.querySelector('img');
        if (img && img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          img.sizes = img.dataset.sizes || '100vw'; // Default sizes if not provided
          element.classList.add('loaded');
        } else {
          console.warn('Lazy load DIV.responsive-img missing inner img or data-srcset:', element);
        }
      }
      // Add more element types here if needed (e.g., background images)
      // else if (element.dataset.bgSrc) { ... }

    } catch (error) {
      console.error('Error loading lazy element:', error, element);
    } finally {
      // Remove lazy-load class regardless of success/failure to avoid reprocessing
      element.classList.remove('lazy-load');
    }
  }

  /**
   * Load all lazy elements at once (fallback for browsers without IntersectionObserver)
   */
  loadAllLazyElements() {
    document.querySelectorAll('.lazy-load').forEach(element => {
      this.loadElement(element);
    });
  }

  /**
   * Set up responsive image handling
   */
  setupResponsiveImages() {
    document.querySelectorAll('[data-responsive]').forEach(element => {
      this.updateResponsiveElement(element);
    });
  }

  /**
   * Update a responsive element based on current viewport
   * @param {HTMLElement} element - The responsive element to update
   * Expects data-responsive attribute with JSON like:
   * {"mobile": "url/small.jpg", "tablet": "url/medium.jpg", "desktop": "url/large.jpg"}
   */
  updateResponsiveElement(element) {
    const currentBreakpoint = this.getCurrentBreakpoint();
    let sources = {};

    try {
      // Attempt to parse the JSON from the data-responsive attribute
      sources = JSON.parse(element.dataset.responsive || '{}');
    } catch (error) {
      console.error('Failed to parse data-responsive JSON:', element.dataset.responsive, error, element);
      return; // Exit if JSON is invalid
    }

    // Check if a source exists for the current breakpoint
    if (sources[currentBreakpoint]) {
      const newSource = sources[currentBreakpoint];
      try {
        if (element.tagName === 'IMG') {
          // Avoid reloading the same image source
          if (element.src !== newSource) {
            element.src = newSource;
          }
        } else {
          // Avoid reloading the same background image source
          const currentBg = element.style.backgroundImage;
          const newBg = `url("${newSource}")`; // Ensure quotes for url()
          if (currentBg !== newBg) {
            element.style.backgroundImage = newBg;
          }
        }
      } catch (error) {
        console.error('Error updating responsive element source:', error, element);
      }
    } else {
      // Optional: Handle cases where no source is defined for the current breakpoint
      // console.warn(`No responsive source found for breakpoint "${currentBreakpoint}" on element:`, element);
    }
  }

  /**
   * Get the current breakpoint based on window width
   * @return {string} The current breakpoint name
   */
  getCurrentBreakpoint() {
    const width = window.innerWidth;

    if (width < this.breakpoints.mobile) {
      return 'mobile';
    } else if (width < this.breakpoints.tablet) {
      return 'tablet';
    } else if (width < this.breakpoints.desktop) {
      return 'desktop';
    } else {
      return 'large';
    }
  }

  /**
   * Set up resize event listener with debounce
   */
  setupResizeListener() {
    let timeout;

    window.addEventListener('resize', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        document.querySelectorAll('[data-responsive]').forEach(element => {
          this.updateResponsiveElement(element);
        });
      }, this.options.debounceTime);
    });
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.responsiveAssetManager = new ResponsiveAssetManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveAssetManager;
}
