/**
 * VS Code Task Runner Integration for SxS CLI
 * Adds support for running VS Code tasks through natural language commands
 * Created: April 26, 2025
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

/**
 * Task Runner for VS Code tasks integration
 */
class TaskRunner {
  constructor() {
    this.workspaceRoot = path.resolve(__dirname, '../..');
    this.tasksPath = path.join(this.workspaceRoot, '.vscode/tasks.json');
    this.tasks = {};
    this.loadTasks();
  }

  /**
   * Load tasks from VS Code tasks.json file
   */
  loadTasks() {
    try {
      if (fs.existsSync(this.tasksPath)) {
        const tasksData = fs.readFileSync(this.tasksPath, 'utf8');
        const tasksFile = JSON.parse(tasksData);

        if (tasksFile.tasks && Array.isArray(tasksFile.tasks)) {
          tasksFile.tasks.forEach(task => {
            if (task.label) {
              this.tasks[task.label] = task;
            }
          });
          console.log(
            chalk.green(
              `✅ Loaded ${Object.keys(this.tasks).length} tasks from VS Code configuration`
            )
          );
        }
      } else {
        console.log(chalk.yellow(`⚠️ VS Code tasks file not found at ${this.tasksPath}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error loading VS Code tasks: ${error.message}`));
    }
  }

  /**
   * Get the list of available tasks
   */
  getAvailableTasks() {
    return Object.keys(this.tasks);
  }

  /**
   * Run a VS Code task by name
   */
  async runTask(taskName, options = {}) {
    if (!this.tasks[taskName]) {
      console.error(chalk.red(`❌ Task '${taskName}' not found in VS Code tasks`));
      return false;
    }

    const task = this.tasks[taskName];

    console.log(chalk.cyan(`🚀 Running VS Code task: ${taskName}`));

    try {
      if (task.type === 'shell') {
        return await this.runShellTask(task, options);
      } else {
        console.error(
          chalk.yellow(`⚠️ Unsupported task type: ${task.type}. Only shell tasks are supported.`)
        );
        return false;
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error running task ${taskName}: ${error.message}`));
      return false;
    }
  }

  /**
   * Run a shell-based task
   */
  runShellTask(task, options = {}) {
    return new Promise((resolve, reject) => {
      const command = task.command;
      const args = this.processTaskArgs(task.args, options);

      // Check if command exists
      if (!command) {
        reject(new Error('No command specified in task'));
        return;
      }

      let spawnOptions = {
        cwd: this.workspaceRoot,
        shell: true,
        stdio: 'inherit'
      };

      if (options.cwd) {
        spawnOptions.cwd = path.resolve(this.workspaceRoot, options.cwd);
      }

      console.log(chalk.gray(`$ ${command} ${args.join(' ')}`));

      const proc = spawn(command, args, spawnOptions);

      proc.on('close', code => {
        if (code === 0) {
          console.log(chalk.green(`✅ Task ${task.label} completed successfully`));
          resolve(true);
        } else {
          const errorMessage = `Task ${task.label} failed with exit code ${code}`;
          console.error(chalk.red(`❌ ${errorMessage}`));
          reject(new Error(errorMessage));
        }
      });

      proc.on('error', error => {
        reject(error);
      });
    });
  }

  /**
   * Process task arguments, substituting variables
   */
  processTaskArgs(args, options = {}) {
    if (!args) return [];

    return args.map(arg => {
      if (typeof arg !== 'string') return arg;

      // Replace workspaceFolder variable
      let processed = arg.replace(/\$\{workspaceFolder\}/g, this.workspaceRoot);

      // Replace custom options
      Object.keys(options).forEach(key => {
        processed = processed.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), options[key]);
      });

      return processed;
    });
  }

  /**
   * Map intent names to task names
   */
  getTaskMappings() {
    return {
      build_web: 'make_web',
      build_native: 'make_native',
      start_server: 'start_server',
      clean_project: 'clean',
      deploy_project: 'deploy',
      generate_docs: 'generate_contract_docs',
      branch_info: 'branch_info',
      switch_to_main: 'switch_to_main',
      switch_to_docs: 'switch_to_docs',
      sync_branches: 'sync_branches',
      bypass_native_build: 'make_native_bypass',
      setup_environment: 'setup_emsdk'
    };
  }
}

module.exports = TaskRunner;
