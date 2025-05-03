/**
 * UI Helpers
 *
 * Provides consistent UI elements for the SxS CLI
 * including spinners, progress bars, and other visual feedback
 */

const readline = require('readline');
const chalk = require('chalk');

// Spinner frames for loading animation
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const suggestionSymbol = '💡';
const successSymbol = '✓';
const errorSymbol = '✗';
const warningSymbol = '⚠️';

/**
 * Create a spinner that shows a loading animation
 */
class Spinner {
  constructor(text = 'Loading...', stream = process.stdout) {
    this.text = text;
    this.stream = stream;
    this.frame = 0;
    this.interval = null;
    this.isSpinning = false;
    this.startTime = null;
    this.prefixColor = chalk.blue;
  }

  /**
   * Start the spinner
   */
  start(text) {
    if (text) this.text = text;
    if (this.isSpinning) return this;

    this.isSpinning = true;
    this.startTime = Date.now();

    // Hide cursor
    this.stream.write('\u001B[?25l');

    this.render();
    this.interval = setInterval(() => {
      this.render();
    }, 80);

    return this;
  }

  /**
   * Stop the spinner
   */
  stop() {
    if (!this.isSpinning) return this;

    clearInterval(this.interval);
    this.interval = null;
    this.isSpinning = false;

    // Clear the spinner line
    readline.clearLine(this.stream, 0);
    readline.cursorTo(this.stream, 0);

    // Show cursor
    this.stream.write('\u001B[?25h');

    return this;
  }

  /**
   * Update spinner text
   */
  setText(text) {
    this.text = text;
    return this;
  }

  /**
   * Render the spinner
   */
  render() {
    const frame = spinnerFrames[(this.frame = ++this.frame % spinnerFrames.length)];
    const elapsed = this.getElapsed();

    // Clear the line and move cursor to start
    readline.clearLine(this.stream, 0);
    readline.cursorTo(this.stream, 0);

    // Write the spinner frame and text
    this.stream.write(`${this.prefixColor(frame)} ${this.text} ${chalk.gray(elapsed)}`);
  }

  /**
   * Get elapsed time as a readable string
   */
  getElapsed() {
    const elapsed = Date.now() - this.startTime;

    if (elapsed < 1000) {
      return `${elapsed}ms`;
    } else {
      return `${(elapsed / 1000).toFixed(1)}s`;
    }
  }

  /**
   * Stop with success message
   */
  succeed(text) {
    return this.stopWithSymbol(successSymbol, text, chalk.green);
  }

  /**
   * Stop with error message
   */
  fail(text) {
    return this.stopWithSymbol(errorSymbol, text, chalk.red);
  }

  /**
   * Stop with warning message
   */
  warn(text) {
    return this.stopWithSymbol(warningSymbol, text, chalk.yellow);
  }

  /**
   * Stop with suggestion
   */
  suggest(text) {
    return this.stopWithSymbol(suggestionSymbol, text, chalk.cyan);
  }

  /**
   * Stop with a custom symbol
   */
  stopWithSymbol(symbol, text, colorFn) {
    this.stop();
    const finalText = text || this.text;
    console.log(`${colorFn(symbol)} ${finalText}`);
    return this;
  }
}

/**
 * Progress bar for showing completion progress
 */
class ProgressBar {
  constructor(total = 100, options = {}) {
    this.total = total;
    this.current = 0;
    this.width = options.width || 40;
    this.complete = options.complete || '█';
    this.incomplete = options.incomplete || '░';
    this.format = options.format || 'progress [:bar] :percent :etas';
    this.stream = options.stream || process.stdout;
    this.startTime = null;
    this.lastRenderTime = 0;
  }

  /**
   * Start the progress bar
   */
  start() {
    this.startTime = Date.now();
    this.render();
    return this;
  }

  /**
   * Update progress
   */
  update(current) {
    this.current = current;

    // Throttle renders to avoid flickering
    const now = Date.now();
    if (now - this.lastRenderTime > 100 || current >= this.total) {
      this.render();
      this.lastRenderTime = now;
    }

    return this;
  }

  /**
   * Increment progress
   */
  increment(amount = 1) {
    return this.update(Math.min(this.current + amount, this.total));
  }

  /**
   * Render the progress bar
   */
  render() {
    const percent = Math.min(Math.floor((this.current / this.total) * 100), 100);
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);

    let remainingTime = '?';
    if (percent > 0) {
      const rate = this.current / elapsed;
      const remaining = Math.round((this.total - this.current) / rate);
      remainingTime = this.formatTime(remaining);
    }

    // Calculate completed and remaining bar portions
    const completedWidth = Math.floor((this.current / this.total) * this.width);
    const bar =
      chalk.cyan(this.complete.repeat(completedWidth)) +
      chalk.gray(this.incomplete.repeat(this.width - completedWidth));

    // Format the output
    const output = this.format
      .replace(':bar', bar)
      .replace(':percent', chalk.yellow(`${percent}%`))
      .replace(':current', String(this.current))
      .replace(':total', String(this.total))
      .replace(':elapsed', this.formatTime(elapsed))
      .replace(':etas', remainingTime);

    // Clear the line and write the progress bar
    readline.clearLine(this.stream, 0);
    readline.cursorTo(this.stream, 0);
    this.stream.write(output);

    // If complete, add a new line
    if (this.current >= this.total) {
      this.stream.write('\n');
    }
  }

  /**
   * Format time in seconds to a readable string
   */
  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m${remainingSeconds}s`;
    }
  }
}

/**
 * Suggestion system that shows recommendations during CLI usage
 */
class Suggestions {
  constructor() {
    this.suggestions = {};
    this.history = [];
  }

  /**
   * Add suggestions for a specific command
   */
  add(command, suggestions) {
    this.suggestions[command] = suggestions;
  }

  /**
   * Record a command in the history
   */
  recordCommand(command, args) {
    this.history.push({ command, args, timestamp: Date.now() });

    // Keep history size manageable
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * Show relevant suggestions based on command history
   */
  showRelevantSuggestions() {
    if (this.history.length === 0) return;

    const lastCommand = this.history[this.history.length - 1];
    const suggestions = this.suggestions[lastCommand.command];

    if (suggestions && suggestions.length > 0) {
      console.log('');
      console.log(chalk.cyan(`${suggestionSymbol} Suggestions:`));

      suggestions.forEach((suggestion, i) => {
        if (typeof suggestion === 'string') {
          console.log(chalk.gray(`  ${i + 1}. ${suggestion}`));
        } else if (typeof suggestion === 'object') {
          console.log(chalk.gray(`  ${i + 1}. ${suggestion.text}`));
          if (suggestion.command) {
            console.log(chalk.gray(`     Run: ${chalk.white(suggestion.command)}`));
          }
        }
      });

      console.log('');
    }
  }
}

/**
 * Notification system for showing toast-like messages
 */
class Notifications {
  constructor(options = {}) {
    this.queue = [];
    this.isDisplaying = false;
    this.displayTime = options.displayTime || 3000;
  }

  /**
   * Add a notification to the queue
   */
  add(message, type = 'info') {
    this.queue.push({ message, type, time: Date.now() });

    if (!this.isDisplaying) {
      this.processQueue();
    }

    return this;
  }

  /**
   * Process the notification queue
   */
  processQueue() {
    if (this.queue.length === 0) {
      this.isDisplaying = false;
      return;
    }

    this.isDisplaying = true;
    const notification = this.queue.shift();

    let prefix = '';
    let color = chalk.white;

    switch (notification.type) {
      case 'success':
        prefix = successSymbol;
        color = chalk.green;
        break;
      case 'error':
        prefix = errorSymbol;
        color = chalk.red;
        break;
      case 'warning':
        prefix = warningSymbol;
        color = chalk.yellow;
        break;
      default:
        prefix = 'ℹ️';
        color = chalk.blue;
    }

    // Clear line and show notification
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${color(prefix)} ${notification.message}\n`);

    // Process next notification after delay
    setTimeout(() => this.processQueue(), this.displayTime);
  }
}

// Helper function to create a divider line
function divider(title = '') {
  const width = process.stdout.columns || 80;
  let line = '';

  if (title) {
    const padding = Math.floor((width - title.length - 2) / 2);
    line = '─'.repeat(padding) + ` ${chalk.cyan(title)} ` + '─'.repeat(padding);

    // Ensure proper width by trimming or adding characters
    if (line.length > width) {
      line = line.substring(0, width);
    } else if (line.length < width) {
      line += '─'.repeat(width - line.length);
    }
  } else {
    line = '─'.repeat(width);
  }

  return line;
}

// Log with proper indentation
function log(message, level = 0, color = null) {
  const indent = '  '.repeat(level);
  if (color) {
    console.log(color(`${indent}${message}`));
  } else {
    console.log(`${indent}${message}`);
  }
}

// Export all helpers
module.exports = {
  Spinner,
  ProgressBar,
  Suggestions,
  Notifications,
  divider,
  log,
  symbols: {
    success: successSymbol,
    error: errorSymbol,
    warning: warningSymbol,
    suggestion: suggestionSymbol
  }
};
