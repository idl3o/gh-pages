const fs = require('fs');
const path = require('path');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const duplicateSuffixes = [' 2.md', ' 2.html', ' 2.js', ' 2.css'];
const excludeDirs = ['node_modules', '.git', 'gh-pages-build'];

// Results storage
const duplicates = [];

/**
 * Recursively search for files with duplicate suffixes
 * @param {string} dir Directory to search
 */
function findDuplicates(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);

    // Skip excluded directories
    if (stats.isDirectory() && !excludeDirs.includes(item)) {
      findDuplicates(fullPath);
      continue;
    }

    // Check if file has a duplicate suffix
    if (stats.isFile()) {
      for (const suffix of duplicateSuffixes) {
        if (item.endsWith(suffix)) {
          // Check if original file exists
          const originalName = item.replace(suffix, suffix.replace(' 2', ''));
          const originalPath = path.join(dir, originalName);

          if (fs.existsSync(originalPath)) {
            duplicates.push({
              duplicate: fullPath,
              original: originalPath,
              relativeDuplicate: path.relative(rootDir, fullPath),
              relativeOriginal: path.relative(rootDir, originalPath)
            });
          } else {
            console.log(`Note: Found ${fullPath} but no original file exists.`);
          }
          break;
        }
      }
    }
  }
}

// Start the search
console.log('Searching for duplicate files...');
findDuplicates(rootDir);

// Output results
console.log('\nDuplicate files found:', duplicates.length);
duplicates.forEach((pair, index) => {
  console.log(`\n${index + 1}. Duplicate: ${pair.relativeDuplicate}`);
  console.log(`   Original: ${pair.relativeOriginal}`);
});

// Save results to a JSON file for later processing
fs.writeFileSync(path.join(__dirname, 'duplicates.json'), JSON.stringify(duplicates, null, 2));
console.log('\nResults saved to scripts/duplicates.json');
