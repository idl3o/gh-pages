/**
 * Cache Clear Script
 * Clears various cache stores
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

// Cache locations
const cacheLocations = {
  // Memory caches can't be cleared from file system
  filesystem: [
    {
      name: 'General Cache',
      path: './cache'
    },
    {
      name: 'Content Cache',
      path: './cache/content'
    },
    {
      name: 'Media Cache',
      path: './cache/media'
    },
    {
      name: 'Thumbnails',
      path: './cache/thumbnails'
    },
    {
      name: 'IPFS',
      path: './cache/ipfs'
    }
  ],
  // Browser caches (just info - can't be cleared from Node)
  browser: [
    {
      name: 'Browser Cache',
      info: 'Browser caches need to be cleared from the browser itself'
    },
    {
      name: 'Service Worker Cache',
      info: 'Service worker caches need to be cleared from the browser'
    }
  ],
  // Local storage caches (just info - can't be cleared from Node directly)
  localStorage: [
    {
      name: 'Local Storage',
      info: 'Local storage caches need to be cleared from the browser'
    },
    {
      name: 'IndexedDB',
      info: 'IndexedDB caches need to be cleared from the browser'
    }
  ]
};

/**
 * Clear filesystem caches
 * @returns {Object} Results
 */
async function clearFilesystemCaches() {
  const results = {
    cleared: [],
    errors: [],
    skipped: []
  };

  for (const cache of cacheLocations.filesystem) {
    const spinner = ora(`Clearing ${cache.name}...`).start();
    const cachePath = path.resolve(__dirname, '..', '..', cache.path);

    try {
      if (fs.existsSync(cachePath)) {
        // Get size before clearing
        const stats = {
          files: 0,
          size: 0
        };

        try {
          const files = getFilesRecursively(cachePath);
          stats.files = files.length;
          stats.size = files.reduce((total, file) => {
            return total + fs.statSync(file).size;
          }, 0);
        } catch (err) {
          // Ignore errors in getting stats
        }

        // Clear the cache
        await clearDirectory(cachePath);

        // Ensure directory exists after clearing
        if (!fs.existsSync(cachePath)) {
          fs.mkdirSync(cachePath, { recursive: true });
        }

        results.cleared.push({
          name: cache.name,
          path: cachePath,
          stats: {
            files: stats.files,
            size: formatBytes(stats.size)
          }
        });

        spinner.succeed(`Cleared ${cache.name} (${stats.files} files, ${formatBytes(stats.size)})`);
      } else {
        results.skipped.push({
          name: cache.name,
          path: cachePath,
          reason: 'Directory does not exist'
        });

        spinner.warn(`Skipped ${cache.name}: Directory does not exist`);

        // Create the directory
        fs.mkdirSync(cachePath, { recursive: true });
      }
    } catch (error) {
      results.errors.push({
        name: cache.name,
        path: cachePath,
        error: error.message
      });

      spinner.fail(`Failed to clear ${cache.name}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Get files recursively from directory
 * @param {string} directory - Directory path
 * @returns {Array} List of files
 */
function getFilesRecursively(directory) {
  let files = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Clear directory recursively
 * @param {string} directory - Directory path
 */
async function clearDirectory(directory) {
  if (!fs.existsSync(directory)) return;

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await clearDirectory(fullPath);
      fs.rmdirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes
 * @returns {string} Formatted size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue.bold('=== Cache Clearing Utility ==='));

  try {
    // Clear filesystem caches
    console.log(chalk.yellow('\nClearing filesystem caches...'));
    const results = await clearFilesystemCaches();

    // Show browser cache info
    console.log(chalk.yellow('\nBrowser caches:'));
    for (const cache of cacheLocations.browser) {
      console.log(chalk.cyan(`${cache.name}:`), chalk.gray(cache.info));
    }

    // Show localStorage cache info
    console.log(chalk.yellow('\nLocal storage caches:'));
    for (const cache of cacheLocations.localStorage) {
      console.log(chalk.cyan(`${cache.name}:`), chalk.gray(cache.info));
    }

    // Summary
    console.log(chalk.green('\nCache clearing complete!'));
    console.log(chalk.green(`Cleared: ${results.cleared.length} caches`));

    if (results.errors.length > 0) {
      console.log(chalk.red(`Errors: ${results.errors.length} caches`));
    }

    if (results.skipped.length > 0) {
      console.log(chalk.yellow(`Skipped: ${results.skipped.length} caches`));
    }
  } catch (error) {
    console.error(chalk.red(`Error clearing caches: ${error.message}`));
    process.exit(1);
  }
}

// Run the script
main();
