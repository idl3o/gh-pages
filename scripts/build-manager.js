const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.blue('🚀 Starting build process for GitHub Pages'));

// Check if we're running in CI environment
const isCI = process.env.CI === 'true';
console.log(chalk.gray(`Running in ${isCI ? 'CI environment' : 'local environment'}`));

// Check if Ruby is available
let rubyAvailable = false;
try {
  execSync('ruby -v', { stdio: ['ignore', 'pipe', 'ignore'] });
  rubyAvailable = true;
  console.log(chalk.green('✓ Ruby is available'));
} catch (error) {
  console.log(chalk.yellow('⚠️ Ruby is not available, will use static build only'));
}

try {
  // Prepare static content
  console.log(chalk.blue('Preparing static content...'));
  execSync('npm run prepare-static', { stdio: 'inherit' });

  if (rubyAvailable) {
    // Try Jekyll build if Ruby is available
    try {
      console.log(chalk.blue('Attempting Jekyll build...'));
      execSync('npm run build:jekyll', { stdio: 'inherit' });
      console.log(chalk.green('✓ Jekyll build completed successfully'));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Jekyll build failed, falling back to static build'));
      console.log(chalk.gray('Error details:'), error.message);
      execSync('npm run build:static', { stdio: 'inherit' });
    }
  } else {
    // Use static build if Ruby is not available
    console.log(chalk.blue('Using static build process...'));
    execSync('npm run build:static', { stdio: 'inherit' });
  }

  console.log(chalk.green('✓ Build completed successfully'));
  process.exit(0);
} catch (error) {
  console.log(chalk.red('✗ Build failed:'), error.message);
  process.exit(1);
}
