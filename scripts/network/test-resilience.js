/**
 * Network Resilience Test Script
 * Tests and demonstrates robust network error handling
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const chalk = require('chalk');
const ora = require('ora');

// Network operation patterns
const NetworkPatterns = {
  /**
   * Retry with exponential backoff
   * @param {Function} operation - The async operation to perform
   * @param {Object} options - Options for retry
   */
  async retryWithBackoff(operation, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 300,
      maxDelay = 5000,
      factor = 2,
      onRetry = null
    } = options;

    let retries = 0;
    let delay = initialDelay;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        // Don't retry if max retries reached or error is not retryable
        if (retries >= maxRetries || error.retryable === false) {
          throw error;
        }

        // Calculate next delay with exponential backoff
        delay = Math.min(delay * factor, maxDelay);

        // Add some jitter to avoid thundering herd
        const jitter = Math.random() * 100;
        const actualDelay = delay + jitter;

        retries++;

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry({
            error,
            retries,
            maxRetries,
            delay: actualDelay
          });
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }
  },

  /**
   * Circuit Breaker Pattern
   * @param {Object} options - Circuit breaker options
   */
  createCircuitBreaker(options = {}) {
    const {
      failureThreshold = 3,
      resetTimeout = 30000,
      monitorInterval = 5000,
      onStateChange = null
    } = options;

    let failures = 0;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    let lastFailureTime = null;

    // Monitor the circuit
    let intervalId = null;

    // Start monitoring
    const startMonitoring = () => {
      if (intervalId) clearInterval(intervalId);

      intervalId = setInterval(() => {
        if (state === 'OPEN') {
          const now = Date.now();
          if (now - lastFailureTime > resetTimeout) {
            // Try to recover - transition to half-open
            changeState('HALF_OPEN');
          }
        }
      }, monitorInterval);
    };

    // Change state and notify
    const changeState = newState => {
      const oldState = state;
      state = newState;

      if (onStateChange && oldState !== newState) {
        onStateChange({ oldState, newState });
      }
    };

    // Reset failures counter
    const reset = () => {
      failures = 0;
      if (state !== 'CLOSED') {
        changeState('CLOSED');
      }
    };

    // Record a failure
    const recordFailure = () => {
      failures++;
      lastFailureTime = Date.now();

      if (failures >= failureThreshold && state === 'CLOSED') {
        changeState('OPEN');
      }
    };

    startMonitoring();

    return {
      async execute(operation) {
        if (state === 'OPEN') {
          throw new Error('Circuit is OPEN - failing fast');
        }

        try {
          const result = await operation();

          // On success in HALF_OPEN, transition back to CLOSED
          if (state === 'HALF_OPEN') {
            reset();
          }

          return result;
        } catch (error) {
          recordFailure();
          throw error;
        }
      },

      getState() {
        return { state, failures };
      },

      reset,

      // Clean up resources
      dispose() {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };
  },

  /**
   * Create a fetch wrapper with timeout, retry and circuit breaker
   * @param {Object} options - Options
   */
  createResilientFetch(options = {}) {
    const { timeout = 5000, retryOptions = {}, circuitBreakerOptions = {} } = options;

    // Create circuit breaker
    const circuitBreaker = this.createCircuitBreaker({
      ...circuitBreakerOptions,
      onStateChange: ({ oldState, newState }) => {
        console.log(`Circuit state changed: ${oldState} -> ${newState}`);
      }
    });

    // Return the resilient fetch function
    return async (url, options = {}) => {
      // Add timeout to fetch options
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        ...options,
        signal: controller.signal
      };

      try {
        // Execute with circuit breaker and retry
        return await circuitBreaker.execute(() =>
          this.retryWithBackoff(async () => {
            try {
              const fetchModule = await import('node-fetch');
              const fetch = fetchModule.default;

              const response = await fetch(url, fetchOptions);

              if (!response.ok) {
                const error = new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                error.status = response.status;
                error.retryable = response.status >= 500 || response.status === 429;
                throw error;
              }

              return response;
            } catch (error) {
              // Make network errors retryable
              if (error.name === 'AbortError') {
                error.message = `Request timed out after ${timeout}ms`;
                error.retryable = true;
              } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                error.retryable = true;
              }

              throw error;
            }
          }, retryOptions)
        );
      } finally {
        clearTimeout(timeoutId);
      }
    };
  },

  /**
   * Create a caching fetch function
   * @param {Object} cacheService - Cache service instance
   * @param {Function} fetchFn - Fetch function to wrap
   * @param {Object} options - Cache options
   */
  createCachingFetch(cacheService, fetchFn, options = {}) {
    const {
      ttl = 300, // 5 minutes default
      cachePredicate = () => true,
      keyGenerator = url => url
    } = options;

    return async (url, fetchOptions = {}) => {
      // Skip cache for non-GET requests
      if (fetchOptions.method && fetchOptions.method !== 'GET') {
        return fetchFn(url, fetchOptions);
      }

      const cacheKey = keyGenerator(url);

      // Try cache first
      try {
        return await cacheService.getOrSet(
          cacheKey,
          async () => {
            const response = await fetchFn(url, fetchOptions);
            const data = await response.json();

            // Only cache if predicate returns true
            if (!cachePredicate(data, response)) {
              // Signal to cache service not to store this
              throw new Error('CACHE_SKIP');
            }

            return data;
          },
          ttl
        );
      } catch (error) {
        if (error.message === 'CACHE_SKIP') {
          // Just fetch again without caching
          const response = await fetchFn(url, fetchOptions);
          return response.json();
        }
        throw error;
      }
    };
  }
};

/**
 * Mock cache service for testing
 */
class MockCacheService {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl) {
    this.cache.set(key, value);
    return true;
  }

  async getOrSet(key, producer, ttl) {
    const cachedValue = this.get(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    try {
      const value = typeof producer === 'function' ? await producer() : producer;
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      throw error;
    }
  }

  delete(key) {
    return this.cache.delete(key);
  }
}

/**
 * Mock server for testing
 */
class MockServer {
  constructor() {
    this.server = null;
    this.failureRate = 0.3; // 30% chance of failure
    this.latency = 0; // Additional latency in ms
  }

  /**
   * Start the mock server
   */
  start(port = 0) {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // Handle request with simulated issues
        this.handleRequest(req, res);
      });

      this.server.on('error', reject);

      this.server.listen(port, () => {
        const { port } = this.server.address();
        resolve(port);
      });
    });
  }

  /**
   * Handle incoming requests
   */
  handleRequest(req, res) {
    // Add simulated latency
    setTimeout(() => {
      // Simulate failures randomly
      if (Math.random() < this.failureRate) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
        return;
      }

      // Return success response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          path: req.url,
          timestamp: new Date().toISOString()
        })
      );
    }, Math.random() * this.latency);
  }

  /**
   * Set failure rate
   */
  setFailureRate(rate) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Set latency
   */
  setLatency(latency) {
    this.latency = Math.max(0, latency);
  }

  /**
   * Stop the server
   */
  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

/**
 * Test resilient fetch
 * @param {string} url - URL to fetch
 * @param {Object} options - Test options
 */
async function testResilientFetch(url, options = {}) {
  const spinner = ora(`Testing resilient fetch on ${url}`).start();

  const resilientFetch = NetworkPatterns.createResilientFetch({
    timeout: options.timeout || 3000,
    retryOptions: {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 300,
      onRetry: ({ error, retries, maxRetries, delay }) => {
        spinner.text = `Attempt ${retries}/${maxRetries} failed: ${error.message}. Retrying in ${Math.round(delay)}ms...`;
      }
    }
  });

  try {
    spinner.text = `Fetching ${url}...`;
    const response = await resilientFetch(url);
    const data = await response.json();

    spinner.succeed(`Fetch successful: ${JSON.stringify(data).substring(0, 100)}`);
    return data;
  } catch (error) {
    spinner.fail(`Fetch failed after retries: ${error.message}`);
    throw error;
  }
}

/**
 * Test circuit breaker pattern
 * @param {Function} operation - Operation to test
 * @param {number} attempts - Number of attempts
 */
async function testCircuitBreaker(operation, attempts = 10) {
  const spinner = ora('Testing circuit breaker pattern').start();

  const circuitBreaker = NetworkPatterns.createCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 5000,
    onStateChange: ({ oldState, newState }) => {
      spinner.text = `Circuit state changed: ${oldState} -> ${newState}`;
    }
  });

  const results = {
    success: 0,
    failure: 0,
    circuitOpen: 0
  };

  for (let i = 0; i < attempts; i++) {
    try {
      spinner.text = `Attempt ${i + 1}/${attempts} - Circuit: ${circuitBreaker.getState().state}`;

      await circuitBreaker.execute(operation);
      results.success++;
    } catch (error) {
      if (error.message.includes('Circuit is OPEN')) {
        results.circuitOpen++;
      } else {
        results.failure++;
      }
    }

    // Add a small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  spinner.succeed(`Circuit breaker test complete. Results: ${JSON.stringify(results)}`);
  return results;
}

/**
 * Test caching fetch
 * @param {string} url - URL to fetch
 * @param {number} attempts - Number of attempts
 */
async function testCachingFetch(url, attempts = 5) {
  const spinner = ora('Testing caching fetch').start();

  // Create base fetch function
  const baseFetch = NetworkPatterns.createResilientFetch({
    timeout: 3000
  });

  // Create cache service
  const cacheService = new MockCacheService();

  // Create caching fetch
  const cachingFetch = NetworkPatterns.createCachingFetch(cacheService, baseFetch, {
    ttl: 10, // Cache for 10 seconds
    cachePredicate: data => data.success === true,
    keyGenerator: url => `fetch:${url}`
  });

  const timings = [];

  for (let i = 0; i < attempts; i++) {
    const start = Date.now();

    try {
      spinner.text = `Request ${i + 1}/${attempts}...`;
      const result = await cachingFetch(url);
      const elapsed = Date.now() - start;

      timings.push({
        attempt: i + 1,
        elapsed,
        cached: i > 0,
        success: true
      });

      spinner.text = `Request ${i + 1}/${attempts} completed in ${elapsed}ms${i > 0 ? ' (cached)' : ''}`;
    } catch (error) {
      const elapsed = Date.now() - start;

      timings.push({
        attempt: i + 1,
        elapsed,
        cached: false,
        success: false,
        error: error.message
      });

      spinner.text = `Request ${i + 1}/${attempts} failed in ${elapsed}ms: ${error.message}`;
    }

    // Add a small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const cacheMisses = timings.filter(t => !t.cached).length;
  const cacheHits = timings.filter(t => t.cached).length;

  spinner.succeed(`Caching test complete. Cache hits: ${cacheHits}, misses: ${cacheMisses}`);

  return timings;
}

/**
 * Main test function
 */
async function main() {
  console.log(chalk.blue.bold('=== Network Resilience Testing ==='));

  // Start mock server
  const mockServer = new MockServer();
  mockServer.setLatency(1000); // 1 second latency

  let port;
  try {
    port = await mockServer.start(0);
    console.log(`Mock server started on port ${port}`);

    const serverUrl = `http://localhost:${port}`;

    // Test 1: Resilient fetch
    console.log(chalk.yellow.bold('\nTest 1: Resilient Fetch'));
    await testResilientFetch(`${serverUrl}/test1`);

    // Test 2: Circuit breaker with high failure rate
    console.log(chalk.yellow.bold('\nTest 2: Circuit Breaker'));
    mockServer.setFailureRate(0.7); // 70% chance of failure

    const failingOperation = async () => {
      const response = await fetch(`${serverUrl}/test2`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return response.json();
    };

    await testCircuitBreaker(failingOperation);

    // Test 3: Caching fetch
    console.log(chalk.yellow.bold('\nTest 3: Caching Fetch'));
    mockServer.setFailureRate(0.3); // Back to 30%

    const cachingResults = await testCachingFetch(`${serverUrl}/test3`);

    // Write results to file
    const resultsDir = path.join(__dirname, '..', '..', 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const resultsPath = path.join(resultsDir, 'network-resilience-results.json');
    fs.writeFileSync(
      resultsPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          cachingResults
        },
        null,
        2
      )
    );

    console.log(chalk.green(`\nResults saved to ${resultsPath}`));
  } finally {
    // Stop the mock server
    if (mockServer.server) {
      await mockServer.stop();
      console.log('Mock server stopped');
    }
  }

  console.log(chalk.green.bold('\nNetwork resilience testing complete!'));
}

// Run the tests
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
