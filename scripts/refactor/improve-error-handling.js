/**
 * Error Handling Improvement Script
 * Analyzes and improves error handling patterns in JavaScript files
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Error handling patterns
const errorPatterns = {
  // Custom error classes
  customErrors: `/**
 * Custom error classes for better error handling
 */

/**
 * Base application error
 */
class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fields = fields;
  }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
  constructor(message, resource = 'Resource') {
    super(message || \`\${resource} not found\`, 'NOT_FOUND', 404);
    this.resource = resource;
  }
}

/**
 * Unauthorized error
 */
class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || 'Unauthorized access', 'UNAUTHORIZED', 401);
  }
}

/**
 * Forbidden error
 */
class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Access forbidden', 'FORBIDDEN', 403);
  }
}

/**
 * Network error
 */
class NetworkError extends AppError {
  constructor(message, originalError = null) {
    super(message || 'Network error occurred', 'NETWORK_ERROR', 503);
    this.originalError = originalError;
    this.retryable = true;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  NetworkError
};`,

  // Error handler middleware
  errorHandler: `/**
 * Global error handling middleware
 */

const { AppError } = require('./errors');
const logger = require('./logger');

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Default error structure
  const error = {
    message: err.message || 'An unexpected error occurred',
    code: err.code || 'INTERNAL_ERROR',
    status: err.statusCode || 500
  };

  // Add request ID if available
  if (req.id) {
    error.requestId = req.id;
  }

  // Add validation errors if available
  if (err.fields) {
    error.fields = err.fields;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    error.stack = err.stack;
  }

  // Log error
  logger.error('Request error', {
    error: err,
    method: req.method,
    path: req.path,
    ip: req.ip,
    requestId: req.id
  });

  // Send response
  res.status(error.status).json({ error });
}

module.exports = errorHandler;`,

  // Async request handler wrapper
  asyncHandler: `/**
 * Async request handler wrapper
 * Automatically catches errors in async route handlers
 */

/**
 * Wraps an async function to properly handle errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;`,

  // Fetch wrapper with error handling
  fetchWrapper: `/**
 * Fetch wrapper with error handling
 */

const { NetworkError } = require('./errors');

/**
 * Enhanced fetch with better error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function safeFetch(url, options = {}) {
  try {
    // Add timeout if not set
    if (!options.signal) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
      options.signal = controller.signal;

      // Clean up timeout after fetch completes
      const cleanup = () => clearTimeout(timeoutId);
      process.nextTick(() => process.once('unhandledRejection', cleanup));
    }

    // Perform fetch
    const response = await fetch(url, options);

    // Handle HTTP errors
    if (!response.ok) {
      const body = await response.text();
      let parsedBody;

      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        parsedBody = { message: body };
      }

      const error = new NetworkError(
        parsedBody.message || \`HTTP error \${response.status}: \${response.statusText}\`,
      );

      error.statusCode = response.status;
      error.body = parsedBody;
      error.headers = Object.fromEntries(response.headers.entries());
      error.retryable = response.status >= 500 || response.status === 429;

      throw error;
    }

    return response;
  } catch (error) {
    // Handle abort/timeout
    if (error.name === 'AbortError') {
      const timeoutError = new NetworkError('Request timeout');
      timeoutError.retryable = true;
      throw timeoutError;
    }

    // Handle other network errors
    if (error.message.includes('fetch failed') || error.name === 'TypeError') {
      const networkError = new NetworkError(error.message, error);
      networkError.retryable = true;
      throw networkError;
    }

    // Re-throw if it's already our custom error
    if (error instanceof NetworkError) {
      throw error;
    }

    // Wrap other errors
    const wrappedError = new NetworkError('Fetch error', error);
    wrappedError.originalError = error;
    throw wrappedError;
  }
}

module.exports = safeFetch;`
};

/**
 * Find JavaScript files to analyze
 * @param {string} directory - Directory to search
 * @returns {Array<string>} Array of file paths
 */
function findJsFiles(directory) {
  let results = [];
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      results = results.concat(findJsFiles(filePath));
    } else if (stat.isFile() && path.extname(file) === '.js') {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Analyze file for error handling issues
 * @param {string} filePath - Path to file
 * @returns {Object} Analysis results
 */
function analyzeErrorHandling(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Check for async/Promise usage without error handling
  const asyncUsage = content.includes('async') || content.includes('Promise');
  const hasPromiseCatch = content.includes('.catch(') || content.includes('try {');

  // Check for fetch without error handling
  const fetchUsage = content.includes('fetch(');
  const hasFetchErrorHandling =
    content.includes('.catch(') || (content.includes('try {') && content.includes('fetch('));

  // Check for custom error types
  const usesCustomErrors =
    content.includes('extends Error') || content.includes('instanceof Error');

  // Look for async functions
  const asyncFunctions = [];
  const functionRegex = /async\s+function\s+(\w+)|(\w+)\s*=\s*async\s+(?:function|\()/g;
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    const functionName = match[1] || match[2];
    const functionStart = match.index;

    // Find function body
    let openBraces = 0;
    let functionBody = '';
    let inBody = false;

    // Simple parser to extract function body
    for (let i = functionStart; i < content.length; i++) {
      const char = content[i];

      if (char === '{') {
        openBraces++;
        inBody = true;
        functionBody += char;
      } else if (char === '}') {
        openBraces--;
        functionBody += char;

        if (openBraces === 0 && inBody) {
          break;
        }
      } else if (inBody) {
        functionBody += char;
      }
    }

    // Check if this async function has error handling
    const hasErrorHandling = functionBody.includes('try {') || functionBody.includes('.catch(');

    asyncFunctions.push({
      name: functionName,
      hasErrorHandling
    });
  }

  // Count missing error handling in async functions
  const functionsWithoutErrorHandling = asyncFunctions.filter(fn => !fn.hasErrorHandling);

  return {
    fileName,
    filePath,
    asyncUsage,
    hasPromiseCatch,
    fetchUsage,
    hasFetchErrorHandling,
    usesCustomErrors,
    asyncFunctions,
    functionsWithoutErrorHandling,
    missingErrorHandling:
      (asyncUsage && !hasPromiseCatch) ||
      (fetchUsage && !hasFetchErrorHandling) ||
      functionsWithoutErrorHandling.length > 0
  };
}

/**
 * Generate error handling improvements for a file
 * @param {Object} analysis - Error handling analysis
 * @returns {Array} Array of improvement suggestions
 */
function generateImprovements(analysis) {
  const improvements = [];

  // Suggest improvements for async functions without error handling
  if (analysis.functionsWithoutErrorHandling.length > 0) {
    improvements.push({
      type: 'missing-try-catch',
      description: `Add try/catch blocks to ${analysis.functionsWithoutErrorHandling.length} async functions`,
      functions: analysis.functionsWithoutErrorHandling.map(fn => fn.name)
    });
  }

  // Suggest custom error types
  if ((analysis.asyncUsage || analysis.fetchUsage) && !analysis.usesCustomErrors) {
    improvements.push({
      type: 'custom-errors',
      description: 'Add custom error classes for better error identification',
      codeExample: errorPatterns.customErrors.split('\n').slice(0, 15).join('\n') + '\n// ...'
    });
  }

  // Suggest fetch wrapper for better error handling
  if (analysis.fetchUsage && !analysis.hasFetchErrorHandling) {
    improvements.push({
      type: 'fetch-wrapper',
      description: 'Use safeFetch wrapper for better fetch error handling',
      codeExample: errorPatterns.fetchWrapper.split('\n').slice(0, 15).join('\n') + '\n// ...'
    });
  }

  // Suggest async handler wrapper for Express routes
  if (content.includes('app.get(') || content.includes('router.')) {
    improvements.push({
      type: 'async-handler',
      description: 'Use asyncHandler wrapper for Express route handlers',
      codeExample: errorPatterns.asyncHandler
    });
  }

  return improvements;
}

/**
 * Generate example improvements to a file
 * @param {string} filePath - Path to file
 * @param {Object} analysis - Error analysis
 * @returns {string} Improved file content
 */
function generateImprovedFile(filePath, analysis) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add imports for error handling utilities
  if (!content.includes('const { AppError }') && !content.includes("require('./errors')")) {
    const lines = content.split('\n');

    // Find a good spot for imports (after existing imports)
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(') || lines[i].includes('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, "const { AppError } = require('../core/errors');");
      content = lines.join('\n');
    } else {
      content = "const { AppError } = require('../core/errors');\n\n" + content;
    }
  }

  // Add try/catch to async functions without error handling
  for (const fn of analysis.functionsWithoutErrorHandling) {
    const functionRegex = new RegExp(
      `async\\s+function\\s+${fn.name}|${fn.name}\\s*=\\s*async\\s+(?:function|\\()`,
      'g'
    );
    let match;

    if ((match = functionRegex.exec(content)) !== null) {
      const functionStart = match.index;

      // Find function body opening brace
      let openingBraceIndex = content.indexOf('{', functionStart);

      if (openingBraceIndex !== -1) {
        // Insert try after opening brace
        content =
          content.slice(0, openingBraceIndex + 1) +
          '\n    try {' +
          content.slice(openingBraceIndex + 1);

        // Find function end to insert catch block
        let openBraces = 1;
        let i = openingBraceIndex + 1;

        while (i < content.length && openBraces > 0) {
          if (content[i] === '{') {
            openBraces++;
          } else if (content[i] === '}') {
            openBraces--;
          }
          i++;
        }

        // Insert catch block before the closing brace
        if (i > 0) {
          content =
            content.slice(0, i - 1) +
            '\n    } catch (error) {\n' +
            '        console.error(`Error in ${fn.name}:`, error);\n' +
            "        throw new AppError(`Failed to execute ${fn.name}: ${error.message}`, 'OPERATION_FAILED');\n" +
            '    }' +
            content.slice(i - 1);
        }
      }
    }
  }

  // Replace direct fetch calls with safeFetch if needed
  if (analysis.fetchUsage && !analysis.hasFetchErrorHandling) {
    // Import safeFetch
    if (!content.includes('safeFetch')) {
      const lines = content.split('\n');
      let lastImportIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(') || lines[i].includes('import ')) {
          lastImportIndex = i;
        }
      }

      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, "const safeFetch = require('../utils/safeFetch');");
        content = lines.join('\n');
      } else {
        content = "const safeFetch = require('../utils/safeFetch');\n\n" + content;
      }
    }

    // Replace fetch with safeFetch
    content = content.replace(/fetch\(/g, 'safeFetch(');
  }

  return content;
}

/**
 * Main function to analyze and improve error handling
 * @param {string} directory - Directory to analyze
 */
async function main(directory) {
  const spinner = ora('Analyzing files for error handling issues...').start();

  try {
    // Find JS files
    const files = findJsFiles(directory);
    spinner.text = `Analyzing ${files.length} JavaScript files...`;

    // Analyze each file
    const analyses = [];
    for (const file of files) {
      const analysis = analyzeErrorHandling(file);
      analyses.push(analysis);
    }

    // Filter files with error handling issues
    const filesWithIssues = analyses.filter(a => a.missingErrorHandling);
    spinner.succeed(`Found ${filesWithIssues.length} files with error handling issues`);

    if (filesWithIssues.length === 0) {
      console.log(chalk.green('No error handling issues found - good job!'));
      return;
    }

    // Show files with issues
    console.log(chalk.blue('\n=== Files with Error Handling Issues ==='));

    for (const [index, file] of filesWithIssues.entries()) {
      console.log(chalk.yellow(`\n${index + 1}. ${file.fileName}`));
      console.log(`   Path: ${file.filePath}`);

      if (file.asyncUsage && !file.hasPromiseCatch) {
        console.log(chalk.red('   ✗ Uses async/Promise without error handling'));
      }

      if (file.fetchUsage && !file.hasFetchErrorHandling) {
        console.log(chalk.red('   ✗ Uses fetch without error handling'));
      }

      if (file.functionsWithoutErrorHandling.length > 0) {
        console.log(
          chalk.red(
            `   ✗ ${file.functionsWithoutErrorHandling.length} async functions without error handling:`
          )
        );
        file.functionsWithoutErrorHandling.forEach(fn => {
          console.log(`     - ${fn.name}`);
        });
      }
    }

    // Show improvement suggestions
    console.log(chalk.blue('\n=== Error Handling Recommendations ==='));

    console.log(chalk.cyan('\n1. Add core error handling utilities:'));
    console.log('   Create a custom error classes file:');
    console.log(chalk.gray('   // core/errors.js'));
    console.log(errorPatterns.customErrors.split('\n').slice(0, 10).join('\n') + '\n   // ...');

    console.log(chalk.cyan('\n2. Add a central error handler:'));
    console.log(chalk.gray('   // middleware/errorHandler.js'));
    console.log(errorPatterns.asyncHandler.split('\n').slice(0, 10).join('\n') + '\n   // ...');

    // Generate example improvement for the first file
    if (filesWithIssues.length > 0) {
      const exampleFile = filesWithIssues[0];
      console.log(chalk.cyan(`\n3. Example improvements for ${exampleFile.fileName}:`));

      const improvedContent = generateImprovedFile(exampleFile.filePath, exampleFile);
      console.log(chalk.gray('\n   // Improved version:'));
      console.log(improvedContent.split('\n').slice(0, 30).join('\n') + '\n   // ...');
    }

    console.log(chalk.yellow('\nTo implement these improvements:'));
    console.log('1. Create the core error utilities (errors.js, asyncHandler.js)');
    console.log('2. Add try/catch blocks to all async functions');
    console.log('3. Use custom error types for better error identification');
    console.log('4. Use async handler wrappers for Express routes');
    console.log('5. Add central error logging and handling');
  } catch (error) {
    spinner.fail(`Analysis failed: ${error.message}`);
    console.error(error);
  }
}

// Get the content variable in scope
let content = '';

// Run the script
const baseDir = path.resolve(__dirname, '..', '..');
main(baseDir).catch(console.error);
