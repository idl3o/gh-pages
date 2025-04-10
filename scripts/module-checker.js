#!/usr/bin/env node

/**
 * Module Dependency Checker
 *
 * Scans the project to locate all modules, validate require statements,
 * and check for missing dependencies.
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

// Mapped modules (for aliases/custom paths)
const MODULE_MAPPINGS = {
  // Add any custom mappings here if needed
  // './models': '../models'
};

/**
 * Module Checker
 * 
 * This script checks for dependencies and modules required by the Web3 Crypto Streaming Service.
 * It validates both frontend and blockchain-related dependencies.
 */

const MODULE_REQUIREMENTS = {
    core: [
        { name: "web3", minVersion: "1.7.0", description: "JavaScript library to interact with Ethereum" },
        { name: "ethers", minVersion: "5.6.0", description: "Complete Ethereum library and wallet implementation" },
        { name: "ipfs-http-client", minVersion: "56.0.0", description: "IPFS API client library for JavaScript" }
    ],
    contracts: [
        { name: "@openzeppelin/contracts", minVersion: "4.5.0", description: "Library for secure smart contract development" },
        { name: "hardhat", minVersion: "2.9.0", description: "Ethereum development environment" },
        { name: "@nomiclabs/hardhat-ethers", minVersion: "2.0.0", description: "Hardhat plugin for ethers.js" }
    ],
    frontend: [
        { name: "react", minVersion: "17.0.0", description: "JavaScript library for building user interfaces" },
        { name: "bootstrap", minVersion: "5.1.0", description: "Frontend component library" },
        { name: "chart.js", minVersion: "3.7.0", description: "JavaScript charting library" }
    ],
    testing: [
        { name: "chai", minVersion: "4.3.0", description: "Assertion library" },
        { name: "mocha", minVersion: "9.1.0", description: "JavaScript test framework" }
    ]
};

/**
 * Checks if a package is installed and meets the minimum version requirement
 * @param {string} packageName - Name of the package to check
 * @param {string} minVersion - Minimum required version
 * @returns {Object} - Result with status and message
 */
function checkPackageVersion(packageName, minVersion) {
    try {
        // In a browser environment, we'd use a different approach
        if (typeof window !== 'undefined') {
            console.warn(`Cannot check ${packageName} version in browser environment`);
            return { status: 'unknown', message: 'Cannot check in browser environment' };
        }
        
        // Node.js environment
        const packageJson = require(`${packageName}/package.json`);
        const installedVersion = packageJson.version;
        
        if (compareVersions(installedVersion, minVersion) >= 0) {
            return { 
                status: 'success', 
                message: `${packageName}@${installedVersion} (✓ meets ${minVersion} requirement)` 
            };
        } else {
            return { 
                status: 'warning', 
                message: `${packageName}@${installedVersion} (✗ below ${minVersion} requirement)` 
            };
        }
    } catch (error) {
        return { 
            status: 'error', 
            message: `${packageName} not found. Run: npm install ${packageName}@${minVersion} or higher` 
        };
    }
}

/**
 * Compares two version strings
 * @param {string} v1 - First version string
 * @param {string} v2 - Second version string
 * @returns {number} - 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    
    return 0;
}

/**
 * Runs module checks and returns results
 * @param {Array} categories - Categories to check (default: all)
 * @returns {Object} - Results organized by category
 */
function runModuleChecks(categories = Object.keys(MODULE_REQUIREMENTS)) {
    const results = {};
    
    categories.forEach(category => {
        if (MODULE_REQUIREMENTS[category]) {
            results[category] = {};
            
            MODULE_REQUIREMENTS[category].forEach(module => {
                results[category][module.name] = {
                    ...checkPackageVersion(module.name, module.minVersion),
                    description: module.description,
                    required: module.minVersion
                };
            });
        }
    });
    
    return results;
}

/**
 * Generates a report based on check results
 * @param {Object} results - Check results from runModuleChecks()
 * @returns {string} - Formatted report
 */
function generateReport(results) {
    let report = "## Module Check Report\n\n";
    
    Object.keys(results).forEach(category => {
        report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Dependencies\n\n`;
        report += "| Package | Status | Description | Required | Message |\n";
        report += "|---------|--------|-------------|----------|--------|\n";
        
        Object.keys(results[category]).forEach(moduleName => {
            const module = results[category][moduleName];
            const statusIcon = module.status === 'success' ? '✅' : 
                               module.status === 'warning' ? '⚠️' : '❌';
            
            report += `| ${moduleName} | ${statusIcon} | ${module.description} | ${module.required} | ${module.message} |\n`;
        });
        
        report += "\n";
    });
    
    return report;
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runModuleChecks,
        generateReport,
        MODULE_REQUIREMENTS
    };
}

// For browser environment
if (typeof window !== 'undefined') {
    window.ModuleChecker = {
        requirements: MODULE_REQUIREMENTS,
        checkModules: function() {
            console.log("Module checking in browser environment is limited. Using browser detection instead.");
            
            const browserReport = {
                browser: {
                    name: detectBrowser(),
                    features: checkBrowserFeatures()
                }
            };
            
            console.table(browserReport);
            return browserReport;
        }
    };
    
    // Simple browser detection
    function detectBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.indexOf("Chrome") > -1) return "Chrome";
        if (userAgent.indexOf("Safari") > -1) return "Safari";
        if (userAgent.indexOf("Firefox") > -1) return "Firefox";
        if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
        if (userAgent.indexOf("Edge") > -1) return "Edge";
        
        return "Unknown";
    }
    
    // Check for essential browser features
    function checkBrowserFeatures() {
        return {
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            indexedDB: !!window.indexedDB,
            webCrypto: !!window.crypto && !!window.crypto.subtle,
            serviceWorker: 'serviceWorker' in navigator
        };
    }
}

// If run directly from Node.js command line
if (typeof require !== 'undefined' && require.main === module) {
    const results = runModuleChecks();
    console.log(generateReport(results));
}
