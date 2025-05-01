---
layout: default
title: Development Utilities Documentation
---

# Development Utilities Documentation

This documentation covers the utility tools and scripts that support development, deployment, and optimization of our platform.

## Overview

Our development utilities provide essential tools for managing blockchain interactions, environment configuration, deployment automation, and performance optimization.

## Key Utilities

### Gas Price Manager

The Gas Price Manager utility helps optimize transaction costs on Ethereum and other EVM-compatible blockchains.

```javascript
// gas-price-manager.js
const { ethers } = require('ethers');
const axios = require('axios');

class GasPriceManager {
  constructor(config = {}) {
    this.provider = config.provider || new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.gasPriceOracle = config.gasPriceOracle || 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=';
    this.apiKey = config.apiKey || '';
    this.defaultPriorityFee = config.defaultPriorityFee || ethers.utils.parseUnits('1.5', 'gwei');
    this.updateInterval = config.updateInterval || 60000; // 1 minute
    this.gasPrices = {
      standard: ethers.utils.parseUnits('50', 'gwei'),
      fast: ethers.utils.parseUnits('55', 'gwei'),
      fastest: ethers.utils.parseUnits('60', 'gwei')
    };
    
    this.lastUpdated = 0;
  }

  async updateGasPrices() {
    const now = Date.now();
    
    // Only update if more than updateInterval has passed
    if (now - this.lastUpdated < this.updateInterval) {
      return this.gasPrices;
    }
    
    try {
      // Try to get gas prices from the gas oracle
      const response = await axios.get(`${this.gasPriceOracle}${this.apiKey}`);
      
      if (response.data && response.data.status === '1') {
        const result = response.data.result;
        
        this.gasPrices = {
          standard: ethers.utils.parseUnits(result.SafeGasPrice, 'gwei'),
          fast: ethers.utils.parseUnits(result.ProposeGasPrice, 'gwei'),
          fastest: ethers.utils.parseUnits(result.FastGasPrice, 'gwei')
        };
      } else {
        // Fallback to provider's gas price
        const gasPrice = await this.provider.getGasPrice();
        
        this.gasPrices = {
          standard: gasPrice,
          fast: gasPrice.add(gasPrice.div(10)), // +10%
          fastest: gasPrice.add(gasPrice.div(5)) // +20%
        };
      }
      
      this.lastUpdated = now;
    } catch (error) {
      console.error('Error updating gas prices:', error);
      
      // Try fallback method
      try {
        const gasPrice = await this.provider.getGasPrice();
        
        this.gasPrices = {
          standard: gasPrice,
          fast: gasPrice.add(gasPrice.div(10)),
          fastest: gasPrice.add(gasPrice.div(5))
        };
        
        this.lastUpdated = now;
      } catch (fallbackError) {
        console.error('Fallback gas price update failed:', fallbackError);
      }
    }
    
    return this.gasPrices;
  }

  async getGasPrice(speed = 'standard') {
    await this.updateGasPrices();
    return this.gasPrices[speed] || this.gasPrices.standard;
  }

  async getFeeData() {
    // For EIP-1559 compatible networks
    try {
      const feeData = await this.provider.getFeeData();
      
      if (feeData.maxFeePerGas) {
        return feeData;
      }
      
      // Network doesn't support EIP-1559 or getFeeData failed
      const gasPrice = await this.getGasPrice('fast');
      
      return {
        lastBaseFeePerGas: null,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: this.defaultPriorityFee,
        gasPrice
      };
    } catch (error) {
      console.error('Error getting fee data:', error);
      
      // Fallback to standard gas price
      const gasPrice = await this.getGasPrice('standard');
      
      return {
        lastBaseFeePerGas: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice
      };
    }
  }

  async getTransactionOptions(speed = 'standard') {
    const network = await this.provider.getNetwork();
    
    // Check if the network supports EIP-1559
    if (network.chainId === 1 || network.chainId === 3 || network.chainId === 4 || network.chainId === 5 || network.chainId === 42) {
      // Ethereum mainnet or testnets
      const feeData = await this.getFeeData();
      
      if (feeData.maxFeePerGas) {
        // Support for EIP-1559
        return {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        };
      }
    }
    
    // Fallback for non-EIP-1559 networks
    return {
      gasPrice: await this.getGasPrice(speed)
    };
  }
}

module.exports = GasPriceManager;
```

#### Usage Example

```javascript
const { ethers } = require('ethers');
const GasPriceManager = require('./utils/gas-price-manager');

async function optimizeTransactionCosts() {
  // Initialize provider
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your-project-id');
  
  // Initialize gas price manager
  const gasPriceManager = new GasPriceManager({
    provider,
    apiKey: 'your-etherscan-api-key'
  });
  
  // Get current gas prices
  const gasPrices = await gasPriceManager.updateGasPrices();
  console.log('Current gas prices:');
  console.log(`Standard: ${ethers.utils.formatUnits(gasPrices.standard, 'gwei')} gwei`);
  console.log(`Fast: ${ethers.utils.formatUnits(gasPrices.fast, 'gwei')} gwei`);
  console.log(`Fastest: ${ethers.utils.formatUnits(gasPrices.fastest, 'gwei')} gwei`);
  
  // Create a transaction with optimized gas settings
  const wallet = new ethers.Wallet('your-private-key', provider);
  const txOptions = await gasPriceManager.getTransactionOptions('fast');
  
  const tx = await wallet.sendTransaction({
    to: '0xRecipientAddress',
    value: ethers.utils.parseEther('0.1'),
    ...txOptions
  });
  
  console.log(`Transaction sent: ${tx.hash}`);
  console.log('Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
}
```

### Environment Utilities

Environment utilities simplify configuration and setup across different environments.

```javascript
// cfig.js - Configuration Manager
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

class ConfigManager {
  constructor(options = {}) {
    this.configDir = options.configDir || path.join(process.cwd(), 'config');
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.envFile = options.envFile || '.env';
    this.config = {};
    
    // Load environment variables
    dotenv.config({ path: path.join(process.cwd(), this.envFile) });
    
    // Initialize configuration
    this.loadConfig();
  }

  loadConfig() {
    try {
      // Load base configuration
      const baseConfigPath = path.join(this.configDir, 'base.json');
      if (fs.existsSync(baseConfigPath)) {
        const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
        this.config = { ...baseConfig };
      }
      
      // Load environment-specific configuration
      const envConfigPath = path.join(this.configDir, `${this.environment}.json`);
      if (fs.existsSync(envConfigPath)) {
        const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
        this.config = { ...this.config, ...envConfig };
      }
      
      // Override with environment variables
      this.overrideWithEnvVars();
      
      console.log(`Configuration loaded for environment: ${this.environment}`);
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    }
  }

  overrideWithEnvVars() {
    const overrideConfig = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const envPath = path ? `${path}_${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          overrideConfig(value, envPath);
        } else {
          const envVarName = `CONFIG_${envPath.toUpperCase()}`;
          
          if (process.env[envVarName] !== undefined) {
            let envValue = process.env[envVarName];
            
            // Convert to appropriate type
            if (typeof value === 'number') {
              envValue = Number(envValue);
            } else if (typeof value === 'boolean') {
              envValue = envValue.toLowerCase() === 'true';
            }
            
            this.setNestedValue(obj, key, envValue);
          }
        }
      }
    };
    
    overrideConfig(this.config);
  }

  setNestedValue(obj, key, value) {
    obj[key] = value;
  }

  get(key, defaultValue = null) {
    const keys = key.split('.');
    let result = this.config;
    
    for (const k of keys) {
      if (result === undefined || result === null) {
        return defaultValue;
      }
      
      result = result[k];
    }
    
    return result !== undefined ? result : defaultValue;
  }

  getAll() {
    return { ...this.config };
  }
}

module.exports = ConfigManager;
```

#### Usage Example

```javascript
const ConfigManager = require('./utils/cfig');

// Initialize configuration
const config = new ConfigManager({
  environment: process.env.NODE_ENV,
  configDir: './config'
});

// Access configuration values
const serverPort = config.get('server.port', 3000);
const dbUrl = config.get('database.url');
const apiKeys = config.get('api.keys', []);

console.log(`Server port: ${serverPort}`);
console.log(`Database URL: ${dbUrl}`);
console.log(`API keys: ${apiKeys.join(', ')}`);

// Start server with configuration
function startServer() {
  const express = require('express');
  const app = express();
  
  app.listen(serverPort, () => {
    console.log(`Server running on port ${serverPort}`);
  });
}
```

### Ruby Setup Tools

Ruby setup tools automate the configuration and installation of Ruby-based components.

```ruby
# ruby_env_setup.rb
require 'fileutils'
require 'json'
require 'open3'

class RubyEnvironmentSetup
  def initialize(options = {})
    @options = {
      ruby_version: '2.7.4',
      bundler_version: '2.2.27',
      install_dependencies: true,
      setup_jekyll: false
    }.merge(options)
    
    @log_file = 'ruby_setup.log'
  end
  
  def setup
    log_message("Starting Ruby environment setup")
    log_message("Ruby version: #{@options[:ruby_version]}")
    log_message("Bundler version: #{@options[:bundler_version]}")
    
    check_ruby_installation
    install_bundler
    
    if @options[:setup_jekyll]
      setup_jekyll
    end
    
    if @options[:install_dependencies]
      install_dependencies
    end
    
    log_message("Ruby environment setup completed successfully")
  rescue => e
    log_message("Error during setup: #{e.message}")
    log_message(e.backtrace.join("\n"))
    exit(1)
  end
  
  private
  
  def check_ruby_installation
    log_message("Checking Ruby installation...")
    
    stdout, stderr, status = Open3.capture3('ruby -v')
    
    if status.success?
      log_message("Ruby detected: #{stdout.strip}")
      
      # Check if version matches
      version_match = stdout.match(/ruby (\d+\.\d+\.\d+)/)
      if version_match && version_match[1] != @options[:ruby_version]
        log_message("Warning: Ruby version mismatch. Expected #{@options[:ruby_version]}, got #{version_match[1]}")
        log_message("Consider installing the correct Ruby version")
      end
    else
      log_message("Ruby not found. Please install Ruby #{@options[:ruby_version]}")
      exit(1)
    end
  end
  
  def install_bundler
    log_message("Installing Bundler #{@options[:bundler_version]}...")
    
    stdout, stderr, status = Open3.capture3("gem install bundler -v #{@options[:bundler_version]}")
    
    if status.success?
      log_message("Bundler #{@options[:bundler_version]} installed successfully")
    else
      log_message("Failed to install Bundler: #{stderr}")
      exit(1)
    end
  end
  
  def setup_jekyll
    log_message("Setting up Jekyll...")
    
    # Check if Jekyll is installed
    stdout, stderr, status = Open3.capture3('jekyll -v')
    
    if !status.success?
      log_message("Installing Jekyll...")
      stdout, stderr, status = Open3.capture3('gem install jekyll')
      
      if !status.success?
        log_message("Failed to install Jekyll: #{stderr}")
        exit(1)
      end
    else
      log_message("Jekyll detected: #{stdout.strip}")
    end
    
    # Check for Gemfile
    if File.exist?('Gemfile')
      log_message("Gemfile found, installing dependencies...")
      stdout, stderr, status = Open3.capture3('bundle install')
      
      if !status.success?
        log_message("Failed to install bundle dependencies: #{stderr}")
        exit(1)
      end
    else
      log_message("No Gemfile found, creating default Jekyll Gemfile...")
      
      # Create default Jekyll Gemfile
      File.open('Gemfile', 'w') do |f|
        f.puts "source 'https://rubygems.org'"
        f.puts "gem 'jekyll', '~> 4.2.0'"
        f.puts "gem 'minima', '~> 2.5'"
        f.puts "group :jekyll_plugins do"
        f.puts "  gem 'jekyll-feed', '~> 0.12'"
        f.puts "end"
      end
      
      log_message("Default Gemfile created, installing dependencies...")
      stdout, stderr, status = Open3.capture3('bundle install')
      
      if !status.success?
        log_message("Failed to install bundle dependencies: #{stderr}")
        exit(1)
      end
    end
    
    log_message("Jekyll setup completed")
  end
  
  def install_dependencies
    log_message("Installing dependencies from Gemfile...")
    
    if File.exist?('Gemfile')
      stdout, stderr, status = Open3.capture3('bundle install')
      
      if status.success?
        log_message("Dependencies installed successfully")
      else
        log_message("Failed to install dependencies: #{stderr}")
        exit(1)
      end
    else
      log_message("No Gemfile found, skipping dependency installation")
    end
  end
  
  def log_message(message)
    timestamp = Time.now.strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = "[#{timestamp}] #{message}"
    
    puts formatted_message
    
    File.open(@log_file, 'a') do |f|
      f.puts formatted_message
    end
  end
end

# Execute if run directly
if __FILE__ == $0
  options = {
    setup_jekyll: ARGV.include?('--jekyll'),
    install_dependencies: !ARGV.include?('--no-deps')
  }
  
  RubyEnvironmentSetup.new(options).setup
end
```

#### Usage Example

```bash
# Setup Ruby environment for Jekyll
ruby ruby_env_setup.rb --jekyll

# Setup Ruby environment without installing dependencies
ruby ruby_env_setup.rb --no-deps
```

### Deployment Scripts

Deployment scripts automate the process of building and deploying the platform to various environments.

```powershell
# deploy-gh-pages.ps1
<#
.SYNOPSIS
    Deploys the website to GitHub Pages
.DESCRIPTION
    This script builds the Jekyll site and deploys it to GitHub Pages.
    It requires Git and Ruby with Jekyll installed.
.NOTES
    Author: Platform Team
    Date: May 1, 2025
#>

# Stop on errors
$ErrorActionPreference = "Stop"

# Configuration
$buildDir = "./_site"
$sourceBranch = "main"
$deployBranch = "gh-pages"
$commitMessage = "Deploy site update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Log function
function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Log "Git detected: $gitVersion"
} catch {
    Write-Log "Git not found. Please install Git." "ERROR"
    exit 1
}

# Check current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne $sourceBranch) {
    Write-Log "You are not on the $sourceBranch branch. Please switch to $sourceBranch before deploying." "WARNING"
    $confirm = Read-Host "Do you want to continue anyway? (y/n)"
    if ($confirm -ne "y") {
        Write-Log "Deployment aborted." "INFO"
        exit 0
    }
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Log "You have uncommitted changes. Please commit or stash them before deploying." "WARNING"
    $confirm = Read-Host "Do you want to continue anyway? (y/n)"
    if ($confirm -ne "y") {
        Write-Log "Deployment aborted." "INFO"
        exit 0
    }
}

# Build the site
try {
    Write-Log "Building the site with Jekyll..." "INFO"
    
    # Set Ruby environment path
    $env:PATH = "C:\Ruby27-x64\bin;$env:PATH"
    
    # Build the site
    bundle exec jekyll build
    
    if (-not $?) {
        Write-Log "Jekyll build failed." "ERROR"
        exit 1
    }
    
    Write-Log "Site built successfully." "INFO"
} catch {
    Write-Log "Failed to build the site: $_" "ERROR"
    exit 1
}

# Deploy to GitHub Pages
try {
    Write-Log "Deploying to GitHub Pages..." "INFO"
    
    # Save current branch to return to it later
    $originalBranch = git rev-parse --abbrev-ref HEAD
    
    # Check if the deploy branch exists
    $branchExists = git show-ref --verify --quiet refs/heads/$deployBranch
    
    if ($branchExists -eq $false) {
        Write-Log "Creating $deployBranch branch..." "INFO"
        git checkout --orphan $deployBranch
        git rm -rf .
    } else {
        Write-Log "Checking out $deployBranch branch..." "INFO"
        git checkout $deployBranch
        
        # Remove all files except .git directory
        Get-ChildItem -Path . -Exclude .git | Remove-Item -Recurse -Force
    }
    
    # Copy built files
    Write-Log "Copying built files..." "INFO"
    Copy-Item -Path "$buildDir/*" -Destination . -Recurse
    
    # Add, commit, and push
    git add -A
    git commit -m "$commitMessage"
    git push origin $deployBranch
    
    # Return to original branch
    git checkout $originalBranch
    
    Write-Log "Deployment completed successfully!" "INFO"
} catch {
    Write-Log "Failed to deploy: $_" "ERROR"
    
    # Try to return to original branch
    try {
        git checkout $originalBranch
    } catch {
        Write-Log "Failed to return to original branch. You may need to do this manually." "WARNING"
    }
    
    exit 1
}
```

#### Usage Example

```powershell
# Deploy to GitHub Pages
.\deploy-gh-pages.ps1
```

## Utility Functions

In addition to the major utilities, we provide a collection of smaller utility functions for common tasks.

### Browser Compatibility Checking

```javascript
// browser-compatibility.js
const browserify = require('browserify');
const babelify = require('babelify');
const fs = require('fs');
const path = require('path');
const browserslist = require('browserslist');

class BrowserCompatibilityChecker {
  constructor(options = {}) {
    this.sourceDir = options.sourceDir || './src';
    this.outputDir = options.outputDir || './dist';
    this.targets = options.targets || '> 0.5%, last 2 versions, not dead';
    this.checkFiles = options.checkFiles || ['*.js'];
  }

  async checkCompatibility() {
    const supportedBrowsers = browserslist(this.targets);
    console.log('Checking compatibility for browsers:', supportedBrowsers.join(', '));
    
    const files = this.getJsFiles();
    const results = [];
    
    for (const file of files) {
      const result = await this.checkFile(file);
      results.push(result);
    }
    
    return results;
  }

  getJsFiles() {
    // Implementation to find JS files based on this.checkFiles patterns
    // This is a simplified version
    return fs.readdirSync(this.sourceDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(this.sourceDir, file));
  }

  checkFile(filePath) {
    return new Promise((resolve, reject) => {
      const filename = path.basename(filePath);
      const outputPath = path.join(this.outputDir, filename);
      
      browserify(filePath)
        .transform(babelify, {
          presets: [
            ['@babel/preset-env', {
              targets: this.targets,
              useBuiltIns: 'usage',
              corejs: 3
            }]
          ]
        })
        .bundle()
        .on('error', (err) => {
          resolve({
            file: filename,
            compatible: false,
            error: err.message
          });
        })
        .pipe(fs.createWriteStream(outputPath))
        .on('finish', () => {
          resolve({
            file: filename,
            compatible: true,
            outputPath
          });
        });
    });
  }
}

module.exports = BrowserCompatibilityChecker;
```

### Impact Analysis

```javascript
// impact-analysis.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ImpactAnalyzer {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || process.cwd();
    this.excludeDirs = options.excludeDirs || ['node_modules', 'dist', 'build', '.git'];
  }

  analyzeChanges(baseBranch = 'main') {
    try {
      // Get changed files
      const diffCommand = `git diff --name-only ${baseBranch}`;
      const changedFiles = execSync(diffCommand, { encoding: 'utf-8' })
        .split('\n')
        .filter(file => file.trim() !== '');
      
      if (changedFiles.length === 0) {
        return { changedFiles: [], impactedAreas: [], riskLevel: 'none' };
      }
      
      // Analyze impact
      const impactedAreas = this.identifyImpactedAreas(changedFiles);
      const riskLevel = this.assessRiskLevel(changedFiles, impactedAreas);
      
      return {
        changedFiles,
        impactedAreas,
        riskLevel
      };
    } catch (error) {
      console.error('Error analyzing changes:', error);
      return { error: error.message };
    }
  }

  identifyImpactedAreas(changedFiles) {
    const areas = new Set();
    
    const areaMapping = {
      'contracts/': 'blockchain',
      'src/web3/': 'blockchain',
      'src/components/': 'frontend',
      'src/pages/': 'frontend',
      'server/': 'backend',
      'api/': 'backend',
      'config/': 'configuration',
      'scripts/': 'tooling',
      'docs/': 'documentation',
      'tests/': 'testing'
    };
    
    changedFiles.forEach(file => {
      for (const [prefix, area] of Object.entries(areaMapping)) {
        if (file.startsWith(prefix)) {
          areas.add(area);
          break;
        }
      }
    });
    
    return Array.from(areas);
  }

  assessRiskLevel(changedFiles, impactedAreas) {
    // High-risk files and patterns
    const highRiskPatterns = [
      'contracts/',
      'server/auth/',
      'src/web3/wallet',
      'config/production',
      'deploy'
    ];
    
    // Check for high-risk changes
    const hasHighRiskChanges = changedFiles.some(file => 
      highRiskPatterns.some(pattern => file.includes(pattern))
    );
    
    // Check for changes across multiple areas
    const hasMultipleAreaChanges = impactedAreas.length > 1;
    
    // Check for large changes
    const largeChangeThreshold = 10;
    const hasLargeChanges = changedFiles.length > largeChangeThreshold;
    
    if (hasHighRiskChanges) {
      return 'high';
    } else if (hasMultipleAreaChanges || hasLargeChanges) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  suggestReviewers(changedFiles) {
    // Map file patterns to team members
    const expertMapping = {
      'contracts/': ['blockchain-expert', 'security-reviewer'],
      'server/': ['backend-developer', 'api-specialist'],
      'src/components/': ['frontend-developer', 'ui-designer'],
      'src/web3/': ['blockchain-developer', 'integration-specialist'],
      'docs/': ['documentation-specialist', 'product-manager']
    };
    
    const reviewers = new Set();
    
    changedFiles.forEach(file => {
      for (const [prefix, experts] of Object.entries(expertMapping)) {
        if (file.startsWith(prefix)) {
          experts.forEach(expert => reviewers.add(expert));
          break;
        }
      }
    });
    
    return Array.from(reviewers);
  }
}

module.exports = ImpactAnalyzer;
```

## Next Steps

- [Server Documentation](../server-docs/index.md)
- [Serverless Functions Documentation](../serverless-docs/index.md)
- [Integration Services Documentation](../services-docs/index.md)