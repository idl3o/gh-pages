module.exports = {
  // The root directory that Jest should scan for tests
  rootDir: '.',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.js',
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // An array of regexp pattern strings that are matched against all test paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.github/'
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/__mocks__/'
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov', 'clover'],

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },

  // A preset that is used as a base for Jest's configuration
  // preset: 'ts-jest', // Uncomment if using TypeScript

  // Automatically restore mock state between every test
  restoreMocks: true,

  // Allows you to use a custom runner instead of Jest's default test runner
  // runner: 'jest-runner',

  // Setup files that will be run before each test
  setupFiles: [],

  // Setup files that will run after the test framework is instantiated
  setupFilesAfterEnv: [],

  // The test results processor used by Jest
  // testResultsProcessor: undefined,

  // Display individual test results with the test suite hierarchy
  displayIndividualTestResults: true
};
