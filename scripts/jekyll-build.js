const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

/**
 * Cross-platform solution to build Jekyll site
 */
function buildJekyll() {
  console.log(chalk.blue('Building Jekyll site...'));

  try {
    // Check if Ruby is installed
    try {
      execSync('ruby -v', { stdio: 'pipe' });
    } catch (error) {
      console.log(chalk.yellow('Ruby not found. Skipping Jekyll build.'));
      console.log(chalk.blue('Continuing with static files only.'));
      return true;
    }

    // Check if bundle command is available
    try {
      execSync('bundle -v', { stdio: 'pipe' });
    } catch (error) {
      console.log(chalk.yellow('Bundler not found. Skipping Jekyll build.'));
      console.log(chalk.blue('Continuing with static files only.'));
      return true;
    }

    // Run bundle check
    try {
      execSync('bundle check', { stdio: 'inherit' });
    } catch (error) {
      console.log(chalk.yellow('Running bundle install...'));
      execSync('bundle install', { stdio: 'inherit' });
    }

    // Build Jekyll
    console.log(chalk.blue('Running Jekyll build...'));
    execSync('bundle exec jekyll build', { stdio: 'inherit' });
    console.log(chalk.green('Jekyll build completed successfully!'));
    return true;
  } catch (error) {
    console.log(chalk.red('Jekyll build failed:'), error.message);
    console.log(chalk.yellow('Continuing with static files only.'));
    return false;
  }
}

buildJekyll();
