/**
 * UI Demo Command
 *
 * Demonstrates the UI components available in the SxS CLI
 */

const chalk = require('chalk');
const {
  Spinner,
  ProgressBar,
  Suggestions,
  Notifications,
  divider,
  log
} = require('../utils/ui-helpers');

/**
 * Register UI demo command
 * @param {object} program Commander program instance
 */
function registerUICommands(program) {
  const ui = program
    .command('ui')
    .description('UI demonstration and utilities')
    .action(() => {
      console.log(chalk.blue('\n🎨 SxS UI Components Demonstration'));
      console.log(divider());
      console.log(
        'This command demonstrates the various UI components available in the SxS CLI.\n'
      );

      // Create a suggestions system
      const suggestions = new Suggestions();

      // Add some suggestions for the UI demo
      suggestions.add('ui', [
        {
          text: 'Try the spinner demo',
          command: 'sxs ui spinner'
        },
        {
          text: 'Progress bar is useful for long operations',
          command: 'sxs ui progress'
        },
        {
          text: 'Notifications provide unobtrusive feedback',
          command: 'sxs ui notify'
        }
      ]);

      suggestions.recordCommand('ui', {});
      suggestions.showRelevantSuggestions();
    });

  ui.command('spinner')
    .description('Demonstrate spinner component')
    .action(() => {
      console.log(chalk.blue('\n🔄 Spinner Demonstration'));
      console.log(divider());

      const spinner = new Spinner('Loading project configuration');

      spinner.start();

      // Simulate a series of loading steps
      setTimeout(() => {
        spinner.setText('Checking dependencies');

        setTimeout(() => {
          spinner.setText('Processing files');

          setTimeout(() => {
            spinner.setText('Finalizing');

            setTimeout(() => {
              spinner.succeed('Operation completed successfully');

              // Show another spinner with failure
              const errorSpinner = new Spinner('Connecting to remote server');
              errorSpinner.start();

              setTimeout(() => {
                errorSpinner.fail('Connection refused');

                // Show warning spinner
                const warnSpinner = new Spinner('Checking for updates');
                warnSpinner.start();

                setTimeout(() => {
                  warnSpinner.warn('Update available but not critical');

                  // Show suggestion
                  const suggestionSpinner = new Spinner('Analyzing project structure');
                  suggestionSpinner.start();

                  setTimeout(() => {
                    suggestionSpinner.suggest('Consider organizing files by feature');
                    console.log('\nSpinner demonstration completed.');
                  }, 1500);
                }, 1500);
              }, 1500);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    });

  ui.command('progress')
    .description('Demonstrate progress bar component')
    .action(() => {
      console.log(chalk.blue('\n📊 Progress Bar Demonstration'));
      console.log(divider());

      const progress = new ProgressBar(100, {
        format: 'Downloading [:bar] :percent :etas remaining'
      });

      progress.start();

      let current = 0;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 5) + 1;
        progress.update(current);

        if (current >= 100) {
          clearInterval(interval);
          console.log(chalk.green('Download completed!'));

          // Start another progress bar for extraction
          console.log('\nExtracting files:');
          const extractProgress = new ProgressBar(100, {
            format: 'Extracting [:bar] :percent',
            complete: '▰',
            incomplete: '▱'
          });

          extractProgress.start();

          let extractCurrent = 0;
          const extractInterval = setInterval(() => {
            extractCurrent += Math.floor(Math.random() * 10) + 5;
            extractProgress.update(extractCurrent);

            if (extractCurrent >= 100) {
              clearInterval(extractInterval);
              console.log(chalk.green('Extraction completed!'));
              console.log('\nProgress bar demonstration completed.');
            }
          }, 200);
        }
      }, 100);
    });

  ui.command('notify')
    .description('Demonstrate notification component')
    .action(() => {
      console.log(chalk.blue('\n🔔 Notification Demonstration'));
      console.log(divider());

      const notifications = new Notifications({
        displayTime: 2000
      });

      console.log('Showing a series of notifications:');

      // Queue up several notifications
      notifications.add('Project initialized successfully', 'success');
      notifications.add('Configuration file loaded', 'info');
      notifications.add('Ruby not found in PATH', 'warning');
      notifications.add('Failed to connect to remote server', 'error');

      // Wrap up after all notifications
      setTimeout(() => {
        console.log('\nNotification demonstration completed.');
      }, 10000);
    });

  return ui;
}

module.exports = registerUICommands;
