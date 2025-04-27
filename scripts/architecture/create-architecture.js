/**
 * Architecture Creation Script
 * Generates architectural guidelines and enforces separation of concerns
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Directory structure with clear separation of concerns
const directoryStructure = {
  src: {
    api: {
      controllers: {},
      middlewares: {},
      routes: {},
      validators: {}
    },
    components: {
      common: {},
      forms: {},
      layout: {},
      media: {},
      upload: {
        batch: {}
      }
    },
    core: {
      auth: {},
      cache: {},
      config: {},
      errors: {},
      events: {},
      logger: {}
    },
    models: {},
    services: {
      blockchain: {},
      content: {},
      ipfs: {},
      media: {},
      upload: {},
      wallet: {}
    },
    utils: {
      formatters: {},
      validators: {},
      network: {}
    }
  },
  tests: {
    unit: {},
    integration: {},
    e2e: {}
  }
};

// Templates for each type of file
const templates = {
  service: `// Template Service
class TemplateService {
  constructor(dependencies = {}) {
    // Inject dependencies - better testability and separation
    this.logger = dependencies.logger || console;
    this.config = dependencies.config || {};
    this.events = dependencies.events || { emit: () => {} };
  }

  async performOperation(data) {
    try {
      this.logger.info('Starting operation');
      // Implementation
      this.events.emit('operation:complete', { success: true });
      return { success: true };
    } catch (error) {
      this.logger.error('Operation failed', { error });
      this.events.emit('operation:error', { error });
      throw error;
    }
  }
}

module.exports = TemplateService;
`,

  controller: `// Template Controller
class TemplateController {
  constructor(service) {
    this.service = service;
    // Bind methods to ensure 'this' context
    this.handleRequest = this.handleRequest.bind(this);
  }

  async handleRequest(req, res, next) {
    try {
      const result = await this.service.performOperation(req.body);
      res.json(result);
    } catch (error) {
      next(error); // Pass to error middleware
    }
  }
}

module.exports = TemplateController;
`,

  errorHandler: `// Error Handler
const errorTypes = require('./error-types');

/**
 * Central error handler middleware
 */
function errorHandler(err, req, res, next) {
  const error = {
    message: err.message || 'An unexpected error occurred',
    code: err.code || 'INTERNAL_ERROR',
    status: err.status || 500
  };

  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    error.stack = err.stack;
  }

  // Log error
  console.error('[Error]', error);

  // Send response
  res.status(error.status).json({ error });
}

module.exports = errorHandler;
`,

  errorTypes: `// Error Types
class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class NetworkError extends AppError {
  constructor(message, details) {
    super(message || 'Network operation failed', 'NETWORK_ERROR', 503);
    this.details = details;
    this.retryable = true;
  }
}

class ValidationError extends AppError {
  constructor(message, fields) {
    super(message || 'Validation failed', 'VALIDATION_ERROR', 400);
    this.fields = fields;
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message || 'Not authorized', 'AUTH_ERROR', 403);
  }
}

module.exports = {
  AppError,
  NetworkError,
  ValidationError,
  AuthorizationError
};
`,

  cacheService: `// Cache Service
const NodeCache = require('node-cache');

class CacheService {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || 300, // Default 5 min
      checkperiod: options.checkPeriod || 60, // Check every minute
      useClones: false // Store references
    });

    this.namespace = options.namespace || '';
    this.logger = options.logger || console;

    // Track hits and misses for optimization
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  /**
   * Generate namespaced key
   */
  _key(key) {
    return this.namespace ? \`\${this.namespace}:\${key}\` : key;
  }

  /**
   * Get item from cache
   */
  get(key) {
    const value = this.cache.get(this._key(key));

    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Get item from cache or compute it
   */
  async getOrSet(key, producer, ttl) {
    const cachedValue = this.get(key);

    if (cachedValue !== null) {
      return cachedValue;
    }

    try {
      const value = typeof producer === 'function' ? await producer() : producer;
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error('Cache producer error', { key, error });
      throw error;
    }
  }

  /**
   * Set item in cache
   */
  set(key, value, ttl) {
    this.stats.sets++;
    return this.cache.set(this._key(key), value, ttl);
  }

  /**
   * Remove item from cache
   */
  delete(key) {
    return this.cache.del(this._key(key));
  }

  /**
   * Clear entire cache or namespace
   */
  clear() {
    if (this.namespace) {
      // Clear only keys in this namespace
      const keys = this.cache.keys();
      const namespacedKeys = keys.filter(key =>
        key.startsWith(\`\${this.namespace}:\`));

      this.cache.del(namespacedKeys);
      return namespacedKeys.length;
    }

    // Clear all keys
    this.cache.flushAll();
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();

    return {
      ...this.stats,
      keys: this.cache.keys().length,
      memory: cacheStats.ksize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
    };
  }
}

module.exports = CacheService;
`
};

/**
 * Create directory structure
 * @param {string} basePath - Base directory path
 * @param {Object} structure - Directory structure object
 */
function createDirectoryStructure(basePath, structure) {
  const spinner = ora('Creating directory structure...').start();

  try {
    // Create each directory recursively
    createDirectoriesRecursively(basePath, structure);
    spinner.succeed('Directory structure created successfully');
  } catch (error) {
    spinner.fail(`Failed to create directory structure: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Recursively create directories
 * @param {string} currentPath - Current directory path
 * @param {Object} structure - Directory structure object
 */
function createDirectoriesRecursively(currentPath, structure) {
  // Create the current directory if it doesn't exist
  if (!fs.existsSync(currentPath)) {
    fs.mkdirSync(currentPath, { recursive: true });
  }

  // Create subdirectories
  for (const [name, content] of Object.entries(structure)) {
    const dirPath = path.join(currentPath, name);

    // Create directory
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // If there are subdirectories, create them recursively
    if (content && typeof content === 'object' && Object.keys(content).length > 0) {
      createDirectoriesRecursively(dirPath, content);
    }
  }
}

/**
 * Create template files
 * @param {string} basePath - Base directory path
 */
function createTemplateFiles(basePath) {
  const spinner = ora('Creating template files...').start();

  try {
    // Service template
    const servicePath = path.join(basePath, 'src', 'services', 'TemplateService.js');
    fs.writeFileSync(servicePath, templates.service);

    // Controller template
    const controllerPath = path.join(
      basePath,
      'src',
      'api',
      'controllers',
      'TemplateController.js'
    );
    fs.writeFileSync(controllerPath, templates.controller);

    // Error handler
    const errorHandlerPath = path.join(basePath, 'src', 'core', 'errors', 'error-handler.js');
    fs.writeFileSync(errorHandlerPath, templates.errorHandler);

    // Error types
    const errorTypesPath = path.join(basePath, 'src', 'core', 'errors', 'error-types.js');
    fs.writeFileSync(errorTypesPath, templates.errorTypes);

    // Cache service
    const cachePath = path.join(basePath, 'src', 'core', 'cache', 'CacheService.js');
    fs.writeFileSync(cachePath, templates.cacheService);

    spinner.succeed('Template files created successfully');
  } catch (error) {
    spinner.fail(`Failed to create template files: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create architectural guide file
 * @param {string} basePath - Base directory path
 */
function createArchitectureGuide(basePath) {
  const spinner = ora('Creating architecture guide...').start();

  try {
    const guidePath = path.join(basePath, 'ARCHITECTURE.md');

    const guide = `# Architecture Guide

## Directory Structure

Our codebase follows a clear separation of concerns using the following structure:

\`\`\`
src/
├── api/                 # API layer
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── routes/          # Route definitions
│   └── validators/      # Request validation
├── components/          # UI Components
│   ├── common/          # Shared components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── media/           # Media components
│   └── upload/          # Upload components
├── core/                # Core application services
│   ├── auth/            # Authentication
│   ├── cache/           # Caching mechanism
│   ├── config/          # Configuration
│   ├── errors/          # Error handling
│   ├── events/          # Event system
│   └── logger/          # Logging
├── models/              # Data models
├── services/            # Business logic
│   ├── blockchain/      # Blockchain interactions
│   ├── content/         # Content management
│   ├── ipfs/            # IPFS storage
│   ├── media/           # Media processing
│   ├── upload/          # Upload management
│   └── wallet/          # Wallet services
└── utils/               # Utility functions
    ├── formatters/      # Data formatting
    ├── validators/      # Data validation
    └── network/         # Network utilities
\`\`\`

## Architectural Principles

### 1. Separation of Concerns

Each module has a single responsibility and should not be concerned with the implementation details of other modules.

### 2. Dependency Injection

Components receive their dependencies through their constructors, making them more testable and decoupled.

Example:

\`\`\`javascript
// Good - Dependencies injected
class UserService {
  constructor(userRepository, logger) {
    this.userRepository = userRepository;
    this.logger = logger;
  }
}

// Bad - Hard-coded dependencies
class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.logger = new Logger();
  }
}
\`\`\`

### 3. Error Handling

All errors should be centralized and categorized properly. Use custom error types from \`src/core/errors/error-types.js\`.

### 4. Caching Strategy

- Use the CacheService for all caching needs
- Set appropriate TTLs based on data volatility
- Use namespaced caches for different services
- Implement cache invalidation when data changes

### 5. Network Resilience

- Always use timeouts on network requests
- Implement retry logic with exponential backoff
- Handle partial failures gracefully
- Use circuit breakers for failing services

## Best Practices

### Services

- Services contain business logic
- They should not know about HTTP concepts
- Use dependency injection for all dependencies
- Return domain objects, not framework-specific responses

### Controllers

- Controllers handle HTTP requests and responses
- They should be thin and delegate to services
- Handle request validation and formatting
- Consistent error handling with next(error)

### Models

- Represent domain entities
- Include validation logic
- Keep business rules with the data they apply to

### Utilities

- Small, focused, pure functions
- Well-tested and reusable
- No side effects

## Testing Strategy

- **Unit Tests**: Test each component in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user flows

## Documentation Guidelines

- Each module should have a README.md
- Use JSDoc for all public methods
- Keep documentation close to the code it documents
`;

    fs.writeFileSync(guidePath, guide);
    spinner.succeed('Architecture guide created successfully');
  } catch (error) {
    spinner.fail(`Failed to create architecture guide: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('=== Creating Architecture Framework ==='));

  const basePath = path.resolve(__dirname, '..', '..');

  console.log(`Base path: ${basePath}`);

  // Create directory structure
  createDirectoryStructure(basePath, directoryStructure);

  // Create template files
  createTemplateFiles(basePath);

  // Create architecture guide
  createArchitectureGuide(basePath);

  console.log(chalk.green.bold('Architecture setup complete!'));
  console.log(
    'Review the ARCHITECTURE.md file for guidelines on maintaining separation of concerns.'
  );
}

// Run the script
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});
