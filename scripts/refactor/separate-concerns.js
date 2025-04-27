/**
 * Separation of Concerns Refactoring Script
 * Helps refactor code to better separate responsibilities
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Core structure patterns for better separation
const patterns = {
  // Core module pattern
  coreModule: `/**
 * @module {name}
 * @description {description}
 */

// Dependencies - injected for better testability
const dependencies = {};

/**
 * Initialize module with dependencies
 * @param {Object} deps - Dependencies object
 */
function init(deps = {}) {
  // Store injected dependencies
  Object.assign(dependencies, deps);
}

/**
 * The main functionality of this module
 * @param {Object} options - Options for the operation
 * @returns {Promise<Object>} Result of the operation
 */
async function execute(options = {}) {
  try {
    // Implementation here
    return { success: true };
  } catch (error) {
    // Proper error handling with specific error types
    const enhancedError = new Error(\`Operation failed: \${error.message}\`);
    enhancedError.originalError = error;
    enhancedError.code = 'EXECUTION_FAILED';
    throw enhancedError;
  }
}

// Export public API only
module.exports = {
  init,
  execute
};`,

  // API Layer (Controllers)
  apiLayer: `/**
 * @module {name}Controller
 * @description API layer for {name} functionality
 */

// Import service layer - separation of API from business logic
const {name}Service = require('../services/{name}Service');

/**
 * Handle {name} request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
async function handle{name}Request(req, res, next) {
  try {
    // Extract parameters from request
    const params = extractParams(req);

    // Validate input
    validateInput(params);

    // Delegate to service layer
    const result = await {name}Service.process(params);

    // Send response
    res.json(result);
  } catch (error) {
    // Pass to error middleware
    next(error);
  }
}

// Helper functions
function extractParams(req) {
  // Extract and normalize parameters from request
  return {
    ...req.body,
    ...req.query,
    ...req.params
  };
}

function validateInput(params) {
  // Input validation logic
  if (!params.id) {
    const error = new Error('Missing required parameter: id');
    error.statusCode = 400;
    throw error;
  }
}

module.exports = {
  handle{name}Request
};`,

  // Service Layer
  serviceLayer: `/**
 * @module {name}Service
 * @description Business logic for {name} functionality
 */

// Import data layer - separation of business logic from data access
const {name}Repository = require('../repositories/{name}Repository');
// Import event system - for decoupled components communication
const eventBus = require('../core/eventBus');
// Import logging - central logging system
const logger = require('../core/logger');

/**
 * Process {name} request
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Result
 */
async function process(params) {
  try {
    logger.info('{name}Service processing request', { params });

    // Use repository layer for data access
    const data = await {name}Repository.getData(params.id);

    // Apply business logic
    const result = transformData(data);

    // Emit event for other components
    eventBus.emit('{name}:processed', { id: params.id, result });

    return result;
  } catch (error) {
    logger.error('Error in {name}Service', { error, params });

    // Re-throw with appropriate error type
    if (error.code === 'NOT_FOUND') {
      const notFoundError = new Error(\`{name} not found: \${params.id}\`);
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    throw error;
  }
}

// Pure function for business logic
function transformData(data) {
  // Transform data according to business rules
  return {
    ...data,
    processedAt: new Date().toISOString()
  };
}

module.exports = {
  process
};`,

  // Data Layer (Repository)
  dataLayer: `/**
 * @module {name}Repository
 * @description Data access layer for {name}
 */

// Import database connection
const db = require('../core/database');
// Import caching layer
const cache = require('../core/cache');

/**
 * Get {name} data by ID
 * @param {string} id - {name} ID
 * @returns {Promise<Object>} {name} data
 */
async function getData(id) {
  // Try cache first
  const cacheKey = \`{name}:\${id}\`;
  const cachedData = await cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  // Not in cache, query database
  const data = await db.query(
    'SELECT * FROM {name}s WHERE id = ?',
    [id]
  );

  if (!data) {
    const error = new Error(\`{name} not found: \${id}\`);
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Store in cache
  await cache.set(cacheKey, data, 3600); // 1 hour TTL

  return data;
}

/**
 * Save {name} data
 * @param {Object} data - {name} data
 * @returns {Promise<Object>} Saved {name}
 */
async function saveData(data) {
  // Save to database
  const result = await db.query(
    'INSERT INTO {name}s SET ?',
    [data]
  );

  // Invalidate cache
  await cache.delete(\`{name}:\${data.id}\`);

  return { ...data, id: result.insertId };
}

module.exports = {
  getData,
  saveData
};`,

  // UI Layer (separated from API and business logic)
  uiLayer: `/**
 * @module {name}UI
 * @description UI handlers for {name} functionality
 */

// Import API client - separates UI from direct API calls
const apiClient = require('../api/apiClient');

/**
 * Initialize UI handlers
 */
function init() {
  // Attach event listeners
  document.getElementById('{name}-form')?.addEventListener('submit', handleSubmit);
  document.getElementById('{name}-load')?.addEventListener('click', handleLoad);
}

/**
 * Handle form submission
 * @param {Event} event - Submit event
 */
async function handleSubmit(event) {
  event.preventDefault();

  try {
    // Show loading state
    showLoading(true);

    // Get form data
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    // Call API through client
    const result = await apiClient.{name}.create(data);

    // Update UI
    updateUI(result);
    showMessage('Success!', 'success');
  } catch (error) {
    // Show error in UI
    showMessage(error.message, 'error');
    console.error('Error submitting form:', error);
  } finally {
    // Hide loading state
    showLoading(false);
  }
}

/**
 * Handle load button click
 */
async function handleLoad() {
  try {
    // Show loading state
    showLoading(true);

    // Get ID from input
    const id = document.getElementById('{name}-id').value;

    // Call API through client
    const result = await apiClient.{name}.get(id);

    // Update UI
    updateUI(result);
  } catch (error) {
    // Show error in UI
    showMessage(error.message, 'error');
    console.error('Error loading data:', error);
  } finally {
    // Hide loading state
    showLoading(false);
  }
}

// Helper functions
function updateUI(data) {
  // Update DOM with received data
  const container = document.getElementById('{name}-container');
  container.innerHTML = \`
    <div class="{name}-item">
      <h3>\${data.name}</h3>
      <p>\${data.description}</p>
    </div>
  \`;
}

function showLoading(isLoading) {
  // Update loading state in UI
  document.getElementById('loading').style.display = isLoading ? 'block' : 'none';
}

function showMessage(message, type) {
  // Show message in UI
  const messageElement = document.getElementById('message');
  messageElement.textContent = message;
  messageElement.className = type;
  messageElement.style.display = 'block';

  // Hide after 3 seconds
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, 3000);
}

// Export public API
module.exports = {
  init
};`
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
 * Analyze file for separation of concerns issues
 * @param {string} filePath - Path to file
 * @returns {Object} Analysis results
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Check for mixing of concerns
  const hasDomManipulation =
    /document\.getElementById|querySelector|innerHTML|addEventListener/.test(content);
  const hasApiCalls = /fetch\(|\.post\(|\.get\(|axios|XMLHttpRequest/.test(content);
  const hasBusinessLogic = /function\s+calculate|function\s+process|function\s+transform/.test(
    content
  );
  const hasDataAccess = /database|db\.|connection|query\(/.test(content);

  // Count lines of code
  const lines = content.split('\n').length;

  // Estimate function complexity
  const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*{/g) || [];
  const functionCount = functionMatches.length;

  // Get functions with mixed responsibilities
  const mixedFunctions = [];

  // Simple function extraction for analysis
  const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/g;
  let match;
  while ((match = functionPattern.exec(content)) !== null) {
    const functionName = match[1];
    const functionBody = match[2];

    const functionHasDom = /document\.getElementById|querySelector|innerHTML|addEventListener/.test(
      functionBody
    );
    const functionHasApi = /fetch\(|\.post\(|\.get\(|axios|XMLHttpRequest/.test(functionBody);
    const functionHasLogic = /calculate|process|transform|\.map\(|\.filter\(|\.reduce\(/.test(
      functionBody
    );
    const functionHasData = /database|db\.|connection|query\(/.test(functionBody);

    // Count mixed concerns in this function
    const mixedConcernsCount = [
      functionHasDom,
      functionHasApi,
      functionHasLogic,
      functionHasData
    ].filter(Boolean).length;

    if (mixedConcernsCount >= 2) {
      mixedFunctions.push({
        name: functionName,
        mixedConcerns: {
          ui: functionHasDom,
          api: functionHasApi,
          logic: functionHasLogic,
          data: functionHasData
        }
      });
    }
  }

  return {
    fileName,
    filePath,
    size: lines,
    concerns: {
      ui: hasDomManipulation,
      api: hasApiCalls,
      businessLogic: hasBusinessLogic,
      dataAccess: hasDataAccess
    },
    mixedConcernsCount: [hasDomManipulation, hasApiCalls, hasBusinessLogic, hasDataAccess].filter(
      Boolean
    ).length,
    functionCount,
    mixedFunctions
  };
}

/**
 * Generate refactoring plan for a file
 * @param {Object} analysis - File analysis
 * @returns {Object} Refactoring plan
 */
function generateRefactoringPlan(analysis) {
  const plan = {
    original: analysis.filePath,
    needsRefactoring: analysis.mixedConcernsCount > 1,
    suggestedFiles: []
  };

  if (!plan.needsRefactoring) {
    return plan;
  }

  const baseName = path.basename(analysis.filePath, '.js');
  const dirName = path.dirname(analysis.filePath);

  // Suggest files based on concerns
  if (analysis.concerns.ui) {
    plan.suggestedFiles.push({
      name: `${baseName}UI.js`,
      path: path.join(dirName, `${baseName}UI.js`),
      type: 'uiLayer',
      replacements: {
        name: baseName
      },
      description: 'Handles DOM manipulation and UI events'
    });
  }

  if (analysis.concerns.api) {
    plan.suggestedFiles.push({
      name: `${baseName}Controller.js`,
      path: path.join(dirName, `${baseName}Controller.js`),
      type: 'apiLayer',
      replacements: {
        name: baseName
      },
      description: 'Handles API requests and responses'
    });
  }

  if (analysis.concerns.businessLogic) {
    plan.suggestedFiles.push({
      name: `${baseName}Service.js`,
      path: path.join(dirName, `${baseName}Service.js`),
      type: 'serviceLayer',
      replacements: {
        name: baseName
      },
      description: 'Handles business logic'
    });
  }

  if (analysis.concerns.dataAccess) {
    plan.suggestedFiles.push({
      name: `${baseName}Repository.js`,
      path: path.join(dirName, `${baseName}Repository.js`),
      type: 'dataLayer',
      replacements: {
        name: baseName
      },
      description: 'Handles data access'
    });
  }

  return plan;
}

/**
 * Generate template file content
 * @param {string} templateType - Type of template
 * @param {Object} replacements - Value replacements
 * @returns {string} Generated content
 */
function generateTemplate(templateType, replacements) {
  let template = patterns[templateType];

  // Apply replacements
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{${key}}`, 'g');
    template = template.replace(regex, value);
  }

  return template;
}

/**
 * Main function to analyze and show refactoring suggestions
 * @param {string} directory - Directory to analyze
 */
async function main(directory) {
  const spinner = ora('Analyzing files for separation of concerns...').start();

  try {
    // Find JS files
    const files = findJsFiles(directory);
    spinner.text = `Analyzing ${files.length} JavaScript files...`;

    // Analyze each file
    const analyses = [];
    for (const file of files) {
      const analysis = analyzeFile(file);
      analyses.push(analysis);
    }

    // Filter files with mixed concerns
    const filesWithMixedConcerns = analyses.filter(a => a.mixedConcernsCount > 1);
    spinner.succeed(`Found ${filesWithMixedConcerns.length} files with mixed concerns`);

    if (filesWithMixedConcerns.length === 0) {
      console.log(chalk.green('No files with mixed concerns found - good job!'));
      return;
    }

    // Sort by mixed concerns count
    filesWithMixedConcerns.sort((a, b) => b.mixedConcernsCount - a.mixedConcernsCount);

    // Generate refactoring plans
    console.log(chalk.blue('\n=== Files with Mixed Concerns ==='));

    for (const [index, file] of filesWithMixedConcerns.entries()) {
      const plan = generateRefactoringPlan(file);

      console.log(
        chalk.yellow(`\n${index + 1}. ${file.fileName} (${file.mixedConcernsCount} mixed concerns)`)
      );
      console.log(`   Path: ${file.filePath}`);
      console.log(`   Lines: ${file.size}`);
      console.log(
        `   Concerns: ${Object.entries(file.concerns)
          .filter(([_, value]) => value)
          .map(([key, _]) => key)
          .join(', ')}`
      );

      if (file.mixedFunctions.length > 0) {
        console.log(chalk.cyan('   Mixed functions:'));
        file.mixedFunctions.forEach(func => {
          console.log(
            `     - ${func.name} (${Object.entries(func.mixedConcerns)
              .filter(([_, value]) => value)
              .map(([key, _]) => key)
              .join(', ')})`
          );
        });
      }

      console.log(chalk.cyan('\n   Suggested refactoring:'));
      plan.suggestedFiles.forEach(suggestion => {
        console.log(`     - ${suggestion.name}: ${suggestion.description}`);
      });
    }

    // Show example refactoring
    if (filesWithMixedConcerns.length > 0) {
      const exampleFile = filesWithMixedConcerns[0];
      const examplePlan = generateRefactoringPlan(exampleFile);

      console.log(chalk.blue('\n=== Example Refactoring for:', exampleFile.fileName, '==='));

      examplePlan.suggestedFiles.forEach(suggestion => {
        console.log(chalk.cyan(`\n// ${suggestion.name}:`));
        console.log(
          generateTemplate(suggestion.type, suggestion.replacements).slice(0, 500) + '...'
        );
      });

      // Ask if user wants to create example files
      console.log(
        chalk.yellow(
          '\nTo implement this refactoring, create the suggested files and move the corresponding functionality.'
        )
      );
      console.log(chalk.yellow('Remember to properly handle dependencies between the files.'));
      console.log(chalk.yellow('Example directory structure:'));
      console.log(`
src/
├── controllers/       # API layer
│   └── ${exampleFile.fileName.replace('.js', 'Controller.js')}
├── services/          # Business logic
│   └── ${exampleFile.fileName.replace('.js', 'Service.js')}
├── repositories/      # Data access
│   └── ${exampleFile.fileName.replace('.js', 'Repository.js')}
└── ui/                # User interface
    └── ${exampleFile.fileName.replace('.js', 'UI.js')}
      `);
    }
  } catch (error) {
    spinner.fail(`Analysis failed: ${error.message}`);
    console.error(error);
  }
}

// Run the script
const baseDir = path.resolve(__dirname, '..', '..');
main(baseDir).catch(console.error);
