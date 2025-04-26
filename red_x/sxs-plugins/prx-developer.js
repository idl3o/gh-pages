/**
 * PRX Developer Plugin for SxS CLI
 * Adds Project RED X specific development features to the SxS CLI
 * Created: April 26, 2025
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const os = require('os');

class PRXDeveloperPlugin {
  constructor() {
    this.id = 'prx-developer';
    this.name = 'PRX Developer';
    this.version = '1.0.0';
    this.description = 'Enhances SxS CLI with Project RED X development features';
    this.author = 'RED X Team';

    this.workspaceDir = path.resolve('../');
    this.redXDir = path.resolve('./');
    this.isWindows = os.platform() === 'win32';

    this.codePatterns = {
      js: /\.(js|jsx|ts|tsx)$/,
      html: /\.(html|htm)$/,
      css: /\.css$/,
      solidity: /\.sol$/
    };

    // Keep track of active processes
    this.activeProcesses = new Map();
  }

  async initialize() {
    console.log(`[PRX Developer] Plugin initialized`);
    return true;
  }

  /**
   * Get project stats
   */
  async getProjectStats() {
    try {
      // Count files by type
      const stats = {
        js: 0,
        html: 0,
        css: 0,
        sol: 0,
        other: 0,
        total: 0
      };

      const countFiles = (dir, stats) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const fullPath = path.join(dir, file);

          // Skip node_modules
          if (file === 'node_modules' || file === '.git') {
            continue;
          }

          if (fs.statSync(fullPath).isDirectory()) {
            countFiles(fullPath, stats);
          } else {
            stats.total++;

            if (this.codePatterns.js.test(file)) {
              stats.js++;
            } else if (this.codePatterns.html.test(file)) {
              stats.html++;
            } else if (this.codePatterns.css.test(file)) {
              stats.css++;
            } else if (this.codePatterns.solidity.test(file)) {
              stats.sol++;
            } else {
              stats.other++;
            }
          }
        }
      };

      countFiles(this.redXDir, stats);

      return stats;
    } catch (error) {
      console.error(`[PRX Developer] Error getting project stats: ${error.message}`);
      return null;
    }
  }

  /**
   * List recent changes
   */
  async getRecentChanges() {
    try {
      const cmd = this.isWindows
        ? `cd "${this.workspaceDir}" && git log -10 --pretty=format:"%h|%an|%ar|%s"`
        : `cd "${this.workspaceDir}" && git log -10 --pretty=format:"%h|%an|%ar|%s"`;

      const output = execSync(cmd).toString();

      return output.split('\n').map(line => {
        const [hash, author, time, message] = line.split('|');
        return { hash, author, time, message };
      });
    } catch (error) {
      console.error(`[PRX Developer] Error getting recent changes: ${error.message}`);
      return [];
    }
  }

  /**
   * Run a development task with monitor
   */
  async runDevTask(task, args = {}) {
    if (this.activeProcesses.has(task)) {
      console.log(`[PRX Developer] Task ${task} is already running. Stopping it first...`);
      this.stopDevTask(task);
    }

    console.log(`[PRX Developer] Running task: ${task}`);

    let cmd, cmdArgs;

    if (this.isWindows) {
      cmd = 'powershell.exe';
      cmdArgs = ['-Command', `code --folder . --task ${task}`];
    } else {
      cmd = 'code';
      cmdArgs = ['--folder', '.', '--task', task];
    }

    try {
      const proc = spawn(cmd, cmdArgs, {
        stdio: 'pipe',
        shell: true
      });

      this.activeProcesses.set(task, proc);

      proc.stdout.on('data', data => {
        console.log(`[${task}] ${data.toString().trim()}`);
      });

      proc.stderr.on('data', data => {
        console.error(`[${task}] Error: ${data.toString().trim()}`);
      });

      proc.on('close', code => {
        console.log(`[PRX Developer] Task ${task} completed with code ${code}`);
        this.activeProcesses.delete(task);
      });

      return true;
    } catch (error) {
      console.error(`[PRX Developer] Error running task ${task}: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop a running task
   */
  stopDevTask(task) {
    if (this.activeProcesses.has(task)) {
      const proc = this.activeProcesses.get(task);

      if (this.isWindows) {
        execSync(`taskkill /pid ${proc.pid} /T /F`);
      } else {
        proc.kill('SIGTERM');
      }

      this.activeProcesses.delete(task);
      console.log(`[PRX Developer] Stopped task: ${task}`);
      return true;
    }

    console.log(`[PRX Developer] Task ${task} is not running`);
    return false;
  }

  /**
   * Get all active PRX processes
   */
  getActiveProcesses() {
    const active = [];

    for (const [task, proc] of this.activeProcesses.entries()) {
      active.push({
        task,
        pid: proc.pid,
        running: true
      });
    }

    return active;
  }

  /**
   * Check if PRX server is running
   */
  async isPRXServerRunning() {
    try {
      // Check if port 8080 is in use
      const cmd = this.isWindows ? `netstat -ano | findstr :8080` : `lsof -i:8080 | grep LISTEN`;

      const output = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      return output.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  // Plugin commands
  commands = {
    'prx:status': {
      description: 'Show Project RED X development status',
      usage: 'sxs prx:status',
      execute: async () => {
        console.log('\nProject RED X Status');
        console.log('===================\n');

        // Check if server is running
        const serverRunning = await this.isPRXServerRunning();
        console.log(`Server: ${serverRunning ? 'RUNNING' : 'STOPPED'} (Port 8080)`);

        // Show active processes
        const activeProcs = this.getActiveProcesses();
        console.log(`\nActive Processes: ${activeProcs.length}`);
        activeProcs.forEach(proc => {
          console.log(`  - ${proc.task} (PID: ${proc.pid})`);
        });

        // Project stats
        const stats = await this.getProjectStats();
        console.log('\nProject Stats:');
        if (stats) {
          console.log(`  Total Files: ${stats.total}`);
          console.log(`  JavaScript: ${stats.js}`);
          console.log(`  HTML: ${stats.html}`);
          console.log(`  CSS: ${stats.css}`);
          console.log(`  Solidity: ${stats.sol}`);
          console.log(`  Other: ${stats.other}`);
        }

        return true;
      }
    },

    'prx:changes': {
      description: 'Show recent changes to the project',
      usage: 'sxs prx:changes',
      execute: async () => {
        console.log('\nRecent Project Changes');
        console.log('====================\n');

        const changes = await this.getRecentChanges();

        if (changes.length === 0) {
          console.log('No recent changes found');
          return true;
        }

        changes.forEach((change, index) => {
          console.log(`[${index + 1}] ${change.hash} - ${change.time} - ${change.author}`);
          console.log(`    ${change.message}\n`);
        });

        return true;
      }
    },

    'prx:run': {
      description: 'Run a PRX development task',
      usage: 'sxs prx:run <task>',
      execute: async args => {
        const task = args._raw[0];

        if (!task) {
          console.log('Please specify a task to run');
          console.log('Usage: sxs prx:run <task>');
          console.log('Available tasks: make_web, make_native, start_server, etc.');
          return false;
        }

        return await this.runDevTask(task);
      }
    },

    'prx:stop': {
      description: 'Stop a running PRX task',
      usage: 'sxs prx:stop <task>',
      execute: async args => {
        const task = args._raw[0];

        if (!task) {
          console.log('Please specify a task to stop');
          console.log('Usage: sxs prx:stop <task>');

          const activeProcs = this.getActiveProcesses();
          if (activeProcs.length > 0) {
            console.log('\nActive tasks:');
            activeProcs.forEach(proc => {
              console.log(`  - ${proc.task}`);
            });
          }

          return false;
        }

        return this.stopDevTask(task);
      }
    },

    'prx:watch': {
      description: 'Watch project for changes and rebuild',
      usage: 'sxs prx:watch',
      execute: async () => {
        console.log('Starting PRX watch mode...');
        console.log('Press Ctrl+C to stop watching');

        // First build the project
        await this.runDevTask('make_web');

        // Check if nodemon is installed
        try {
          execSync('npm list -g nodemon || npm install -g nodemon');
        } catch (error) {
          console.log('Installing nodemon...');
          execSync('npm install -g nodemon');
        }

        // Start watching
        const nodemonCmd = this.isWindows ? 'npx.cmd' : 'npx';

        const proc = spawn(
          nodemonCmd,
          [
            '--watch',
            '.',
            '--ext',
            'js,html,css,c,h',
            '--ignore',
            'node_modules/,*.wasm',
            '--exec',
            this.isWindows ? 'powershell.exe -Command "sxs dev"' : 'sxs dev'
          ],
          {
            stdio: 'inherit',
            shell: true
          }
        );

        this.activeProcesses.set('prx:watch', proc);

        return true;
      }
    },

    'prx:setup': {
      description: 'Set up PRX development environment',
      usage: 'sxs prx:setup',
      execute: async () => {
        console.log('Setting up PRX development environment...');

        // Run setup_emsdk task
        await this.runDevTask('setup_emsdk');

        // Install dependencies
        console.log('Installing project dependencies...');
        const cmd = this.isWindows
          ? `cd "${this.redXDir}" && npm install`
          : `cd "${this.redXDir}" && npm install`;

        execSync(cmd, { stdio: 'inherit' });

        console.log('\nPRX development environment setup complete!');
        console.log('You can now run: sxs dev');

        return true;
      }
    }
  };

  // Plugin hooks
  hooks = {
    // Add hooks here as needed
  };
}

// Export a new instance of the plugin
module.exports = new PRXDeveloperPlugin();
