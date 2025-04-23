/**
 * Documentation Commands
 *
 * Commands related to documentation management
 */

const chalk = require('chalk');
const { execSync } = require('child_process');

/**
 * Register documentation commands
 * @param {object} program Commander program instance
 */
function registerDocsCommands(program) {
  const docs = program
    .command('docs')
    .description('Manage StreamChain documentation')
    .action(() => {
      // Default action is to build all documentation
      try {
        execSync('npm run docs:build', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Documentation build failed:'), error.message);
        process.exit(1);
      }
    });

  docs
    .command('build')
    .description('Build all documentation')
    .action(() => {
      console.log(chalk.blue('🔨 Building all documentation...'));
      try {
        execSync('npm run docs:build', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Documentation build failed:'), error.message);
        process.exit(1);
      }
    });

  docs
    .command('serve')
    .description('Serve documentation locally')
    .action(() => {
      console.log(chalk.blue('🌐 Starting documentation server...'));
      try {
        execSync('npm run docs:serve', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Documentation server failed:'), error.message);
        process.exit(1);
      }
    });

  const docTypes = [
    { name: 'whitepaper', description: 'Build the whitepaper' },
    { name: 'architecture', description: 'Build architecture documentation' },
    { name: 'contracts', description: 'Build smart contract documentation' },
    { name: 'api', description: 'Build API documentation' },
    { name: 'auth', description: 'Build authentication documentation' },
    { name: 'endpoints', description: 'Build endpoints documentation' },
    { name: 'sdk', description: 'Build SDK documentation' },
    { name: 'guides', description: 'Build user guides' }
  ];

  docTypes.forEach(docType => {
    docs
      .command(docType.name)
      .description(docType.description)
      .action(() => {
        console.log(chalk.blue(`🔨 Building ${docType.name} documentation...`));
        try {
          execSync(`npm run docs:${docType.name}`, { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red(`${docType.name} documentation build failed:`), error.message);
          process.exit(1);
        }
      });
  });

  return docs;
}

module.exports = registerDocsCommands;
