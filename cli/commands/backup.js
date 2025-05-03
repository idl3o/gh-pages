/**
 * Backup Commands
 *
 * Commands related to backing up and restoring the StreamChain platform
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Create readline interface
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Register backup commands
 * @param {object} program Commander program instance
 */
function registerBackupCommands(program) {
  const backup = program
    .command('backup')
    .description('Backup management commands')
    .action(() => {
      // Default action is to list available backups
      try {
        execSync('npm run restore:list', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Failed to list backups:'), error.message);
        process.exit(1);
      }
    });

  backup
    .command('create')
    .description('Create a new backup')
    .option('-t, --target <target>', 'Backup target (site, docs, all)', 'all')
    .action(options => {
      console.log(chalk.blue(`🔄 Creating backup of ${options.target}...`));
      try {
        execSync(`npm run backup:${options.target}`, { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Backup failed:'), error.message);
        process.exit(1);
      }
    });

  backup
    .command('list')
    .description('List available backups')
    .action(() => {
      try {
        execSync('npm run restore:list', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('Failed to list backups:'), error.message);
        process.exit(1);
      }
    });

  backup
    .command('restore [backup]')
    .description('Restore from a backup')
    .option('-l, --latest', 'Restore from latest backup')
    .action((backup, options) => {
      if (options.latest) {
        console.log(chalk.blue('🔄 Restoring from latest backups...'));
        try {
          execSync('npm run restore:latest', { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red('Restore failed:'), error.message);
          process.exit(1);
        }
        return;
      }

      if (backup) {
        console.log(chalk.blue(`🔄 Restoring from backup: ${backup}`));
        try {
          execSync(`npm run restore -- "${backup}"`, { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red('Restore failed:'), error.message);
          process.exit(1);
        }
        return;
      }

      // Interactive mode if no backup specified and not latest
      execSync('npm run restore:list', { stdio: 'inherit' });

      const rl = createReadlineInterface();
      rl.question(chalk.blue('\nEnter backup name to restore: '), answer => {
        rl.close();
        if (!answer.trim()) {
          console.log(chalk.yellow('No backup selected. Exiting.'));
          return;
        }

        console.log(chalk.blue(`🔄 Restoring from backup: ${answer}`));
        try {
          execSync(`npm run restore -- "${answer}"`, { stdio: 'inherit' });
        } catch (error) {
          console.error(chalk.red('Restore failed:'), error.message);
          process.exit(1);
        }
      });
    });

  return backup;
}

module.exports = registerBackupCommands;
