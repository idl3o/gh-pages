const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

console.log(chalk.blue('🚀 Deploying to GitHub Pages'));

// Define paths
const rootDir = path.join(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const outputDir = path.join(rootDir, '_site');

try {
  // Check if we're in CI environment
  const isCI = process.env.CI === 'true';

  // Make sure docs directory exists
  if (!fs.existsSync(docsDir)) {
    console.log(chalk.yellow('⚠️ Docs directory not found. Creating it...'));
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // Check for _site directory - Jekyll output or static build output
  const siteExists = fs.existsSync(outputDir);

  // Determine source directory for deployment
  const sourceDir = siteExists ? outputDir : docsDir;

  console.log(chalk.gray(`Using ${path.relative(rootDir, sourceDir)} as deployment source`));

  // Copy files to root for GitHub Pages
  console.log(chalk.blue('Copying files to root directory...'));

  // Get list of files to copy
  const files = fs.readdirSync(sourceDir);

  // Files to exclude from copying to root
  const excludeFiles = ['.git', 'node_modules', 'package.json', 'package-lock.json'];

  for (const file of files) {
    if (excludeFiles.includes(file)) {
      continue;
    }

    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(rootDir, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      console.log(chalk.gray(`Copying directory: ${file}`));
      // Different copy command based on platform
      if (process.platform === 'win32') {
        try {
          if (fs.existsSync(destPath)) {
            execSync(`rmdir /s /q "${destPath}"`, { stdio: 'ignore' });
          }
          execSync(`xcopy "${srcPath}" "${destPath}" /E /I /Y`, { stdio: 'ignore' });
        } catch (err) {
          console.log(chalk.yellow(`Warning copying ${file}: ${err.message}`));
        }
      } else {
        execSync(`rm -rf "${destPath}" && cp -r "${srcPath}" "${destPath}"`, { stdio: 'ignore' });
      }
    } else {
      console.log(chalk.gray(`Copying file: ${file}`));
      fs.copyFileSync(srcPath, destPath);
    }
  }

  // Create .nojekyll file if it doesn't exist
  const nojekyllFile = path.join(rootDir, '.nojekyll');
  if (!fs.existsSync(nojekyllFile)) {
    console.log(chalk.gray('Creating .nojekyll file'));
    fs.writeFileSync(nojekyllFile, '');
  }

  console.log(chalk.green('✓ Deployment files prepared successfully'));

  if (isCI) {
    console.log(
      chalk.blue(
        'CI environment detected. GitHub Pages deployment will be handled by GitHub Actions.'
      )
    );
  } else {
    console.log(chalk.blue('Local environment detected. To deploy:'));
    console.log(chalk.gray('1. Commit all changes'));
    console.log(chalk.gray('2. Push to GitHub'));
    console.log(chalk.gray('3. Enable GitHub Pages in repository settings'));
  }
} catch (error) {
  console.log(chalk.red('✗ Deployment preparation failed:'), error.message);
  process.exit(1);
}
