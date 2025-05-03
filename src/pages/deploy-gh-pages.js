/**
 * GitHub Pages Deployment Script
 *
 * This script helps with local deployment testing and
 * provides utilities for managing GitHub Pages deployments.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const config = {
  buildFolder: '_site',
  deployBranch: 'gh-pages',
  siteName: 'Project RED X',
  baseUrl: 'https://idl3o.github.io/gh-pages',
  mainBranch: 'main'
};

// Make sure we're in the correct directory
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'status';

/**
 * Display deployment status
 */
function showStatus() {
  console.log(chalk.blue('📊 Deployment Status:'));

  try {
    // Check current branch
    const currentBranch = execSync('git branch --show-current').toString().trim();
    console.log(`Current branch: ${chalk.green(currentBranch)}`);

    // Check if there are uncommitted changes
    const status = execSync('git status --porcelain').toString();
    if (status) {
      console.log(chalk.yellow('⚠️ You have uncommitted changes that won\'t be deployed'));
    } else {
      console.log(chalk.green('✅ Working directory is clean'));
    }

    // Check if deploy branch exists
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${config.deployBranch}`);
      console.log(`Deployment branch ${chalk.green(config.deployBranch)} exists`);

      // Get last deployment info
      const lastCommit = execSync(`git log -1 --pretty=format:"%h - %s (%cr)" ${config.deployBranch}`).toString();
      console.log(`Last deployment: ${chalk.cyan(lastCommit)}`);
    } catch (e) {
      console.log(chalk.yellow(`⚠️ Deployment branch ${config.deployBranch} doesn't exist yet`));
    }

    console.log(`Site URL: ${chalk.blue(config.baseUrl)}`);
  } catch (error) {
    console.error(chalk.red('Error getting status:'), error.message);
  }
}

/**
 * Build the site
 */
function buildSite() {
  console.log(chalk.blue('🔨 Building site...'));

  try {
    // Clean previous build
    if (fs.existsSync(config.buildFolder)) {
      console.log('Cleaning previous build...');
      fs.rmSync(config.buildFolder, { recursive: true, force: true });
    }

    // Run Jekyll build
    console.log('Running Jekyll build...');
    execSync('bundle exec jekyll build', { stdio: 'inherit' });

    console.log(chalk.green('✅ Site built successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Build failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Deploy the site to GitHub Pages
 */
function deploySite() {
  console.log(chalk.blue('🚀 Deploying to GitHub Pages...'));

  try {
    // Build the site first
    buildSite();

    // Get current branch
    const currentBranch = execSync('git branch --show-current').toString().trim();

    // Deploy using gh-pages branch
    console.log(`Deploying from ${currentBranch} to ${config.deployBranch}...`);

    // Create or update the deployment branch
    if (!fs.existsSync(config.buildFolder)) {
      console.error(chalk.red('❌ Build folder not found. Run build first.'));
      process.exit(1);
    }

    // Create commit message
    const timestamp = new Date().toISOString();
    const commitMsg = `Deploy: ${config.siteName} - ${timestamp}`;

    // Using git commands to deploy
    const commands = [
      `git checkout -B ${config.deployBranch}`,
      `git add -f ${config.buildFolder}`,
      `git commit -m "${commitMsg}"`,
      `git filter-branch -f --prune-empty --subdirectory-filter ${config.buildFolder} ${config.deployBranch}`,
      `git push -f origin ${config.deployBranch}`,
      `git checkout ${currentBranch}`
    ];

    commands.forEach(cmd => {
      console.log(`Executing: ${cmd}`);
      execSync(cmd);
    });

    console.log(chalk.green(`✅ Site deployed successfully to ${config.baseUrl}`));
  } catch (error) {
    console.error(chalk.red('❌ Deployment failed:'), error.message);
    process.exit(1);
  }
}

// Execute command
switch (command) {
  case 'status':
    showStatus();
    break;
  case 'build':
    buildSite();
    break;
  case 'deploy':
    deploySite();
    break;
  default:
    console.log(`
${chalk.yellow('GitHub Pages Deployment Script')}

Available commands:
  ${chalk.green('status')} - Show deployment status
  ${chalk.green('build')}  - Build the site
  ${chalk.green('deploy')} - Build and deploy the site to GitHub Pages
    `);
}
