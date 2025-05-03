/**
 * Deploy Commands
 *
 * Commands related to deploying the StreamChain platform
 */

const chalk = require('chalk');
const { execSync } = require('child_process');

/**
 * Register deploy commands
 * @param {object} program Commander program instance
 */
function registerDeployCommands(program) {
  const deploy = program
    .command('deploy')
    .description('Deploy the StreamChain platform')
    .option('-b, --backup', 'Create a backup before deploying')
    .action(options => {
      if (options.backup) {
        console.log(chalk.blue('🔄 Creating backup before deployment...'));
        try {
          execSync('npm run backup:all', { stdio: 'inherit' });
        } catch (error) {
          console.error(
            chalk.yellow('⚠️ Backup failed but continuing with deployment:'),
            error.message
          );
        }
      }

      console.log(chalk.blue('🚀 Deploying StreamChain platform...'));
      try {
        execSync('npm run docs:deploy', { stdio: 'inherit' });
        console.log(chalk.green('✅ Deployment completed successfully!'));
      } catch (error) {
        console.error(chalk.red('Deployment failed:'), error.message);
        process.exit(1);
      }
    });

  deploy
    .command('docs')
    .description('Deploy documentation only')
    .action(() => {
      console.log(chalk.blue('🚀 Deploying documentation...'));
      try {
        execSync('npm run docs:deploy', { stdio: 'inherit' });
        console.log(chalk.green('✅ Documentation deployment completed successfully!'));
      } catch (error) {
        console.error(chalk.red('Documentation deployment failed:'), error.message);
        process.exit(1);
      }
    });

  return deploy;
}

module.exports = registerDeployCommands;
