/**
 * SxS Performance Monitor Plugin
 * Monitors performance metrics during builds and server operations
 * Created: April 26, 2025
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class PerformanceMonitorPlugin {
  constructor() {
    this.id = 'performance-monitor';
    this.name = 'Performance Monitor';
    this.version = '1.0.0';
    this.description = 'Monitors build and runtime performance metrics';
    this.author = 'SxS Team';

    this.metricsPath = path.resolve('./sxs-metrics');
    this.startTime = null;
    this.metrics = {
      builds: [],
      servers: [],
      system: {}
    };
  }

  async initialize() {
    // Create metrics directory if it doesn't exist
    if (!fs.existsSync(this.metricsPath)) {
      fs.mkdirSync(this.metricsPath, { recursive: true });
    }

    // Load previous metrics if they exist
    const metricsFile = path.join(this.metricsPath, 'metrics.json');
    if (fs.existsSync(metricsFile)) {
      try {
        this.metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      } catch (error) {
        console.warn(`Failed to load previous metrics: ${error.message}`);
      }
    }

    // Collect system information
    this.metrics.system = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    };

    console.log(`[Performance Monitor] Plugin initialized`);
    return true;
  }

  // Hook: Before build starts
  async preBuild(context) {
    this.startTime = process.hrtime();
    console.log(
      `[Performance Monitor] Starting build performance measurement for ${context.mode} mode`
    );
  }

  // Hook: After build completes
  async postBuild(context) {
    if (!this.startTime) return;

    const elapsed = process.hrtime(this.startTime);
    const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1000000;

    this.metrics.builds.push({
      mode: context.mode,
      timestamp: new Date().toISOString(),
      duration: elapsedMs,
      success: true
    });

    console.log(`[Performance Monitor] Build completed in ${elapsedMs.toFixed(2)}ms`);
    this.saveMetrics();
    this.startTime = null;
  }

  // Hook: Before server starts
  async preServer(context) {
    console.log(
      `[Performance Monitor] Starting server monitoring on port ${context.options.port || 'default'}`
    );

    this.metrics.servers.push({
      startTime: new Date().toISOString(),
      port: context.options.port || 'default',
      mode: context.mode
    });

    this.saveMetrics();
  }

  // Hook: When server stops
  async postServer(context) {
    const currentServer = this.metrics.servers[this.metrics.servers.length - 1];
    if (currentServer) {
      currentServer.endTime = new Date().toISOString();
      this.saveMetrics();
    }
  }

  // Save metrics to disk
  saveMetrics() {
    try {
      const metricsFile = path.join(this.metricsPath, 'metrics.json');
      fs.writeFileSync(metricsFile, JSON.stringify(this.metrics, null, 2), 'utf8');
    } catch (error) {
      console.error(`[Performance Monitor] Failed to save metrics: ${error.message}`);
    }
  }

  // Plugin commands
  commands = {
    perf: {
      description: 'Show performance metrics',
      usage: 'sxs perf [build|server]',
      execute: async args => {
        const type = args._raw[0];

        if (type === 'build' || !type) {
          console.log('\nBuild Performance Metrics:');
          console.log('=======================');

          if (this.metrics.builds.length === 0) {
            console.log('No build metrics recorded yet.');
          } else {
            // Calculate average build time
            const avgTime =
              this.metrics.builds.reduce((sum, build) => sum + build.duration, 0) /
              this.metrics.builds.length;
            console.log(`Average build time: ${avgTime.toFixed(2)}ms`);

            // Show last 5 builds
            console.log('\nRecent builds:');
            const recentBuilds = this.metrics.builds.slice(-5);
            for (const build of recentBuilds) {
              console.log(
                `[${new Date(build.timestamp).toLocaleString()}] ${build.mode} mode: ${build.duration.toFixed(2)}ms`
              );
            }
          }
        }

        if (type === 'server' || !type) {
          console.log('\nServer Runtime Metrics:');
          console.log('=======================');

          if (this.metrics.servers.length === 0) {
            console.log('No server metrics recorded yet.');
          } else {
            for (const server of this.metrics.servers.slice(-5)) {
              const endTime = server.endTime ? new Date(server.endTime) : null;
              const startTime = new Date(server.startTime);
              const duration = endTime
                ? ((endTime - startTime) / 1000).toFixed(2) + 's'
                : 'still running';

              console.log(
                `[${startTime.toLocaleString()}] ${server.mode} mode on port ${server.port}: ${duration}`
              );
            }
          }
        }

        if (type === 'system' || !type) {
          console.log('\nSystem Information:');
          console.log('=======================');
          console.log(`Platform: ${this.metrics.system.platform} (${this.metrics.system.arch})`);
          console.log(`CPUs: ${this.metrics.system.cpus}`);
          console.log(
            `Memory: ${(this.metrics.system.totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB total`
          );
        }

        return true;
      }
    },

    'perf-clear': {
      description: 'Clear performance metrics',
      usage: 'sxs perf-clear',
      execute: async () => {
        this.metrics = {
          builds: [],
          servers: [],
          system: this.metrics.system
        };
        this.saveMetrics();
        console.log('Performance metrics cleared.');
        return true;
      }
    }
  };

  // Plugin hooks
  hooks = {
    preBuild: this.preBuild,
    postBuild: this.postBuild,
    preServer: this.preServer,
    postServer: this.postServer
  };
}

// Export a new instance of the plugin
module.exports = new PerformanceMonitorPlugin();
