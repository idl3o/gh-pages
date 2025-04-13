/**
 * Jest setup file to provide global polyfills
 */
const { TextEncoder, TextDecoder } = require('text-encoding');

// Explicitly set TextEncoder and TextDecoder as globals
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.ethereum for Web3 tests
global.window = {
  ethereum: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
  }
};

// Add missing fetch API
global.fetch = require('node-fetch');

// Any other global setup for Jest tests can go here