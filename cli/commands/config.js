/**
 * Config Commands
 *
 * Commands related to configuration management
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const path = require('path');
const cfigPath = path.join(__dirname, '..', '..', 'scripts', 'cfig.js');

/**
 * Register configuration commands
 * @param {object} program Commander program instance
 */
function registerConfigCommands(program) {
  const config = program
    .command('config')
    .description('Manage StreamChain configuration')
    .action(() => {
      // Default action is to list all configuration
      try {
        execSync(`node "${cfigPath}" list`, { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Failed to list configuration:'), error.message);
        process.exit(1);
      }
    });

  config
    .command('get <path>')
    .description('Get a configuration value')
    .action(path => {
      try {
        execSync(`node "${cfigPath}" get ${path}`, { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red(`Failed to get ${path}:`), error.message);
        process.exit(1);
      }
    });

  config
    .command('set <path> <value>')
    .description('Set a configuration value')
    .action((path, value) => {
      try {
        execSync(`node "${cfigPath}" set ${path} ${value}`, { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red(`Failed to set ${path}:`), error.message);
        process.exit(1);
      }
    });

  config
    .command('env [environment]')
    .description('Show environment-specific configuration')
    .action(environment => {
      try {
        const cmd = environment
          ? `node "${cfigPath}" env ${environment}`
          : `node "${cfigPath}" env`;
        execSync(cmd, { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Failed to get environment configuration:'), error.message);
        process.exit(1);
      }
    });

  config
    .command('features')
    .description('List all feature flags')
    .action(() => {
      try {
        execSync(`node "${cfigPath}" features`, { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Failed to list features:'), error.message);
        process.exit(1);
      }
    });

  return config;
}

module.exports = registerConfigCommands;
