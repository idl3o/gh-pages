/**
 * Backup Manager
 * Creates backups of important project files and directories
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { createGzip } = require('zlib');
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
const targetArg = args.find(arg => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : 'site';

// Format date for backup filename
const getFormattedDate = () => {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
};

// Create backup directories if they don't exist
const setupBackupDir = () => {
  if (!fs.existsSync(backupDir)) {
    console.log(chalk.blue('Creating backups directory...'));
    fs.mkdirSync(backupDir, { recursive: true });
  }
};

// Back up a directory
async function backupDirectory(sourceDir, name) {
  if (!fs.existsSync(sourceDir)) {
    console.log(chalk.yellow(`⚠️ Source directory not found: ${sourceDir}`));
    return false;
  }

  const timestamp = getFormattedDate();
  const backupFileName = `${name}_${timestamp}.tar.gz`;
  const backupFilePath = path.join(backupDir, backupFileName);

  console.log(chalk.blue(`Creating backup of ${name}...`));

  try {
    // Create tarball command - platform specific
    let tarCommand;
    if (process.platform === 'win32') {
      // For Windows, we'll use a more compatible approach
      console.log(chalk.gray('Using Windows-compatible backup method...'));

      // First create a ZIP file using PowerShell
      const zipFileName = `${name}_${timestamp}.zip`;
      const zipFilePath = path.join(backupDir, zipFileName);

      const relativePath = path.relative(rootDir, sourceDir);
      const powershellCmd = `powershell -command "Compress-Archive -Path './${relativePath}/*' -DestinationPath '${zipFilePath}' -Force"`;

      execSync(powershellCmd, { cwd: rootDir, stdio: 'inherit' });
      console.log(chalk.green(`✓ Backup created at: ${zipFilePath}`));
      return zipFilePath;
    } else {
      // For Unix-based systems (Linux, macOS)
      tarCommand = `tar -czf "${backupFilePath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`;
      execSync(tarCommand, { stdio: 'inherit' });
      console.log(chalk.green(`✓ Backup created at: ${backupFilePath}`));
      return backupFilePath;
    }
  } catch (error) {
    console.error(chalk.red(`✗ Backup failed: ${error.message}`));
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.blue('🔄 Starting backup process'));
  setupBackupDir();

  // Define directories to back up based on target
  const backupTasks = [];

  if (target === 'site' || target === 'all') {
    backupTasks.push({
      sourceDir: path.join(rootDir, '_site'),
      name: 'site'
    });
  }

  if (target === 'docs' || target === 'all') {
    backupTasks.push({
      sourceDir: path.join(rootDir, 'docs'),
      name: 'docs'
    });
  }

  // Always back up important configuration files
  if (target === 'config' || target === 'all') {
    // Create a temp dir for config files
    const configTempDir = path.join(rootDir, 'tmp_config_backup');
    if (!fs.existsSync(configTempDir)) {
      fs.mkdirSync(configTempDir, { recursive: true });
    }

    // Copy important config files to temp dir
    const configFiles = [
      'package.json',
      'package-lock.json',
      '.github/workflows/build-and-test.yml',
      'Gemfile',
      'Gemfile.lock',
      '_config.yml'
    ];

    for (const file of configFiles) {
      const sourceFile = path.join(rootDir, file);
      const targetFile = path.join(configTempDir, file);

      if (fs.existsSync(sourceFile)) {
        // Create subdirectories if needed
        const targetDir = path.dirname(targetFile);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copyFileSync(sourceFile, targetFile);
      }
    }

    // Add the temp config dir to backup tasks
    backupTasks.push({
      sourceDir: configTempDir,
      name: 'config'
    });
  }

  // Run backup tasks
  for (const task of backupTasks) {
    await backupDirectory(task.sourceDir, task.name);
  }

  // Clean up temp directories
  const configTempDir = path.join(rootDir, 'tmp_config_backup');
  if (fs.existsSync(configTempDir)) {
    fs.rmSync(configTempDir, { recursive: true, force: true });
  }

  console.log(chalk.green('✓ Backup process completed successfully'));
  console.log(chalk.gray(`Backups stored in: ${backupDir}`));
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Backup process failed: ${error.message}`));
  process.exit(1);
});
