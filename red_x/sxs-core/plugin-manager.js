/**
 * SxS CLI Plugin Manager
 * Handles loading, validation, and execution of plugins
 * Created: April 26, 2025
 */

const fs = require('fs');
const path = require('path');

class PluginManager {
  constructor(config) {
    this.config = config;
    this.plugins = {};
    this.hooks = {
      // Lifecycle hooks that plugins can attach to
      preBuild: [],
      postBuild: [],
      preServer: [],
      postServer: [],
      preDeploy: [],
      postDeploy: [],
      custom: {}
    };
    this.commands = {};
  }

  /**
   * Initialize the plugin system
   */
  async initialize() {
    if (!this.config.plugins || !this.config.plugins.enabled) {
      return false;
    }

    const pluginDir = path.resolve(this.config.plugins.directory || './sxs-plugins');

    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
      return false;
    }

    const pluginFiles = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));

    for (const file of pluginFiles) {
      try {
        const pluginPath = path.join(pluginDir, file);
        const plugin = require(pluginPath);

        if (this.validatePlugin(plugin)) {
          await this.registerPlugin(plugin);
        }
      } catch (error) {
        console.error(`Error loading plugin ${file}:`, error);
      }
    }

    return true;
  }

  /**
   * Validate a plugin has the required properties
   */
  validatePlugin(plugin) {
    if (!plugin.id || !plugin.name || !plugin.version) {
      console.error('Plugin missing required metadata (id, name, or version)');
      return false;
    }

    if (this.plugins[plugin.id]) {
      console.error(`Plugin with ID ${plugin.id} is already registered.`);
      return false;
    }

    return true;
  }

  /**
   * Register a plugin and its hooks/commands
   */
  async registerPlugin(plugin) {
    this.plugins[plugin.id] = plugin;

    // Register hooks
    if (plugin.hooks) {
      for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
        if (this.hooks[hookName]) {
          this.hooks[hookName].push(hookFn.bind(plugin));
        } else if (hookName.startsWith('custom:')) {
          const customHook = hookName.substring(7);
          if (!this.hooks.custom[customHook]) {
            this.hooks.custom[customHook] = [];
          }
          this.hooks.custom[customHook].push(hookFn.bind(plugin));
        }
      }
    }

    // Register commands
    if (plugin.commands) {
      for (const [cmdName, cmdInfo] of Object.entries(plugin.commands)) {
        this.commands[cmdName] = {
          ...cmdInfo,
          plugin: plugin.id,
          execute: cmdInfo.execute.bind(plugin)
        };
      }
    }

    // Call plugin's initialize method if it exists
    if (typeof plugin.initialize === 'function') {
      await plugin.initialize();
    }

    console.log(`Plugin ${plugin.name} v${plugin.version} registered.`);
    return true;
  }

  /**
   * Trigger a specific hook with context data
   */
  async triggerHook(hookName, context = {}) {
    if (this.hooks[hookName]) {
      for (const hookFn of this.hooks[hookName]) {
        try {
          await hookFn(context);
        } catch (error) {
          console.error(`Error in ${hookName} hook:`, error);
        }
      }
    } else if (hookName.startsWith('custom:')) {
      const customHook = hookName.substring(7);
      if (this.hooks.custom[customHook]) {
        for (const hookFn of this.hooks.custom[customHook]) {
          try {
            await hookFn(context);
          } catch (error) {
            console.error(`Error in custom:${customHook} hook:`, error);
          }
        }
      }
    }
  }

  /**
   * Execute a plugin command
   */
  async executeCommand(cmdName, args = {}) {
    if (!this.commands[cmdName]) {
      throw new Error(`Command "${cmdName}" not found.`);
    }

    try {
      return await this.commands[cmdName].execute(args);
    } catch (error) {
      console.error(`Error executing command ${cmdName}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered commands
   */
  getCommands() {
    return Object.entries(this.commands).map(([name, cmd]) => ({
      name,
      description: cmd.description,
      usage: cmd.usage,
      plugin: cmd.plugin
    }));
  }

  /**
   * Get all registered plugins
   */
  getPlugins() {
    return Object.values(this.plugins).map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      description: p.description,
      author: p.author
    }));
  }
}

module.exports = PluginManager;
