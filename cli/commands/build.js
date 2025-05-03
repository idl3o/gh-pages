/**
 * Build Commands
 *
 * Commands related to building the StreamChain platform
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Register build commands
 * @param {object} program Commander program instance
 */
function registerBuildCommands(program) {
  const build = program
    .command('build')
    .description('Build the StreamChain platform')
    .action(() => {
      console.log(chalk.blue('🔨 Building StreamChain platform...'));
      try {
        execSync('npm run build', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Build failed:'), error.message);
        process.exit(1);
      }
    });

  build
    .command('static')
    .description('Build static assets only (no Jekyll)')
    .action(() => {
      console.log(chalk.blue('🔨 Building static assets...'));
      try {
        execSync('npm run build:static', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Static build failed:'), error.message);
        process.exit(1);
      }
    });

  build
    .command('jekyll')
    .description('Build with Jekyll if available')
    .action(() => {
      console.log(chalk.blue('🔨 Building with Jekyll...'));
      try {
        execSync('npm run build:jekyll', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Jekyll build failed:'), error.message);
        process.exit(1);
      }
    });

  build
    .command('github')
    .description('Build for GitHub Pages deployment')
    .action(() => {
      console.log(chalk.blue('🔨 Building for GitHub Pages...'));
      try {
        execSync('npm run build:github', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('GitHub build failed:'), error.message);
        process.exit(1);
      }
    });

  return build;
}

module.exports = registerBuildCommands;
