module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js'],
  testMatch: [
    '**/tests/**/*.js',
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  setupFilesAfterEnv: ['./tests/setup/jest-setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'assets/js/**/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true
};