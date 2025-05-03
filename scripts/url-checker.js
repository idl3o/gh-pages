/**
 * URL Checker for Web3 Crypto Streaming Service
 * This script scans all HTML files for URLs and verifies they are valid
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Configure paths to check
const BASE_DIR = path.resolve(__dirname, '..');
const EXCLUDED_DIRS = ['node_modules', '.git', '.github'];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Results tracking
const results = {
  total: 0,
  valid: 0,
  invalid: 0,
  skipped: 0
};

/**
 * Check if URL is valid
 * @param {string} url URL to check
 * @return {Promise<{success: boolean, message: string}>}
 */
async function checkUrl(url) {
  // Skip anchors and relative paths
  if (url.startsWith('#') || url === '/') {
    return { success: true, message: 'Skipped (anchor or root path)' };
  }

  // Handle relative URLs
  if (url.startsWith('./') || url.startsWith('../') || (url.startsWith('/') && !url.startsWith('//')) || !url.includes('://')) {
    // For relative URLs, just check if the file exists
    try {
      const fullPath = url.startsWith('/')
        ? path.join(BASE_DIR, url)
        : path.resolve(BASE_DIR, url);

      await stat(fullPath);
      return { success: true, message: 'Local file exists' };
    } catch (error) {
      return { success: false, message: `Local file not found: ${error.message}` };
    }
  }

  // External URL
  try {
    // Just do a HEAD request to check if URL exists
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    if (response.ok) {
      return { success: true, message: `Status: ${response.status}` };
    } else {
      return { success: false, message: `Status: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Extract URLs from HTML content
 * @param {string} content HTML content
 * @param {string} filePath Path to the file (for reporting)
 * @return {Array<{url: string, type: string, location: string}>}
 */
function extractUrls(content, filePath) {
  const $ = cheerio.load(content);
  const urls = [];

  // Check <a> tags
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      urls.push({
        url: href,
        type: 'link',
        location: `${filePath} (a href)`
      });
    }
  });

  // Check <img> tags
  $('img').each((i, el) => {
    const src = $(el).attr('src');
    if (src) {
      urls.push({
        url: src,
        type: 'image',
        location: `${filePath} (img src)`
      });
    }
  });

  // Check <script> tags
  $('script').each((i, el) => {
    const src = $(el).attr('src');
    if (src) {
      urls.push({
        url: src,
        type: 'script',
        location: `${filePath} (script src)`
      });
    }
  });

  // Check <link> tags
  $('link').each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      urls.push({
        url: href,
        type: 'link',
        location: `${filePath} (link href)`
      });
    }
  });

  return urls;
}

/**
 * Process an HTML file
 * @param {string} filePath Path to HTML file
 */
async function processHtmlFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const urls = extractUrls(content, filePath);

    console.log(`\n${colors.blue}Checking URLs in: ${filePath}${colors.reset}`);

    for (const { url, type, location } of urls) {
      results.total++;

      process.stdout.write(`  Checking ${type}: ${url.substring(0, 70)}${url.length > 70 ? '...' : ''} `);

      const { success, message } = await checkUrl(url);

      if (success) {
        results.valid++;
        process.stdout.write(`${colors.green}✓ ${message}${colors.reset}\n`);
      } else {
        results.invalid++;
        process.stdout.write(`${colors.red}✗ ${message}${colors.reset}\n`);
        console.log(`    ${colors.yellow}Location: ${location}${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error processing ${filePath}: ${error.message}${colors.reset}`);
  }
}

/**
 * Recursively scan directory for HTML files
 * @param {string} dir Directory to scan
 */
async function scanDirectory(dir) {
  try {
    const files = await readdir(dir);

    for (const file of files) {
      if (EXCLUDED_DIRS.includes(file)) continue;

      const filePath = path.join(dir, file);
      const fileStat = await stat(filePath);

      if (fileStat.isDirectory()) {
        await scanDirectory(filePath);
      } else if (filePath.endsWith('.html')) {
        await processHtmlFile(filePath);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error scanning directory ${dir}: ${error.message}${colors.reset}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.blue}Starting URL checker for Web3 Crypto Streaming Service...${colors.reset}`);

  // First check if we need to install dependencies
  if (!fs.existsSync(path.join(BASE_DIR, 'node_modules/cheerio')) ||
      !fs.existsSync(path.join(BASE_DIR, 'node_modules/node-fetch'))) {
    console.log(`${colors.yellow}Installing required dependencies...${colors.reset}`);
    console.log('Run the following commands before using this script:');
    console.log('npm install cheerio node-fetch');
    process.exit(1);
  }

  // Scan the entire project directory
  await scanDirectory(BASE_DIR);

  // Print results
  console.log(`\n${colors.blue}URL Check Results:${colors.reset}`);
  console.log(`Total URLs: ${results.total}`);
  console.log(`${colors.green}Valid URLs: ${results.valid}${colors.reset}`);
  console.log(`${colors.red}Invalid URLs: ${results.invalid}${colors.reset}`);
  console.log(`${colors.yellow}Skipped URLs: ${results.skipped}${colors.reset}`);

  // Exit with error if any invalid URLs
  if (results.invalid > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
