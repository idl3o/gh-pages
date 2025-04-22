const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

/**
 * Cross-platform solution to serve Jekyll site for development
 */
function serveJekyll() {
  console.log(chalk.blue('Starting Jekyll development server...'));

  try {
    // Check if Ruby is installed
    try {
      execSync('ruby -v', { stdio: 'pipe' });
    } catch (error) {
      console.log(chalk.red('Ruby not found. Cannot start Jekyll server.'));
      console.log(
        chalk.yellow(
          'Please install Ruby: https://www.ruby-lang.org/en/documentation/installation/'
        )
      );
      return false;
    }

    // Check if bundle command is available
    try {
      execSync('bundle -v', { stdio: 'pipe' });
    } catch (error) {
      console.log(chalk.red('Bundler not found. Cannot start Jekyll server.'));
      console.log(chalk.yellow('Please install Bundler: gem install bundler'));
      return false;
    }

    // Run bundle check/install
    try {
      execSync('bundle check', { stdio: 'inherit' });
    } catch (error) {
      console.log(chalk.yellow('Running bundle install...'));
      execSync('bundle install', { stdio: 'inherit' });
    }

    // Start Jekyll server
    console.log(chalk.blue('Starting Jekyll server...'));
    const jekyll = spawn('bundle', ['exec', 'jekyll', 'serve', '--livereload'], {
      stdio: 'inherit',
      shell: true
    });

    jekyll.on('error', error => {
      console.log(chalk.red('Failed to start Jekyll server:'), error.message);
    });

    return true;
  } catch (error) {
    console.log(chalk.red('Jekyll server failed:'), error.message);
    return false;
  }
}

serveJekyll();
