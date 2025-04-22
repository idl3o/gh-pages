const { execSync } = require('child_process');
const chalk = require('chalk');

/**
 * Check if Ruby is installed and available
 */
function checkRuby() {
  console.log(chalk.blue('Checking Ruby installation...'));

  try {
    const rubyVersion = execSync('ruby -v', { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
    console.log(chalk.green('✓ Ruby found:'), rubyVersion);
    return true;
  } catch (error) {
    console.log(chalk.red('✗ Ruby not found or not available in PATH'));
    console.log(
      chalk.yellow(
        'Please install Ruby to use Jekyll: https://www.ruby-lang.org/en/documentation/installation/'
      )
    );
    return false;
  }
}

/**
 * Check if Jekyll is installed
 */
function checkJekyll() {
  console.log(chalk.blue('Checking Jekyll installation...'));

  try {
    const jekyllVersion = execSync('bundle exec jekyll -v', { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
    console.log(chalk.green('✓ Jekyll found:'), jekyllVersion);
    return true;
  } catch (error) {
    console.log(chalk.red('✗ Jekyll not found or not properly installed'));
    console.log(chalk.yellow('Please install Jekyll: https://jekyllrb.com/docs/installation/'));
    return false;
  }
}

// Run checks
const rubyInstalled = checkRuby();
if (rubyInstalled) {
  checkJekyll();
}

process.exit(0); // Don't fail the build
