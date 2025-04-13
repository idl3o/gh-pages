#!/usr/bin/env node
/**
 * PRX CLI for GitHub Pages
 * Command-line interface to manage the proxy server
 */

const { startPrxServer } = require('./prx-server');
const prxConfig = require('./config/prx-config');
const fs = require('fs');
const path = require('path');

// Process command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Get environment from command line or environment variable
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] 
  || process.env.NODE_ENV 
  || 'development';

// Help text
function showHelp() {
  console.log('PRX CLI - GitHub Pages Proxy Management');
  console.log('');
  console.log('Usage:');
  console.log('  node prx-cli.js <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  start            Start the PRX server');
  console.log('  status           Show PRX server status');
  console.log('  config           Show current configuration');
  console.log('  save-config      Save configuration to file');
  console.log('  help             Show this help message');
  console.log('');
  console.log('Options:');
  console.log('  --env=<env>      Set environment (development, production, test)');
  console.log('  --port=<port>    Override port number');
  console.log('  --target=<url>   Override target origin URL');
  console.log('');
}

// Get configuration with overrides
function getConfig() {
  const config = { ...prxConfig[env] };
  
  // Apply command line overrides
  args.forEach(arg => {
    if (arg.startsWith('--port=')) {
      config.port = parseInt(arg.split('=')[1], 10);
    }
    if (arg.startsWith('--target=')) {
      config.targetOrigin = arg.split('=')[1];
    }
  });
  
  return config;
}

// Execute the command
switch (command) {
  case 'start':
    console.log(`Starting PRX server in ${env} mode...`);
    startPrxServer(getConfig());
    break;
    
  case 'status':
    // This would check if the server is running
    console.log('PRX Status Check:');
    console.log('This feature would check if the server is running');
    console.log(`Environment: ${env}`);
    console.log(`Configuration: ${JSON.stringify(getConfig(), null, 2)}`);
    break;
    
  case 'config':
    console.log(`PRX Configuration (${env}):`);
    console.log(JSON.stringify(getConfig(), null, 2));
    break;
    
  case 'save-config':
    const config = getConfig();
    const configDir = path.join(__dirname, 'config');
    const configPath = path.join(configDir, `prx-config.${env}.json`);
    
    try {
      // Ensure the config directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Write the configuration
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`Configuration saved to ${configPath}`);
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
    break;
    
  case 'help':
  default:
    showHelp();
    break;
}
