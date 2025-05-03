/**
 * Rollback Dependencies Script
 *
 * Restores dependencies to a previous backup state
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

console.log(`${colors.blue}╔════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║      Dependency Rollback Tool      ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════╝${colors.reset}`);
console.log('');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get backup directory
const backupDir = path.join(__dirname, '..', '.dependency-backups');
const backupsFile = path.join(backupDir, 'backups.json');

// Check if backups exist
if (!fs.existsSync(backupDir) || !fs.existsSync(backupsFile)) {
  console.log(`${colors.red}No backups found. Nothing to restore.${colors.reset}`);
  process.exit(1);
}

// Load backup metadata
const backupMetadata = JSON.parse(fs.readFileSync(backupsFile, 'utf8'));

// Get latest backup
const latestBackup = backupMetadata.find(b => b.isLatest);
if (!latestBackup) {
  console.log(`${colors.red}No latest backup found. Cannot restore.${colors.reset}`);
  process.exit(1);
}

console.log(
  `${colors.cyan}Latest backup found from: ${new Date(latestBackup.timestamp.replace(/-/g, ':')).toLocaleString()}${colors.reset}`
);

// Ask for confirmation
rl.question(`${colors.yellow}Do you want to restore this backup? (y/n) ${colors.reset}`, answer => {
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log(`${colors.gray}Rollback canceled.${colors.reset}`);
    rl.close();
    return;
  }

  // Restore package.json and package-lock.json
  console.log(`${colors.cyan}Restoring package.json...${colors.reset}`);
  fs.copyFileSync(latestBackup.packageJsonBackup, path.join(__dirname, '..', 'package.json'));

  if (latestBackup.packageLockBackup && fs.existsSync(latestBackup.packageLockBackup)) {
    console.log(`${colors.cyan}Restoring package-lock.json...${colors.reset}`);
    fs.copyFileSync(
      latestBackup.packageLockBackup,
      path.join(__dirname, '..', 'package-lock.json')
    );
  }

  console.log(`${colors.green}✓ Files restored successfully${colors.reset}`);

  // Run npm install to make changes take effect
  console.log(`${colors.cyan}Reinstalling dependencies...${colors.reset}`);

  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Dependencies reinstalled successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to reinstall dependencies: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  console.log('');
  console.log(`${colors.green}✓ Rollback completed successfully!${colors.reset}`);
  rl.close();
});

rl.on('close', () => {
  process.exit(0);
});
