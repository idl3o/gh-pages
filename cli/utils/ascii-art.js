/**
 * ASCII Art Generator
 *
 * Provides ASCII art banners for the SxS CLI
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Collection of ASCII art banners
const banners = {
  // Main SxS banner
  default:
    `
  .d8888b.                 .d8888b.
  d88P  Y88b               d88P  Y88b
  Y88b.                    Y88b.
   "Y888b.   888  888  888  "Y888b.
      "Y88b. ` +
    chalk.cyan('888') +
    `  ` +
    chalk.cyan('888') +
    `  ` +
    chalk.cyan('888') +
    `     "Y88b.
        "888 888  888  888       "888
  Y88b  d88P Y88b 888 d88P Y88b  d88P
   "Y8888P"   "Y8888888P"   "Y8888P"
  `,

  // StreamChain logo
  streamchain: `
   _______ __                             ______ __         __
  |     __|  |_.----.-----.---.-.--------.|      |  |--.---.|  |--.
  |__     |   _|   _|  -__|  _  |        ||   ---|     |  _||    <
  |_______|____|__| |_____|___._|__|__|__||______|__|__|___||__|__|
  `,

  // Blockchain banner
  blockchain: `
   _____  __    ____  ________ __ ______ __  _____ ____ ____ _   __
  | __  |/  \\  /    \\|        |  |   __ \\  |/     \\|   |    | \\_/  |
  | __ -|    ||  ()  |   -   |  |      <  ||  --  ||   |    |       |
  |_____|__/\\__|\\____/|__|__|___|___|__|__||_____/|___|____|___|___|
  `,

  // Token banner
  token: `
   _____ _____ _   _ _____ _   _
  |_   _|  _  | | / |  ___|/   |
    | | | | | | |/ /| |__ / /| |
    | | | | | |    \\|  __/ /_| |
    | | \\ \\_/ | |\\  | |__|\\___  |
    \\_/  \\___/\\_| \\_\\____/    |_/
  `,

  // Content banner
  content: `
    _____ _____ _   _ _____ _____ _   _ _____
   /  __ \\  _  | \\ | |_   _|  ___| \\ | |_   _|
   | /  \\/ | | |  \\| | | | | |__ |  \\| | | |
   | |   | | | | . \` | | | |  __|| . \` | | |
   | \\__/\\ \\_/ / |\\  | | | | |___| |\\  | | |
    \\____/\\___/\\_| \\_/ \\_/ \\____/\\_| \\_/ \\_/
  `,

  // Analytics banner
  analytics: `
    _____ _   _  _____ _____  _____ _____ _____ _____  _____
   |  _  | \\ | |/  _  |_   _||  _  |_   _|_   _|  __ \\/ ____|
   | | | |  \\| || | | | | |  | | | | | |   | | | |  \\/| (___
   | | | | . \` || | | | | |  | | | | | |   | | | | __  \\___ \\
   \\ \\_/ / |\\  |\\ \\_/ / | |  | |/ / _| |_  | | | |_\\ \\ ____) |
    \\___/\\_| \\_/ \\___/  \\_/  |___/ |_____| |_/  \\____/|_____/
  `
};

/**
 * Get ASCII art banner with optional styling
 * @param {string} name Banner name
 * @param {object} options Style options
 * @returns {string} Styled ASCII art
 */
function getBanner(name = 'default', options = {}) {
  const banner = banners[name] || banners.default;
  const { textColor = 'blue', backgroundColor = null, bold = false, frame = false } = options;

  let styled = banner;

  // Apply text color
  if (textColor && chalk[textColor]) {
    styled = chalk[textColor](styled);
  }

  // Apply background color
  if (
    backgroundColor &&
    chalk[`bg${backgroundColor.charAt(0).toUpperCase() + backgroundColor.slice(1)}`]
  ) {
    styled =
      chalk[`bg${backgroundColor.charAt(0).toUpperCase() + backgroundColor.slice(1)}`](styled);
  }

  // Apply bold style
  if (bold && chalk.bold) {
    styled = chalk.bold(styled);
  }

  // Add frame
  if (frame) {
    const lines = styled.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const border = chalk.gray('─'.repeat(maxLength + 4));

    styled = `${border}\n${lines.map(line => chalk.gray('│ ') + line + ' '.repeat(maxLength - line.length) + chalk.gray(' │')).join('\n')}\n${border}`;
  }

  return styled;
}

/**
 * Print a banner to the console
 * @param {string} name Banner name
 * @param {object} options Style options
 */
function printBanner(name = 'default', options = {}) {
  console.log('\n' + getBanner(name, options));

  if (options.subtitle) {
    console.log('\n' + chalk.gray(options.subtitle));
  }

  console.log(); // Add newline after banner
}

/**
 * Save a banner to a file
 * @param {string} name Banner name
 * @param {string} outputPath File path
 * @param {object} options Style options
 */
function saveBanner(name, outputPath, options = {}) {
  const banner = getBanner(name, options);
  fs.writeFileSync(outputPath, banner);
  console.log(`Banner saved to ${outputPath}`);
}

/**
 * List available banners
 */
function listBanners() {
  console.log(chalk.cyan('Available banners:'));
  Object.keys(banners).forEach(name => {
    console.log(`- ${name}`);
  });
}

// Execute if run directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const name = args[0] || 'default';

  if (name === '--list' || name === '-l') {
    listBanners();
  } else if (name === '--help' || name === '-h') {
    console.log(`
Usage: node ascii-art.js [banner-name] [options]

Options:
  --list, -l    List available banners
  --help, -h    Show this help message
  --save=FILE   Save banner to a file
  --color=COLOR Set text color
  --bg=COLOR    Set background color
  --bold        Apply bold style
  --frame       Add a frame around the banner
  --subtitle=TEXT Add subtitle text under the banner

Examples:
  node ascii-art.js
  node ascii-art.js streamchain
  node ascii-art.js token --color=green --bold
  node ascii-art.js blockchain --frame --subtitle="Blockchain Management Tools"
`);
  } else {
    // Parse options
    const options = {};
    args.slice(1).forEach(arg => {
      if (arg.startsWith('--color=')) {
        options.textColor = arg.split('=')[1];
      } else if (arg.startsWith('--bg=')) {
        options.backgroundColor = arg.split('=')[1];
      } else if (arg === '--bold') {
        options.bold = true;
      } else if (arg === '--frame') {
        options.frame = true;
      } else if (arg.startsWith('--subtitle=')) {
        options.subtitle = arg.split('=')[1];
      } else if (arg.startsWith('--save=')) {
        const outputPath = arg.split('=')[1];
        saveBanner(name, outputPath, options);
        return;
      }
    });

    printBanner(name, options);
  }
}

module.exports = {
  getBanner,
  printBanner,
  listBanners
};
