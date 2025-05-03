#!/usr/bin/env node

/**
 * Configuration CLI Tool
 *
 * This script provides a command-line interface for managing the configuration.
 *
 * Usage:
 *   node cfig.js get <path>
 *   node cfig.js set <path> <value>
 *   node cfig.js list
 *   node cfig.js env [environment]
 *   node cfig.js features
 */

const cfig = require('../utils/cfig');
const chalk = require('chalk');

/**
 * Parse arguments from command line
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'get':
      if (!args[1]) {
        console.error(chalk.red('Error: Path argument is required for get command'));
        showHelp();
        process.exit(1);
      }
      return { command, path: args[1] };

    case 'set':
      if (!args[1] || !args[2]) {
        console.error(chalk.red('Error: Path and value arguments are required for set command'));
        showHelp();
        process.exit(1);
      }
      return {
        command,
        path: args[1],
        value: parseValue(args[2])
      };

    case 'list':
      return { command };

    case 'env':
      return {
        command,
        environment: args[1] || cfig.environment
      };

    case 'features':
      return { command };

    case 'help':
    default:
      return { command: 'help' };
  }
}

/**
 * Parse a value string into the appropriate type
 */
function parseValue(valueStr) {
  // Check if value is a number
  if (!isNaN(valueStr)) {
    return Number(valueStr);
  }

  // Check if value is boolean
  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;

  // Check if value is null
  if (valueStr === 'null') return null;

  // Check if value is an object or array (JSON)
  if ((valueStr.startsWith('{') && valueStr.endsWith('}')) ||
      (valueStr.startsWith('[') && valueStr.endsWith(']'))) {
    try {
      return JSON.parse(valueStr);
    } catch (e) {
      // Not valid JSON, treat as string
    }
  }

  // Default to string
  return valueStr;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(chalk.blue('\nWeb3 Crypto Streaming Service - Configuration Tool\n'));
  console.log('Usage:');
  console.log('  node cfig.js get <path>          Get a configuration value');
  console.log('  node cfig.js set <path> <value>  Set a configuration value');
  console.log('  node cfig.js list                List all configuration');
  console.log('  node cfig.js env [environment]   Show environment-specific configuration');
  console.log('  node cfig.js features            List all feature flags');
  console.log('  node cfig.js help                Show this help information\n');

  console.log('Examples:');
  console.log('  node cfig.js get ui.theme');
  console.log('  node cfig.js set ui.theme dark');
  console.log('  node cfig.js set features.experimentalFeatures.nftIntegration true');
  console.log('  node cfig.js env production');
}

/**
 * Print an object with formatting
 */
function printObject(obj, indent = 0) {
  const padding = ' '.repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      console.log(`${padding}${chalk.cyan(key)}:`);
      printObject(value, indent + 2);
    } else {
      const valueColor = typeof value === 'boolean' ?
        (value ? chalk.green : chalk.red) :
        typeof value === 'number' ? chalk.yellow : chalk.white;

      console.log(`${padding}${chalk.cyan(key)}: ${valueColor(value)}`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Load configuration
    cfig.load();

    const args = parseArgs();

    switch (args.command) {
      case 'get':
        const value = cfig.get(args.path);
        if (typeof value === 'object' && value !== null) {
          console.log(`${chalk.cyan(args.path)}:`);
          printObject(value, 2);
        } else {
          console.log(`${chalk.cyan(args.path)}: ${value}`);
        }
        break;

      case 'set':
        cfig.set(args.path, args.value);
        cfig.save();
        console.log(chalk.green(`Set ${args.path} to:`), args.value);
        break;

      case 'list':
        console.log(chalk.blue('\nCurrent Configuration:\n'));
        printObject(cfig.config);
        break;

      case 'env':
        console.log(chalk.blue(`\nEnvironment: ${chalk.yellow(args.environment)}\n`));
        const envConfig = cfig.get(`environment.${args.environment}`);
        printObject(envConfig);
        break;

      case 'features':
        console.log(chalk.blue('\nFeature Flags:\n'));
        const features = cfig.get('features');

        // List regular features
        Object.entries(features)
          .filter(([key, value]) => typeof value === 'boolean')
          .forEach(([key, value]) => {
            const icon = value ? chalk.green('✓') : chalk.red('✗');
            console.log(`${icon} ${key}`);
          });

        // List experimental features
        if (features.experimentalFeatures) {
          console.log(chalk.yellow('\nExperimental Features:\n'));
          Object.entries(features.experimentalFeatures).forEach(([key, value]) => {
            const icon = value ? chalk.green('✓') : chalk.red('✗');
            console.log(`${icon} ${key}`);
          });
        }
        break;

      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Run the CLI
main();
