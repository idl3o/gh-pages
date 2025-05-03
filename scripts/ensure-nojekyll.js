/**
 * Ensure .nojekyll file exists
 * Cross-platform solution that works on both Windows and Unix systems
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const rootDir = path.join(__dirname, '..');
const nojekyllPath = path.join(rootDir, '.nojekyll');

console.log(chalk.blue('Ensuring .nojekyll file exists...'));

if (!fs.existsSync(nojekyllPath)) {
  console.log(chalk.gray('Creating .nojekyll file'));
  fs.writeFileSync(nojekyllPath, '');
  console.log(chalk.green('✓ .nojekyll file created'));
} else {
  console.log(chalk.green('✓ .nojekyll file already exists'));
}
