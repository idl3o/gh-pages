// Global test setup
jest.setTimeout(10000); // Increase timeout for all tests

// Add global mocks or polyfills here as needed
global.fetch = require('jest-fetch-mock');

// Mock browser APIs when needed
if (typeof window === 'undefined') {
  global.window = {};
}

// Additional setup can be added here
