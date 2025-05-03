/**
 * Network Issues Diagnostics Script
 * Diagnoses common network issues and suggests improvements
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const http = require('http');
const https = require('https');

// Base URL for tests
const TEST_URLS = [
  'https://api.github.com/users/octocat',
  'https://httpbin.org/get',
  'https://httpbin.org/delay/1',
  'https://httpbin.org/status/500'
];

// Set default timeout for all requests
http.globalAgent.timeout = 5000;
https.globalAgent.timeout = 5000;

// Network diagnostics tests
const networkTests = {
  /**
   * Test basic connectivity
   */
  async testConnectivity() {
    const spinner = ora('Testing basic connectivity...').start();

    try {
      const pingResult = await execCommand('ping', ['-c', '3', 'google.com']);
      const pingStats = parsePingStats(pingResult);

      if (pingStats.packetLoss > 0) {
        spinner.warn(`Connectivity issues detected: ${pingStats.packetLoss}% packet loss`);
        return {
          success: false,
          packetLoss: pingStats.packetLoss,
          avgLatency: pingStats.avgLatency
        };
      }

      spinner.succeed(`Basic connectivity OK: ${pingStats.avgLatency}ms average latency`);
      return {
        success: true,
        packetLoss: pingStats.packetLoss,
        avgLatency: pingStats.avgLatency
      };
    } catch (error) {
      spinner.fail(`Connectivity test failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Test API endpoints with retries and timeout
   */
  async testAPIEndpoints() {
    const results = [];

    for (const url of TEST_URLS) {
      const spinner = ora(`Testing API endpoint: ${url}`).start();

      try {
        const startTime = Date.now();
        const response = await fetchWithTimeout(url, { timeout: 5000 });
        const endTime = Date.now();
        const latency = endTime - startTime;

        results.push({
          url,
          status: response.status,
          latency,
          success: response.ok
        });

        if (response.ok) {
          spinner.succeed(`${url}: ${response.status} OK (${latency}ms)`);
        } else {
          spinner.warn(`${url}: ${response.status} (${latency}ms)`);
        }
      } catch (error) {
        spinner.fail(`${url}: ${error.message}`);

        results.push({
          url,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  },

  /**
   * Test with different retry strategies
   */
  async testRetryStrategies() {
    const url = 'https://httpbin.org/status/500';
    const spinner = ora('Testing retry strategies...').start();

    try {
      // Test with linear backoff
      const linearStart = Date.now();
      try {
        await fetchWithRetry(url, {
          retries: 3,
          retryDelay: 1000,
          backoffType: 'linear'
        });
      } catch (error) {
        // Expected failure
      }
      const linearDuration = Date.now() - linearStart;

      // Test with exponential backoff
      const expStart = Date.now();
      try {
        await fetchWithRetry(url, {
          retries: 3,
          retryDelay: 300,
          backoffType: 'exponential',
          backoffFactor: 2
        });
      } catch (error) {
        // Expected failure
      }
      const expDuration = Date.now() - expStart;

      spinner.succeed('Retry strategies tested');

      return {
        linearBackoff: {
          duration: linearDuration,
          retries: 3
        },
        exponentialBackoff: {
          duration: expDuration,
          retries: 3
        }
      };
    } catch (error) {
      spinner.fail(`Retry test failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Scan JavaScript files for network code issues
   */
  async scanJSFilesForNetworkIssues() {
    const spinner = ora('Scanning JavaScript files for network issues...').start();
    const issues = [];
    const basePath = path.resolve(__dirname, '..', '..');

    try {
      // Find all JS files
      const files = findJSFiles(basePath);
      let scannedFiles = 0;
      let issuesFound = 0;

      for (const file of files) {
        scannedFiles++;
        spinner.text = `Scanning JavaScript files: ${scannedFiles}/${files.length}`;

        const content = fs.readFileSync(file, 'utf8');
        const fileIssues = scanFileForNetworkIssues(content, file);

        if (fileIssues.length > 0) {
          issuesFound += fileIssues.length;
          issues.push({
            file: path.relative(basePath, file),
            issues: fileIssues
          });
        }
      }

      spinner.succeed(`Scanned ${scannedFiles} files, found ${issuesFound} network issues`);
      return issues;
    } catch (error) {
      spinner.fail(`Scan failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * Find all JavaScript files recursively
 * @param {string} directory - Directory to search
 * @param {Array} result - Result array
 * @returns {Array} JavaScript files
 */
function findJSFiles(directory, result = []) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        findJSFiles(fullPath, result);
      }
    } else if (entry.name.endsWith('.js')) {
      result.push(fullPath);
    }
  }

  return result;
}

/**
 * Scan a file for network issues
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Array} Issues found
 */
function scanFileForNetworkIssues(content, filePath) {
  const issues = [];

  // Check for fetch without timeout
  if (content.includes('fetch(') && !content.includes('timeout') && !content.includes('signal')) {
    issues.push({
      type: 'missing-timeout',
      description: 'Fetch without timeout can lead to hanging requests',
      severity: 'high',
      line: findLineNumber(content, 'fetch(')
    });
  }

  // Check for no error handling in fetch
  if (content.includes('fetch(') && !content.includes('.catch(')) {
    issues.push({
      type: 'missing-error-handling',
      description: 'Fetch without error handling',
      severity: 'high',
      line: findLineNumber(content, 'fetch(')
    });
  }

  // Check for hard-coded URLs
  const urlRegex = /['"]https?:\/\/[^'"]+['"]/g;
  const matches = content.match(urlRegex);

  if (matches) {
    issues.push({
      type: 'hardcoded-urls',
      description: `${matches.length} hard-coded URLs found`,
      severity: 'medium',
      urls: matches.map(m => m.replace(/['"]/g, '')).slice(0, 5)
    });
  }

  // Check for XMLHttpRequest without timeout
  if (content.includes('XMLHttpRequest') && !content.includes('timeout')) {
    issues.push({
      type: 'missing-xhr-timeout',
      description: 'XMLHttpRequest without timeout',
      severity: 'medium',
      line: findLineNumber(content, 'XMLHttpRequest')
    });
  }

  return issues;
}

/**
 * Find line number for a pattern in text
 * @param {string} content - Text content
 * @param {string} pattern - Pattern to find
 * @returns {number} Line number
 */
function findLineNumber(content, pattern) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      return i + 1;
    }
  }
  return -1;
}

/**
 * Parse ping statistics
 * @param {string} pingOutput - Output from ping command
 * @returns {Object} Ping statistics
 */
function parsePingStats(pingOutput) {
  const packetLossMatch = pingOutput.match(/(\d+)% packet loss/);
  const avgLatencyMatch = pingOutput.match(/min\/avg\/max\/[^=]+=\s+[\d.]+\/([\d.]+)\/[\d.]+/);

  return {
    packetLoss: packetLossMatch ? parseFloat(packetLossMatch[1]) : 0,
    avgLatency: avgLatencyMatch ? parseFloat(avgLatencyMatch[1]) : 0
  };
}

/**
 * Execute command
 * @param {string} command - Command to execute
 * @param {Array} args - Command arguments
 * @returns {Promise<string>} Command output
 */
function execCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let output = '';

    process.stdout.on('data', data => {
      output += data.toString();
    });

    process.stderr.on('data', data => {
      output += data.toString();
    });

    process.on('close', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${output}`));
      }
    });

    process.on('error', reject);
  });
}

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 8000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch with retry and backoff
 * @param {string} url - URL to fetch
 * @param {Object} options - Options
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, options = {}) {
  const {
    retries = 3,
    retryDelay = 1000,
    backoffType = 'exponential',
    backoffFactor = 2,
    ...fetchOptions
  } = options;

  let lastError;
  let delay = retryDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, fetchOptions);
    } catch (error) {
      lastError = error;

      if (attempt >= retries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay based on backoff type
      if (backoffType === 'exponential') {
        delay *= backoffFactor;
      } else if (backoffType === 'linear') {
        delay += retryDelay;
      }
    }
  }

  throw lastError;
}

/**
 * Generate recommendations based on test results
 * @param {Object} results - Test results
 * @returns {Array} Recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  // Network connectivity recommendations
  if (results.connectivity.avgLatency > 100) {
    recommendations.push({
      type: 'connectivity',
      description: `High latency detected (${results.connectivity.avgLatency}ms). Consider implementing caching strategies.`,
      code: `
// Example cache implementation for fetch
const cache = new Map();

async function fetchWithCache(url, options = {}) {
  const { cacheTime = 60000, ...fetchOptions } = options;

  // Check cache first
  const cacheKey = \`\${url}-\${JSON.stringify(fetchOptions)}\`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < cacheTime) {
    return new Response(cached.data, cached.init);
  }

  // Not in cache or expired, fetch fresh data
  const response = await fetch(url, fetchOptions);
  const data = await response.clone().text();

  // Store in cache
  cache.set(cacheKey, {
    timestamp: Date.now(),
    data,
    init: {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    }
  });

  return response;
}
`
    });
  }

  // API endpoint recommendations
  const failedEndpoints = results.apiEndpoints.filter(endpoint => !endpoint.success);

  if (failedEndpoints.length > 0) {
    recommendations.push({
      type: 'api-resilience',
      description: `${failedEndpoints.length} API endpoints failed. Implement circuit breakers.`,
      code: `
// Circuit breaker implementation
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.onStateChange = options.onStateChange;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      // Check if it's time to try again
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this._setState('HALF_OPEN');
      } else {
        throw new Error('Circuit is OPEN - failing fast');
      }
    }

    try {
      const result = await fn();

      // If successful during HALF_OPEN, reset circuit
      if (this.state === 'HALF_OPEN') {
        this._reset();
      }

      return result;
    } catch (error) {
      this._recordFailure();
      throw error;
    }
  }

  _recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold && this.state === 'CLOSED') {
      this._setState('OPEN');
    }
  }

  _reset() {
    this.failures = 0;
    this._setState('CLOSED');
  }

  _setState(newState) {
    const oldState = this.state;
    this.state = newState;

    if (this.onStateChange && oldState !== newState) {
      this.onStateChange({ oldState, newState });
    }
  }
}

// Usage example
const apiBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000,
  onStateChange: ({ oldState, newState }) => {
    console.log(\`Circuit changed from \${oldState} to \${newState}\`);
  }
});

async function fetchWithCircuitBreaker(url) {
  return apiBreaker.execute(async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(\`HTTP error: \${response.status}\`);
    return response;
  });
}
`
    });
  }

  // Retry strategies recommendations
  recommendations.push({
    type: 'retry-strategy',
    description:
      'Implement exponential backoff for retries to avoid overwhelming servers during issues.',
    code: `
// Exponential backoff retry implementation
async function fetchWithBackoff(url, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 300,
    maxDelay = 10000,
    factor = 2,
    jitter = true,
    ...fetchOptions
  } = options;

  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fetch(url, fetchOptions);
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * factor, maxDelay);

      // Add jitter to avoid thundering herd
      const actualDelay = jitter ? delay * (0.8 + Math.random() * 0.4) : delay;

      console.log(\`Retry \${retries + 1}/\${maxRetries} after \${Math.round(actualDelay)}ms\`);
      await new Promise(resolve => setTimeout(resolve, actualDelay));

      retries++;
    }
  }
}
`
  });

  // JavaScript issues recommendations
  if (results.jsIssues.length > 0) {
    let totalIssues = 0;
    results.jsIssues.forEach(file => {
      totalIssues += file.issues.length;
    });

    recommendations.push({
      type: 'code-issues',
      description: `Found ${totalIssues} network-related issues in JavaScript files.`,
      issues: results.jsIssues.slice(0, 3).map(file => {
        return {
          file: file.file,
          issues: file.issues.slice(0, 3) // First 3 issues per file
        };
      }),
      code: `
// Improved fetch implementation with timeout, retry and error handling
async function safeFetch(url, options = {}) {
  const {
    timeout = 5000,
    retries = 2,
    retryDelay = 500,
    ...fetchOptions
  } = options;

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!response.ok) {
        throw new Error(\`HTTP error \${response.status}: \${response.statusText}\`);
      }

      return response;
    } catch (error) {
      lastError = error;
      attempt++;

      // Don't retry on abort/timeout
      if (error.name === 'AbortError' || attempt > retries) {
        break;
      }

      // Wait before retry with increasing delay
      await new Promise(resolve =>
        setTimeout(resolve, retryDelay * attempt));
    }
  }

  // Clear timeout if we exit the loop with an error
  clearTimeout(timeoutId);

  // Enhance error with retry information
  lastError.message = \`Request failed after \${attempt} attempts: \${lastError.message}\`;
  throw lastError;
}
`
    });
  }

  return recommendations;
}

/**
 * Generate HTML report
 * @param {Object} results - Test results
 * @returns {string} HTML report
 */
function generateHTMLReport(results) {
  const recommendations = generateRecommendations(results);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Network Diagnostics Report</title>
  <style>
    :root {
      --bg-color: #0d1117;
      --text-color: #c9d1d9;
      --heading-color: #58a6ff;
      --border-color: #30363d;
      --card-bg: #161b22;
      --success-color: #2ea043;
      --warning-color: #f7b955;
      --error-color: #f85149;
      --code-bg: #1f2937;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--bg-color);
      margin: 0;
      padding: 20px;
    }

    h1, h2, h3 {
      color: var(--heading-color);
    }

    .container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .card {
      background-color: var(--card-bg);
      border-radius: 6px;
      border: 1px solid var(--border-color);
      padding: 16px;
      margin-bottom: 20px;
    }

    .success { color: var(--success-color); }
    .warning { color: var(--warning-color); }
    .error { color: var(--error-color); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      background-color: rgba(255, 255, 255, 0.05);
    }

    code {
      display: block;
      background-color: var(--code-bg);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.9em;
      white-space: pre;
    }

    .recommendation {
      border-left: 4px solid var(--heading-color);
      padding-left: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Network Diagnostics Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>

    <div class="card">
      <h2>Connectivity Test</h2>
      <p>
        Average latency: <span class="${results.connectivity.avgLatency > 100 ? 'warning' : 'success'}">${results.connectivity.avgLatency}ms</span>
        <br>
        Packet loss: <span class="${results.connectivity.packetLoss > 0 ? 'error' : 'success'}">${results.connectivity.packetLoss}%</span>
      </p>
    </div>

    <div class="card">
      <h2>API Endpoints Test</h2>
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          ${results.apiEndpoints
            .map(
              endpoint => `
            <tr>
              <td>${endpoint.url}</td>
              <td>${endpoint.status || 'N/A'}</td>
              <td>${endpoint.latency ? endpoint.latency + 'ms' : 'N/A'}</td>
              <td>
                ${
                  endpoint.success
                    ? '<span class="success">OK</span>'
                    : `<span class="error">${endpoint.error || 'Failed'}</span>`
                }
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>JavaScript Issues (${results.jsIssues.length} files with issues)</h2>
      ${results.jsIssues.length === 0 ? '<p>No issues found.</p>' : ''}
      ${results.jsIssues
        .slice(0, 5)
        .map(
          file => `
        <div class="card">
          <h3>${file.file}</h3>
          <table>
            <thead>
              <tr>
                <th>Issue</th>
                <th>Severity</th>
                <th>Line</th>
              </tr>
            </thead>
            <tbody>
              ${file.issues
                .map(
                  issue => `
                <tr>
                  <td>${issue.description}</td>
                  <td>
                    <span class="${
                      issue.severity === 'high'
                        ? 'error'
                        : issue.severity === 'medium'
                          ? 'warning'
                          : 'success'
                    }">
                      ${issue.severity}
                    </span>
                  </td>
                  <td>${issue.line || 'N/A'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
        )
        .join('')}
      ${results.jsIssues.length > 5 ? `<p>...and ${results.jsIssues.length - 5} more files with issues.</p>` : ''}
    </div>

    <div class="card">
      <h2>Recommendations</h2>
      ${recommendations
        .map(
          rec => `
        <div class="recommendation card">
          <h3>${rec.type}</h3>
          <p>${rec.description}</p>
          <code>${rec.code}</code>
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('=== Network Diagnostics ==='));

  const results = {
    timestamp: new Date().toISOString()
  };

  try {
    console.log('\n1. Testing basic connectivity...');
    results.connectivity = await networkTests.testConnectivity();

    console.log('\n2. Testing API endpoints...');
    results.apiEndpoints = await networkTests.testAPIEndpoints();

    console.log('\n3. Testing retry strategies...');
    results.retryTests = await networkTests.testRetryStrategies();

    console.log('\n4. Scanning JavaScript files for network issues...');
    results.jsIssues = await networkTests.scanJSFilesForNetworkIssues();

    // Generate recommendations
    console.log('\n5. Generating recommendations...');
    const recommendations = generateRecommendations(results);

    // Display recommendations
    console.log(chalk.green.bold('\n=== Recommendations ==='));
    recommendations.forEach((rec, i) => {
      console.log(chalk.yellow(`\n${i + 1}. ${rec.description}`));
    });

    // Generate HTML report
    const reportDir = path.join(__dirname, '..', '..', 'network-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `network-diagnostics-${Date.now()}.html`);
    fs.writeFileSync(reportPath, generateHTMLReport(results));

    console.log(chalk.green(`\nDetailed report saved to: ${reportPath}`));

    // Save JSON results
    const jsonPath = path.join(reportDir, `network-diagnostics-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(chalk.red(`Error running diagnostics: ${error.message}`));
    process.exit(1);
  }
}

// Run diagnostics
main();
