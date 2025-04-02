#!/usr/bin/env node

/**
 * Module Mapper
 *
 * Generates a visual representation of module dependencies in the project.
 * Creates both a JSON file for programmatic use and an HTML visualization.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Directories to scan (relative to project root)
const SCAN_DIRS = [
  './',
  './models',
  './controllers',
  './lib',
  './scripts'
];

// File extensions to check
const FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

// Ignored directories
const IGNORED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage'
];

// Output directory for generated files
const OUTPUT_DIR = './docs/module-map';

/**
 * Find the project root directory
 * @returns {Promise<string>} Path to project root
 */
async function findProjectRoot() {
  try {
    // Try to use git to find the root
    const { stdout } = await execAsync('git rev-parse --show-toplevel');
    return stdout.trim();
  } catch (error) {
    // If git not available, use current directory
    return process.cwd();
  }
}

/**
 * Get all JavaScript files to scan
 * @param {string} rootDir Project root directory
 * @returns {Promise<Array<string>>} List of file paths
 */
async function getFilesToScan(rootDir) {
  const filesToScan = [];

  for (const scanDir of SCAN_DIRS) {
    const dir = path.join(rootDir, scanDir);

    try {
      await scanDirectory(dir, filesToScan);
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Could not scan directory ${dir}: ${error.message}${colors.reset}`);
    }
  }

  return filesToScan;
}

/**
 * Recursively scan a directory for JavaScript files
 * @param {string} dir Directory to scan
 * @param {Array<string>} files Array to collect file paths
 */
async function scanDirectory(dir, files) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip ignored directories
        if (IGNORED_DIRS.includes(entry.name)) continue;

        // Recursively scan subdirectory
        await scanDirectory(fullPath, files);
      } else if (FILE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors for non-existent paths
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Extract required modules from file content
 * @param {string} content File content
 * @returns {Array<string>} Required module paths
 */
function extractRequiredModules(content) {
  const requireRegex = /require\(['"](.*?)['"]\)/g;
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"](.*?)['"]/g;

  const modules = new Set();
  let match;

  // Extract require statements
  while ((match = requireRegex.exec(content)) !== null) {
    modules.add(match[1]);
  }

  // Extract import statements
  while ((match = importRegex.exec(content)) !== null) {
    modules.add(match[1]);
  }

  return Array.from(modules);
}

/**
 * Check if module is a built-in Node.js module
 * @param {string} moduleName Module name
 * @returns {boolean} True if built-in module
 */
function isBuiltinModule(moduleName) {
  const builtins = [
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
    'http2', 'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
    'process', 'punycode', 'querystring', 'readline', 'repl', 'stream',
    'string_decoder', 'timers', 'tls', 'trace_events', 'tty', 'url', 'util',
    'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
  ];

  return builtins.includes(moduleName);
}

/**
 * Process a single file and extract its dependencies
 * @param {string} filePath File path
 * @param {string} rootDir Project root directory
 * @returns {Promise<Object>} File information with dependencies
 */
async function processFile(filePath, rootDir) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const requiredModules = extractRequiredModules(content);

    const dependencies = requiredModules.map(module => {
      const type = isBuiltinModule(module) ? 'builtin' :
                 (!module.startsWith('.') && !module.startsWith('/')) ? 'npm' : 'local';

      return {
        path: module,
        type
      };
    });

    return {
      path: path.relative(rootDir, filePath),
      dependencies
    };
  } catch (error) {
    console.error(`${colors.red}Error processing file ${filePath}:${colors.reset}`, error);
    return {
      path: path.relative(rootDir, filePath),
      dependencies: [],
      error: error.message
    };
  }
}

/**
 * Generate HTML visualization of module dependencies
 * @param {Object} dependencyMap Dependency map object
 * @returns {string} HTML content
 */
function generateHtmlVisualization(dependencyMap) {
  // Create nodes for each file
  const nodes = dependencyMap.files.map((file, index) => ({
    id: index,
    label: file.path,
    group: getModuleGroup(file.path)
  }));

  // Create edges for dependencies
  const edges = [];
  let edgeId = 0;

  dependencyMap.files.forEach((file, fileIndex) => {
    file.dependencies.forEach(dep => {
      if (dep.type === 'local') {
        // Try to find the target module in the files list
        const targetPath = dep.path.startsWith('.')
          ? path.join(path.dirname(file.path), dep.path).replace(/\\/g, '/')
          : dep.path;

        const targetIndex = dependencyMap.files.findIndex(f =>
          f.path === targetPath ||
          f.path === `${targetPath}.js` ||
          f.path === `${targetPath}/index.js`
        );

        if (targetIndex !== -1) {
          edges.push({
            id: edgeId++,
            from: fileIndex,
            to: targetIndex,
            arrows: 'to'
          });
        }
      }
    });
  });

  // Create HTML content
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Dependency Map - Web3 Crypto Streaming Service</title>
    <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      #visualization {
        width: 100%;
        height: 90vh;
        border: 1px solid #ddd;
      }

      .header {
        background-color: #4361ee;
        color: white;
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .controls {
        padding: 1rem;
        background-color: #f0f0f0;
        margin-bottom: 1rem;
      }

      .legend {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .legend-color {
        width: 20px;
        height: 20px;
        border-radius: 4px;
      }

      #module-info {
        padding: 1rem;
        background-color: #f0f0f0;
        margin-top: 1rem;
      }

      .search-box {
        margin-right: 1rem;
        padding: 0.5rem;
        min-width: 300px;
      }
    </style>
</head>
<body>
    <div class="header">
        <h1>Module Dependency Map - Web3 Crypto Streaming Service</h1>
        <p>Visualization of module dependencies in the codebase</p>
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #6366F1;"></div>
            <span>Controllers</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #10B981;"></div>
            <span>Models</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #F59E0B;"></div>
            <span>Lib</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #EF4444;"></div>
            <span>Scripts</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #8B5CF6;"></div>
            <span>Other</span>
          </div>
        </div>
    </div>

    <div class="controls">
      <label for="search">Search module: </label>
      <input type="text" id="search" class="search-box" placeholder="Enter module name...">
      <button id="fit-btn">Fit View</button>
      <button id="collapse-btn">Collapse All</button>
      <button id="expand-btn">Expand All</button>
    </div>

    <div id="visualization"></div>

    <div id="module-info">
      <h2>Module Details</h2>
      <p>Click on a node to see details</p>
      <div id="detail-content"></div>
    </div>

    <script>
      // Module dependency data
      const nodes = ${JSON.stringify(nodes)};
      const edges = ${JSON.stringify(edges)};
      const files = ${JSON.stringify(dependencyMap.files)};

      // Group colors
      const groupColors = {
        controllers: "#6366F1",
        models: "#10B981",
        lib: "#F59E0B",
        scripts: "#EF4444",
        other: "#8B5CF6"
      };

      // Create a visualization network
      const container = document.getElementById('visualization');

      // Configure vis-network
      const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
      };

      const options = {
        nodes: {
          shape: 'box',
          margin: 10,
          font: {
            size: 14
          },
          shadow: true
        },
        edges: {
          width: 1.5,
          smooth: {
            type: 'continuous'
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.75
            }
          }
        },
        layout: {
          hierarchical: {
            enabled: false
          }
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 150,
            springConstant: 0.08
          },
          stabilization: {
            iterations: 100
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true
        }
      };

      const network = new vis.Network(container, data, options);

      // Handle node selection
      network.on("click", function(params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const fileInfo = files[nodeId];
          const detailContent = document.getElementById('detail-content');

          if (fileInfo) {
            let html = '<h3>' + fileInfo.path + '</h3>';

            html += '<h4>Dependencies:</h4>';
            if (fileInfo.dependencies.length > 0) {
              html += '<ul>';
              fileInfo.dependencies.forEach(dep => {
                html += '<li><strong>' + dep.path + '</strong> [' + dep.type + ']</li>';
              });
              html += '</ul>';
            } else {
              html += '<p>No dependencies</p>';
            }

            // Find modules that depend on this file
            html += '<h4>Used by:</h4>';
            const dependents = [];
            files.forEach((file, index) => {
              if (file.dependencies.some(dep => {
                const targetPath = dep.path.startsWith('.')
                  ? path.join(path.dirname(file.path), dep.path).replace(/\\/g, '/')
                  : dep.path;
                return fileInfo.path === targetPath ||
                       fileInfo.path === targetPath + '.js' ||
                       fileInfo.path === targetPath + '/index.js';
              })) {
                dependents.push({ path: file.path, id: index });
              }
            });

            if (dependents.length > 0) {
              html += '<ul>';
              dependents.forEach(dep => {
                html += '<li><a href="#" class="navigate-to" data-id="' + dep.id + '">' +
                        dep.path + '</a></li>';
              });
              html += '</ul>';
            } else {
              html += '<p>No modules import this file</p>';
            }

            detailContent.innerHTML = html;

            // Add event listeners to navigation links
            document.querySelectorAll('.navigate-to').forEach(link => {
              link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = parseInt(e.target.dataset.id);
                network.selectNodes([targetId]);
                network.focus(targetId, {
                  scale: 1.0,
                  animation: true
                });
              });
            });
          }
        }
      });

      // Search functionality
      const searchInput = document.getElementById('search');
      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();

        if (query.trim() === '') {
          // Reset all nodes
          const allNodes = data.nodes.get();
          for (let node of allNodes) {
            node.color = undefined;
            node.font = undefined;
          }
          data.nodes.update(allNodes);
          return;
        }

        const matchingNodes = [];
        nodes.forEach(node => {
          if (node.label.toLowerCase().includes(query)) {
            matchingNodes.push(node.id);
          }
        });

        // Update nodes to highlight matches
        const allNodes = data.nodes.get();

        for (let node of allNodes) {
          if (matchingNodes.includes(node.id)) {
            node.color = {
              background: '#FFFF00',
              border: '#FFA500'
            };
            node.font = {
              color: '#000000',
              bold: true
            };
          } else {
            node.color = undefined;
            node.font = undefined;
          }
        }

        data.nodes.update(allNodes);

        // Focus on first match if any
        if (matchingNodes.length > 0) {
          network.focus(matchingNodes[0], {
            scale: 1.0,
            animation: true
          });
        }
      });

      // Button handlers
      document.getElementById('fit-btn').addEventListener('click', () => {
        network.fit();
      });

      document.getElementById('collapse-btn').addEventListener('click', () => {
        options.layout.hierarchical.enabled = true;
        options.layout.hierarchical.direction = 'UD';
        network.setOptions(options);
      });

      document.getElementById('expand-btn').addEventListener('click', () => {
        options.layout.hierarchical.enabled = false;
        network.setOptions(options);
      });

      // Helper function to determine module group
      function getModuleGroup(filePath) {
        if (filePath.includes('/controllers/')) return 'controllers';
        if (filePath.includes('/models/')) return 'models';
        if (filePath.includes('/lib/')) return 'lib';
        if (filePath.includes('/scripts/')) return 'scripts';
        return 'other';
      }

      // Add colors based on groups
      const allNodes = data.nodes.get();
      for (let node of allNodes) {
        node.color = {
          background: groupColors[node.group],
          border: groupColors[node.group],
          highlight: {
            background: '#ffffff',
            border: groupColors[node.group]
          }
        };
      }
      data.nodes.update(allNodes);
    </script>
</body>
</html>
  `;
}

/**
 * Determine module group based on file path
 * @param {string} filePath File path
 * @returns {string} Module group name
 */
function getModuleGroup(filePath) {
  if (filePath.includes('/controllers/')) return 'controllers';
  if (filePath.includes('/models/')) return 'models';
  if (filePath.includes('/lib/')) return 'lib';
  if (filePath.includes('/scripts/')) return 'scripts';
  return 'other';
}

/**
 * Main function - generate module dependency map
 */
async function main() {
  console.log(`${colors.cyan}Module Dependency Mapper${colors.reset}\n`);

  try {
    const rootDir = await findProjectRoot();
    console.log(`${colors.blue}Project root:${colors.reset} ${rootDir}\n`);

    const filesToScan = await getFilesToScan(rootDir);
    console.log(`${colors.blue}Found ${filesToScan.length} files to scan${colors.reset}\n`);

    // Process all files
    const processedFiles = [];
    for (const file of filesToScan) {
      const result = await processFile(file, rootDir);
      processedFiles.push(result);
    }

    // Create dependency map
    const dependencyMap = {
      projectName: 'Web3 Crypto Streaming Service',
      generatedAt: new Date().toISOString(),
      totalFiles: processedFiles.length,
      files: processedFiles
    };

    // Create output directory
    const outputPath = path.join(rootDir, OUTPUT_DIR);
    try {
      await fs.mkdir(outputPath, { recursive: true });
    } catch (mkdirError) {
      console.error(`${colors.red}Failed to create output directory:${colors.reset}`, mkdirError);
    }

    // Save dependency map as JSON
    const jsonPath = path.join(outputPath, 'module-map.json');
    await fs.writeFile(jsonPath, JSON.stringify(dependencyMap, null, 2));
    console.log(`${colors.green}Module map JSON saved to:${colors.reset} ${jsonPath}\n`);

    // Generate HTML visualization
    const htmlPath = path.join(outputPath, 'module-map.html');
    const htmlContent = generateHtmlVisualization(dependencyMap);
    await fs.writeFile(htmlPath, htmlContent);
    console.log(`${colors.green}Interactive visualization saved to:${colors.reset} ${htmlPath}`);

    console.log(`\n${colors.green}Module map generation complete!${colors.reset}`);
    console.log(`You can view the interactive visualization by opening the HTML file in your browser.`);

  } catch (error) {
    console.error(`${colors.red}Error generating module map:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
