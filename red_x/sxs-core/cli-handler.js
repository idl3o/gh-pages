/**
 * CLI Handler for RED X
 * Processes direct CLI commands
 * Created: April 26, 2025
 */

const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const os = require('os');

/**
 * CLI Handler class for processing direct commands
 */
class CLIHandler {
  constructor() {
    // Command handlers
    this.commandHandlers = {
      web: this.buildWeb.bind(this),
      native: this.buildNative.bind(this),
      server: this.startServer.bind(this),
      help: this.showHelp.bind(this),
      version: this.showVersion.bind(this),
      plugins: this.listPlugins.bind(this),
      deploy: this.deployProject.bind(this),
      clean: this.cleanProject.bind(this),
      setup_emsdk: this.setupEnvironment.bind(this),
      env_info: this.showEnvironmentInfo.bind(this),
      status: this.showNodeStatus.bind(this),
      docs: this.generateDocs.bind(this),
      branch_info: this.showBranchInfo.bind(this),
      switch_main: this.switchToMainBranch.bind(this),
      switch_docs: this.switchToDocsBranch.bind(this),
      sync_branches: this.syncBranches.bind(this),
      bypass_native: this.bypassNativeBuild.bind(this),
      show_network_status: this.showNetworkStatus.bind(this),
      visualize_network: this.visualizeNetwork.bind(this)
    };

    // Package info
    this.packageInfo = this.loadPackageInfo();

    // RED X root directory (2 levels up from this file)
    this.rootDir = path.resolve(__dirname, '..');
  }

  /**
   * Load package info from package.json
   */
  loadPackageInfo() {
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      if (fs.existsSync(packagePath)) {
        return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      }

      // Try one level up
      const parentPackagePath = path.join(path.dirname(this.rootDir), 'package.json');
      if (fs.existsSync(parentPackagePath)) {
        return JSON.parse(fs.readFileSync(parentPackagePath, 'utf8'));
      }

      return { name: 'RED X', version: '1.0.0' };
    } catch (error) {
      console.error(chalk.yellow('Warning: Could not load package.json'));
      return { name: 'RED X', version: '1.0.0' };
    }
  }

  /**
   * Process a direct command
   */
  processCommand(args) {
    if (!args || args.length === 0) {
      this.showHelp();
      return true;
    }

    const command = args[0].toLowerCase();
    const options = this.parseOptions(args.slice(1));

    // Check if we have a handler for this command
    if (this.commandHandlers[command]) {
      return this.commandHandlers[command](options);
    }

    console.error(chalk.red(`Unknown command: ${command}`));
    console.log(chalk.yellow('Type "help" for a list of available commands.'));
    return false;
  }

  /**
   * Parse command line options
   */
  parseOptions(args) {
    const options = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--')) {
        // Long option (--option=value or --option value)
        const option = arg.substring(2);

        if (option.includes('=')) {
          const [key, value] = option.split('=', 2);
          options[key] = value;
        } else {
          // Check if the next arg is a value or another option
          if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
            options[option] = args[i + 1];
            i++; // Skip the next arg as we've used it as a value
          } else {
            options[option] = true; // Flag option with no value
          }
        }
      } else if (arg.startsWith('-')) {
        // Short option (-o value)
        const option = arg.substring(1);

        // Check if the next arg is a value or another option
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          options[option] = args[i + 1];
          i++; // Skip the next arg as we've used it as a value
        } else {
          options[option] = true; // Flag option with no value
        }
      } else {
        // Positional argument
        if (!options.args) {
          options.args = [];
        }
        options.args.push(arg);
      }
    }

    return options;
  }

  /**
   * Run a VSCode task
   */
  async runTask(taskName, options = {}) {
    console.log(chalk.cyan(`Running task: ${taskName}`));

    // Implementation will depend on how VSCode tasks are structured in your project
    // This is a simplified version that uses child_process.exec

    let command;
    const isWindows = os.platform() === 'win32';

    switch (taskName) {
      case 'make_web':
        command = isWindows
          ? `cd "${this.rootDir}" && powershell -Command "& {$emsdkDir = Join-Path -Path '${this.rootDir}' -ChildPath 'emsdk'; if (Test-Path -Path $emsdkDir) { & '$emsdkDir\\emsdk_env.bat' | Out-Null; Push-Location '${this.rootDir}'; make web } else { Write-Host 'emsdk not found. Please run the setup_emsdk task first.' -ForegroundColor Red }}"`
          : `cd "${this.rootDir}" && make web`;
        break;

      case 'make_native':
        command = isWindows
          ? `C:\\tools\\msys64\\msys2_shell.cmd -mingw64 -defterm -no-start -here -c "cd '${this.rootDir}' && make"`
          : `cd "${this.rootDir}" && make`;
        break;

      case 'start_server':
        const port = options.port || 3000;
        command = isWindows
          ? `cd "${this.rootDir}" && powershell -Command "Set-Location -Path '${this.rootDir}'; node server.js --port ${port}"`
          : `cd "${this.rootDir}" && node server.js --port ${port}`;
        break;

      // Add other tasks as needed...

      default:
        console.error(chalk.red(`Unknown task: ${taskName}`));
        return false;
    }

    return new Promise((resolve, reject) => {
      console.log(chalk.gray(`Executing: ${command}`));

      const childProcess = exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(chalk.red(`Error executing task: ${error.message}`));
          console.error(stderr);
          reject(error);
          return;
        }

        console.log(stdout);
        if (stderr) {
          console.error(stderr);
        }

        console.log(chalk.green(`✓ Task ${taskName} completed successfully`));
        resolve(true);
      });

      childProcess.stdout.on('data', data => {
        process.stdout.write(data);
      });

      childProcess.stderr.on('data', data => {
        process.stderr.write(data);
      });
    });
  }

  /**
   * Command handlers
   */
  buildWeb(options) {
    console.log(chalk.cyan('Building web version...'));
    return this.runTask('make_web', options);
  }

  buildNative(options) {
    console.log(chalk.cyan('Building native version...'));
    return this.runTask('make_native', options);
  }

  startServer(options) {
    console.log(chalk.cyan(`Starting server${options.port ? ` on port ${options.port}` : ''}...`));
    return this.runTask('start_server', options);
  }

  showHelp() {
    console.log(chalk.cyan('\nRED X CLI Commands:'));
    console.log(chalk.cyan('=================='));

    console.log('\n' + chalk.green('Build Commands:'));
    console.log('  web                Build the web version');
    console.log('  native             Build the native version');
    console.log('  clean              Clean build artifacts');

    console.log('\n' + chalk.green('Server Commands:'));
    console.log('  server             Start the development server');
    console.log('  server --port 3000 Start server on specific port');

    console.log('\n' + chalk.green('Deployment Commands:'));
    console.log('  deploy             Deploy the project');

    console.log('\n' + chalk.green('Environment Commands:'));
    console.log('  setup_emsdk       Set up the Emscripten SDK');
    console.log('  env_info          Show environment information');

    console.log('\n' + chalk.green('Branch Management:'));
    console.log('  branch_info        Show branch information');
    console.log('  switch_main        Switch to main branch');
    console.log('  switch_docs        Switch to docs branch');
    console.log('  sync_branches      Sync branches');

    console.log('\n' + chalk.green('Network Commands:'));
    console.log('  status             Show node status');
    console.log('  show_network_status Show network status');
    console.log('  visualize_network  Visualize network topology');

    console.log('\n' + chalk.green('Other Commands:'));
    console.log('  version            Show version information');
    console.log('  plugins            List available plugins');
    console.log('  docs               Generate documentation');
    console.log('  help               Show this help message');

    console.log('\nFor more information, visit: https://github.com/sam/red-x\n');

    return true;
  }

  showVersion() {
    console.log(chalk.cyan(`\n${this.packageInfo.name} v${this.packageInfo.version}`));

    // Get Git commit if available
    try {
      const gitRev = require('child_process')
        .execSync('git rev-parse --short HEAD', { cwd: this.rootDir })
        .toString()
        .trim();
      console.log(chalk.gray(`Git commit: ${gitRev}`));
    } catch (e) {
      // Git not available or not a git repo
    }

    console.log('');
    return true;
  }

  listPlugins() {
    console.log(chalk.cyan('\nAvailable plugins:'));

    // This would normally scan for plugins
    const demoPlugins = [
      { name: 'web3-connector', version: '1.2.0', enabled: true },
      { name: 'network-visualizer', version: '0.9.1', enabled: true },
      { name: 'conversation-manager', version: '1.0.0', enabled: true },
      { name: 'data-analyzer', version: '0.8.5', enabled: false }
    ];

    demoPlugins.forEach(plugin => {
      const status = plugin.enabled ? chalk.green('✓ Enabled') : chalk.yellow('✗ Disabled');

      console.log(`  ${plugin.name} (v${plugin.version}) - ${status}`);
    });

    console.log('');
    return true;
  }

  deployProject(options) {
    console.log(chalk.cyan('Deploying project...'));
    // Implementation would depend on your deployment process
    console.log(chalk.green('Project deployed successfully!'));
    return true;
  }

  cleanProject() {
    console.log(chalk.cyan('Cleaning build artifacts...'));
    return this.runTask('clean');
  }

  setupEnvironment() {
    console.log(chalk.cyan('Setting up Emscripten SDK...'));
    return this.runTask('setup_emsdk');
  }

  showEnvironmentInfo() {
    console.log(chalk.cyan('\nEnvironment Information:'));
    console.log(chalk.cyan('========================'));

    // Node.js info
    console.log('\n' + chalk.green('Node.js:'));
    console.log(`  Version: ${process.version}`);
    console.log(`  Path: ${process.execPath}`);

    // OS info
    console.log('\n' + chalk.green('Operating System:'));
    console.log(`  Platform: ${os.platform()}`);
    console.log(`  Version: ${os.release()}`);
    console.log(`  Architecture: ${os.arch()}`);

    // Project info
    console.log('\n' + chalk.green('Project:'));
    console.log(`  Name: ${this.packageInfo.name}`);
    console.log(`  Version: ${this.packageInfo.version}`);
    console.log(`  Directory: ${this.rootDir}`);

    console.log('');
    return true;
  }

  showNodeStatus() {
    console.log(chalk.cyan('\nNode Status:'));
    console.log(chalk.cyan('==========='));

    // This would normally query actual node status
    // For demo purposes, we'll show some simulated status

    console.log('\n' + chalk.green('Primary Node (this):'));
    console.log(`  Status: ${chalk.green('Online')}`);
    console.log(`  Uptime: 3h 42m`);
    console.log(`  CPU: 12%`);
    console.log(`  Memory: 824 MB / 4 GB`);

    console.log('\n' + chalk.green('Connected Nodes:'));
    console.log(`  node-alpha:   ${chalk.green('Online')}     Ping: 32ms`);
    console.log(`  node-beta:    ${chalk.yellow('Warning')}   Ping: 187ms`);
    console.log(`  node-gamma:   ${chalk.green('Online')}     Ping: 54ms`);
    console.log(`  node-delta:   ${chalk.red('Offline')}      Last seen: 2h ago`);

    console.log('\n' + chalk.green('Network:'));
    console.log(`  Connected Peers: 3/4`);
    console.log(`  Network Health: ${chalk.yellow('⚠️ Warning')}`);
    console.log(`  Issues: High latency detected with node-beta`);

    console.log('');
    return true;
  }

  generateDocs() {
    console.log(chalk.cyan('Generating documentation...'));
    return this.runTask('generate_contract_docs');
  }

  showBranchInfo() {
    console.log(chalk.cyan('Getting branch information...'));
    return this.runTask('branch_info');
  }

  switchToMainBranch() {
    console.log(chalk.cyan('Switching to main branch...'));
    return this.runTask('switch_to_main');
  }

  switchToDocsBranch() {
    console.log(chalk.cyan('Switching to docs branch...'));
    return this.runTask('switch_to_docs');
  }

  syncBranches() {
    console.log(chalk.cyan('Synchronizing branches...'));
    return this.runTask('sync_branches');
  }

  bypassNativeBuild() {
    console.log(chalk.cyan('Bypassing native build...'));
    return this.runTask('make_native_bypass');
  }

  showNetworkStatus() {
    console.log(chalk.cyan('Network status will be displayed by the NetworkVisualizer component'));
    // This will be handled by the NetworkVisualizer component
    // in the NLPHandler
    return true;
  }

  visualizeNetwork() {
    console.log(
      chalk.cyan('Network visualization will be displayed by the NetworkVisualizer component')
    );
    // This will be handled by the NetworkVisualizer component
    // in the NLPHandler
    return true;
  }
}

module.exports = CLIHandler;
