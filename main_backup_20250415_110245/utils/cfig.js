/**
 * Configuration Manager for Web3 Crypto Streaming Service
 *
 * This utility provides methods to load, access, and modify configuration settings
 * across different environments.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class ConfigManager {
  constructor() {
    this.config = null;
    this.configPath = path.join(__dirname, '../config/cfig.json');
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Load the configuration file
   * @returns {Object} Configuration object
   */
  load() {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }

      // Parse the config file
      this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));

      // Set the current environment
      this.config.environment.current = this.environment;

      // Process environment variables in the config
      this.processEnvVars(this.config);

      console.log(`Configuration loaded for environment: ${this.environment}`);
      return this.config;
    } catch (error) {
      console.error('Failed to load configuration:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific configuration value
   * @param {string} path - Dot notation path to the config value
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} Configuration value
   */
  get(path, defaultValue = null) {
    if (!this.config) {
      this.load();
    }

    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, key)) {
        return defaultValue;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Get environment-specific configuration
   * @returns {Object} Environment-specific configuration
   */
  getEnvironmentConfig() {
    return this.get(`environment.${this.environment}`, {});
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get blockchain configuration for the specified network
   * @param {string} network - Blockchain network name
   * @returns {Object} Network configuration
   */
  getBlockchainConfig(network = null) {
    const activeNetwork = network ||
      Object.keys(this.get('blockchain.networks', {}))
        .find(net => this.get(`blockchain.networks.${net}.active`, false));

    return this.get(`blockchain.networks.${activeNetwork}`, {});
  }

  /**
   * Get contract address for the specified contract and network
   * @param {string} contractName - Contract name
   * @param {string} network - Blockchain network name
   * @returns {string} Contract address
   */
  getContractAddress(contractName, network = null) {
    if (!network) {
      network = Object.keys(this.get('blockchain.networks', {}))
        .find(net => this.get(`blockchain.networks.${net}.active`, false));
    }

    return this.get(`blockchain.contracts.${contractName}.address.${network}`, null);
  }

  /**
   * Process environment variables in the configuration
   * @param {Object} obj - Object to process
   * @returns {Object} Processed object
   */
  processEnvVars(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string' && obj[key].includes('${')) {
          obj[key] = obj[key].replace(/\${([^}]+)}/g, (match, envVar) => {
            return process.env[envVar] || '';
          });
        } else if (typeof obj[key] === 'object') {
          this.processEnvVars(obj[key]);
        }
      }
    }

    return obj;
  }

  /**
   * Update a configuration value
   * @param {string} path - Dot notation path to the config value
   * @param {*} value - New value
   */
  set(path, value) {
    if (!this.config) {
      this.load();
    }

    const keys = path.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Save configuration to file
   */
  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
const cfig = new ConfigManager();
module.exports = cfig;
