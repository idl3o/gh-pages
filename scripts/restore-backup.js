/**
 * Restore Backup
 * Restores backups created by the backup-manager
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { createGunzip } = require('zlib');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

// Convert pipeline to promise-based
const pipe = promisify(pipeline);

// Root directory of the project
const rootDir = path.join(__dirname, '..');
const backupDir = path.join(rootDir, 'backups');

// Parse command line arguments
const args = process.argv.slice(2);
const listMode = args.includes('--list');
const latestMode = args.includes('--latest');
const backupFileArg = args.find(arg => arg.endsWith('.zip') || arg.endsWith('.tar.gz'));
const backupFileName = backupFileArg || '';

// List all available backups
function listBackups() {
  if (!fs.existsSync(backupDir)) {
    console.log(chalk.yellow('No backups directory found.'));
    return [];
  }

  const backups = fs
    .readdirSync(backupDir)
    .filter(file => file.endsWith('.zip') || file.endsWith('.tar.gz'))
    .sort()
    .reverse(); // Newest first

  if (backups.length === 0) {
    console.log(chalk.yellow('No backups found.'));
    return [];
  }

  console.log(chalk.blue('Available backups:'));
  backups.forEach((backup, index) => {
    // Extract timestamp from filename
    const match = backup.match(/_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
    const timestamp = match ? match[1].replace('_', ' ').replace(/-/g, ':') : 'Unknown date';

    // Determine type
    const type = backup.startsWith('site_')
      ? 'Site'
      : backup.startsWith('docs_')
        ? 'Documentation'
        : backup.startsWith('config_')
          ? 'Configuration'
          : 'Unknown';

    console.log(`${index + 1}. ${chalk.green(type)} - ${chalk.blue(timestamp)} - ${backup}`);
  });

  return backups;
}

// Get the latest backup of a specific type
function getLatestBackup(type) {
  if (!fs.existsSync(backupDir)) {
    console.log(chalk.yellow('No backups directory found.'));
    return null;
  }

  const backups = fs
    .readdirSync(backupDir)
    .filter(
      file => file.startsWith(`${type}_`) && (file.endsWith('.zip') || file.endsWith('.tar.gz'))
    )
    .sort()
    .reverse(); // Newest first

  if (backups.length === 0) {
    console.log(chalk.yellow(`No backups found for type: ${type}`));
    return null;
  }

  return backups[0];
}

// Restore from a backup file
async function restoreBackup(backupFile) {
  const backupPath = path.join(backupDir, backupFile);

  if (!fs.existsSync(backupPath)) {
    console.error(chalk.red(`Backup file not found: ${backupPath}`));
    return false;
  }

  console.log(chalk.blue(`Restoring from backup: ${backupFile}`));

  try {
    // Determine backup type from filename
    const isZip = backupFile.endsWith('.zip');
    const isTarGz = backupFile.endsWith('.tar.gz');

    // Extract backup type from filename (site, docs, config)
    const typeMatch = backupFile.match(/^(site|docs|config)_/);
    const type = typeMatch ? typeMatch[1] : null;

    if (!type) {
      console.error(chalk.red('Could not determine backup type from filename.'));
      return false;
    }

    // Determine target directory
    let targetDir;
    if (type === 'site') {
      targetDir = path.join(rootDir, '_site');
    } else if (type === 'docs') {
      targetDir = path.join(rootDir, 'docs');
    } else if (type === 'config') {
      targetDir = rootDir; // Config files go to root
    } else {
      console.error(chalk.red(`Unknown backup type: ${type}`));
      return false;
    }

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    } else if (type !== 'config') {
      // For non-config backups, clear the target directory
      console.log(chalk.yellow(`Clearing target directory: ${targetDir}`));
      const files = fs.readdirSync(targetDir);
      for (const file of files) {
        const filePath = path.join(targetDir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Extract the backup
    if (isZip) {
      if (process.platform === 'win32') {
        // For Windows, use PowerShell's Expand-Archive
        console.log(chalk.gray('Using Windows-compatible restore method...'));
        const powershellCmd = `powershell -command "Expand-Archive -Path '${backupPath}' -DestinationPath '${targetDir}' -Force"`;
        execSync(powershellCmd, { stdio: 'inherit' });
      } else {
        // For Unix-based systems, use unzip
        execSync(`unzip -o "${backupPath}" -d "${targetDir}"`, { stdio: 'inherit' });
      }
    } else if (isTarGz) {
      // For tar.gz, use tar command
      execSync(`tar -xzf "${backupPath}" -C "${targetDir}"`, { stdio: 'inherit' });
    }

    console.log(chalk.green(`✓ Successfully restored ${type} from backup`));
    return true;
  } catch (error) {
    console.error(chalk.red(`Restore failed: ${error.message}`));
    return false;
  }
}

// Main function
async function main() {
  // Check if backups directory exists
  if (!fs.existsSync(backupDir)) {
    console.log(chalk.yellow('No backups directory found. Nothing to restore.'));
    return;
  }

  // List mode - just show available backups
  if (listMode) {
    listBackups();
    return;
  }

  // Latest mode - restore the latest backup of each type
  if (latestMode) {
    console.log(chalk.blue('🔄 Restoring from latest backups...'));

    const types = ['site', 'docs', 'config'];
    for (const type of types) {
      const latestBackup = getLatestBackup(type);
      if (latestBackup) {
        console.log(chalk.blue(`Restoring latest ${type} backup: ${latestBackup}`));
        await restoreBackup(latestBackup);
      }
    }

    console.log(chalk.green('✓ Restore from latest backups completed'));
    return;
  }

  // Specific file mode
  if (backupFileName) {
    await restoreBackup(backupFileName);
    return;
  }

  // Interactive mode - list backups and let user choose
  const backups = listBackups();

  if (backups.length === 0) {
    return;
  }

  console.log(chalk.blue('\nTo restore a backup, run:'));
  console.log(chalk.gray(`npm run restore -- "filename.zip"`));
  console.log(chalk.blue('\nOr to restore the latest backups:'));
  console.log(chalk.gray(`npm run restore:latest`));
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Restore process failed: ${error.message}`));
  process.exit(1);
});
