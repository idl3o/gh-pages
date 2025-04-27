/**
 * Mobile Responsiveness Tester
 *
 * This script helps test your website's responsiveness across various
 * device sizes and viewport dimensions. It provides visual feedback
 * and reports potential issues with responsive design.
 */

class MobileResponsivenessTester {
  constructor(options = {}) {
    // Define standard device dimensions to test
    this.deviceProfiles = [
      { name: 'iPhone SE', width: 375, height: 667, devicePixelRatio: 2, userAgent: 'Mobile' },
      { name: 'iPhone 12/13', width: 390, height: 844, devicePixelRatio: 3, userAgent: 'Mobile' },
      {
        name: 'iPhone 12/13 Pro Max',
        width: 428,
        height: 926,
        devicePixelRatio: 3,
        userAgent: 'Mobile'
      },
      { name: 'iPad', width: 768, height: 1024, devicePixelRatio: 2, userAgent: 'Tablet' },
      { name: 'iPad Pro', width: 1024, height: 1366, devicePixelRatio: 2, userAgent: 'Tablet' },
      { name: 'Galaxy S21', width: 360, height: 800, devicePixelRatio: 3, userAgent: 'Mobile' },
      { name: 'Pixel 6', width: 393, height: 851, devicePixelRatio: 2.75, userAgent: 'Mobile' },
      { name: 'Surface Duo', width: 540, height: 720, devicePixelRatio: 2.5, userAgent: 'Tablet' }
    ];

    // Common breakpoints to test
    this.breakpoints = [
      { name: 'Extra Small', width: 320, height: 568 },
      { name: 'Small', width: 576, height: 812 },
      { name: 'Medium', width: 768, height: 1024 },
      { name: 'Large', width: 992, height: 800 },
      { name: 'Extra Large', width: 1200, height: 800 },
      { name: 'XXL', width: 1400, height: 800 }
    ];

    // Configuration options
    this.options = {
      screenshotPath: options.screenshotPath || './screenshots',
      generateScreenshots: options.generateScreenshots !== false,
      checkOverflow: options.checkOverflow !== false,
      checkTouchTargets: options.checkTouchTargets !== false,
      checkFontSizes: options.checkFontSizes !== false,
      pagesToTest: options.pagesToTest || this.discoverPages(),
      elementsToCheck: options.elementsToCheck || [
        'header',
        'nav',
        'footer',
        '.container',
        '.batch-upload-container',
        '#batchDropzone',
        '.batch-item',
        '.notifications-container'
      ]
    };

    // Results storage
    this.testResults = {
      passedTests: 0,
      failedTests: 0,
      warnings: 0,
      deviceResults: {},
      breakpointResults: {},
      elementResults: {},
      performanceResults: {}
    };

    // UI elements
    this.ui = {
      container: null,
      resultsPanel: null,
      testProgress: null,
      viewport: null
    };

    this.isRunning = false;
    this.currentTest = null;
  }

  /**
   * Initialize the tester UI
   */
  init() {
    // Create UI container if it doesn't exist
    if (!document.getElementById('mobile-responsiveness-tester')) {
      this.createUI();
    }

    // Bind events
    this.bindEvents();

    console.log('Mobile Responsiveness Tester initialized');
    return this;
  }

  /**
   * Create the tester UI panel
   */
  createUI() {
    // Create container
    const container = document.createElement('div');
    container.id = 'mobile-responsiveness-tester';
    container.className = 'mrt-container';

    // Add control panel
    container.innerHTML = `
      <div class="mrt-controls">
        <h3>Mobile Responsiveness Tester</h3>
        <div class="mrt-test-selection">
          <label>Test Mode:</label>
          <select id="mrt-test-mode">
            <option value="devices">Device Profiles</option>
            <option value="breakpoints">Standard Breakpoints</option>
            <option value="elements">Test Specific Elements</option>
          </select>
        </div>
        <div class="mrt-actions">
          <button id="mrt-run-tests" class="mrt-btn mrt-primary">Run Tests</button>
          <button id="mrt-toggle-panel" class="mrt-btn">Minimize</button>
          <button id="mrt-close" class="mrt-btn mrt-danger">Close</button>
        </div>
      </div>
      <div class="mrt-viewport-container">
        <div class="mrt-viewport-controls">
          <select id="mrt-device-select">
            ${this.deviceProfiles
              .map(
                device =>
                  `<option value="${device.name}">${device.name} (${device.width}x${device.height})</option>`
              )
              .join('')}
          </select>
          <div class="mrt-orientation-toggle">
            <button id="mrt-portrait" class="mrt-btn mrt-active" title="Portrait">
              <span class="mrt-icon">⬜</span>
            </button>
            <button id="mrt-landscape" class="mrt-btn" title="Landscape">
              <span class="mrt-icon">⬜</span>
            </button>
          </div>
        </div>
        <div id="mrt-viewport" class="mrt-viewport">
          <div class="mrt-device-frame">
            <iframe id="mrt-content-frame" src=""></iframe>
          </div>
        </div>
      </div>
      <div class="mrt-results">
        <div class="mrt-progress">
          <div class="mrt-progress-bar" style="width: 0%"></div>
        </div>
        <div class="mrt-result-summary">
          <span class="mrt-passed">0 passed</span>
          <span class="mrt-failed">0 failed</span>
          <span class="mrt-warnings">0 warnings</span>
        </div>
        <div class="mrt-result-details"></div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .mrt-container {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 80%;
        max-width: 1200px;
        height: 600px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px 0 0 0;
        box-shadow: 0 0 20px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        transition: transform 0.3s ease;
      }

      .mrt-container.minimized {
        transform: translateY(calc(100% - 40px));
      }

      .mrt-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 15px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
        border-radius: 8px 0 0 0;
      }

      .mrt-controls h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }

      .mrt-test-selection {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .mrt-actions {
        display: flex;
        gap: 8px;
      }

      .mrt-btn {
        padding: 5px 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .mrt-btn:hover {
        background: #f0f0f0;
      }

      .mrt-btn.mrt-primary {
        background: #3861fb;
        border-color: #3861fb;
        color: white;
      }

      .mrt-btn.mrt-primary:hover {
        background: #2a4cd7;
      }

      .mrt-btn.mrt-danger {
        background: #dc3545;
        border-color: #dc3545;
        color: white;
      }

      .mrt-btn.mrt-danger:hover {
        background: #c82333;
      }

      .mrt-btn.mrt-active {
        background: #e9ecef;
        border-color: #adb5bd;
      }

      .mrt-viewport-container {
        flex: 1;
        padding: 15px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .mrt-viewport-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .mrt-orientation-toggle {
        display: flex;
        gap: 5px;
      }

      .mrt-viewport {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 5px;
        overflow: hidden;
        position: relative;
        transition: width 0.3s ease, height 0.3s ease;
        margin: 0 auto;
      }

      .mrt-device-frame {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #f5f5f5;
      }

      #mrt-content-frame {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
      }

      .mrt-results {
        padding: 10px 15px;
        border-top: 1px solid #eee;
        background: #f8f9fa;
        max-height: 200px;
        overflow-y: auto;
      }

      .mrt-progress {
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        margin-bottom: 10px;
      }

      .mrt-progress-bar {
        height: 100%;
        background: #3861fb;
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .mrt-result-summary {
        display: flex;
        gap: 15px;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .mrt-passed {
        color: #28a745;
      }

      .mrt-failed {
        color: #dc3545;
      }

      .mrt-warnings {
        color: #ffc107;
      }

      .mrt-result-details {
        font-size: 14px;
        line-height: 1.5;
      }

      .mrt-result-item {
        padding: 8px 10px;
        border-left: 3px solid #ddd;
        margin-bottom: 8px;
        background: #fff;
      }

      .mrt-result-item.pass {
        border-left-color: #28a745;
      }

      .mrt-result-item.fail {
        border-left-color: #dc3545;
      }

      .mrt-result-item.warning {
        border-left-color: #ffc107;
      }

      @media (max-width: 768px) {
        .mrt-container {
          width: 100%;
          height: 100%;
          max-width: none;
          border-radius: 0;
        }

        .mrt-controls {
          flex-wrap: wrap;
          gap: 10px;
        }

        .mrt-test-selection, .mrt-actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(container);

    // Store UI references
    this.ui.container = container;
    this.ui.resultsPanel = container.querySelector('.mrt-result-details');
    this.ui.testProgress = container.querySelector('.mrt-progress-bar');
    this.ui.viewport = container.querySelector('#mrt-viewport');
  }

  /**
   * Bind event handlers to UI elements
   */
  bindEvents() {
    const container = this.ui.container;

    // Run tests button
    container.querySelector('#mrt-run-tests').addEventListener('click', () => {
      this.runTests();
    });

    // Toggle panel size
    container.querySelector('#mrt-toggle-panel').addEventListener('click', () => {
      container.classList.toggle('minimized');
      const button = container.querySelector('#mrt-toggle-panel');
      button.textContent = container.classList.contains('minimized') ? 'Expand' : 'Minimize';
    });

    // Close button
    container.querySelector('#mrt-close').addEventListener('click', () => {
      this.destroy();
    });

    // Device selector
    container.querySelector('#mrt-device-select').addEventListener('change', e => {
      this.setDevice(e.target.value);
    });

    // Orientation toggles
    container.querySelector('#mrt-portrait').addEventListener('click', () => {
      this.setOrientation('portrait');
    });

    container.querySelector('#mrt-landscape').addEventListener('click', () => {
      this.setOrientation('landscape');
    });
  }

  /**
   * Set the device profile for testing
   */
  setDevice(deviceName) {
    // Find the device profile
    const device = this.deviceProfiles.find(d => d.name === deviceName);
    if (!device) return;

    // Get current orientation
    const isPortrait =
      this.ui.viewport.classList.contains('portrait') ||
      !this.ui.viewport.classList.contains('landscape');

    // Set viewport dimensions
    const width = isPortrait ? device.width : device.height;
    const height = isPortrait ? device.height : device.width;

    this.ui.viewport.style.width = `${width}px`;
    this.ui.viewport.style.height = `${height}px`;

    // Update iframe if needed
    const iframe = document.getElementById('mrt-content-frame');
    if (iframe.src) {
      iframe.style.transform = `scale(1)`;
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;
    }

    return this;
  }

  /**
   * Set viewport orientation
   */
  setOrientation(orientation) {
    // Update UI
    const portraitBtn = this.ui.container.querySelector('#mrt-portrait');
    const landscapeBtn = this.ui.container.querySelector('#mrt-landscape');

    if (orientation === 'portrait') {
      this.ui.viewport.classList.remove('landscape');
      this.ui.viewport.classList.add('portrait');
      portraitBtn.classList.add('mrt-active');
      landscapeBtn.classList.remove('mrt-active');
    } else {
      this.ui.viewport.classList.remove('portrait');
      this.ui.viewport.classList.add('landscape');
      portraitBtn.classList.remove('mrt-active');
      landscapeBtn.classList.add('mrt-active');
    }

    // Get current device
    const deviceSelector = this.ui.container.querySelector('#mrt-device-select');
    const deviceName = deviceSelector.value;

    // Reset device to apply orientation
    this.setDevice(deviceName);

    return this;
  }

  /**
   * Run all the configured tests
   */
  async runTests() {
    if (this.isRunning) {
      console.log('Tests already running');
      return;
    }

    this.isRunning = true;
    this.resetResults();

    // Update UI to show test is running
    const runBtn = this.ui.container.querySelector('#mrt-run-tests');
    runBtn.textContent = 'Running Tests...';
    runBtn.disabled = true;

    // Get test mode
    const testMode = this.ui.container.querySelector('#mrt-test-mode').value;

    try {
      // Run tests based on selected mode
      switch (testMode) {
        case 'devices':
          await this.testDeviceProfiles();
          break;
        case 'breakpoints':
          await this.testBreakpoints();
          break;
        case 'elements':
          await this.testSpecificElements();
          break;
        default:
          await this.testDeviceProfiles();
      }

      // Complete
      this.addResultItem('All tests completed!', 'pass');
    } catch (error) {
      console.error('Error running tests:', error);
      this.addResultItem(`Error running tests: ${error.message}`, 'fail');
    } finally {
      // Reset UI
      runBtn.textContent = 'Run Tests';
      runBtn.disabled = false;
      this.isRunning = false;

      // Update final results
      this.updateResultSummary();
    }
  }

  /**
   * Reset test results
   */
  resetResults() {
    this.testResults = {
      passedTests: 0,
      failedTests: 0,
      warnings: 0,
      deviceResults: {},
      breakpointResults: {},
      elementResults: {},
      performanceResults: {}
    };

    // Clear results UI
    this.ui.resultsPanel.innerHTML = '';
    this.ui.testProgress.style.width = '0%';

    // Reset summary counters
    const summary = this.ui.container.querySelector('.mrt-result-summary');
    summary.querySelector('.mrt-passed').textContent = '0 passed';
    summary.querySelector('.mrt-failed').textContent = '0 failed';
    summary.querySelector('.mrt-warnings').textContent = '0 warnings';
  }

  /**
   * Test the site across device profiles
   */
  async testDeviceProfiles() {
    const totalTests = this.deviceProfiles.length * this.options.pagesToTest.length * 2; // Portrait + landscape
    let completedTests = 0;

    this.addResultItem(
      `Testing ${this.options.pagesToTest.length} pages across ${this.deviceProfiles.length} devices...`,
      'info'
    );

    // Loop through each page
    for (const page of this.options.pagesToTest) {
      for (const device of this.deviceProfiles) {
        // Test portrait orientation
        await this.testViewport({
          page,
          width: device.width,
          height: device.height,
          deviceName: device.name,
          orientation: 'portrait',
          userAgent: device.userAgent
        });

        completedTests++;
        this.updateProgress(completedTests / totalTests);

        // Test landscape orientation
        await this.testViewport({
          page,
          width: device.height,
          height: device.width,
          deviceName: device.name,
          orientation: 'landscape',
          userAgent: device.userAgent
        });

        completedTests++;
        this.updateProgress(completedTests / totalTests);
      }
    }
  }

  /**
   * Test the site across standard breakpoints
   */
  async testBreakpoints() {
    const totalTests = this.breakpoints.length * this.options.pagesToTest.length;
    let completedTests = 0;

    this.addResultItem(
      `Testing ${this.options.pagesToTest.length} pages across ${this.breakpoints.length} breakpoints...`,
      'info'
    );

    // Loop through each page
    for (const page of this.options.pagesToTest) {
      for (const breakpoint of this.breakpoints) {
        await this.testViewport({
          page,
          width: breakpoint.width,
          height: breakpoint.height,
          breakpointName: breakpoint.name,
          orientation: 'portrait'
        });

        completedTests++;
        this.updateProgress(completedTests / totalTests);
      }
    }
  }

  /**
   * Test specific elements across device sizes
   */
  async testSpecificElements() {
    const elements = this.options.elementsToCheck;
    const devices = [
      this.deviceProfiles[0], // Small mobile
      this.deviceProfiles[3], // Tablet
      { name: 'Desktop', width: 1280, height: 800, userAgent: 'Desktop' }
    ];

    const totalTests = elements.length * devices.length;
    let completedTests = 0;

    this.addResultItem(`Testing ${elements.length} elements across 3 device sizes...`, 'info');

    // Use the first page in the list
    const page = this.options.pagesToTest[0];

    for (const device of devices) {
      for (const element of elements) {
        await this.testElement({
          page,
          selector: element,
          width: device.width,
          height: device.height,
          deviceName: device.name
        });

        completedTests++;
        this.updateProgress(completedTests / totalTests);
      }
    }
  }

  /**
   * Test a specific element
   */
  async testElement({ page, selector, width, height, deviceName }) {
    this.addResultItem(`Testing ${selector} on ${deviceName} (${width}x${height})...`, 'info');

    // Implementation depends on testing approach:
    // 1. Iframe-based: Load page in iframe and check elements
    // 2. Puppeteer/headless: Take screenshots of elements
    // 3. In-page analysis: Analyze current page only

    // For this demo, we'll do a basic accessibility check
    try {
      const iframe = document.getElementById('mrt-content-frame');
      iframe.src = page;

      // Wait for iframe to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        setTimeout(resolve, 5000); // Timeout after 5s
      });

      // Set iframe to device size
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;

      // Try to get the element
      const element = iframe.contentDocument.querySelector(selector);

      if (!element) {
        this.addResultItem(`Element ${selector} not found on ${deviceName}`, 'warning');
        this.testResults.warnings++;
        return;
      }

      // Check element visibility
      const rect = element.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        this.addResultItem(`Element ${selector} has zero width/height on ${deviceName}`, 'fail');
        this.testResults.failedTests++;
        return;
      }

      // Check if element is fully visible in viewport
      const isFullyVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= iframe.contentWindow.innerHeight &&
        rect.right <= iframe.contentWindow.innerWidth;

      if (!isFullyVisible) {
        this.addResultItem(`Element ${selector} is not fully visible on ${deviceName}`, 'warning');
        this.testResults.warnings++;
      }

      // Check touch target size (minimum 44x44px for mobile)
      if (
        deviceName.includes('iPhone') ||
        deviceName.includes('Galaxy') ||
        deviceName.includes('Pixel')
      ) {
        if (rect.width < 44 || rect.height < 44) {
          this.addResultItem(
            `Element ${selector} may be too small for touch targets (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
            'warning'
          );
          this.testResults.warnings++;
        }
      }

      // Check for text overflow
      if (
        element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight
      ) {
        this.addResultItem(`Text overflow detected in ${selector} on ${deviceName}`, 'fail');
        this.testResults.failedTests++;
      } else {
        this.addResultItem(`Element ${selector} passes responsive tests on ${deviceName}`, 'pass');
        this.testResults.passedTests++;
      }
    } catch (error) {
      console.error(`Error testing ${selector}:`, error);
      this.addResultItem(`Error testing ${selector}: ${error.message}`, 'fail');
      this.testResults.failedTests++;
    }
  }

  /**
   * Test a page at a specific viewport size
   */
  async testViewport({ page, width, height, deviceName, breakpointName, orientation, userAgent }) {
    const displayName = deviceName || breakpointName;
    this.addResultItem(
      `Testing ${page} at ${displayName} (${width}x${height}) in ${orientation} mode...`,
      'info'
    );

    try {
      // Set viewport
      this.setViewportSize(width, height);

      // Load page in iframe
      const iframe = document.getElementById('mrt-content-frame');
      iframe.src = page;

      // Wait for page to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        setTimeout(resolve, 5000); // Timeout after 5s
      });

      // Run viewport-specific tests

      // 1. Check for horizontal overflow (indicates responsive issues)
      const hasHorizontalScroll =
        iframe.contentDocument.body.scrollWidth > iframe.contentDocument.body.clientWidth;

      if (hasHorizontalScroll) {
        this.addResultItem(
          `Horizontal scroll detected on ${displayName} - page content may not be fully responsive`,
          'fail'
        );
        this.testResults.failedTests++;
      }

      // 2. Check for elements that extend beyond viewport
      const overflowingElements = this.findOverflowingElements(iframe.contentDocument);

      if (overflowingElements.length > 0) {
        this.addResultItem(
          `Found ${overflowingElements.length} elements that extend beyond the viewport on ${displayName}`,
          'warning'
        );
        this.testResults.warnings++;
      }

      // 3. Check for touch target sizes on mobile
      if (userAgent === 'Mobile') {
        const smallTouchTargets = this.findSmallTouchTargets(iframe.contentDocument);

        if (smallTouchTargets.length > 0) {
          this.addResultItem(
            `Found ${smallTouchTargets.length} elements with touch targets smaller than 44x44px`,
            'warning'
          );
          this.testResults.warnings++;
        }
      }

      // 4. Check for font sizes on mobile
      if (userAgent === 'Mobile') {
        const smallFonts = this.findSmallFonts(iframe.contentDocument);

        if (smallFonts.length > 0) {
          this.addResultItem(
            `Found ${smallFonts.length} text elements with font-size smaller than 14px`,
            'warning'
          );
          this.testResults.warnings++;
        }
      }

      // 5. Check for media query effectiveness
      const mediaQueryEffectiveness = this.checkMediaQueryEffectiveness(
        iframe.contentDocument,
        width
      );

      if (!mediaQueryEffectiveness.effective) {
        this.addResultItem(
          `Media queries may not be working correctly at ${width}px width: ${mediaQueryEffectiveness.reason}`,
          'warning'
        );
        this.testResults.warnings++;
      }

      // If no major issues, report success
      if (!hasHorizontalScroll && overflowingElements.length === 0) {
        this.addResultItem(`Page displays correctly at ${displayName} size`, 'pass');
        this.testResults.passedTests++;
      }
    } catch (error) {
      console.error('Error testing viewport:', error);
      this.addResultItem(`Error testing at ${displayName}: ${error.message}`, 'fail');
      this.testResults.failedTests++;
    }
  }

  /**
   * Set the viewport size of the testing iframe
   */
  setViewportSize(width, height) {
    this.ui.viewport.style.width = `${width}px`;
    this.ui.viewport.style.height = `${height}px`;
  }

  /**
   * Find elements that extend beyond the viewport
   */
  findOverflowingElements(doc) {
    const viewportWidth = doc.documentElement.clientWidth;
    const allElements = doc.querySelectorAll('*');
    const overflowing = [];

    for (const element of allElements) {
      const rect = element.getBoundingClientRect();

      // Check if element extends beyond right edge
      if (rect.right > viewportWidth + 5) {
        // 5px buffer for rounding errors
        overflowing.push({
          element:
            element.tagName.toLowerCase() +
            (element.id ? `#${element.id}` : '') +
            (element.className ? `.${element.className.replace(/\s+/g, '.')}` : ''),
          overflowAmount: Math.round(rect.right - viewportWidth)
        });
      }
    }

    return overflowing;
  }

  /**
   * Find interactive elements with touch targets that are too small
   */
  findSmallTouchTargets(doc) {
    const interactiveElements = doc.querySelectorAll(
      'a, button, input, select, textarea, [role="button"]'
    );
    const smallTargets = [];

    for (const element of interactiveElements) {
      const rect = element.getBoundingClientRect();

      if (rect.width < 44 || rect.height < 44) {
        smallTargets.push({
          element:
            element.tagName.toLowerCase() +
            (element.id ? `#${element.id}` : '') +
            (element.className ? `.${element.className.replace(/\s+/g, '.')}` : ''),
          size: `${Math.round(rect.width)}x${Math.round(rect.height)}px`
        });
      }
    }

    return smallTargets;
  }

  /**
   * Find text elements with font sizes that are too small for mobile
   */
  findSmallFonts(doc) {
    const textElements = doc.querySelectorAll(
      'p, span, h1, h2, h3, h4, h5, h6, li, td, th, label, button'
    );
    const smallFonts = [];

    for (const element of textElements) {
      const style = window.getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);

      if (fontSize < 14 && element.textContent.trim().length > 0) {
        smallFonts.push({
          element:
            element.tagName.toLowerCase() +
            (element.id ? `#${element.id}` : '') +
            (element.className ? `.${element.className.replace(/\s+/g, '.')}` : ''),
          fontSize: `${fontSize}px`
        });
      }
    }

    return smallFonts;
  }

  /**
   * Check if media queries are working effectively
   */
  checkMediaQueryEffectiveness(doc, width) {
    // Look for common patterns that indicate media queries are working
    let containerElements = doc.querySelectorAll('.container, .row, main, section');
    let foundResponsiveContainer = false;
    let reason = '';

    // If no container elements, check body
    if (containerElements.length === 0) {
      containerElements = [doc.body];
    }

    for (const element of containerElements) {
      const style = window.getComputedStyle(element);
      const elemWidth = element.getBoundingClientRect().width;

      // Check if width is responsive
      if (elemWidth <= width && style.maxWidth !== 'none') {
        foundResponsiveContainer = true;
        break;
      }

      // Check for fixed width that's too wide
      if (style.width !== 'auto' && !style.width.includes('%') && parseFloat(style.width) > width) {
        reason = `Found fixed width (${style.width}) container that's wider than viewport`;
      }
    }

    if (!foundResponsiveContainer && !reason) {
      reason = 'No responsive containers found';
    }

    return {
      effective: foundResponsiveContainer,
      reason: reason || 'Unknown issue'
    };
  }

  /**
   * Discover HTML pages in the site
   */
  discoverPages() {
    // In a real implementation, this would analyze the site structure
    // For demo, we'll return some common pages
    return ['index.html', 'batch-upload-demo.html', 'creator-dashboard.html'];
  }

  /**
   * Add an item to the results panel
   */
  addResultItem(message, type = 'info') {
    if (!this.ui.resultsPanel) return;

    const item = document.createElement('div');
    item.className = `mrt-result-item ${type}`;
    item.textContent = message;

    this.ui.resultsPanel.appendChild(item);
    this.ui.resultsPanel.scrollTop = this.ui.resultsPanel.scrollHeight;
  }

  /**
   * Update the progress bar
   */
  updateProgress(percent) {
    if (!this.ui.testProgress) return;

    this.ui.testProgress.style.width = `${Math.round(percent * 100)}%`;
  }

  /**
   * Update the result summary numbers
   */
  updateResultSummary() {
    const summary = this.ui.container.querySelector('.mrt-result-summary');
    if (!summary) return;

    summary.querySelector('.mrt-passed').textContent = `${this.testResults.passedTests} passed`;
    summary.querySelector('.mrt-failed').textContent = `${this.testResults.failedTests} failed`;
    summary.querySelector('.mrt-warnings').textContent = `${this.testResults.warnings} warnings`;
  }

  /**
   * Remove the tester from the page
   */
  destroy() {
    if (this.ui.container && this.ui.container.parentNode) {
      this.ui.container.parentNode.removeChild(this.ui.container);
    }
  }

  /**
   * Generate a report of all test results
   */
  generateReport() {
    return {
      summary: {
        passed: this.testResults.passedTests,
        failed: this.testResults.failedTests,
        warnings: this.testResults.warnings,
        total:
          this.testResults.passedTests + this.testResults.failedTests + this.testResults.warnings
      },
      details: {
        deviceResults: this.testResults.deviceResults,
        breakpointResults: this.testResults.breakpointResults,
        elementResults: this.testResults.elementResults,
        performanceResults: this.testResults.performanceResults
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize and add to global scope
window.MobileResponsivenessTester = MobileResponsivenessTester;

// Auto-initialize when included in a page with data-auto-init attribute
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-auto-init="true"]');
  if (script) {
    window.mobileResponsivenessTester = new MobileResponsivenessTester().init();
  }
});
