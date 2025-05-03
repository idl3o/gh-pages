/**
 * Dashboard Builder Script
 * Processes and optimizes the dashboard HTML, CSS and JS files
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const cheerio = require('cheerio');

console.log(chalk.blue('🔧 Building StreamChain Creator Dashboard'));

// Define paths
const dashboardPath = path.join(__dirname, '..', 'creator-dashboard.html');
const cssPath = path.join(__dirname, '..', 'css', 'dashboard.css');
const outputDir = path.join(__dirname, '..', '_site');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Make sure dashboard directories exist
require('./ensure-dashboard-dirs');

// Generate analytics data
require('./dashboard-analytics');

// Process the dashboard HTML
console.log(chalk.gray('Processing dashboard HTML...'));
if (fs.existsSync(dashboardPath)) {
  let html = fs.readFileSync(dashboardPath, 'utf8');

  // Load HTML with cheerio
  const $ = cheerio.load(html);

  // Add meta tags for better SEO and mobile support
  $('head').prepend(`
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="StreamChain Creator Dashboard - Manage your Web3 streaming content and analytics">
    <meta name="theme-color" content="#1A1E2E">
  `);

  // Update title if needed
  if ($('title').length === 0) {
    $('head').append('<title>Creator Dashboard | StreamChain</title>');
  }

  // Add preconnect for performance
  $('head').append(`
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  `);

  // Add noscript message
  $('body').prepend(`
    <noscript>
      <div class="noscript-warning">
        JavaScript is required for the StreamChain Creator Dashboard to function properly.
        Please enable JavaScript in your browser settings.
      </div>
    </noscript>
  `);

  // Add a loader that disappears when the page is ready
  $('body').prepend(`
    <div id="page-loader">
      <div class="spinner"></div>
      <p>Loading Dashboard...</p>
    </div>
  `);

  // Add script to remove loader when page is ready
  $('body').append(`
    <script>
      window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          document.getElementById('page-loader').classList.add('loaded');
          setTimeout(function() {
            document.getElementById('page-loader').style.display = 'none';
          }, 500);
        }, 300);
      });
    </script>
  `);

  // Write the processed HTML back
  fs.writeFileSync(path.join(outputDir, 'creator-dashboard.html'), $.html());
  console.log(chalk.green('✓ Dashboard HTML processed'));
} else {
  console.log(chalk.yellow('⚠️ Dashboard HTML not found at:', dashboardPath));
}

// Copy and process the CSS
if (fs.existsSync(cssPath)) {
  console.log(chalk.gray('Processing dashboard CSS...'));

  // Simple CSS processing - in a real application you might want to use PostCSS or other tools
  let css = fs.readFileSync(cssPath, 'utf8');

  // Add CSS for loader and noscript warning
  css += `
    #page-loader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #1A1E2E;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.5s ease;
    }

    #page-loader.loaded {
      opacity: 0;
    }

    #page-loader .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    #page-loader p {
      margin-top: 20px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .noscript-warning {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 20px;
      background-color: #e74c3c;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      text-align: center;
      z-index: 10000;
    }
  `;

  // Ensure CSS output directory exists
  const cssDirOutput = path.join(outputDir, 'css');
  if (!fs.existsSync(cssDirOutput)) {
    fs.mkdirSync(cssDirOutput, { recursive: true });
  }

  // Write processed CSS
  fs.writeFileSync(path.join(cssDirOutput, 'dashboard.css'), css);
  console.log(chalk.green('✓ Dashboard CSS processed'));
} else {
  console.log(chalk.yellow('⚠️ Dashboard CSS not found at:', cssPath));
}

// Copy images directory
const imagesDir = path.join(__dirname, '..', 'images');
const imagesDirOutput = path.join(outputDir, 'images');

if (fs.existsSync(imagesDir)) {
  console.log(chalk.gray('Copying images...'));

  if (!fs.existsSync(imagesDirOutput)) {
    fs.mkdirSync(imagesDirOutput, { recursive: true });
  }

  // Copy all files from images dir
  fs.readdirSync(imagesDir).forEach(file => {
    const srcPath = path.join(imagesDir, file);
    const destPath = path.join(imagesDirOutput, file);

    // Only copy files, not directories
    if (fs.lstatSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });

  console.log(chalk.green('✓ Images copied'));
} else {
  console.log(chalk.yellow('⚠️ Images directory not found'));
}

// Copy data directory
const dataDir = path.join(__dirname, '..', 'data');
const dataDirOutput = path.join(outputDir, 'data');

if (fs.existsSync(dataDir)) {
  console.log(chalk.gray('Copying data files...'));

  if (!fs.existsSync(dataDirOutput)) {
    fs.mkdirSync(dataDirOutput, { recursive: true });
  }

  // Copy all JSON files from data dir
  fs.readdirSync(dataDir).forEach(file => {
    if (file.endsWith('.json')) {
      const srcPath = path.join(dataDir, file);
      const destPath = path.join(dataDirOutput, file);
      fs.copyFileSync(srcPath, destPath);
    }
  });

  console.log(chalk.green('✓ Data files copied'));
} else {
  console.log(chalk.yellow('⚠️ Data directory not found'));
}

console.log(chalk.green('✅ Dashboard build completed!'));
