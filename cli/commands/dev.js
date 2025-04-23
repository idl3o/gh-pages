/**
 * Development Commands
 *
 * Commands related to development workflows
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Register development commands
 * @param {object} program Commander program instance
 */
function registerDevCommands(program) {
  const dev = program
    .command('dev')
    .description('Development commands')
    .action(() => {
      // Default action is to start development server
      console.log(chalk.blue('🚀 Starting development server...'));
      try {
        execSync('npm run dev', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Development server failed:'), error.message);
        process.exit(1);
      }
    });

  dev
    .command('jekyll')
    .description('Start Jekyll development server')
    .action(() => {
      console.log(chalk.blue('🚀 Starting Jekyll development server...'));
      try {
        execSync('npm run jekyll:dev', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Jekyll server failed:'), error.message);
        process.exit(1);
      }
    });

  dev
    .command('check-ruby')
    .description('Check Ruby and Jekyll installation')
    .action(() => {
      console.log(chalk.blue('🔍 Checking Ruby installation...'));
      try {
        execSync('npm run check:ruby', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Ruby check failed:'), error.message);
        process.exit(1);
      }
    });

  dev
    .command('branch')
    .description('Run branch management operations')
    .option('-l, --list', 'List all branches')
    .option('-m, --merge <branches...>', 'Merge specified branches into main')
    .option('-c, --cleanup', 'Clean up merged branches')
    .action(options => {
      const branchManagerPath = path.join(__dirname, '..', '..', 'scripts', 'branch-manager.js');

      if (!fs.existsSync(branchManagerPath)) {
        console.error(chalk.red('Branch manager script not found at:'), branchManagerPath);
        process.exit(1);
      }

      if (options.list) {
        console.log(chalk.blue('🔍 Listing branches...'));
        try {
          execSync(`node "${branchManagerPath}" status`, { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red('Failed to list branches:'), error.message);
          process.exit(1);
        }
      } else if (options.merge && options.merge.length > 0) {
        console.log(chalk.blue(`🔀 Merging branches: ${options.merge.join(', ')}...`));
        try {
          execSync(`node "${branchManagerPath}" merge ${options.merge.join(' ')}`, {
            stdio: 'inherit'
          });
        } catch (error) {
          console.error(chalk.red('Merge failed:'), error.message);
          process.exit(1);
        }
      } else if (options.cleanup) {
        console.log(chalk.blue('🧹 Cleaning up merged branches...'));
        try {
          execSync(`node "${branchManagerPath}" cleanup`, { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red('Cleanup failed:'), error.message);
          process.exit(1);
        }
      } else {
        // Default action is to show branch status
        console.log(chalk.blue('🔍 Branch status:'));
        try {
          execSync(`node "${branchManagerPath}" status`, { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red('Failed to get branch status:'), error.message);
          process.exit(1);
        }
      }
    });

  return dev;
}

module.exports = registerDevCommands;
