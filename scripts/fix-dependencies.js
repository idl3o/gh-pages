/**
 * Fix Dependencies Script
 *
 * Safely resolves dependency issues by selectively updating packages
 * and creates a backup for easy rollback
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
console.log(`${colors.blue}║    Dependency Fix Utility v1.0     ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════╝${colors.reset}`);
console.log('');

// Get the package.json content
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');

// Create a backup directory
const backupDir = path.join(__dirname, '..', '.dependency-backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Create a backup of current package.json and package-lock.json
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPackageJsonPath = path.join(backupDir, `package.json.${timestamp}`);
const backupPackageLockJsonPath = path.join(backupDir, `package-lock.json.${timestamp}`);

// Load current package.json
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error(`${colors.red}Failed to read package.json: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Create backup
console.log(`${colors.cyan}Creating backup of current dependencies...${colors.reset}`);
fs.copyFileSync(packageJsonPath, backupPackageJsonPath);
if (fs.existsSync(packageLockPath)) {
  fs.copyFileSync(packageLockPath, backupPackageLockJsonPath);
}
console.log(`${colors.green}✓ Backup created at ${backupDir}${colors.reset}`);

// Write backup info to a metadata file for rollback
const backupMetadata = {
  timestamp,
  packageJsonBackup: backupPackageJsonPath,
  packageLockBackup: fs.existsSync(packageLockPath) ? backupPackageLockJsonPath : null,
  isLatest: true
};

// Update other backup metadata files to not be latest
if (fs.existsSync(path.join(backupDir, 'backups.json'))) {
  const existingMetadata = JSON.parse(
    fs.readFileSync(path.join(backupDir, 'backups.json'), 'utf8')
  );
  existingMetadata.forEach(backup => (backup.isLatest = false));
  fs.writeFileSync(
    path.join(backupDir, 'backups.json'),
    JSON.stringify([...existingMetadata, backupMetadata], null, 2)
  );
} else {
  fs.writeFileSync(path.join(backupDir, 'backups.json'), JSON.stringify([backupMetadata], null, 2));
}

// Known problematic dependencies
const knownIssues = {
  'node-fetch': {
    issue: 'v3 uses ES modules which may cause issues with CommonJS',
    fix: 'downgrade to 2.6.7',
    action: deps => {
      if (deps['node-fetch'] && deps['node-fetch'].startsWith('^3')) {
        deps['node-fetch'] = '^2.6.7';
        return true;
      }
      return false;
    }
  },
  dotenv: {
    issue: 'appears in both dependencies and devDependencies',
    fix: 'keep only in dependencies',
    action: (deps, devDeps) => {
      if (deps['dotenv'] && devDeps['dotenv']) {
        delete devDeps['dotenv'];
        return true;
      }
      return false;
    }
  },
  rimraf: {
    issue: 'different versions in dependencies and devDependencies',
    fix: 'standardize on v5.0.1',
    action: (deps, devDeps) => {
      if (deps['rimraf'] && devDeps['rimraf'] && deps['rimraf'] !== devDeps['rimraf']) {
        const version = '^5.0.1'; // Choose stable version
        deps['rimraf'] = version;
        devDeps['rimraf'] = version;
        return true;
      }
      return false;
    }
  },
  ethers: {
    issue: 'duplicated in dependencies and devDependencies',
    fix: 'keep only in dependencies',
    action: (deps, devDeps) => {
      if (deps['ethers'] && devDeps['ethers']) {
        delete devDeps['ethers'];
        return true;
      }
      return false;
    }
  },
  uuid: {
    issue: 'v11 is very recent and might have compatibility issues',
    fix: 'downgrade to v8.3.2',
    action: deps => {
      if (deps['uuid'] && deps['uuid'].startsWith('^11')) {
        deps['uuid'] = '^8.3.2';
        return true;
      }
      return false;
    }
  }
};

// Analyze and fix dependencies
console.log(`${colors.cyan}Analyzing dependencies...${colors.reset}`);

let fixCount = 0;
const { dependencies, devDependencies } = packageJson;

// Process each known issue
Object.entries(knownIssues).forEach(([pkg, info]) => {
  console.log(`${colors.yellow}Checking ${pkg}: ${info.issue}${colors.reset}`);

  // Apply the fix logic
  if (info.action(dependencies, devDependencies)) {
    console.log(`${colors.green}✓ Applied fix: ${info.fix}${colors.reset}`);
    fixCount++;
  } else {
    console.log(`${colors.gray}✓ No action needed${colors.reset}`);
  }
});

// Save changes if any fixes were applied
if (fixCount > 0) {
  console.log(`${colors.cyan}Saving changes to package.json...${colors.reset}`);
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`${colors.cyan}Updating node_modules with fixed dependencies...${colors.reset}`);
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Dependencies updated successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Failed to update dependencies: ${error.message}${colors.reset}`);
    console.log(
      `${colors.yellow}You can roll back changes with: npm run sxs:rollback${colors.reset}`
    );
    process.exit(1);
  }
} else {
  console.log(`${colors.gray}No fixes needed to be applied${colors.reset}`);
}

// Run audit to check the new state
console.log('');
console.log(`${colors.cyan}Running security audit...${colors.reset}`);

try {
  const auditOutput = execSync('npm audit --omit=dev', { encoding: 'utf8', stdio: 'pipe' });
  console.log(`${colors.green}✓ Audit completed${colors.reset}`);

  // Parse audit results
  if (auditOutput.includes('found 0 vulnerabilities')) {
    console.log(
      `${colors.green}✓ No vulnerabilities found in production dependencies!${colors.reset}`
    );
  } else {
    const match = auditOutput.match(/found (\d+) vulnerabilities/);
    if (match) {
      console.log(`${colors.yellow}⚠ Found ${match[1]} vulnerabilities${colors.reset}`);
      console.log(`${colors.gray}${auditOutput}${colors.reset}`);
    }
  }
} catch (error) {
  const auditOutput = error.stdout || '';
  const match = auditOutput.match(/found (\d+) vulnerabilities/);

  if (match) {
    console.log(`${colors.yellow}⚠ Found ${match[1]} vulnerabilities${colors.reset}`);
    console.log(`${colors.gray}These might require manual attention${colors.reset}`);
  } else {
    console.log(`${colors.red}Audit failed: ${error.message}${colors.reset}`);
  }
}

console.log('');
console.log(`${colors.blue}╔════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║           Summary                 ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════╝${colors.reset}`);
console.log(`${colors.green}✓ Applied ${fixCount} fixes to dependencies${colors.reset}`);
console.log(`${colors.green}✓ Created backup that can be restored with:${colors.reset}`);
console.log(`${colors.cyan}  npm run sxs:rollback${colors.reset}`);
console.log('');
console.log(`${colors.yellow}Next steps:${colors.reset}`);
console.log('1. Test the application to verify everything works');
console.log('2. If issues persist, run: npm run sxs:rollback');
console.log('3. For production, consider addressing any remaining audit warnings');
console.log('');
