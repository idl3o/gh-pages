/**
 * ASCII Art Commands
 *
 * Commands for displaying and managing ASCII art
 */

const chalk = require('chalk');
const { listBanners, printBanner } = require('../utils/ascii-art');

/**
 * Register art commands
 * @param {object} program Commander program instance
 */
function registerArtCommands(program) {
  const art = program.command('art').description('ASCII art commands');

  art
    .command('show')
    .description('Show an ASCII art banner')
    .argument('[name]', 'Banner name', 'default')
    .option('-c, --color <color>', 'Text color', 'cyan')
    .option('-b, --background <color>', 'Background color')
    .option('-B, --bold', 'Bold text', false)
    .option('-f, --frame', 'Show with frame', false)
    .option('-s, --subtitle <text>', 'Add subtitle')
    .action((name, options) => {
      printBanner(name, {
        textColor: options.color,
        backgroundColor: options.background,
        bold: options.bold,
        frame: options.frame,
        subtitle: options.subtitle
      });
    });

  art
    .command('list')
    .description('List available ASCII art banners')
    .action(() => {
      console.log(chalk.cyan('\nAvailable ASCII Art Banners:'));
      listBanners();
      console.log('\nUse with: sxs art show [banner-name] [options]');
      console.log('Example: sxs art show blockchain --color green --frame');
    });

  art
    .command('demo')
    .description('Show all available ASCII art banners')
    .action(() => {
      console.log(chalk.cyan('\n=== ASCII Art Banner Demo ===\n'));

      // Default banner
      console.log(chalk.yellow('Default Banner:'));
      printBanner('default', { textColor: 'cyan' });

      // StreamChain banner
      console.log(chalk.yellow('StreamChain Banner:'));
      printBanner('streamchain', { textColor: 'blue' });

      // Blockchain banner
      console.log(chalk.yellow('Blockchain Banner:'));
      printBanner('blockchain', { textColor: 'green' });

      // Token banner
      console.log(chalk.yellow('Token Banner:'));
      printBanner('token', { textColor: 'magenta' });

      // Content banner
      console.log(chalk.yellow('Content Banner:'));
      printBanner('content', { textColor: 'yellow' });

      // Analytics banner
      console.log(chalk.yellow('Analytics Banner:'));
      printBanner('analytics', { textColor: 'red' });

      // Framed example
      console.log(chalk.yellow('Framed Banner Example:'));
      printBanner('default', {
        textColor: 'cyan',
        frame: true,
        subtitle: 'This is a framed banner with subtitle'
      });
    });

  return art;
}

module.exports = registerArtCommands;
