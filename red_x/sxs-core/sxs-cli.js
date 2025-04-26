#!/usr/bin/env node

/**
 * SxS CLI
 * Command line interface for the RED X project
 * Created: April 26, 2025
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const NLPHandler = require('./nlp-handler');
const CLIHandler = require('./cli-handler');

// Initialize the CLI handler
const cliHandler = new CLIHandler();

// Initialize the NLP handler
const nlpHandler = new NLPHandler(cliHandler);

/**
 * Process CLI arguments
 */
async function processArguments() {
  // Check if running directly with nodejs
  const args = process.argv.slice(2);

  // If no arguments provided, show help
  if (args.length === 0) {
    showHelp();
    return;
  }

  const userInput = args.join(' ');

  // Process the input
  await processInput(userInput);
}

/**
 * Process user input (from CLI args or interactive mode)
 */
async function processInput(input) {
  try {
    // Check if this appears to be natural language or direct command
    if (nlpHandler.isNaturalLanguage(input)) {
      // Process as natural language
      await nlpHandler.processNaturalLanguage(input);
    } else {
      // Process as direct command
      cliHandler.processCommand(input.split(' '));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (error.stack) {
      console.debug(chalk.gray(error.stack));
    }
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(chalk.cyan('\nRED X CLI Help'));
  console.log(chalk.cyan('=============='));
  console.log('\nYou can use either natural language commands or direct CLI syntax:');

  console.log('\n' + chalk.green('Natural Language Examples:'));
  console.log('  "build the web version"');
  console.log('  "start the server on port 3000"');
  console.log('  "show me the network status"');
  console.log('  "visualize the network topology"');

  console.log('\n' + chalk.green('Direct Command Examples:'));
  console.log('  web            - Build the web version');
  console.log('  native         - Build the native version');
  console.log('  server --port 3000  - Start the server on port 3000');
  console.log('  status         - Show node status');
  console.log('  help           - Show this help');

  console.log('\n' + chalk.green('Interactive Features:'));
  console.log('  - Use conversational follow-ups for enhanced workflow');
  console.log('  - Network visualization with different layouts (radial, hierarchical, matrix)');
  console.log('  - Context-aware command processing');

  console.log('\nFor more information, visit: https://github.com/sam/red-x\n');
}

// Start processing
processArguments();

module.exports = {
  processInput
};
