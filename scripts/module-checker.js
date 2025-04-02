#!/usr/bin/env node

/**
 * Module Dependency Checker
 *
 * Scans the project to locate all modules, validate require statements,
 * and check for missing dependencies.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Directories to scan (relative to project root)
const SCAN_DIRS = [
  './',
  './models',
  './controllers',
  './lib',
  './scripts'
];

// File extensions to check
const FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

// Ignored directories
const IGNORED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage'
];

// Mapped modules (for aliases/custom paths)
const MODULE_MAPPINGS = {
  // Add any custom mappings here if needed
  // './models': '../models'
};

/**
 * Find the project root directory
 * @returns {Promise<string>} Path to project root
 */
async function findProjectRoot() {
  try {
    // Try to use git to find the root
    const { stdout } = await execAsync('git rev-parse --show-toplevel');
    return stdout.trim();
  } catch (error) {
    // If git not available, use current directory
    return process.cwd();
  }
}

/**
 * Get all JavaScript files to scan
 * @param {string} rootDir Project root directory
 * @returns {Promise<Array<string>>} List of file paths
 */
async function getFilesToScan(rootDir) {
  const filesToScan = [];

  for (const scanDir of SCAN_DIRS) {
    const dir = path.join(rootDir, scanDir);

    try {
      await scanDirectory(dir, filesToScan);
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Could not scan directory ${dir}: ${error.message}${colors.reset}`);
    }
  }

  return filesToScan;
}

/**
 * Recursively scan a directory for JavaScript files
 * @param {string} dir Directory to scan
 * @param {Array<string>} files Array to collect file paths
 */
async function scanDirectory(dir, files) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip ignored directories
        if (IGNORED_DIRS.includes(entry.name)) continue;

        // Recursively scan subdirectory
        await scanDirectory(fullPath, files);
      } else if (FILE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors for non-existent paths
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Extract required modules from file content
 * @param {string} content File content
 * @returns {Array<string>} Required module paths
 */
function extractRequiredModules(content) {
  const requireRegex = /require\(['"](.*?)['"]\)/g;
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](.*?)['"]/g;

  const modules = new Set();
  let match;

  // Extract require statements
  while ((match = requireRegex.exec(content)) !== null) {
    modules.add(match[1]);
  }

  // Extract import statements
  while ((match = importRegex.exec(content)) !== null) {
    modules.add(match[1]);
  }

  return Array.from(modules);
}

/**
 * Resolve module path to actual file path
 * @param {string} modulePath Module path from require/import
 * @param {string} filePath Path of the file that requires the module
 * @param {string} rootDir Project root directory
 * @returns {string} Resolved file path
 */
function resolveModulePath(modulePath, filePath, rootDir) {
  // Handle built-in Node.js modules
  if (isBuiltinModule(modulePath)) {
    return { path: modulePath, type: 'builtin' };
  }

  // Handle npm packages
  if (!modulePath.startsWith('.') && !modulePath.startsWith('/')) {
    return { path: modulePath, type: 'npm' };
  }

  // Apply any custom module mappings
  for (const [alias, target] of Object.entries(MODULE_MAPPINGS)) {
    if (modulePath.startsWith(alias)) {
      modulePath = modulePath.replace(alias, target);
      break;
    }
  }

  // Handle relative paths
  const fileDir = path.dirname(filePath);
  let resolvedPath = path.resolve(fileDir, modulePath);

  // Try to resolve without extension first
  if (!FILE_EXTENSIONS.some(ext => resolvedPath.endsWith(ext))) {
    // Try to find with each valid extension
    for (const ext of FILE_EXTENSIONS) {
      const pathWithExt = `${resolvedPath}${ext}`;
      if (fs.existsSync(pathWithExt)) {
        resolvedPath = pathWithExt;
        break;
      }
    }

    // Check for index files
    if (!fs.existsSync(resolvedPath)) {
      for (const ext of FILE_EXTENSIONS) {
        const indexPath = path.join(resolvedPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          resolvedPath = indexPath;
          break;
        }
      }
    }
  }

  return { path: resolvedPath, type: 'local' };
}

/**
 * Check if module is a built-in Node.js module
 * @param {string} moduleName Module name
 * @returns {boolean} True if built-in module
 */
function isBuiltinModule(moduleName) {
  const builtins = [
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
    'http2', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
    'process', 'punycode', 'querystring', 'readline', 'repl', 'stream',
    'string_decoder', 'timers', 'tls', 'trace_events', 'tty', 'url', 'util',
    'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
  ];

  return builtins.includes(moduleName);
}

/**
 * Check if module exists
 * @param {Object} moduleInfo Module info with path and type
 * @returns {Promise<boolean>} True if module exists
 */
async function checkModuleExists(moduleInfo) {
  if (moduleInfo.type === 'builtin') {
    return true;
  }

  if (moduleInfo.type === 'npm') {
    try {
      // Try to find the package in node_modules
      // This is simplified and might not catch all cases,
      // but is good enough for basic verification
      const packageJsonPath = path.join(process.cwd(), 'node_modules', moduleInfo.path, 'package.json');
      await fs.access(packageJsonPath);
      return true;
    } catch (error) {
      try {
        // Try to find it as a scoped package
        const parts = moduleInfo.path.split('/');
        if (parts.length > 1 && parts[0].startsWith('@')) {
          const scopedPath = path.join(process.cwd(), 'node_modules', parts[0], parts.slice(1).join('/'), 'package.json');
          await fs.access(scopedPath);
          return true;
        }
      } catch (error) {
        // Try loading the module to see if it exists
        try {
          require.resolve(moduleInfo.path);
          return true;
        } catch (resolveError) {
          return false;
        }
      }
      return false;
    }
  }

  // For local files, check if they exist
  try {
    await fs.access(moduleInfo.path);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main function - scan project and validate module dependencies
 */
async function main() {
  console.log(`${colors.cyan}Module Dependency Checker${colors.reset}\n`);

  try {
    const rootDir = await findProjectRoot();
    console.log(`${colors.blue}Project root:${colors.reset} ${rootDir}\n`);

    const filesToScan = await getFilesToScan(rootDir);
    console.log(`${colors.blue}Found ${filesToScan.length} files to scan${colors.reset}\n`);

    const results = {
      scanned: 0,
      moduleReferences: 0,
      missingModules: 0,
      problematicFiles: []
    };

    for (const file of filesToScan) {
      const relativeFilePath = path.relative(rootDir, file);

      try {
        const content = await fs.readFile(file, 'utf8');
        const requiredModules = extractRequiredModules(content);

        if (requiredModules.length > 0) {
          results.scanned++;
          results.moduleReferences += requiredModules.length;

          // Check each module
          const missingModules = [];

          for (const modulePath of requiredModules) {
            const resolvedModule = resolveModulePath(modulePath, file, rootDir);
            const exists = await checkModuleExists(resolvedModule);

            if (!exists) {
              results.missingModules++;
              missingModules.push({
                module: modulePath,
                resolved: resolvedModule.path,
                type: resolvedModule.type
              });
            }
          }

          // If file has missing modules, add to problematic files
          if (missingModules.length > 0) {
            results.problematicFiles.push({
              file: relativeFilePath,
              missingModules
            });
          }
        }
      } catch (error) {
        console.error(`${colors.red}Error processing file ${relativeFilePath}:${colors.reset}`, error);
      }
    }

    // Print results
    console.log(`${colors.blue}Scan results:${colors.reset}`);
    console.log(`  Files with dependencies: ${results.scanned}`);
    console.log(`  Total module references: ${results.moduleReferences}`);
    console.log(`  Missing modules: ${colors.yellow}${results.missingModules}${colors.reset}`);

    // Print problematic files
    if (results.problematicFiles.length > 0) {
      console.log(`\n${colors.red}Problematic files:${colors.reset}`);

      for (const file of results.problematicFiles) {
        console.log(`\n  ${colors.yellow}${file.file}${colors.reset}`);

        for (const module of file.missingModules) {
          console.log(`    - ${colors.red}${module.module}${colors.reset} (${module.type})`);
          console.log(`      Resolved to: ${module.resolved}`);
        }
      }

      console.log(`\nRun 'npm install' for missing npm packages or create the missing local modules.`);
    } else {
      console.log(`\n${colors.green}All modules are valid!${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Error scanning modules:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
