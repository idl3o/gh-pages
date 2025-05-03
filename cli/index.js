#!/usr/bin/env node

/**
 * SxS CLI
 *
 * Main entry point for the StreamChain SxS command-line interface.
 * This CLI provides utilities for managing all aspects of the StreamChain platform.
 */

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Import UI utilities
const { divider } = require('./utils/ui-helpers');
const { printBanner } = require('./utils/ascii-art');

// Import commands
const registerUICommands = require('./commands/ui-demo');
const registerContentCommands = require('./commands/content');
const registerAnalyzeCommands = require('./commands/analyze');
const registerBlockchainCommands = require('./commands/blockchain');
const registerTokenCommands = require('./commands/token');
const registerArtCommands = require('./commands/art');
const registerWelcomeCommand = require('./commands/welcome');
const registerFourierCommands = require('./commands/fourier');
const registerRSSCommands = require('./commands/rss');

// Get package info
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Display ASCII art banner - only when not executing a subcommand
const isDirectCommand = process.argv.length <= 3;

// Setup program info
program
  .name('sxs')
  .description('StreamChain SxS - Development & Deployment Platform')
  .version(packageJson.version);

// Register welcome command before other commands
registerWelcomeCommand(program);

// Register command modules
registerUICommands(program);
registerContentCommands(program);
registerAnalyzeCommands(program);
registerBlockchainCommands(program);
registerTokenCommands(program);
registerArtCommands(program);
registerFourierCommands(program);
registerRSSCommands(program);

// Register basic commands
program
  .command('build')
  .description('Build the project')
  .option('-s, --static', 'Build static files only')
  .option('-j, --jekyll', 'Force Jekyll build')
  .option('-g, --github', 'Build for GitHub Pages')
  .action(options => {
    console.log(chalk.blue('🔨 Building project...'));
    // Logic will be added in full implementation
  });

program
  .command('deploy')
  .description('Deploy to GitHub Pages')
  .option('-b, --backup', 'Create backup before deploying')
  .action(options => {
    console.log(chalk.blue('🚀 Deploying project...'));
    // Logic will be added in full implementation
  });

program
  .command('backup')
  .description('Create a backup')
  .option('-t, --target <target>', 'Backup target (site, docs, all)', 'all')
  .action(options => {
    console.log(chalk.blue('🔄 Creating backup...'));
    // Logic will be added in full implementation
  });

program
  .command('restore')
  .description('Restore from a backup')
  .option('-l, --latest', 'Restore latest backup')
  .action(options => {
    console.log(chalk.blue('🔄 Restoring from backup...'));
    // Logic will be added in full implementation
  });

// Global help formatting
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: cmd => chalk.green(cmd.name()) + chalk.gray(cmd.usage() || '')
});

// Custom help display
program.addHelpText('beforeAll', () => {
  // Don't duplicate banner if already shown
  if (isDirectCommand) return '';

  return printBanner('default', {
    textColor: 'cyan',
    subtitle: `StreamChain Experience System v${packageJson.version}`
  });
});

program.addHelpText('afterAll', () => {
  return `
${chalk.yellow('Examples:')}
  sxs build                   # Build the project
  sxs deploy                  # Deploy to GitHub Pages
  sxs backup                  # Create a backup
  sxs restore --latest        # Restore latest backup
  sxs ui                      # Demonstrate UI components
  sxs content list            # List all content files
  sxs content create          # Create new content
  sxs analyze performance     # Run performance analysis
  sxs analyze links           # Check for broken links
  sxs blockchain init         # Initialize blockchain project
  sxs blockchain deploy       # Deploy smart contracts
  sxs token create            # Create a new token contract
`;
});

// Parse arguments or show help
if (!process.argv.slice(2).length) {
  program.help();
} else {
  program.parse(process.argv);
}
