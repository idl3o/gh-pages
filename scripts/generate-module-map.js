#!/usr/bin/env node

/**
 * Module Map Generator
 * 
 * This script automatically generates documentation maps for the project
 * based on JSDoc comments and folder structure.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDirs: ['controllers', 'models', 'assets/js'],
  outputPath: 'docs/module-map/index.html',
  templatesPath: '_includes',
  title: 'Web3 Streaming Platform Architecture'
};

// Module metadata storage
const modules = {
  controllers: [],
  models: [],
  utilities: []
};

/**
 * Extract JSDoc comments from a JavaScript file
 * @param {string} filePath Path to the file
 * @returns {Object} Extracted metadata
 */
function extractMetadata(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileInfo = {
      path: filePath,
      name: path.basename(filePath),
      description: '',
      methods: [],
      dependencies: []
    };

    // Extract file description from main JSDoc comment
    const classMatch = content.match(/\/\*\*\s*\n([^*]|\*[^/])*\*\//);
    if (classMatch) {
      const descMatch = classMatch[0].match(/@description\s+([^\n]+)/);
      if (descMatch) {
        fileInfo.description = descMatch[1].trim();
      } else {
        // Try to extract description from the first line after the comment start
        const firstLine = classMatch[0].split('\n')[1];
        if (firstLine) {
          fileInfo.description = firstLine.replace(/\s*\*\s*/, '').trim();
        }
      }
    }

    // Extract methods with JSDoc comments
    const methodMatches = content.matchAll(/\/\*\*\s*\n([^*]|\*[^/])*\*\/\s*(?:async\s+)?(?:function\s+)?(\w+)/g);
    for (const match of methodMatches) {
      const methodName = match[2];
      if (methodName && methodName !== 'constructor') {
        fileInfo.methods.push(methodName);
      }
    }

    // Extract dependencies from require statements
    const requireMatches = content.matchAll(/require\(['"]([^'"]+)['"]\)/g);
    for (const match of requireMatches) {
      const dep = match[1];
      if (dep.startsWith('../')) {
        // Only include internal project dependencies
        fileInfo.dependencies.push(dep);
      }
    }

    return fileInfo;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Scan a directory recursively for JavaScript files
 * @param {string} dir Directory to scan
 * @param {Function} callback Callback for each file
 */
function scanDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDir(filePath, callback);
    } else if (path.extname(file) === '.js') {
      callback(filePath);
    }
  });
}

/**
 * Generate HTML for module map
 * @returns {string} HTML content
 */
function generateHTML() {
  // Start HTML content
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CONFIG.title}</title>
  <link rel="stylesheet" href="/assets/css/main.css">
  <style>
    .module-map {
      margin: 2rem 0;
    }
    .module-section {
      margin-bottom: 2rem;
    }
    .module-card {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
      background-color: #f9f9f9;
    }
    .module-name {
      font-weight: bold;
      font-size: 1.1rem;
    }
    .module-description {
      margin: 0.5rem 0;
      color: #555;
    }
    .module-methods {
      margin-top: 0.5rem;
    }
    .module-methods strong {
      font-weight: 500;
    }
    .module-dependencies {
      font-size: 0.9rem;
      margin-top: 0.5rem;
      color: #666;
    }
    .module-section h2 {
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${CONFIG.title}</h1>
    <p>This documentation is automatically generated from the codebase and provides an overview of the system architecture.</p>
    
    <div class="module-map">`;

  // Generate Controllers section
  html += `
      <div class="module-section">
        <h2>Controllers</h2>
        <p>Controllers handle user interactions and application flow.</p>`;
  
  modules.controllers.forEach(controller => {
    html += `
        <div class="module-card">
          <div class="module-name">${controller.name.replace('.js', '')}</div>
          <div class="module-description">${controller.description || 'No description available'}</div>
          <div class="module-methods">
            <strong>Methods:</strong> ${controller.methods.join(', ') || 'None documented'}
          </div>
          <div class="module-dependencies">
            <strong>Dependencies:</strong> ${controller.dependencies.map(d => {
              const basename = path.basename(d);
              return `<span class="dependency">${basename}</span>`;
            }).join(', ') || 'None'}
          </div>
        </div>`;
  });
  
  html += `
      </div>`;

  // Generate Models section
  html += `
      <div class="module-section">
        <h2>Models</h2>
        <p>Models represent data structures and business logic.</p>`;
  
  modules.models.forEach(model => {
    html += `
        <div class="module-card">
          <div class="module-name">${model.name.replace('.js', '')}</div>
          <div class="module-description">${model.description || 'No description available'}</div>
          <div class="module-methods">
            <strong>Methods:</strong> ${model.methods.join(', ') || 'None documented'}
          </div>
          <div class="module-dependencies">
            <strong>Dependencies:</strong> ${model.dependencies.map(d => {
              const basename = path.basename(d);
              return `<span class="dependency">${basename}</span>`;
            }).join(', ') || 'None'}
          </div>
        </div>`;
  });
  
  html += `
      </div>`;

  // Generate Utilities section
  html += `
      <div class="module-section">
        <h2>Utilities</h2>
        <p>Utility functions that support the application.</p>`;
  
  modules.utilities.forEach(util => {
    html += `
        <div class="module-card">
          <div class="module-name">${util.name.replace('.js', '')}</div>
          <div class="module-description">${util.description || 'No description available'}</div>
          <div class="module-methods">
            <strong>Methods:</strong> ${util.methods.join(', ') || 'None documented'}
          </div>
          <div class="module-dependencies">
            <strong>Dependencies:</strong> ${util.dependencies.map(d => {
              const basename = path.basename(d);
              return `<span class="dependency">${basename}</span>`;
            }).join(', ') || 'None'}
          </div>
        </div>`;
  });
  
  html += `
      </div>
    </div>
    
    <div class="generation-info">
      <p>Last generated on: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

// Main execution
console.log('Generating module map...');

// Make sure output directory exists
const outputDir = path.dirname(CONFIG.outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Scan source directories
CONFIG.sourceDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDir(dir, filePath => {
      const metadata = extractMetadata(filePath);
      
      if (metadata) {
        if (filePath.includes('/controllers/')) {
          modules.controllers.push(metadata);
        } else if (filePath.includes('/models/')) {
          modules.models.push(metadata);
        } else {
          modules.utilities.push(metadata);
        }
      }
    });
  } else {
    console.warn(`Directory not found: ${dir}`);
  }
});

// Generate and write HTML
try {
  const html = generateHTML();
  fs.writeFileSync(CONFIG.outputPath, html);
  console.log(`Module map generated successfully: ${CONFIG.outputPath}`);
} catch (error) {
  console.error('Failed to generate module map:', error);
}
