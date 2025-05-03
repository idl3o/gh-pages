/**
 * Network Visualizer for SxS CLI
 * Provides console-based graphical visualizations of network topology
 * Created: April 26, 2025
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Console-based network visualization toolkit
 */
class NetworkVisualizer {
  constructor() {
    // Terminal dimensions
    this.terminalWidth = process.stdout.columns || 80;
    this.terminalHeight = process.stdout.rows || 24;

    // Default visualization settings
    this.settings = {
      colorCode: true,
      animationEnabled: true,
      detailLevel: 'medium', // 'low', 'medium', 'high'
      refreshRate: 1000, // ms
      layout: 'radial', // 'radial', 'hierarchical', 'matrix'
      maxNodes: 50
    };

    // Network data
    this.networkData = {
      nodes: [],
      edges: [],
      stats: {
        activeNodes: 0,
        totalConnections: 0,
        averageLatency: 0,
        packetLoss: 0,
        bandwidth: 0,
        lastUpdated: null
      }
    };

    // Status indicators
    this.indicators = {
      active: chalk.green('●'),
      inactive: chalk.gray('○'),
      warning: chalk.yellow('◐'),
      error: chalk.red('◯'),
      unknown: chalk.blue('?')
    };

    this.animationFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.currentAnimationFrame = 0;

    // Handle terminal resize
    process.stdout.on('resize', () => {
      this.terminalWidth = process.stdout.columns || 80;
      this.terminalHeight = process.stdout.rows || 24;
    });
  }

  /**
   * Update network data from RED X application
   */
  updateNetworkData(data = null) {
    if (!data) {
      // Try to load the network data from the app's data file
      try {
        const dataPath = path.join(__dirname, '../.data/network-state.json');
        if (fs.existsSync(dataPath)) {
          const rawData = fs.readFileSync(dataPath, 'utf8');
          data = JSON.parse(rawData);
        }
      } catch (error) {
        console.error(chalk.yellow(`⚠️ Couldn't load network data: ${error.message}`));
        // Use sample data when real data isn't available
        data = this.generateSampleNetworkData();
      }
    }

    if (data) {
      this.networkData = data;
      this.networkData.stats.lastUpdated = new Date();
    }

    return this.networkData;
  }

  /**
   * Generate sample network data for demonstration
   */
  generateSampleNetworkData() {
    const nodeCount = Math.floor(Math.random() * 10) + 5; // 5-15 nodes
    const nodes = [];
    const edges = [];

    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      const status = Math.random() > 0.8 ? 'warning' : Math.random() > 0.9 ? 'error' : 'active';
      nodes.push({
        id: `node-${i}`,
        name: `Node ${i}`,
        type: ['server', 'client', 'router'][Math.floor(Math.random() * 3)],
        status: status,
        load: Math.random(),
        connections: 0
      });
    }

    // Generate random connections between nodes
    for (let i = 0; i < nodeCount; i++) {
      const connectionCount = Math.floor(Math.random() * 3) + 1; // 1-3 connections per node

      for (let c = 0; c < connectionCount; c++) {
        let target;
        do {
          target = Math.floor(Math.random() * nodeCount);
        } while (target === i);

        const latency = Math.random() * 100; // 0-100ms
        const packetLoss = Math.random() * 0.1; // 0-10%

        edges.push({
          source: `node-${i}`,
          target: `node-${target}`,
          latency: latency,
          packetLoss: packetLoss,
          status: latency > 80 ? 'error' : latency > 50 ? 'warning' : 'active'
        });

        nodes[i].connections++;
      }
    }

    // Calculate network stats
    const activeNodes = nodes.filter(node => node.status === 'active').length;
    const totalConnections = edges.length;
    const averageLatency = edges.reduce((sum, edge) => sum + edge.latency, 0) / edges.length;
    const packetLoss = edges.reduce((sum, edge) => sum + edge.packetLoss, 0) / edges.length;

    return {
      nodes,
      edges,
      stats: {
        activeNodes,
        totalConnections,
        averageLatency,
        packetLoss,
        bandwidth: Math.random() * 100, // Mbps
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Draw a simple network diagram in the console
   */
  drawNetworkDiagram(refreshInterval = null) {
    // Update data
    this.updateNetworkData();

    // Clear screen
    console.clear();

    // Draw header
    this.drawHeader();

    // Select layout based on settings
    switch (this.settings.layout) {
      case 'radial':
        this.drawRadialLayout();
        break;
      case 'hierarchical':
        this.drawHierarchicalLayout();
        break;
      case 'matrix':
        this.drawMatrixLayout();
        break;
      default:
        this.drawRadialLayout();
    }

    // Draw statistics
    this.drawNetworkStats();

    // Draw footer with controls
    this.drawFooter();

    // Set up auto-refresh if requested
    if (refreshInterval) {
      console.log('\nPress Ctrl+C to exit visualization mode');

      return setInterval(() => {
        this.currentAnimationFrame = (this.currentAnimationFrame + 1) % this.animationFrames.length;
        this.drawNetworkDiagram();
      }, refreshInterval);
    }
  }

  /**
   * Draw the visualization header
   */
  drawHeader() {
    const centerText = (text, width = this.terminalWidth, fillChar = ' ') => {
      const padding = Math.floor((width - text.length) / 2);
      return fillChar.repeat(padding) + text + fillChar.repeat(width - text.length - padding);
    };

    console.log(chalk.bgBlue(centerText(' RED X NETWORK VISUALIZATION ', this.terminalWidth, '=')));
    console.log(
      chalk.cyan(
        `Layout: ${this.settings.layout.toUpperCase()} | Detail Level: ${this.settings.detailLevel.toUpperCase()}`
      )
    );
    console.log();
  }

  /**
   * Draw network statistics
   */
  drawNetworkStats() {
    console.log();
    console.log(chalk.cyan('===== NETWORK STATISTICS ====='));

    const { stats } = this.networkData;
    const formatTime = date => {
      if (!date) return 'Never';
      return new Date(date).toLocaleTimeString();
    };

    console.log(
      `${chalk.bold('Nodes:')} ${stats.activeNodes} active of ${this.networkData.nodes.length} total`
    );
    console.log(`${chalk.bold('Connections:')} ${stats.totalConnections}`);
    console.log(`${chalk.bold('Average Latency:')} ${stats.averageLatency.toFixed(2)}ms`);
    console.log(`${chalk.bold('Packet Loss:')} ${(stats.packetLoss * 100).toFixed(2)}%`);
    console.log(`${chalk.bold('Bandwidth:')} ${stats.bandwidth.toFixed(2)} Mbps`);
    console.log(`${chalk.bold('Last Updated:')} ${formatTime(stats.lastUpdated)}`);
  }

  /**
   * Draw the visualization footer
   */
  drawFooter() {
    console.log();
    const legend = `${this.indicators.active} Active   ${this.indicators.warning} Warning   ${this.indicators.error} Error   ${this.indicators.inactive} Inactive`;
    console.log(legend);
    console.log(chalk.cyan('='.repeat(this.terminalWidth)));
  }

  /**
   * Draw a radial network layout
   */
  drawRadialLayout() {
    const { nodes, edges } = this.networkData;
    if (nodes.length === 0) {
      console.log(chalk.yellow('No nodes to display'));
      return;
    }

    // Use a circle layout where all nodes are positioned around a circle
    const center = {
      x: Math.floor(this.terminalWidth / 2),
      y: Math.floor((this.terminalHeight - 15) / 2) + 5 // Adjust for header and stats
    };

    const radius = Math.min(center.x - 5, center.y - 3);
    const nodePositions = [];

    // Calculate node positions in a circle
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const x = Math.floor(center.x + radius * Math.cos(angle));
      const y = Math.floor(center.y + (radius * Math.sin(angle)) / 2); // Compress vertically for terminal

      nodePositions.push({ node, x, y, angle });
    });

    // Create a grid for the visualization
    const grid = Array(this.terminalHeight)
      .fill(0)
      .map(() => Array(this.terminalWidth).fill(' '));

    // Draw edges first (so they're behind nodes)
    edges.forEach(edge => {
      const source = nodePositions.find(pos => pos.node.id === edge.source);
      const target = nodePositions.find(pos => pos.node.id === edge.target);

      if (source && target) {
        this.drawLine(grid, source.x, source.y, target.x, target.y, this.getEdgeChar(edge));
      }
    });

    // Draw nodes on top of the edges
    nodePositions.forEach(pos => {
      const nodeChar = this.getNodeIndicator(pos.node);
      grid[pos.y][pos.x] = nodeChar;

      // Add label if there's space
      const label = pos.node.name;
      const labelX = pos.x + 2;
      const labelY = pos.y;

      if (labelX < this.terminalWidth - label.length) {
        for (let i = 0; i < label.length; i++) {
          grid[labelY][labelX + i] = label[i];
        }
      }
    });

    // Print the grid
    for (let y = 0; y < grid.length; y++) {
      let line = '';
      for (let x = 0; x < grid[y].length; x++) {
        line += grid[y][x];
      }
      console.log(line);
    }
  }

  /**
   * Draw a hierarchical network layout
   */
  drawHierarchicalLayout() {
    const { nodes, edges } = this.networkData;
    if (nodes.length === 0) {
      console.log(chalk.yellow('No nodes to display'));
      return;
    }

    // Organize nodes by type (to create layers)
    const nodesByType = {
      router: nodes.filter(node => node.type === 'router'),
      server: nodes.filter(node => node.type === 'server'),
      client: nodes.filter(node => node.type === 'client')
    };

    const typeOrder = ['router', 'server', 'client'];
    const layerHeight = Math.floor((this.terminalHeight - 15) / typeOrder.length);
    const nodePositions = [];

    // Position nodes in layers by type
    typeOrder.forEach((type, layerIndex) => {
      const layerNodes = nodesByType[type] || [];
      const layerY = 5 + layerIndex * layerHeight;

      layerNodes.forEach((node, nodeIndex) => {
        const nodesInLayer = layerNodes.length;
        const segmentWidth = this.terminalWidth / (nodesInLayer + 1);
        const x = Math.floor(segmentWidth * (nodeIndex + 1));

        nodePositions.push({ node, x, y: layerY });
      });
    });

    // Create a grid for the visualization
    const grid = Array(this.terminalHeight)
      .fill(0)
      .map(() => Array(this.terminalWidth).fill(' '));

    // Draw layer labels
    typeOrder.forEach((type, layerIndex) => {
      const layerY = 5 + layerIndex * layerHeight - 1;
      const label = `===== ${type.toUpperCase()} LAYER =====`;
      const labelX = Math.floor((this.terminalWidth - label.length) / 2);

      for (let i = 0; i < label.length; i++) {
        if (layerY >= 0 && layerY < grid.length && labelX + i >= 0 && labelX + i < grid[0].length) {
          grid[layerY][labelX + i] = label[i];
        }
      }
    });

    // Draw edges
    edges.forEach(edge => {
      const source = nodePositions.find(pos => pos.node.id === edge.source);
      const target = nodePositions.find(pos => pos.node.id === edge.target);

      if (source && target) {
        this.drawLine(grid, source.x, source.y, target.x, target.y, this.getEdgeChar(edge));
      }
    });

    // Draw nodes
    nodePositions.forEach(pos => {
      const nodeChar = this.getNodeIndicator(pos.node);
      if (pos.y >= 0 && pos.y < grid.length && pos.x >= 0 && pos.x < grid[0].length) {
        grid[pos.y][pos.x] = nodeChar;
      }

      // Add label
      const label = pos.node.name;
      const labelX = pos.x + 2;
      const labelY = pos.y;

      if (labelY >= 0 && labelY < grid.length && labelX < grid[0].length - label.length) {
        for (let i = 0; i < label.length; i++) {
          if (labelX + i < grid[0].length) {
            grid[labelY][labelX + i] = label[i];
          }
        }
      }
    });

    // Print the grid
    for (let y = 0; y < grid.length; y++) {
      let line = '';
      for (let x = 0; x < grid[y].length; x++) {
        line += grid[y][x];
      }
      console.log(line);
    }
  }

  /**
   * Draw a matrix layout (adjacency matrix)
   */
  drawMatrixLayout() {
    const { nodes, edges } = this.networkData;
    if (nodes.length === 0) {
      console.log(chalk.yellow('No nodes to display'));
      return;
    }

    // Create an adjacency matrix
    const matrix = Array(nodes.length)
      .fill(0)
      .map(() => Array(nodes.length).fill(null));

    // Fill the matrix with edge data
    edges.forEach(edge => {
      const sourceIndex = nodes.findIndex(node => node.id === edge.source);
      const targetIndex = nodes.findIndex(node => node.id === edge.target);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        matrix[sourceIndex][targetIndex] = edge;
      }
    });

    // Calculate column widths for node names
    const maxNameLength = Math.max(
      ...nodes.map(node => node.name.length),
      5 // Minimum width
    );

    // Print the matrix header
    let header = ' '.repeat(maxNameLength + 2) + '|';
    nodes.forEach((node, i) => {
      header += ` ${(i + 1).toString().padStart(2)} |`;
    });
    console.log(header);

    const divider = '-'.repeat(header.length);
    console.log(divider);

    // Print each row of the matrix
    nodes.forEach((sourceNode, rowIndex) => {
      let row = sourceNode.name.padEnd(maxNameLength) + ' |';

      for (let colIndex = 0; colIndex < nodes.length; colIndex++) {
        const edge = matrix[rowIndex][colIndex];
        let cell;

        if (rowIndex === colIndex) {
          // Diagonal - show node status
          cell = this.getNodeIndicator(sourceNode);
        } else if (edge) {
          // Show edge status
          cell = this.getEdgeChar(edge);
        } else {
          // No connection
          cell = ' ';
        }

        row += ` ${cell} |`;
      }

      console.log(row);
      console.log(divider);
    });

    // Print node index legend
    console.log('\nNode index:');
    nodes.forEach((node, i) => {
      console.log(
        `${(i + 1).toString().padStart(2)}: ${node.name} (${node.type}) - ${node.connections} connections`
      );
    });
  }

  /**
   * Draw a line between two points in the grid
   */
  drawLine(grid, x0, y0, x1, y1, char) {
    // Bresenham's line algorithm
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (y0 >= 0 && y0 < grid.length && x0 >= 0 && x0 < grid[0].length) {
        // Only draw if we're not overwriting a node
        if (grid[y0][x0] === ' ') {
          grid[y0][x0] = char;
        }
      }

      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /**
   * Get the visual indicator for a node based on its status
   */
  getNodeIndicator(node) {
    switch (node.status) {
      case 'active':
        return this.indicators.active;
      case 'inactive':
        return this.indicators.inactive;
      case 'warning':
        return this.indicators.warning;
      case 'error':
        return this.indicators.error;
      default:
        return this.indicators.unknown;
    }
  }

  /**
   * Get the character to represent an edge based on its status
   */
  getEdgeChar(edge) {
    switch (edge.status) {
      case 'active':
        return chalk.green('·');
      case 'warning':
        return chalk.yellow('·');
      case 'error':
        return chalk.red('·');
      default:
        return chalk.gray('·');
    }
  }

  /**
   * Update the visualization settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  /**
   * Switch to a different layout
   */
  switchLayout(layoutName) {
    if (['radial', 'hierarchical', 'matrix'].includes(layoutName)) {
      this.settings.layout = layoutName;
      return true;
    }
    return false;
  }

  /**
   * Get terminal dimensions
   */
  getTerminalSize() {
    try {
      const stdout = process.stdout;
      if (stdout && stdout.columns && stdout.rows) {
        return {
          width: stdout.columns,
          height: stdout.rows
        };
      }

      // Try to get size using tput (Unix)
      if (process.platform !== 'win32') {
        const width = parseInt(execSync('tput cols', { encoding: 'utf8' }));
        const height = parseInt(execSync('tput lines', { encoding: 'utf8' }));
        if (!isNaN(width) && !isNaN(height)) {
          return { width, height };
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Default fallback
    return {
      width: 80,
      height: 24
    };
  }

  /**
   * Get network status summary text
   */
  getNetworkStatusSummary() {
    const { stats } = this.networkData;
    const activeNodePercent = (stats.activeNodes / this.networkData.nodes.length) * 100;

    let statusText = '';
    let statusIndicator = '';

    if (activeNodePercent > 90 && stats.packetLoss < 0.01) {
      statusIndicator = this.indicators.active;
      statusText = 'Healthy';
    } else if (activeNodePercent > 70 && stats.packetLoss < 0.05) {
      statusIndicator = this.indicators.warning;
      statusText = 'Minor Issues';
    } else {
      statusIndicator = this.indicators.error;
      statusText = 'Critical Problems';
    }

    return `${statusIndicator} Network Status: ${statusText} (${stats.activeNodes}/${this.networkData.nodes.length} nodes active)`;
  }

  /**
   * Generate a text-based mini status view suitable for embedding
   */
  getMiniStatusView() {
    this.updateNetworkData();
    const { nodes, edges, stats } = this.networkData;

    const lines = [];
    lines.push(chalk.cyan('==== RED X NETWORK STATUS ===='));
    lines.push(this.getNetworkStatusSummary());
    lines.push(
      `${chalk.bold('Nodes:')} ${stats.activeNodes}/${nodes.length} | ${chalk.bold('Connections:')} ${edges.length}`
    );
    lines.push(
      `${chalk.bold('Latency:')} ${stats.averageLatency.toFixed(1)}ms | ${chalk.bold('Packet Loss:')} ${(stats.packetLoss * 100).toFixed(1)}%`
    );

    // Active animation indicator if enabled
    if (this.settings.animationEnabled) {
      const animChar = this.animationFrames[this.currentAnimationFrame];
      lines.push(`${chalk.cyan(animChar)} Monitoring Active`);
    }

    return lines.join('\n');
  }
}

module.exports = NetworkVisualizer;
