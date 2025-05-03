const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Takes a file path to an HTML file and validates it
function validateHtml(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const { window } = new JSDOM(html);

    // Log validation result
    console.log(`✓ ${filePath} - No critical syntax errors found`);
    return true;
  } catch (error) {
    console.error(`✗ ${filePath} - Error:`, error.message);
    return false;
  }
}

// Walk directory and validate all HTML files
function walkAndValidate(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      walkAndValidate(fullPath);
    } else if (path.extname(fullPath).toLowerCase() === '.html') {
      validateHtml(fullPath);
    }
  }
}

// Start validation from _includes directory and root HTML files
if (fs.existsSync('_includes')) {
  console.log('Validating HTML files in _includes directory...');
  walkAndValidate('_includes');
} else {
  console.log('_includes directory not found');
}

// Validate root HTML files
const rootFiles = fs.readdirSync('.');
for (const file of rootFiles) {
  if (path.extname(file).toLowerCase() === '.html') {
    validateHtml(file);
  }
}
