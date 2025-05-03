/**
 * Code Structure Refactoring Script
 * Improves separation of concerns in JavaScript files
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Core structure for better separation of concerns
const moduleTemplate = {
  // Core module pattern with clear separation
  core: `
/**
 * @module {name}
 * @description {description}
 */

// Private variables
const state = {
  initialized: false,
  config: null
};

/**
 * Initialize the module
 * @param {Object} config - Configuration options
 * @returns {Promise<boolean>} Initialization result
 */
async function init(config = {}) {
  if (state.initialized) return true;

  try {
    state.config = config;
    state.initialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize {name}:', error);
    return false;
  }
}

/**
 * Get module information
 * @returns {Object} Module info
 */
function getInfo() {
  return {
    name: '{name}',
    version: '1.0.0',
    initialized: state.initialized
  };
}

// Export public API only
module.exports = {
  init,
  getInfo,
  // Add other public methods here
};
`,

  // Service pattern with dependency injection
  service: `
/**
 * @class {name}Service
 * @description {description}
 */
class {name}Service {
  /**
   * Create a new {name}Service instance
   * @param {Object} dependencies - Injected dependencies
   */
  constructor(dependencies = {}) {
    // Inject dependencies - improves testability and separation of concerns
    this.logger = dependencies.logger || console;
    this.config = dependencies.config || {};
    this.events = dependencies.events || { emit: () => {} };

    // Private state
    this._state = {
      initialized: false
    };
  }

  /**
   * Initialize the service
   * @returns {Promise<boolean>} Initialization result
   */
  async init() {
    if (this._state.initialized) return true;

    try {
      // Initialization logic here
      this._state.initialized = true;
      this.logger.info('{name}Service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize {name}Service:', error);
      this.events.emit('service:error', { service: '{name}', error });
      return false;
    }
  }

  /**
   * Example method with proper error handling
   * @param {Object} data - Input data
   * @returns {Promise<Object>} Result
   */
  async process(data) {
    if (!this._state.initialized) {
      throw new Error('{name}Service not initialized');
    }

    try {
      // Processing logic
      this.logger.debug('Processing data', { data });

      // Return result
      return { success: true };
    } catch (error) {
      this.logger.error('Error in {name}Service.process:', error);
      this.events.emit('service:error', {
        service: '{name}',
        method: 'process',
        error
      });
      throw error; // Re-throw for caller to handle
    }
  }
}

module.exports = {name}Service;
`,

  // Controller pattern
  controller: `
/**
 * @class {name}Controller
 * @description {description}
 */
class {name}Controller {
  /**
   * Create a new {name}Controller instance
   * @param {Object} services - Required services
   */
  constructor(services = {}) {
    // Require services
    this.service = services.{lowerName}Service;
    if (!this.service) {
      throw new Error('{name}Service is required');
    }

    // Bind methods to ensure 'this' context
    this.handleRequest = this.handleRequest.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Handle request
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async handleRequest(req, res, next) {
    try {
      const result = await this.service.process(req.body);
      res.json(result);
    } catch (error) {
      this.handleError(error, req, res, next);
    }
  }

  /**
   * Handle controller-specific errors
   * @private
   */
  handleError(error, req, res, next) {
    // Controller-specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        details: error.details
      });
    }

    // Pass to global error handler
    next(error);
  }
}

module.exports = {name}Controller;
`
};

/**
 * Analyze JavaScript files for refactoring
 * @param {string} directory - Directory to analyze
 * @returns {Array} Files needing refactoring
 */
function analyzeFiles(directory) {
  const spinner = ora('Analyzing JavaScript files for refactoring...').start();
  const jsFiles = [];

  try {
    // Find all JS files recursively
    const files = findJSFiles(directory);

    // Analyze each file
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = analyzeFileIssues(content, file);

      if (issues.score > 0) {
        jsFiles.push({
          path: file,
          relativePath: path.relative(directory, file),
          issues,
          score: issues.score
        });
      }
    }

    // Sort by issue score
    jsFiles.sort((a, b) => b.score - a.score);

    spinner.succeed(
      `Analyzed ${files.length} files, found ${jsFiles.length} candidates for refactoring`
    );
    return jsFiles;
  } catch (error) {
    spinner.fail(`Analysis failed: ${error.message}`);
    throw error;
  }
}

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
 * Analyze file for potential issues
 * @param {string} content - File content
 * @param {string} filePath - File path
 * @returns {Object} Analysis result
 */
function analyzeFileIssues(content, filePath) {
  const issues = {
    score: 0,
    mixedConcerns: false,
    missingErrorHandling: false,
    hardcodedDependencies: false,
    complexFunctions: false,
    detailedIssues: []
  };

  // Check for mixed concerns
  if (
    content.includes('fetch(') &&
    (content.includes('getElementById') || content.includes('querySelector'))
  ) {
    issues.mixedConcerns = true;
    issues.score += 30;
    issues.detailedIssues.push('Mixed API calls with DOM manipulation');
  }

  // Check for missing error handling
  const promiseCount = (content.match(/Promise|async|await/g) || []).length;
  const trycatchCount = (content.match(/try\s*{|catch\s*\(/g) || []).length;

  if (promiseCount > 0 && trycatchCount === 0) {
    issues.missingErrorHandling = true;
    issues.score += 40;
    issues.detailedIssues.push('Using async code without error handling');
  }

  // Check for hardcoded dependencies
  if (content.match(/new \w+\(/g)) {
    issues.hardcodedDependencies = true;
    issues.score += 20;
    issues.detailedIssues.push('Hardcoded dependencies found');
  }

  // Check for complex functions
  const lines = content.split('\n');
  let bracketLevel = 0;
  let functionLines = 0;
  let inFunction = false;

  for (const line of lines) {
    if (line.includes('function') || line.match(/\w+\s*\([^)]*\)\s*{/)) {
      inFunction = true;
    }

    if (inFunction) {
      functionLines++;

      bracketLevel += (line.match(/{/g) || []).length;
      bracketLevel -= (line.match(/}/g) || []).length;

      if (bracketLevel === 0 && functionLines > 30) {
        issues.complexFunctions = true;
        issues.score += 25;
        issues.detailedIssues.push(`Complex function found (${functionLines} lines)`);
        inFunction = false;
        functionLines = 0;
      }

      if (bracketLevel === 0) {
        inFunction = false;
        functionLines = 0;
      }
    }
  }

  return issues;
}

/**
 * Suggest refactoring for a file
 * @param {Object} file - File to refactor
 * @returns {Object} Refactoring suggestion
 */
function suggestRefactoring(file) {
  const suggestion = {
    original: file.path,
    suggestions: []
  };

  const filename = path.basename(file.path, '.js');

  // Check which patterns might be appropriate
  if (file.issues.mixedConcerns) {
    suggestion.suggestions.push({
      type: 'split',
      description: 'Split into service and UI components',
      files: [
        {
          path: path.join(path.dirname(file.path), `${filename}Service.js`),
          template: 'service',
          replacements: {
            name: filename,
            lowerName: filename.charAt(0).toLowerCase() + filename.slice(1),
            description: 'Service for handling data operations'
          }
        },
        {
          path: path.join(path.dirname(file.path), `${filename}UI.js`),
          description: 'UI component for handling DOM manipulation'
        }
      ]
    });
  }

  if (file.issues.hardcodedDependencies) {
    suggestion.suggestions.push({
      type: 'dependency-injection',
      description: 'Refactor to use dependency injection',
      files: [
        {
          path: path.join(path.dirname(file.path), `${filename}.js`),
          template: 'service',
          replacements: {
            name: filename,
            lowerName: filename.charAt(0).toLowerCase() + filename.slice(1),
            description: 'Refactored service with dependency injection'
          }
        }
      ]
    });
  }

  if (file.issues.missingErrorHandling) {
    suggestion.suggestions.push({
      type: 'error-handling',
      description: 'Add proper error handling',
      fixInPlace: true
    });
  }

  if (file.issues.complexFunctions) {
    suggestion.suggestions.push({
      type: 'simplify',
      description: 'Break down complex functions',
      fixInPlace: true
    });
  }

  return suggestion;
}

/**
 * Show refactoring suggestions
 * @param {Array} files - Files to refactor
 */
function showRefactoringSuggestions(files) {
  console.log(chalk.blue.bold('\n=== Refactoring Suggestions ===\n'));

  files.forEach((file, index) => {
    const suggestion = suggestRefactoring(file);

    console.log(chalk.yellow(`${index + 1}. ${file.relativePath} (Score: ${file.score})`));
    console.log(chalk.gray(`   Issues: ${file.issues.detailedIssues.join(', ')}`));

    suggestion.suggestions.forEach(s => {
      console.log(chalk.green(`   - ${s.description}`));

      if (s.files) {
        s.files.forEach(f => {
          if (f.path !== file.path) {
            console.log(chalk.cyan(`     → Create: ${path.basename(f.path)}`));
          } else {
            console.log(chalk.cyan(`     → Update: ${path.basename(f.path)}`));
          }
        });
      }
    });

    console.log();
  });
}

/**
 * Execute refactoring for a file
 * @param {Object} file - File to refactor
 * @param {Object} suggestion - Refactoring suggestion
 * @returns {boolean} Success
 */
function executeRefactoring(file, suggestion) {
  const spinner = ora(`Refactoring ${file.relativePath}...`).start();

  try {
    for (const s of suggestion.suggestions) {
      if (s.files) {
        for (const f of s.files) {
          if (f.template) {
            // Create file from template
            let template = moduleTemplate[f.template];

            // Apply replacements
            if (f.replacements) {
              for (const [key, value] of Object.entries(f.replacements)) {
                const regex = new RegExp(`{${key}}`, 'g');
                template = template.replace(regex, value);
              }
            }

            // Write file
            fs.writeFileSync(f.path, template);
          }
        }
      }

      if (s.fixInPlace) {
        // Add error handling if needed
        if (s.type === 'error-handling') {
          addErrorHandling(file.path);
        }
      }
    }

    spinner.succeed(`Refactored ${file.relativePath}`);
    return true;
  } catch (error) {
    spinner.fail(`Failed to refactor ${file.relativePath}: ${error.message}`);
    return false;
  }
}

/**
 * Add error handling to a file
 * @param {string} filePath - File path
 */
function addErrorHandling(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find async functions without try/catch
  const asyncFunctions = content.match(/async\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];

  for (const asyncFunc of asyncFunctions) {
    // Check if function already has try/catch
    if (!asyncFunc.includes('try') && !asyncFunc.includes('catch')) {
      // Extract function name and parameters
      const funcNameMatch = asyncFunc.match(/async\s+(\w+)/);
      if (funcNameMatch) {
        const funcName = funcNameMatch[1];

        // Create wrapped function with error handling
        const openBraceIndex = asyncFunc.indexOf('{');
        const closeBraceIndex = asyncFunc.lastIndexOf('}');

        if (openBraceIndex !== -1 && closeBraceIndex !== -1) {
          const funcDeclaration = asyncFunc.substring(0, openBraceIndex + 1);
          const funcBody = asyncFunc.substring(openBraceIndex + 1, closeBraceIndex);

          const wrappedFunc = `${funcDeclaration}
  try {${funcBody}
  } catch (error) {
    console.error('Error in ${funcName}:', error);
    throw error; // Re-throw or handle appropriately
  }
}`;

          // Replace original function with wrapped one
          content = content.replace(asyncFunc, wrappedFunc);
        }
      }
    }
  }

  // Write updated content
  fs.writeFileSync(filePath, content);
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('=== Code Structure Refactoring ==='));

  const basePath = path.resolve(__dirname, '..', '..');
  console.log(`Base path: ${basePath}`);

  // Analyze files for refactoring
  const files = analyzeFiles(basePath);

  if (files.length === 0) {
    console.log(chalk.green('No files need refactoring.'));
    return;
  }

  // Show refactoring suggestions
  showRefactoringSuggestions(files);

  console.log(chalk.blue.bold('\n=== Manual Refactoring Steps ===\n'));
  console.log('1. Identify files with mixed concerns and split them into:');
  console.log('   - Service files (data handling, API calls)');
  console.log('   - UI components (DOM manipulation)');
  console.log('\n2. Apply dependency injection:');
  console.log('   - Replace "new DependencyClass()" with constructor injection');
  console.log('   - Create factory functions for complex object creation');
  console.log('\n3. Add error handling to async functions:');
  console.log('   - Wrap async operations in try/catch blocks');
  console.log('   - Use custom error classes for better error identification');
  console.log('\n4. Simplify complex functions:');
  console.log('   - Extract helper functions for different responsibilities');
  console.log('   - Apply the Single Responsibility Principle');
}

// Run the script
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
