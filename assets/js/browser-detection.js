/**
 * Browser detection and feature optimization script
 * This script detects browser capabilities and applies appropriate optimizations
 */
(function () {
  'use strict';

  // Create global object for browser feature detection
  window.browserFeatures = {};

  // Add browser detection classes to HTML element
  const html = document.documentElement;
  const ua = navigator.userAgent;

  // Detect browsers (basic detection)
  const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua) && !/Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isEdge = /Edg/.test(ua) || /Edge/.test(ua);
  const isIE = /Trident/.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  // Add browser classes to HTML
  if (isChrome) html.classList.add('chrome');
  if (isFirefox) html.classList.add('firefox');
  if (isSafari) html.classList.add('safari');
  if (isEdge) html.classList.add('edge');
  if (isIE) html.classList.add('ie');
  if (isIOS) html.classList.add('ios');
  if (isAndroid) html.classList.add('android');

  // Detect touch support
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    html.classList.add('touch-device');
    window.browserFeatures.touchEnabled = true;
  } else {
    html.classList.add('no-touch-device');
    window.browserFeatures.touchEnabled = false;
  }

  // Detect backdrop-filter support
  if (
    !CSS.supports('(backdrop-filter: blur(1px))') &&
    !CSS.supports('(-webkit-backdrop-filter: blur(1px))')
  ) {
    html.classList.add('no-backdropfilter');
    window.browserFeatures.backdropFilter = false;
  } else {
    window.browserFeatures.backdropFilter = true;
  }

  // Detect CSS Grid support
  window.browserFeatures.cssGrid = CSS.supports('(display: grid)');
  if (!window.browserFeatures.cssGrid) {
    html.classList.add('no-cssgrid');
  }

  // Detect IntersectionObserver support
  window.browserFeatures.intersectionObserver = 'IntersectionObserver' in window;
  if (!window.browserFeatures.intersectionObserver) {
    html.classList.add('no-intersection-observer');
  }

  // Detect scroll behavior support
  window.browserFeatures.smoothScroll = CSS.supports('(scroll-behavior: smooth)');
  if (!window.browserFeatures.smoothScroll) {
    html.classList.add('no-scroll-behavior');
  }

  // Detect CSS Variables support
  window.browserFeatures.cssVars = window.CSS && CSS.supports('(--test: 0)');
  if (!window.browserFeatures.cssVars) {
    html.classList.add('no-css-variables');
  }

  // Detect WebP support
  const checkWebP = new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = function () {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });

  checkWebP.then(hasWebP => {
    window.browserFeatures.webp = hasWebP;
    if (hasWebP) {
      html.classList.add('webp');
    } else {
      html.classList.add('no-webp');
    }
  });

  // Apply passive event listeners for better performance if supported
  window.browserFeatures.passiveEvents = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function () {
        window.browserFeatures.passiveEvents = true;
        return true;
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}

  // Load appropriate polyfills based on feature detection
  function loadPolyfill(src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  }

  // IntersectionObserver polyfill
  if (!window.browserFeatures.intersectionObserver) {
    loadPolyfill('https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver');
  }

  // Object-fit polyfill for IE
  if (isIE) {
    loadPolyfill('https://cdn.jsdelivr.net/npm/object-fit-images@3.2.4/dist/ofi.min.js');
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof objectFitImages === 'function') {
        objectFitImages();
      }
    });
  }

  // Apply browser-specific optimizations
  document.addEventListener('DOMContentLoaded', function () {
    // Fix for iOS vh units issue
    if (isIOS) {
      const fixVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      fixVh();
      window.addEventListener('resize', fixVh);
      window.addEventListener('orientationchange', fixVh);
    }

    // Apply passive event listeners on touch devices
    if (window.browserFeatures.touchEnabled && window.browserFeatures.passiveEvents) {
      const touchElements = document.querySelectorAll('.touch-action-manipulation');
      touchElements.forEach(el => {
        el.addEventListener('touchstart', function () {}, { passive: true });
        el.addEventListener('touchmove', function () {}, { passive: true });
      });
    }
  });

  // Console log for debugging
  console.log('Browser features detected:', window.browserFeatures);
})();
