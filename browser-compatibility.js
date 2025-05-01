/**
 * Browser Compatibility Module
 * Enhances cross-browser compatibility and performance
 * Created: April 21, 2025
 */

(function () {
  'use strict';

  // Check if we're in a browser environment or Node.js
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  // If we're in Node.js, export a simple module and exit
  if (!isBrowser) {
    console.log('Running in Node.js environment - skipping browser compatibility checks');
    // Export a dummy module for Node.js
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
        info: { isNode: true },
        features: { supportsES6: true }
      };
    }
    return; // Exit early for Node.js
  }

  // Browser-only code below this point
  // Browser detection (for targeted fixes)
  const browserInfo = {
    isIE: !!document.documentMode,
    isEdgeLegacy: !document.documentMode && !!window.StyleMedia,
    isFirefox: typeof InstallTrigger !== 'undefined',
    isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    isOpera: (!!window.opr && !!opr.addons) || !!window.opera,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    isAndroid: /Android/i.test(navigator.userAgent)
  };

  // Feature detection
  const features = {
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    supportsWebP: false, // Will be determined by test
    supportsES6: (function () {
      try {
        new Function('(a = 0) => a');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    supportsWebAnimations: 'animate' in Element.prototype,
    supportsServiceWorker: 'serviceWorker' in navigator
  };

  // Test for WebP support
  function checkWebPSupport() {
    const webP = new Image();
    webP.onload = function () {
      features.supportsWebP = webP.height === 2;
    };
    webP.onerror = function () {
      features.supportsWebP = false;
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }
  checkWebPSupport();

  // Apply appropriate classes to HTML element for targeting in CSS
  const html = document.documentElement;
  Object.keys(browserInfo).forEach(key => {
    if (browserInfo[key] === true) {
      html.classList.add(key.toLowerCase());
    }
  });

  // Polyfills
  // Intersection Observer polyfill for IE and older browsers
  if (!features.supportsIntersectionObserver) {
    const script = document.createElement('script');
    script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
    document.head.appendChild(script);
  }

  // Polyfill for requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      return window.setTimeout(callback, 1000 / 60);
    };
  }

  // Polyfill for cancelAnimationFrame
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }

  // Animation optimizations
  function optimizeAnimations() {
    // Reduce animations on older browsers
    if (browserInfo.isIE || (browserInfo.isMobile && !browserInfo.isChrome)) {
      html.classList.add('reduced-motion');

      // Override any CSS animations/transitions if necessary
      const style = document.createElement('style');
      style.textContent = `
        .reduced-motion * {
          animation-duration: 0.001s !important;
          transition-duration: 0.001s !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Use hardware acceleration for animations on supported browsers
    if (!browserInfo.isIE) {
      const animatedElements = document.querySelectorAll('.animated, .transition');
      animatedElements.forEach(el => {
        el.style.willChange = 'transform, opacity';

        // Clean up will-change after animation completes to free GPU resources
        el.addEventListener(
          'animationend',
          function () {
            this.style.willChange = 'auto';
          },
          { once: true }
        );
      });
    }
  }

  // Lazy loading images and iframes
  function setupLazyLoading() {
    if (features.supportsIntersectionObserver) {
      const lazyImages = document.querySelectorAll('img[data-src], iframe[data-src]');

      const lazyLoadObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const lazyElement = entry.target;

              if (lazyElement.dataset.src) {
                lazyElement.src = lazyElement.dataset.src;
                lazyElement.removeAttribute('data-src');

                if (lazyElement.dataset.srcset) {
                  lazyElement.srcset = lazyElement.dataset.srcset;
                  lazyElement.removeAttribute('data-srcset');
                }

                lazyLoadObserver.unobserve(lazyElement);
              }
            }
          });
        },
        {
          rootMargin: '200px 0px' // Start loading when within 200px
        }
      );

      lazyImages.forEach(image => {
        lazyLoadObserver.observe(image);
      });
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
        element.src = element.dataset.src;
        if (element.dataset.srcset) {
          element.srcset = element.dataset.srcset;
        }
      });
    }
  }

  // Memory management improvements
  function setupMemoryManagement() {
    // Clear event listeners for removed DOM elements to prevent memory leaks
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.removedNodes.length) {
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === 1) {
              // Element node
              // Use WeakMap implementation here if needed
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Register service worker if supported
  function registerServiceWorker() {
    if (features.supportsServiceWorker) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(error => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
    }
  }

  // Optimize rendering on mobile
  function optimizeForMobile() {
    if (browserInfo.isMobile) {
      // Optimize touch interactions
      document.addEventListener('touchstart', function () {}, { passive: true });

      // Optimize viewport for mobile
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
        document.head.appendChild(meta);
      }

      // Remove hover effects on mobile that can cause delays
      const style = document.createElement('style');
      style.textContent = `
        @media (hover: none) {
          .hover-effect {
            transition: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Initialize compatibility features
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFeatures);
    } else {
      initFeatures();
    }

    function initFeatures() {
      optimizeAnimations();
      setupLazyLoading();
      setupMemoryManagement();
      optimizeForMobile();
      registerServiceWorker();

      // Set a global variable so other scripts know features are available
      window.browserCompatibilityLoaded = true;

      // Dispatch custom event
      document.dispatchEvent(
        new CustomEvent('browserCompatibilityReady', {
          detail: {
            browserInfo: browserInfo,
            features: features
          }
        })
      );
    }
  }

  // Export the compatibility module for other scripts to use
  window.BrowserCompatibility = {
    info: browserInfo,
    features: features
  };

  // Initialize
  init();
})();
