module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],

  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: ['/node_modules/', '/vendor/', '/_site/'],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Indicates whether the coverage information should be collected
  collectCoverage: true,

  // Collect coverage from specific files
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/_site/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!jest.config.js'
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov'],

  // Setup files that will run after the test framework is instantiated
  setupFilesAfterEnv: [],

  // Set a timeout for tests
  testTimeout: 10000
};
