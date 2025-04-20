/**
 * Web3 Streaming Player Project Structure
 *
 * This file defines the project structure and key components
 * for implementing the Web3 streaming player.
 */

const projectStructure = {
  core: [
    {
      name: "Smart Contracts",
      path: "./contracts/",
      files: [
        "StreamingToken.sol",  // ERC20 token for streaming access
        "ContentRegistry.sol", // Registry for content metadata
        "StreamingAccess.sol", // Manages streaming permissions
      ]
    },
    {
      name: "Frontend",
      path: "./",
      files: [
        "index.html",        // Landing page
        "streaming.html",    // Main streaming player
        "token-explorer.html" // Token analytics page
      ]
    },
    {
      name: "JavaScript Modules",
      path: "./assets/js/",
      files: [
        "wallet-connector.js", // Wallet integration
        "video-loader.js",     // IPFS video loading
        "network-config.js",   // Network configuration
        "contract-manager.js"  // Smart contract interactions
      ]
    },
    {
      name: "Styles",
      path: "./assets/css/",
      files: [
        "main.css" // Main styles
      ]
    }
  ],

  // Development tools config files
  config: [
    "hardhat.config.js",
    "ipfs.config.js",
    "package.json",
    ".env.example"
  ],

  // Directory structure
  directories: [
    "./contracts",
    "./assets/js",
    "./assets/css",
    "./assets/images",
    "./dist",
    "./test"
  ]
};

// Export the structure for use in build scripts
module.exports = projectStructure;

console.log('Project structure defined for Web3 Streaming Player');
console.log('Run "npm install" to install dependencies');
console.log('Run "npm run build" to build the project');
