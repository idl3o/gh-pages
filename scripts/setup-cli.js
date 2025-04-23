/**
 * CLI Setup Script
 *
 * Installs all necessary dependencies for the SxS CLI
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
  cyan: '\x1b[36m'
};

console.log(`${colors.blue}┌─────────────────────────────────┐${colors.reset}`);
console.log(`${colors.blue}│     StreamChain SxS CLI Setup   │${colors.reset}`);
console.log(`${colors.blue}└─────────────────────────────────┘${colors.reset}`);
console.log('');

// Required dependencies for CLI
const dependencies = [
  'commander',
  'inquirer@8.2.5', // Specify version 8 for CommonJS compatibility
  'chalk@4.1.2', // Using v4 for CommonJS compatibility
  'ora@5.4.1', // Using v5 for CommonJS compatibility
  'cli-table3',
  'dotenv',
  'figlet' // For more ASCII art options
];

console.log(`${colors.cyan}Checking for required dependencies...${colors.reset}`);

// Create node_modules directory if it doesn't exist
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log(`${colors.yellow}Creating node_modules directory${colors.reset}`);
  fs.mkdirSync(nodeModulesPath, { recursive: true });
}

// Check and install each dependency
for (const dep of dependencies) {
  const depName = dep.split('@')[0]; // Extract package name without version
  const depPath = path.join(nodeModulesPath, depName);

  try {
    // Check if dependency exists
    require.resolve(depName);
    console.log(`${colors.green}✓ ${depName} is already installed${colors.reset}`);
  } catch (err) {
    console.log(`${colors.yellow}Installing ${dep}...${colors.reset}`);
    try {
      execSync(`npm install ${dep}`, { stdio: 'inherit' });
      console.log(`${colors.green}✓ ${depName} installed successfully${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Failed to install ${depName}: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }
}

console.log('');
console.log(`${colors.green}✓ All dependencies installed successfully!${colors.reset}`);

// Setup CLI for global usage
console.log('');
console.log(`${colors.cyan}Setting up CLI for global usage...${colors.reset}`);

try {
  // Make CLI file executable (Linux/Mac only)
  if (process.platform !== 'win32') {
    const cliPath = path.join(__dirname, '..', 'cli', 'index.js');
    fs.chmodSync(cliPath, '755');
    console.log(`${colors.green}✓ Made CLI executable${colors.reset}`);
  }

  // Create CLI shortcut
  console.log(`${colors.yellow}Creating global CLI link...${colors.reset}`);
  execSync('npm link', { stdio: 'inherit' });
  console.log(`${colors.green}✓ CLI linked globally${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ Failed to setup global CLI: ${error.message}${colors.reset}`);
  console.log(`${colors.yellow}You can still use the CLI via npm scripts${colors.reset}`);
}

console.log('');
console.log(`${colors.blue}┌─────────────────────────────────┐${colors.reset}`);
console.log(`${colors.blue}│     Setup Complete! 🎉          │${colors.reset}`);
console.log(`${colors.blue}└─────────────────────────────────┘${colors.reset}`);
console.log('');
console.log(`To get started, run: ${colors.cyan}npm run sxs:start${colors.reset}`);
console.log(`Or use the global command: ${colors.cyan}sxs${colors.reset}`);
console.log('');
