const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

console.log(chalk.blue('📦 Building static files (no Jekyll)'));

// Define important directories
const sourceDir = path.join(__dirname, '..');
const outputDir = path.join(sourceDir, '_site');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  // Copy static assets to _site directory
  const staticDirs = ['assets', 'css', 'js', 'images'];
  for (const dir of staticDirs) {
    const srcDir = path.join(sourceDir, dir);
    const destDir = path.join(outputDir, dir);

    if (fs.existsSync(srcDir)) {
      console.log(chalk.gray(`Copying ${dir} files...`));
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // On Windows, use robocopy with /e for directories with content, /purge to clean destination
      if (process.platform === 'win32') {
        try {
          execSync(`robocopy "${srcDir}" "${destDir}" /e /purge`, {
            stdio: ['ignore', 'pipe', 'ignore']
          });
        } catch (err) {
          // robocopy returns non-zero exit codes for successful operations, ignore those
          if (err.status > 7) {
            throw err;
          }
        }
      } else {
        // For non-Windows platforms
        execSync(`cp -R "${srcDir}"/* "${destDir}"/`, { stdio: ['ignore', 'pipe', 'ignore'] });
      }
    }
  }

  // Process HTML files
  console.log(chalk.gray('Processing HTML files...'));
  const htmlFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.html'));
  for (const file of htmlFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(outputDir, file));
  }

  // Create a simple index.html if it doesn't exist
  if (
    !fs.existsSync(path.join(outputDir, 'index.html')) &&
    !fs.existsSync(path.join(sourceDir, 'index.html'))
  ) {
    console.log(chalk.yellow('No index.html found, creating a placeholder...'));
    fs.writeFileSync(
      path.join(outputDir, 'index.html'),
      `<!DOCTYPE html>
<html>
<head>
  <title>StreamChain Web3</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <h1>StreamChain Platform</h1>
  <p>A decentralized Web3 streaming platform.</p>
  <p>This is a static build. For full functionality, please build with Jekyll.</p>
</body>
</html>`
    );
  }

  console.log(chalk.green('✓ Static build completed successfully'));
} catch (error) {
  console.log(chalk.red('✗ Static build failed:'), error.message);
  process.exit(1);
}
