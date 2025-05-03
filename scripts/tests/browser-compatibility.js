/**
 * Browser Compatibility Testing Script
 * Tests website functionality across different browsers
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

// Parse command line arguments
const args = process.argv.slice(2);
const browser = args.find(arg => arg.startsWith('--browser='))?.split('=')[1] || 'all';
const mobile = args.includes('--mobile');
const generateReport = args.includes('--report');

// Browser configurations
const browsers = {
  chrome: {
    name: 'Google Chrome',
    versions: ['112', '100', '90', '80'],
    features: ['webgl', 'webrtc', 'webassembly', 'webcomponents', 'modules']
  },
  firefox: {
    name: 'Mozilla Firefox',
    versions: ['110', '100', '90', '78'],
    features: ['webgl', 'webrtc', 'webassembly', 'webcomponents', 'modules']
  },
  safari: {
    name: 'Apple Safari',
    versions: ['16', '15', '14', '13'],
    features: ['webgl', 'webrtc', 'webassembly', 'webcomponents', 'modules']
  },
  edge: {
    name: 'Microsoft Edge',
    versions: ['110', '100', '90'],
    features: ['webgl', 'webrtc', 'webassembly', 'webcomponents', 'modules']
  }
};

// Mobile device configurations
const mobileDevices = {
  iphone: {
    name: 'iPhone',
    models: ['iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone SE'],
    features: ['touch', 'orientation', 'geolocation', 'offline']
  },
  android: {
    name: 'Android',
    models: ['Pixel 7', 'Galaxy S22', 'OnePlus 10', 'Pixel 6', 'Galaxy S21'],
    features: ['touch', 'orientation', 'geolocation', 'offline']
  },
  ipad: {
    name: 'iPad',
    models: ['iPad Pro', 'iPad Air', 'iPad Mini'],
    features: ['touch', 'orientation', 'geolocation', 'offline']
  }
};

// Test scenarios
const testScenarios = [
  { name: 'Main Page Load', path: '/', priority: 'high' },
  { name: 'Content Streaming', path: '/watch/demo', priority: 'high' },
  { name: 'Batch Upload', path: '/upload/batch', priority: 'high' },
  { name: 'Wallet Connection', path: '/connect', priority: 'high' },
  { name: 'NFT Creation', path: '/create/nft', priority: 'medium' },
  { name: 'Analytics Dashboard', path: '/dashboard/analytics', priority: 'medium' },
  { name: 'User Profile', path: '/profile', priority: 'medium' },
  { name: 'Search Functionality', path: '/search?q=test', priority: 'medium' },
  { name: 'Documentation', path: '/docs', priority: 'low' },
  { name: 'Settings Page', path: '/settings', priority: 'low' }
];

// Overall test results
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  details: [],
  timestamp: new Date().toISOString()
};

/**
 * Simulate running tests for a browser
 * @param {string} browserName - Browser name
 * @param {string} version - Browser version
 * @param {boolean} isMobile - Whether testing mobile version
 * @param {string} [mobileDevice] - Mobile device name if applicable
 */
async function runBrowserTest(browserName, version, isMobile = false, mobileDevice = null) {
  const browserInfo = browsers[browserName];

  const spinner = ora(
    `Testing ${browserInfo.name} ${version}${isMobile ? ` (${mobileDevice})` : ''}...`
  ).start();

  // Count of tests for this browser
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Detailed results for this browser
  const browserResults = {
    browser: browserInfo.name,
    version,
    isMobile,
    mobileDevice,
    scenarios: []
  };

  try {
    // Simulate running tests for each scenario
    for (const scenario of testScenarios) {
      // Simulated test - in a real implementation, this would use a headless browser
      // or a service like BrowserStack to run actual tests
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate test run time

      // Randomly determine test result (for demo purposes)
      // In a real implementation, this would be determined by actual test execution
      const testPassed = Math.random() > 0.2; // 80% chance of passing

      if (testPassed) {
        passed++;
      } else {
        failed++;
      }

      // Add to browser results
      browserResults.scenarios.push({
        name: scenario.name,
        path: scenario.path,
        result: testPassed ? 'pass' : 'fail',
        duration: Math.floor(Math.random() * 500) + 100 + 'ms',
        errors: testPassed ? [] : ['Element not found', 'Timeout waiting for response']
      });
    }

    // Complete the spinner
    spinner.succeed(
      `${browserInfo.name} ${version}${isMobile ? ` (${mobileDevice})` : ''}: ${passed} passed, ${failed} failed`
    );

    // Add to overall test results
    testResults.summary.total += passed + failed + skipped;
    testResults.summary.passed += passed;
    testResults.summary.failed += failed;
    testResults.summary.skipped += skipped;
    testResults.details.push(browserResults);

    return { passed, failed, skipped };
  } catch (error) {
    spinner.fail(`Failed to test ${browserInfo.name} ${version}: ${error.message}`);
    return { passed: 0, failed: testScenarios.length, skipped: 0 };
  }
}

/**
 * Run feature tests for a browser
 * @param {string} browserName - Browser name
 * @param {string} version - Browser version
 */
async function runFeatureTests(browserName, version) {
  const browserInfo = browsers[browserName];

  console.log(chalk.blue(`\nTesting ${browserInfo.name} ${version} feature support:`));

  // Simulate feature tests
  for (const feature of browserInfo.features) {
    const spinner = ora(`Testing ${feature} support`).start();

    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 200));

    // Randomly determine support (for demo purposes)
    const isSupported = Math.random() > 0.1; // 90% chance of support

    if (isSupported) {
      spinner.succeed(`${feature}: Supported`);
    } else {
      spinner.warn(`${feature}: Not supported or limited`);
    }
  }
}

/**
 * Generate an HTML report of test results
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
    const reportPath = path.join(reportsDir, `browser-compatibility-${timestamp}.html`);

    // Generate simple HTML report
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Browser Compatibility Test Report</title>
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
    .fail { color: #F44336; }
    .summary { background-color: #e8eaf6; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .browser-section { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Browser Compatibility Test Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>

  <div class="summary">
    <h2>Summary</h2>
    <p>Total tests: ${testResults.summary.total}</p>
    <p>Passed: <span class="pass">${testResults.summary.passed}</span></p>
    <p>Failed: <span class="fail">${testResults.summary.failed}</span></p>
    <p>Skipped: ${testResults.summary.skipped}</p>
  </div>
    `;

    // Add details for each browser
    testResults.details.forEach(browser => {
      const passCount = browser.scenarios.filter(s => s.result === 'pass').length;
      const failCount = browser.scenarios.filter(s => s.result === 'fail').length;

      html += `
  <div class="browser-section">
    <h2>${browser.browser} ${browser.version}${browser.isMobile ? ` (${browser.mobileDevice})` : ''}</h2>
    <p>Passed: ${passCount}, Failed: ${failCount}</p>

    <h3>Test Results</h3>
    <table>
      <thead>
        <tr>
          <th>Scenario</th>
          <th>Path</th>
          <th>Result</th>
          <th>Duration</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
      `;

      browser.scenarios.forEach(scenario => {
        html += `
        <tr>
          <td>${scenario.name}</td>
          <td>${scenario.path}</td>
          <td class="${scenario.result}">${scenario.result}</td>
          <td>${scenario.duration}</td>
          <td>${scenario.errors && scenario.errors.length ? scenario.errors.join(', ') : ''}</td>
        </tr>
        `;
      });

      html += `
      </tbody>
    </table>
  </div>
      `;
    });

    html += `
</body>
</html>
    `;

    fs.writeFileSync(reportPath, html);
    spinner.succeed(`HTML report generated: ${reportPath}`);

    // Also save JSON results
    const jsonPath = path.join(reportsDir, `browser-compatibility-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
    console.log(`JSON report saved: ${jsonPath}`);

    return reportPath;
  } catch (error) {
    spinner.fail(`Failed to generate report: ${error.message}`);
    return null;
  }
}

/**
 * Main function to run compatibility tests
 */
async function main() {
  console.log(chalk.green.bold('=== Browser Compatibility Testing ==='));

  // Determine which browsers to test
  const browsersToTest = browser === 'all' ? Object.keys(browsers) : [browser];

  if (!browsersToTest.every(b => browsers[b])) {
    console.error(chalk.red(`Invalid browser specified: ${browser}`));
    console.log(`Available browsers: ${Object.keys(browsers).join(', ')}`);
    process.exit(1);
  }

  console.log(`Testing browsers: ${browsersToTest.map(b => browsers[b].name).join(', ')}`);

  // Run tests for each browser and version
  for (const browserName of browsersToTest) {
    const browserInfo = browsers[browserName];
    console.log(chalk.blue.bold(`\n=== Testing ${browserInfo.name} ===`));

    for (const version of browserInfo.versions) {
      if (mobile) {
        // Test mobile devices for this browser
        for (const [deviceType, deviceInfo] of Object.entries(mobileDevices)) {
          for (const model of deviceInfo.models.slice(0, 2)) {
            // Just test first 2 models
            await runBrowserTest(browserName, version, true, `${deviceInfo.name} ${model}`);
          }
        }
      } else {
        // Test desktop version
        await runBrowserTest(browserName, version);

        // Run feature tests
        await runFeatureTests(browserName, version);
      }
    }
  }

  // Display summary
  console.log(chalk.green.bold('\n=== Test Summary ==='));
  console.log(`Total tests: ${testResults.summary.total}`);
  console.log(`Passed: ${chalk.green(testResults.summary.passed)}`);
  console.log(`Failed: ${chalk.red(testResults.summary.failed)}`);
  console.log(`Skipped: ${testResults.summary.skipped}`);

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
