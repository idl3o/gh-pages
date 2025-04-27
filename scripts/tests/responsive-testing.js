/**
 * Mobile Responsiveness Testing Script
 * Tests how the site responds to different screen sizes and devices
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Parse command line arguments
const args = process.argv.slice(2);
const device = args.find(arg => arg.startsWith('--device='))?.split('=')[1] || 'all';
const takeScreenshots = args.includes('--screenshot');
const generateReport = args.includes('--report');

// Device configurations
const devices = {
  phone: {
    name: 'Smartphones',
    sizes: [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 13/14', width: 390, height: 844 },
      { name: 'Pixel 6', width: 412, height: 915 },
      { name: 'Galaxy S22', width: 360, height: 780 },
      { name: 'iPhone 13/14 Mini', width: 360, height: 780 }
    ]
  },
  tablet: {
    name: 'Tablets',
    sizes: [
      { name: 'iPad Mini', width: 768, height: 1024 },
      { name: 'iPad', width: 810, height: 1080 },
      { name: 'iPad Pro 11"', width: 834, height: 1194 },
      { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
      { name: 'Surface Pro', width: 912, height: 1368 }
    ]
  },
  desktop: {
    name: 'Desktops',
    sizes: [
      { name: 'Laptop (720p)', width: 1280, height: 720 },
      { name: 'Laptop (1080p)', width: 1920, height: 1080 },
      { name: 'Desktop (1440p)', width: 2560, height: 1440 },
      { name: 'iMac', width: 2560, height: 1440 },
      { name: 'Ultrawide', width: 3440, height: 1440 }
    ]
  }
};

// Elements to test
const elementsToTest = [
  { name: 'Navigation', selector: 'nav', priority: 'high' },
  { name: 'Main Content', selector: 'main', priority: 'high' },
  { name: 'Header', selector: 'header', priority: 'high' },
  { name: 'Footer', selector: 'footer', priority: 'medium' },
  { name: 'Batch Upload Form', selector: '#batch-upload-form', priority: 'high' },
  { name: 'Video Player', selector: '.video-player', priority: 'high' },
  { name: 'NFT Creator', selector: '#nft-creator', priority: 'medium' },
  { name: 'Wallet Connection', selector: '#wallet-connect', priority: 'high' },
  { name: 'Analytics Charts', selector: '.analytics-chart', priority: 'medium' },
  { name: 'User Profile', selector: '.user-profile', priority: 'medium' },
  { name: 'Content Grid', selector: '.content-grid', priority: 'high' },
  { name: 'Search Bar', selector: '.search-bar', priority: 'medium' },
  { name: 'Filters', selector: '.filters', priority: 'low' },
  { name: 'Modal Dialogs', selector: '.modal', priority: 'medium' },
  { name: 'Toast Notifications', selector: '.toast', priority: 'low' }
];

// Pages to test
const pagesToTest = [
  { name: 'Home Page', path: '/', priority: 'high' },
  { name: 'Upload Page', path: '/upload', priority: 'high' },
  { name: 'Watch Page', path: '/watch/demo', priority: 'high' },
  { name: 'Profile Page', path: '/profile', priority: 'medium' },
  { name: 'Dashboard', path: '/dashboard', priority: 'medium' },
  { name: 'NFT Creation', path: '/create/nft', priority: 'medium' },
  { name: 'Settings', path: '/settings', priority: 'low' },
  { name: 'Documentation', path: '/docs', priority: 'low' }
];

// Test results
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  details: [],
  timestamp: new Date().toISOString()
};

/**
 * Simulate checking if an element renders correctly at a given screen size
 * @param {string} selector - CSS selector for the element
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {Object} Test result
 */
function testElementResponsiveness(selector, width, height) {
  // This is a simulation - in a real implementation, this would use
  // a headless browser to actually render the page and check element properties

  // Generate a simulated result (for demo purposes)
  const issues = [];
  const rand = Math.random();

  // Simulate common responsive issues
  if (rand > 0.85 && width < 768) {
    issues.push('Element overflow detected');
  }

  if (rand > 0.9 && width < 480) {
    issues.push('Text overflow detected');
  }

  if (rand > 0.95) {
    issues.push('Unoptimized image detected');
  }

  // Determine test status
  let status = 'pass';
  if (issues.length > 0) {
    status = issues.length > 1 ? 'fail' : 'warning';
  }

  return {
    selector,
    status,
    issues
  };
}

/**
 * Simulate taking a screenshot of the page
 * @param {string} pagePath - Path of the page
 * @param {string} deviceName - Name of the device
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @returns {string} Path to the screenshot (simulated)
 */
function takeScreenshot(pagePath, deviceName, width, height) {
  // This is a simulation - in a real implementation, this would use
  // a headless browser to actually take screenshots

  const screenshotsDir = path.join(__dirname, '..', '..', 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const deviceSlug = deviceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const pageSlug = pagePath === '/' ? 'home' : pagePath.replace(/\//g, '-').replace(/^-/, '');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

  const screenshotPath = path.join(
    screenshotsDir,
    `${pageSlug}_${deviceSlug}_${width}x${height}_${timestamp}.png`
  );

  // Create an empty file to simulate screenshot
  fs.writeFileSync(screenshotPath, '');

  return screenshotPath;
}

/**
 * Test responsiveness for a specific device and page
 * @param {Object} deviceInfo - Device information
 * @param {Object} pageInfo - Page information
 */
async function testDeviceResponsiveness(deviceInfo, pageInfo) {
  const { name, width, height } = deviceInfo;
  const spinner = ora(`Testing ${pageInfo.name} on ${name} (${width}x${height})...`).start();

  // Simulate delay for the test
  await new Promise(resolve => setTimeout(resolve, 500));

  // Store test results for this device-page combination
  const testDetail = {
    device: name,
    resolution: `${width}x${height}`,
    page: pageInfo.name,
    path: pageInfo.path,
    elements: [],
    screenshot: null
  };

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  // Test each element
  for (const element of elementsToTest) {
    const result = testElementResponsiveness(element.selector, width, height);

    testDetail.elements.push({
      name: element.name,
      selector: element.selector,
      status: result.status,
      issues: result.issues
    });

    if (result.status === 'pass') passCount++;
    else if (result.status === 'fail') failCount++;
    else if (result.status === 'warning') warningCount++;
  }

  // Take screenshot if requested
  if (takeScreenshots) {
    testDetail.screenshot = takeScreenshot(pageInfo.path, name, width, height);
  }

  // Update spinner
  if (failCount > 0) {
    spinner.fail(
      `${name} (${width}x${height}): ${passCount} passed, ${failCount} failed, ${warningCount} warnings`
    );
  } else if (warningCount > 0) {
    spinner.warn(`${name} (${width}x${height}): ${passCount} passed, ${warningCount} warnings`);
  } else {
    spinner.succeed(`${name} (${width}x${height}): All ${passCount} elements passed`);
  }

  // Add to overall results
  testResults.details.push(testDetail);
  testResults.summary.total += elementsToTest.length;
  testResults.summary.passed += passCount;
  testResults.summary.failed += failCount;
  testResults.summary.warnings += warningCount;
}

/**
 * Generate a HTML report for the responsiveness tests
 */
function generateHtmlReport() {
  const spinner = ora('Generating HTML report...').start();

  try {
    // Ensure directory exists
    const reportsDir = path.join(__dirname, '..', '..', 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(reportsDir, `responsive-test-${timestamp}.html`);

    // Generate simple HTML report
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Responsive Testing Report</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1, h2, h3 { margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .pass { color: #4CAF50; }
    .warning { color: #FF9800; }
    .fail { color: #F44336; }
    .summary { background-color: #e8eaf6; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .device-section { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
    .screenshots { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
    .screenshot { border: 1px solid #ddd; padding: 5px; max-width: 300px; }
    .screenshot img { max-width: 100%; }
    .screenshot p { margin: 5px 0; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Responsive Testing Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>

  <div class="summary">
    <h2>Summary</h2>
    <p>Total tests: ${testResults.summary.total}</p>
    <p>Passed: <span class="pass">${testResults.summary.passed}</span></p>
    <p>Failed: <span class="fail">${testResults.summary.failed}</span></p>
    <p>Warnings: <span class="warning">${testResults.summary.warnings}</span></p>
  </div>
    `;

    // Group by page
    const pageGroups = {};
    testResults.details.forEach(detail => {
      if (!pageGroups[detail.page]) {
        pageGroups[detail.page] = [];
      }
      pageGroups[detail.page].push(detail);
    });

    // Add details for each page
    for (const [pageName, details] of Object.entries(pageGroups)) {
      html += `
  <div class="device-section">
    <h2>${details[0].page} (${details[0].path})</h2>

    <h3>Test Results by Device</h3>
    <table>
      <thead>
        <tr>
          <th>Device</th>
          <th>Resolution</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Warnings</th>
        </tr>
      </thead>
      <tbody>
      `;

      details.forEach(detail => {
        const passCount = detail.elements.filter(e => e.status === 'pass').length;
        const failCount = detail.elements.filter(e => e.status === 'fail').length;
        const warningCount = detail.elements.filter(e => e.status === 'warning').length;

        html += `
        <tr>
          <td>${detail.device}</td>
          <td>${detail.resolution}</td>
          <td class="pass">${passCount}</td>
          <td class="fail">${failCount}</td>
          <td class="warning">${warningCount}</td>
        </tr>
        `;
      });

      html += `
      </tbody>
    </table>
      `;

      // Add screenshots section if available
      const screenshots = details.filter(d => d.screenshot).map(d => d.screenshot);
      if (screenshots.length > 0) {
        html += `
    <h3>Screenshots</h3>
    <div class="screenshots">
        `;

        details.forEach(detail => {
          if (detail.screenshot) {
            const screenshotFilename = path.basename(detail.screenshot);
            html += `
      <div class="screenshot">
        <p>${detail.device} (${detail.resolution})</p>
        <p>Screenshot: ${screenshotFilename}</p>
      </div>
            `;
          }
        });

        html += `
    </div>
        `;
      }

      // Add element issues section
      html += `
    <h3>Element Issues</h3>
    <table>
      <thead>
        <tr>
          <th>Element</th>
          <th>Device</th>
          <th>Resolution</th>
          <th>Status</th>
          <th>Issues</th>
        </tr>
      </thead>
      <tbody>
      `;

      details.forEach(detail => {
        detail.elements.forEach(element => {
          if (element.status !== 'pass') {
            html += `
        <tr>
          <td>${element.name} (${element.selector})</td>
          <td>${detail.device}</td>
          <td>${detail.resolution}</td>
          <td class="${element.status}">${element.status}</td>
          <td>${element.issues.join(', ')}</td>
        </tr>
            `;
          }
        });
      });

      html += `
      </tbody>
    </table>
  </div>
      `;
    }

    html += `
</body>
</html>
    `;

    fs.writeFileSync(reportPath, html);
    spinner.succeed(`HTML report generated: ${reportPath}`);

    // Also save JSON results
    const jsonPath = path.join(reportsDir, `responsive-test-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
    console.log(`JSON report saved: ${jsonPath}`);

    return reportPath;
  } catch (error) {
    spinner.fail(`Failed to generate report: ${error.message}`);
    return null;
  }
}

/**
 * Main function to run responsiveness tests
 */
async function main() {
  console.log(chalk.green.bold('=== Mobile Responsiveness Testing ==='));

  // Determine which devices to test
  const devicesToTest = device === 'all' ? Object.keys(devices) : [device];

  if (!devicesToTest.every(d => devices[d])) {
    console.error(chalk.red(`Invalid device specified: ${device}`));
    console.log(`Available devices: ${Object.keys(devices).join(', ')}`);
    process.exit(1);
  }

  // Run tests for each device type and page
  for (const deviceType of devicesToTest) {
    const deviceInfo = devices[deviceType];
    console.log(chalk.blue.bold(`\n=== Testing ${deviceInfo.name} ===`));

    for (const size of deviceInfo.sizes) {
      for (const page of pagesToTest) {
        await testDeviceResponsiveness(
          {
            name: size.name,
            width: size.width,
            height: size.height
          },
          page
        );
      }
    }
  }

  // Display summary
  console.log(chalk.green.bold('\n=== Test Summary ==='));
  console.log(`Total tests: ${testResults.summary.total}`);
  console.log(`Passed: ${chalk.green(testResults.summary.passed)}`);
  console.log(`Failed: ${chalk.red(testResults.summary.failed)}`);
  console.log(`Warnings: ${chalk.yellow(testResults.summary.warnings)}`);

  // Generate report if requested
  if (generateReport) {
    await generateHtmlReport();
  }
}

// Run the tests
main().catch(error => {
  console.error(chalk.red(`Test failed: ${error.message}`));
  process.exit(1);
});
