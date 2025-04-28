# Testing Guide for Web3 Crypto Streaming Service

This directory contains tests for the Web3 Crypto Streaming Service project, using Jest as the testing framework.

## Running Tests

You can run the tests using npm:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- tests/monty-hall.test.js

# Run tests in watch mode (automatically rerun on file changes)
npm test -- --watch
```

## Test Structure

Tests are organized by feature or module:

- `utils.test.js` - Tests for utility functions
- `monty-hall.test.js` - Tests for the Monty Hall probability simulation

## Writing Tests

When writing new tests, follow these conventions:

1. Create test files in the `tests` directory
2. Use descriptive test names and organize with `describe` blocks
3. Use `beforeEach` for test setup when needed
4. Mock external dependencies with Jest mocks

## Code Coverage

We aim for at least 80% code coverage. You can view the coverage report in the `coverage` directory after running tests with the `--coverage` flag.
