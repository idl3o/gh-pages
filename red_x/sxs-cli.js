#!/usr/bin/env node

/**
 * RED X CLI Tool
 * This script provides a command-line interface for accessing RED X functionality
 */

// Core dependencies
const path = require('path');
const fs = require('fs');

// Command processing
function processCommand(args) {
  // Remove 'node' and script path from arguments if present
  const cleanArgs = args.filter(arg => !arg.includes('node') && !arg.includes('sxs-cli.js'));

  if (cleanArgs.length === 0) {
    showHelp();
    return;
  }

  const command = cleanArgs[0];
  const commandArgs = cleanArgs.slice(1);

  switch (command) {
    case 'help':
      showHelp();
      break;
    case 'status':
      showStatus();
      break;
    case 'analyze':
      analyze(commandArgs);
      break;
    case 'visualize':
      visualize(commandArgs);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      showHelp();
  }
}

// Command implementations
function showHelp() {
  console.log(`
RED X Command Line Interface
===========================

Available commands:
  help                 - Show this help message
  status               - Show the current status of RED X
  analyze <file|dir>   - Analyze a contract or directory of contracts
  visualize <file>     - Generate visualization for a contract
`);
}

function showStatus() {
  console.log('RED X Status: Active');
  console.log('Version: 1.0.0');

  // Check for critical dependencies
  try {
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log(`\nDependencies:`);

      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      Object.keys(deps).forEach(dep => {
        console.log(`- ${dep}: ${deps[dep]}`);
      });
    }
  } catch (err) {
    console.log('Error loading package dependencies:', err.message);
  }
}

function analyze(args) {
  if (args.length === 0) {
    console.log('Error: Please specify a file or directory to analyze');
    return;
  }

  const target = args[0];
  console.log(`Analyzing: ${target}`);

  try {
    if (!fs.existsSync(target)) {
      console.log(`Error: File or directory not found: ${target}`);
      return;
    }

    if (fs.statSync(target).isDirectory()) {
      console.log('Scanning directory for Solidity contracts...');
      // Directory analysis logic would go here
    } else {
      // Single file analysis
      const fileContent = fs.readFileSync(target, 'utf8');
      console.log(`Read ${fileContent.length} bytes from ${target}`);
      console.log('Analysis complete. Results would be displayed here.');
    }
  } catch (err) {
    console.log(`Error during analysis: ${err.message}`);
  }
}

function visualize(args) {
  if (args.length === 0) {
    console.log('Error: Please specify a file to visualize');
    return;
  }

  const target = args[0];
  console.log(`Generating visualization for: ${target}`);

  try {
    if (!fs.existsSync(target)) {
      console.log(`Error: File not found: ${target}`);
      return;
    }

    console.log('Visualization complete. Results would be displayed in the web interface.');
  } catch (err) {
    console.log(`Error during visualization: ${err.message}`);
  }
}

// Main execution
try {
  processCommand(process.argv);
} catch (err) {
  console.error('Error executing command:', err.message);
  process.exit(1);
}
