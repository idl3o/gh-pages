const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🔧 Preparing static files for GitHub Pages'));

// Define directories
const rootDir = path.join(__dirname, '..');
const outputDir = path.join(rootDir, '_site');
const docsDir = path.join(rootDir, 'docs');

// Create necessary directories
const ensureDirectory = dir => {
  if (!fs.existsSync(dir)) {
    console.log(chalk.gray(`Creating directory: ${path.relative(rootDir, dir)}`));
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Ensure output and other required directories exist
ensureDirectory(outputDir);
ensureDirectory(path.join(rootDir, 'assets'));
ensureDirectory(path.join(rootDir, 'css'));
ensureDirectory(path.join(rootDir, 'js'));

// Create basic CSS file if it doesn't exist
const cssFile = path.join(rootDir, 'css', 'main.css');
if (!fs.existsSync(cssFile)) {
  console.log(chalk.gray('Creating main CSS file'));
  fs.writeFileSync(
    cssFile,
    `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
h1, h2, h3 {
  color: #0366d6;
}
a {
  color: #0366d6;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
`
  );
}

// Create .nojekyll file to disable Jekyll processing on GitHub Pages if needed
const nojekyllFile = path.join(rootDir, '.nojekyll');
if (!fs.existsSync(nojekyllFile)) {
  console.log(chalk.gray('Creating .nojekyll file as fallback'));
  fs.writeFileSync(nojekyllFile, '');
}

console.log(chalk.green('✓ Static files prepared successfully'));
