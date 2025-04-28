/**
 * Helper script for CI operations
 * This provides additional functions for GitHub Actions workflow
 */

const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Run a command with retry logic
 */
function runWithRetry(command, retries = 3, delaySeconds = 5) {
  console.log(chalk.blue(`Running command with retry: ${command}`));

  for (let i = 1; i <= retries; i++) {
    try {
      execSync(command, { stdio: 'inherit' });
      console.log(chalk.green('✓ Command executed successfully'));
      return true;
    } catch (error) {
      console.log(chalk.yellow(`Attempt ${i}/${retries} failed`));
      if (i < retries) {
        console.log(chalk.gray(`Waiting ${delaySeconds} seconds before retry...`));
        // Simple delay implementation
        const waitTill = new Date(new Date().getTime() + delaySeconds * 1000);
        while (waitTill > new Date()) {
          /* wait */
        }
      } else {
        console.log(chalk.red('All retries failed'));
        return false;
      }
    }
  }
}

/**
 * Check and create a .nojekyll file if required
 */
function ensureNoJekyll() {
  const nojekyllPath = path.join(__dirname, '..', '.nojekyll');
  if (!fs.existsSync(nojekyllPath)) {
    console.log(chalk.blue('Creating .nojekyll file for GitHub Pages'));
    fs.writeFileSync(nojekyllPath, '');
  }
}

/**
 * Create or update CNAME file for custom domain
 */
function updateCNAME(domain) {
  if (!domain) return;

  const cnamePath = path.join(__dirname, '..', 'CNAME');
  console.log(chalk.blue(`Setting up CNAME for ${domain}`));
  fs.writeFileSync(cnamePath, domain);
}

// Export functions for use in other scripts
module.exports = {
  runWithRetry,
  ensureNoJekyll,
  updateCNAME
};

// If run directly, perform CI setup
if (require.main === module) {
  console.log(chalk.blue('🔧 Running CI helper'));

  // Ensure we have a .nojekyll file
  ensureNoJekyll();

  // Check for custom domain from environment variable
  const customDomain = process.env.CUSTOM_DOMAIN;
  if (customDomain) {
    updateCNAME(customDomain);
  }

  console.log(chalk.green('✓ CI helper completed successfully'));
}
