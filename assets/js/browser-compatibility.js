/**
 * Cross-Browser Optimizations
 * Enhances compatibility across browsers and devices
 * Created: April 21, 2025
 */

(function () {
  'use strict';

  // Feature detection object
  const browserSupport = {
    transforms:
      'transform' in document.documentElement.style ||
      'webkitTransform' in document.documentElement.style ||
      'mozTransform' in document.documentElement.style,
    animations:
      'animation' in document.documentElement.style ||
      'webkitAnimation' in document.documentElement.style,
    localStorage: !!window.localStorage,
    serviceWorker: 'serviceWorker' in navigator,
    webp: false, // Will be detected below
    intersectionObserver: 'IntersectionObserver' in window,
    touchEvents: 'ontouchstart' in window,
    passiveEvents: false, // Will be detected below
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // Detection for passive events support
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function () {
        browserSupport.passiveEvents = true;
        return true;
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}

  // WebP support detection
  function checkWebpSupport() {
    const webpImg = new Image();
    webpImg.onload = function () {
      browserSupport.webp = webpImg.width > 0 && webpImg.height > 0;
      document.documentElement.classList.add(browserSupport.webp ? 'webp' : 'no-webp');
    };
    webpImg.onerror = function () {
      document.documentElement.classList.add('no-webp');
    };
    webpImg.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  }

  // Apply optimized styles based on browser capabilities
  function applyBrowserOptimizations() {
    // Add browser capability classes to HTML tag
    const html = document.documentElement;
    Object.keys(browserSupport).forEach(feature => {
      html.classList.add(browserSupport[feature] ? `has-${feature}` : `no-${feature}`);
    });

    // Apply specific fixes for older browsers
    if (!browserSupport.transforms || !browserSupport.animations) {
      applyLegacyBrowserFixes();
    }

    // Apply mobile-specific optimizations
    if (window.innerWidth < 768 || browserSupport.touchEvents) {
      applyMobileOptimizations();
    }

    // Apply reduced motion settings if preferred
    if (browserSupport.reducedMotion) {
      applyReducedMotion();
    }

    // Register service worker if supported
    if (browserSupport.serviceWorker) {
      registerServiceWorker();
    }
  }

  // Fixes for legacy browsers (IE11, older Edge, etc.)
  function applyLegacyBrowserFixes() {
    // Replace some CSS animations with simpler versions
    const animations = document.querySelectorAll('.svg-hyperstitial, .svg-warp, .creator-chart');
    animations.forEach(el => {
      el.classList.add('simplified-animation');
    });

    // Add polyfills for older browsers
    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }

    if (!Element.prototype.closest) {
      Element.prototype.closest = function (s) {
        let el = this;
        do {
          if (el.matches(s)) return el;
          el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
      };
    }
  }

  // Mobile specific optimizations
  function applyMobileOptimizations() {
    // Reduce animation complexity on mobile
    document.documentElement.classList.add('mobile-optimized');

    // Use passive event listeners for touch events
    if (browserSupport.passiveEvents) {
      const scrollElements = document.querySelectorAll('.scroll-container, .token-chart');
      scrollElements.forEach(el => {
        el.addEventListener('touchstart', function () {}, { passive: true });
        el.addEventListener('touchmove', function () {}, { passive: true });
      });
    }

    // Optimize background patterns for mobile
    const bgElements = document.querySelectorAll('.svg-bg-grid, .svg-bg-circuit, .svg-bg-dots');
    bgElements.forEach(el => {
      el.classList.add('mobile-bg');
    });
  }

  // Apply reduced motion settings
  function applyReducedMotion() {
    document.documentElement.classList.add('reduced-motion');

    // Replace animations with simpler transitions
    const animatedElements = document.querySelectorAll(
      '.fade-in, .svg-pulse, .svg-spinner, .svg-wave, .counter, .token-chart-segment'
    );

    animatedElements.forEach(el => {
      el.classList.add('motion-reduced');
      el.classList.remove('fade-in', 'svg-pulse', 'svg-spinner', 'svg-wave');
    });
  }

  // Register service worker for offline support and caching
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(function (registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(function (err) {
            console.log('ServiceWorker registration failed: ', err);
          });
      });
    }
  }

  // Optimize image loading with IntersectionObserver
  function setupLazyLoading() {
    if (browserSupport.intersectionObserver) {
      const lazyImages = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            if (img.dataset.srcset) {
              img.srcset = img.dataset.srcset;
            }
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
      });
    }
  }

  // Initialize
  checkWebpSupport();
  applyBrowserOptimizations();

  // Setup lazy loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLazyLoading);
  } else {
    setupLazyLoading();
  }

  // Expose browser support information
  window.browserSupport = browserSupport;
})();
