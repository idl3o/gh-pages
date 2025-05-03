/**
 * Dependency Audit Script
 *
 * Checks for deprecated packages, outdated versions, and compatibility issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for simple coloring without dependencies
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

console.log(`${colors.blue}╔══════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║         SxS Dependency Audit Tool        ║${colors.reset}`);
console.log(`${colors.blue}╚══════════════════════════════════════════╝${colors.reset}`);
console.log('');

// Get package.json content
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Known deprecated packages or packages with issues to watch
const deprecatedPackages = {
  'node-fetch@2': {
    reason: 'v2 is no longer maintained. v3 requires ES modules.',
    recommendation: 'Use v2.6.7 as the last CommonJS version or migrate to fetch() API in Node 18+',
    isCritical: false
  },
  'node-fetch@3': {
    reason: 'v3 uses ES modules only which can cause compatibility issues with CommonJS.',
    recommendation: 'Ensure your project supports ESM or use v2.6.7 as the last CommonJS version',
    isCritical: false
  },
  'chalk@5': {
    reason: 'v5+ uses ES modules only which can cause compatibility issues with CommonJS.',
    recommendation: 'Use chalk@4.1.2 for CommonJS projects',
    isCritical: false
  },
  'ora@6': {
    reason: 'v6+ uses ES modules only which can cause compatibility issues with CommonJS.',
    recommendation: 'Use ora@5.4.1 for CommonJS projects',
    isCritical: false
  },
  'inquirer@9': {
    reason: 'v9+ uses ES modules only which can cause compatibility issues with CommonJS.',
    recommendation: 'Use inquirer@8.2.5 for CommonJS projects',
    isCritical: false
  },
  'rimraf@4': {
    reason: 'Multiple major versions with breaking changes',
    recommendation: 'Ensure your code is compatible with the specific version',
    isCritical: false
  },
  'uuid@9': {
    reason: 'New versions use ES modules',
    recommendation: 'Use uuid@8.3.2 for CommonJS projects or ensure compatibility',
    isCritical: false
  },
  'ethers@6': {
    reason: 'Major breaking changes from v5 to v6',
    recommendation: 'Stick with v5 if using with Hardhat, or carefully migrate',
    isCritical: false
  }
};

// Node.js compatibility check
const nodeVersion = process.version;
const nodeMinVersion = packageJson.engines?.node || '>=16.0.0';
console.log(`${colors.cyan}Node.js Compatibility${colors.reset}`);
console.log(`Current Node.js: ${nodeVersion}`);
console.log(`Required Node.js: ${nodeMinVersion}`);

// Check if current Node version meets requirements
console.log('');

// Function to check package versions
function checkPackageVersions(dependencies, type) {
  if (!dependencies) return [];

  console.log(`${colors.cyan}Checking ${type}...${colors.reset}`);

  const issues = [];

  for (const [pkg, version] of Object.entries(dependencies)) {
    // Remove version specifier for checking
    const cleanVersion = version.replace(/^\^|~|>=?|<=?/, '');
    const majorVersion = cleanVersion.split('.')[0];

    // Check for specific problematic packages
    const packageKey = `${pkg}@${majorVersion}`;
    if (deprecatedPackages[packageKey]) {
      const info = deprecatedPackages[packageKey];
      const severity = info.isCritical ? colors.red : colors.yellow;
      console.log(`${severity}⚠ ${pkg}@${version} - ${info.reason}${colors.reset}`);
      console.log(`  ${colors.gray}Recommendation: ${info.recommendation}${colors.reset}`);
      issues.push({ package: pkg, version, ...info });
    }

    // Additional known issues
    if (
      pkg === 'rimraf' &&
      dependencies['rimraf'] &&
      dependencies['rimraf'].startsWith('^5') &&
      devDependencies['rimraf'] &&
      devDependencies['rimraf'].startsWith('^6')
    ) {
      console.log(
        `${colors.yellow}⚠ Multiple versions of rimraf (${dependencies['rimraf']} vs ${devDependencies['rimraf']})${colors.reset}`
      );
      console.log(`  ${colors.gray}This can lead to inconsistent behavior${colors.reset}`);
      issues.push({
        package: pkg,
        version,
        reason: 'Multiple versions in dependencies and devDependencies',
        recommendation: 'Standardize on one version'
      });
    }

    if (pkg === 'dotenv' && dependencies['dotenv'] && devDependencies['dotenv']) {
      console.log(
        `${colors.yellow}⚠ dotenv appears in both dependencies and devDependencies${colors.reset}`
      );
      console.log(
        `  ${colors.gray}This is redundant and may cause version conflicts${colors.reset}`
      );
      issues.push({
        package: pkg,
        version,
        reason: 'Duplicate in dependencies and devDependencies',
        recommendation: 'Move to dependencies only'
      });
    }
  }

  if (issues.length === 0) {
    console.log(`${colors.green}✓ No known issues found${colors.reset}`);
  }

  return issues;
}

// Check dependencies and devDependencies
const { dependencies, devDependencies } = packageJson;
const dependencyIssues = checkPackageVersions(dependencies, 'dependencies');
const devDependencyIssues = checkPackageVersions(devDependencies, 'devDependencies');

// Check for npm audit issues
console.log('');
console.log(`${colors.cyan}Running npm audit...${colors.reset}`);

try {
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
  const auditData = JSON.parse(auditOutput);

  if (auditData.metadata.vulnerabilities.total > 0) {
    console.log(
      `${colors.yellow}⚠ Found ${auditData.metadata.vulnerabilities.total} vulnerabilities:${colors.reset}`
    );
    console.log(
      `  ${colors.red}Critical: ${auditData.metadata.vulnerabilities.critical}${colors.reset}`
    );
    console.log(
      `  ${colors.yellow}High: ${auditData.metadata.vulnerabilities.high}${colors.reset}`
    );
    console.log(
      `  ${colors.blue}Moderate: ${auditData.metadata.vulnerabilities.moderate}${colors.reset}`
    );
    console.log(`  ${colors.gray}Low: ${auditData.metadata.vulnerabilities.low}${colors.reset}`);

    // Show remediation advice
    if (
      auditData.metadata.vulnerabilities.critical > 0 ||
      auditData.metadata.vulnerabilities.high > 0
    ) {
      console.log('');
      console.log(
        `${colors.yellow}Run the following to fix critical/high vulnerabilities:${colors.reset}`
      );
      console.log(`  ${colors.gray}npm audit fix --force${colors.reset}`);
    }
  } else {
    console.log(`${colors.green}✓ No vulnerabilities found${colors.reset}`);
  }
} catch (error) {
  console.log(`${colors.red}Error running npm audit: ${error.message}${colors.reset}`);
}

// Check for specific issues and provide recommendations
console.log('');
console.log(`${colors.cyan}Recommendations:${colors.reset}`);

const allIssues = [...dependencyIssues, ...devDependencyIssues];

// Specific recommendations based on findings
if (allIssues.length === 0) {
  console.log(`${colors.green}✓ Your dependencies look good!${colors.reset}`);
} else {
  // Deduplicate issues
  const uniqueIssues = {};
  allIssues.forEach(issue => {
    uniqueIssues[issue.package] = issue;
  });

  const fixableIssues = Object.values(uniqueIssues).filter(issue => issue.recommendation);

  if (fixableIssues.length > 0) {
    console.log(`${colors.yellow}Issues to address:${colors.reset}`);
    fixableIssues.forEach(issue => {
      console.log(`• ${issue.package}: ${issue.recommendation}`);
    });
  }

  // Add specific package recommendations
  if (packageJson.dependencies['node-fetch']?.startsWith('^3')) {
    console.log(
      `• Consider migrating from node-fetch to the built-in fetch API in newer Node.js versions`
    );
  }

  if (packageJson.dependencies['dotenv'] && packageJson.devDependencies['dotenv']) {
    console.log(`• Remove dotenv from devDependencies and keep only in dependencies`);
  }

  if (packageJson.dependencies['rimraf'] && packageJson.devDependencies['rimraf']) {
    console.log(`• Standardize on one version of rimraf across dependencies and devDependencies`);
  }
}

// CommonJS vs ESM compatibility check
console.log('');
console.log(`${colors.cyan}Module System Compatibility:${colors.reset}`);
const packageType = packageJson.type || 'commonjs';
console.log(`Project type: ${packageType}`);

if (packageType === 'commonjs') {
  const esmOnlyDeps = [];

  // Check for ESM-only packages in a CommonJS project
  const checkEsmCompatibility = deps => {
    if (!deps) return;

    for (const [pkg, version] of Object.entries(deps)) {
      // Check for known ESM-only versions
      if (
        (pkg === 'chalk' && version.startsWith('^5')) ||
        (pkg === 'ora' && version.startsWith('^6')) ||
        (pkg === 'inquirer' && version.startsWith('^9')) ||
        (pkg === 'node-fetch' && version.startsWith('^3'))
      ) {
        esmOnlyDeps.push(`${pkg}@${version}`);
      }
    }
  };

  checkEsmCompatibility(dependencies);
  checkEsmCompatibility(devDependencies);

  if (esmOnlyDeps.length > 0) {
    console.log(`${colors.yellow}⚠ Found ESM-only packages in CommonJS project:${colors.reset}`);
    esmOnlyDeps.forEach(dep => console.log(`  • ${dep}`));
    console.log(
      `${colors.gray}These packages may require 'import' syntax or cause compatibility issues${colors.reset}`
    );
  } else {
    console.log(
      `${colors.green}✓ No ESM-only packages detected in CommonJS project${colors.reset}`
    );
  }
}

// Summary
console.log('');
console.log(`${colors.blue}╔════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║          Audit Summary            ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════╝${colors.reset}`);
console.log('');

if (allIssues.length === 0) {
  console.log(`${colors.green}✓ No deprecated packages found${colors.reset}`);
} else {
  console.log(
    `${colors.yellow}⚠ Found ${allIssues.length} issues with dependencies${colors.reset}`
  );
}

// Next steps
console.log('');
console.log(`${colors.cyan}Recommended Next Steps:${colors.reset}`);
console.log(
  `1. Run ${colors.gray}npm outdated${colors.reset} to see which packages can be updated`
);
console.log(
  `2. Run ${colors.gray}npm update${colors.reset} to update packages within semver range`
);
console.log(`3. For any critical updates, manually adjust versions in package.json`);
console.log(
  `4. If you update dependencies, run ${colors.gray}npm run sxs:setup${colors.reset} to reinstall`
);
console.log('');
