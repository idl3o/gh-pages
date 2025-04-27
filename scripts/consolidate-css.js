const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const cssDir = path.join(rootDir, 'assets', 'css');
const outputFile = path.join(cssDir, 'consolidated.css');

// Pattern to look for CSS files
const cssPattern = /\.css$/i;
const excludeFiles = ['consolidated.css', 'min.css'];

// Results storage
const cssFiles = [];
const cssContent = [];
const duplicateSelectors = new Map();

/**
 * Simple CSS parser to extract rules
 * @param {string} css CSS content
 * @returns {Object} Parsed CSS rules by selector
 */
function parseCSS(css, filename) {
  const rules = {};
  let currentSelector = null;
  let buffer = '';
  let inComment = false;
  let inRule = false;
  let braceLevel = 0;

  // Split CSS into lines
  const lines = css.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle comment blocks
    if (line.includes('/*') && !line.includes('*/')) {
      inComment = true;
      continue;
    }

    if (inComment) {
      if (line.includes('*/')) {
        inComment = false;
      }
      continue;
    }

    // Skip comment lines
    if (line.trim().startsWith('/*') && line.includes('*/')) {
      continue;
    }

    // Extract selectors and rules
    if (!inRule && line.includes('{')) {
      currentSelector = line.substring(0, line.indexOf('{')).trim();
      buffer = line.substring(line.indexOf('{')) + '\n';
      inRule = true;
      braceLevel = 1;

      // Handle single-line rules
      if (line.includes('}')) {
        rules[currentSelector] = {
          content: buffer + '}',
          file: filename,
          line: i + 1
        };
        buffer = '';
        inRule = false;
        braceLevel = 0;
      }
    } else if (inRule) {
      buffer += line + '\n';

      // Count opening and closing braces
      for (const char of line) {
        if (char === '{') braceLevel++;
        if (char === '}') braceLevel--;
      }

      if (braceLevel === 0) {
        rules[currentSelector] = {
          content: buffer,
          file: filename,
          line: i + 1
        };
        buffer = '';
        inRule = false;
      }
    }
  }

  return rules;
}

/**
 * Find CSS files recursively
 * @param {string} dir Directory to search
 */
function findCSSFiles(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      // Skip node_modules and other ignored dirs
      if (item === 'node_modules' || item === '.git') continue;
      findCSSFiles(fullPath);
    } else if (stats.isFile() && cssPattern.test(item)) {
      // Skip excluded files
      if (excludeFiles.some(exclude => item.includes(exclude))) continue;

      cssFiles.push({
        path: fullPath,
        relativePath: path.relative(rootDir, fullPath),
        size: stats.size
      });
    }
  }
}

/**
 * Analyze CSS files for duplicate selectors
 */
function analyzeCSS() {
  for (const file of cssFiles) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      cssContent.push({
        file: file.relativePath,
        content: content
      });

      const rules = parseCSS(content, file.relativePath);

      // Check for duplicate selectors
      for (const selector in rules) {
        if (!duplicateSelectors.has(selector)) {
          duplicateSelectors.set(selector, [
            {
              file: file.relativePath,
              content: rules[selector].content,
              line: rules[selector].line
            }
          ]);
        } else {
          duplicateSelectors.get(selector).push({
            file: file.relativePath,
            content: rules[selector].content,
            line: rules[selector].line
          });
        }
      }
    } catch (error) {
      console.error(`Error reading ${file.relativePath}: ${error.message}`);
    }
  }
}

/**
 * Generate a consolidated CSS file
 */
function generateConsolidatedCSS() {
  let consolidated = '/* Consolidated CSS - Generated ' + new Date().toISOString() + ' */\n\n';
  consolidated +=
    '/* This file combines rules from multiple CSS files and removes duplicates */\n\n';

  // Add file sources
  consolidated += '/* Source files:\n';
  cssFiles.forEach(file => {
    consolidated += ` * - ${file.relativePath}\n`;
  });
  consolidated += ' */\n\n';

  // Process selectors
  for (const [selector, instances] of duplicateSelectors.entries()) {
    if (instances.length > 1) {
      consolidated += `/* ${selector} appears in ${instances.length} files:\n`;
      instances.forEach(instance => {
        consolidated += ` * - ${instance.file}:${instance.line}\n`;
      });
      consolidated += ' */\n';
    } else {
      consolidated += `/* From ${instances[0].file}:${instances[0].line} */\n`;
    }

    consolidated += selector + ' ' + instances[0].content + '\n\n';
  }

  // Write the consolidated file
  fs.writeFileSync(outputFile, consolidated);
  console.log(`Consolidated CSS written to ${path.relative(rootDir, outputFile)}`);

  // Generate a report
  const duplicates = Array.from(duplicateSelectors.entries()).filter(
    ([_, instances]) => instances.length > 1
  );

  console.log(
    `Found ${duplicates.length} duplicate CSS selectors across ${cssFiles.length} files.`
  );

  // Write a report file
  const reportPath = path.join(__dirname, 'css-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        totalFiles: cssFiles.length,
        totalSelectors: duplicateSelectors.size,
        duplicateSelectors: duplicates.length,
        duplicateDetails: Object.fromEntries(duplicates)
      },
      null,
      2
    )
  );
  console.log(`CSS analysis report written to ${path.relative(rootDir, reportPath)}`);
}

// Run the script
console.log('Searching for CSS files...');
findCSSFiles(rootDir);
console.log(`Found ${cssFiles.length} CSS files.`);

console.log('Analyzing CSS content...');
analyzeCSS();

console.log('Generating consolidated CSS...');
generateConsolidatedCSS();
