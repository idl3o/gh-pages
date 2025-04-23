/**
 * Welcome Command
 *
 * First-time user onboarding and command guide
 */

const chalk = require('chalk');
const { printBanner } = require('../utils/ascii-art');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

/**
 * Register welcome command
 * @param {object} program Commander program instance
 */
function registerWelcomeCommand(program) {
  program.option('--welcome', 'Show welcome guide for first-time users', false);

  // Handler for the welcome flag
  program.hook('preAction', (thisCommand, actionCommand) => {
    if (program.opts().welcome) {
      showWelcomeGuide();
      process.exit(0); // Exit after showing welcome guide
    }
  });
}

/**
 * Show welcome guide for new users
 */
function showWelcomeGuide() {
  // Show the welcome banner
  printBanner('streamchain', {
    textColor: 'cyan',
    subtitle: 'Welcome to StreamChain Experience System (SxS CLI)'
  });

  console.log(chalk.white('\nThank you for using the StreamChain Experience System CLI!'));
  console.log(chalk.gray('This guide will help you get started with the CLI.\n'));

  // Basic info section
  console.log(chalk.cyan('✨ Getting Started'));
  console.log(
    chalk.white('The SxS CLI provides tools for managing your StreamChain Web3 platform:')
  );

  // Core features
  const features = [
    { name: 'Content Management', command: 'sxs content', desc: 'Create and manage content' },
    { name: 'Site Analytics', command: 'sxs analyze', desc: 'Analyze site performance' },
    { name: 'Blockchain Tools', command: 'sxs blockchain', desc: 'Manage blockchain projects' },
    { name: 'Token Generation', command: 'sxs token', desc: 'Create and deploy tokens' },
    { name: 'Dashboard Management', command: 'sxs dashboard', desc: 'Manage creator dashboard' }
  ];

  console.log('');
  features.forEach(feature => {
    console.log(`${chalk.green('•')} ${chalk.white(feature.name)}: ${chalk.gray(feature.desc)}`);
    console.log(`  ${chalk.gray('Command:')} ${chalk.cyan(feature.command)}`);
  });

  console.log('\n' + chalk.cyan('🚀 First Commands to Try'));
  console.log(chalk.white('Here are some commands to get you started:'));

  console.log(`\n1. ${chalk.cyan('sxs --help')} - Show all available commands`);
  console.log(`2. ${chalk.cyan('sxs art demo')} - See the CLI's ASCII art capabilities`);
  console.log(`3. ${chalk.cyan('sxs ui')} - Explore UI components`);
  console.log(`4. ${chalk.cyan('sxs content list')} - List all content files`);
  console.log(`5. ${chalk.cyan('sxs analyze size')} - Analyze site file sizes\n`);

  // Show system info
  console.log(chalk.cyan('💻 System Information'));
  console.log(`${chalk.gray('Node.js:')} ${process.version}`);
  console.log(`${chalk.gray('OS:')} ${process.platform} ${process.arch}`);
  try {
    const packageInfo = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8')
    );
    console.log(`${chalk.gray('SxS Version:')} ${packageInfo.version}`);
  } catch (err) {
    console.log(`${chalk.gray('SxS Version:')} unknown`);
  }

  // Ask the user what they want to do next
  promptNextAction();
}

/**
 * Ask the user what they want to do next
 */
async function promptNextAction() {
  console.log('\n' + chalk.cyan('🤔 What would you like to do now?'));

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select an action:',
      choices: [
        { name: 'Show available commands', value: 'help' },
        { name: 'Try a demo command', value: 'demo' },
        { name: 'Check project status', value: 'status' },
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);

  switch (answer.action) {
    case 'help':
      console.log('\nShowing available commands:\n');
      try {
        execSync('node cli/index.js --help', { stdio: 'inherit' });
      } catch (error) {
        // Ignore error
      }
      break;
    case 'demo':
      console.log('\nShowing ASCII art demo:\n');
      try {
        execSync('node cli/index.js art demo', { stdio: 'inherit' });
      } catch (error) {
        // Ignore error
      }
      break;
    case 'status':
      console.log('\nChecking project status:\n');
      try {
        console.log(chalk.cyan('📂 Project Structure'));

        // Check for key directories
        const dirs = ['cli', 'scripts', 'docs', 'blockchain'];
        dirs.forEach(dir => {
          const dirPath = path.join(__dirname, '..', '..', dir);
          if (fs.existsSync(dirPath)) {
            console.log(`${chalk.green('✓')} ${dir}/ directory found`);
          } else {
            console.log(`${chalk.yellow('⚠')} ${dir}/ directory not found`);
          }
        });

        console.log('');
      } catch (error) {
        console.error(chalk.red('Error checking status:', error.message));
      }
      break;
    case 'exit':
      console.log(chalk.green('\nThank you for using SxS CLI! 👋'));
      console.log(chalk.gray('Run "npm run sxs" anytime to use the CLI again.\n'));
      break;
  }
}

module.exports = registerWelcomeCommand;
