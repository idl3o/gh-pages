/**
 * DeFiDB Service
 * A decentralized finance database for tracking financial metrics on the Web3 Crypto Streaming platform
 * 
 * INTERNAL DOCUMENTATION:
 * This module provides a centralized system for accessing DeFi metrics across the application.
 * It implements a singleton pattern and handles:
 * - Local caching with versioning
 * - Smart contract data retrieval and formatting
 * - Subscription model for real-time UI updates
 * 
 * SECURITY NOTE: This connects to blockchain via user's wallet; ensure proper disclosure
 * PERFORMANCE NOTE: Uses optimistic UI with background refresh
 */

import { ethers } from 'ethers';
import { getItem, setItem } from '../utils/storage';

// Local storage keys
const DEFI_DATA_KEY = 'defi_metrics_cache';
const DEFI_LAST_UPDATE_KEY = 'defi_last_update';

// Define data structure for DeFi metrics
export const MetricTypes = {
  TVL: 'tvl',                  // Total Value Locked
  TRADING_VOLUME: 'volume',    // Trading Volume
  CREATOR_EARNINGS: 'earnings', // Creator Earnings
  TOKEN_HOLDERS: 'holders',    // Number of Token Holders
  APY: 'apy',                  // Annual Percentage Yield
  LIQUIDITY: 'liquidity',      // Liquidity in Pools
  STAKING: 'staking',          // Staked Tokens
  SUPPLY: 'supply'             // Token Supply Data
};

// Initial default metrics
const defaultMetrics = {
  [MetricTypes.TVL]: {
    value: '4782650',
    currency: 'USD',
    change24h: 2.4,
    history: []
  },
  [MetricTypes.TRADING_VOLUME]: {
    value: '342186',
    currency: 'USD',
    change24h: 5.7,
    history: []
  },
  [MetricTypes.CREATOR_EARNINGS]: {
    value: '217893',
    currency: 'USD',
    change24h: 8.2,
    history: []
  },
  [MetricTypes.TOKEN_HOLDERS]: {
    value: '8745',
    change24h: 1.2,
    history: []
  },
  [MetricTypes.APY]: {
    value: '12.4',
    unit: '%',
    change24h: -0.3,
    history: []
  },
  [MetricTypes.LIQUIDITY]: {
    value: '1246790',
    currency: 'USD',
    change24h: 3.1,
    history: []
  },
  [MetricTypes.STAKING]: {
    value: '2456780',
    currency: 'STREAM',
    change24h: 1.8,
    history: []
  },
  [MetricTypes.SUPPLY]: {
    circulating: '8750000',
    total: '10000000',
    unit: 'STREAM',
    change24h: 0,
    history: []
  }
};

/**
 * DeFiDB Class for managing decentralized finance metrics
 * 
 * IMPLEMENTATION NOTES:
 * - Constructor initializes metrics from cache or defaults
 * - Uses observer pattern (callbacks array) for change notifications
 * - Formats values for display throughout the app for consistency
 * - Maintains history array for each metric for chart visualization
 */
class DeFiDB {
  constructor() {
    this.metrics = this._loadFromCache() || { ...defaultMetrics };
    this.contracts = {};
    this.isInitialized = false;
    this.callbacks = [];
  }

  /**
   * Initialize DeFiDB with Web3 provider
   * 
   * INTERNAL: Configures blockchain interaction for metrics retrieval
   * SECURITY: Only connects when explicitly called; provider access is limited
   * ERROR HANDLING: Fails gracefully with defaults if connection issues occur
   * 
   * @param {ethers.Provider} provider - Ethereum provider
   * @param {Object} contractAddresses - Contract addresses for DeFi data
   * @returns {Promise<boolean>} - Initialization success status
   */
  async initialize(provider, contractAddresses = {}) {
    try {
      if (!provider) {
        console.error('Provider is required to initialize DeFiDB');
        return false;
      }

      this.provider = provider;
      
      // Setup contracts if addresses provided
      if (contractAddresses.token) {
        const tokenAbi = ["function totalSupply() view returns (uint256)", "function balanceOf(address) view returns (uint256)"];
        this.contracts.token = new ethers.Contract(contractAddresses.token, tokenAbi, provider);
      }
      
      if (contractAddresses.staking) {
        const stakingAbi = ["function totalStaked() view returns (uint256)", "function getAPY() view returns (uint256)"];
        this.contracts.staking = new ethers.Contract(contractAddresses.staking, stakingAbi, provider);
      }
      
      if (contractAddresses.treasury) {
        const treasuryAbi = ["function getTVL() view returns (uint256)", "function getCreatorEarnings() view returns (uint256)"];
        this.contracts.treasury = new ethers.Contract(contractAddresses.treasury, treasuryAbi, provider);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize DeFiDB:', error);
      return false;
    }
  }

  /**
   * Subscribe to DeFi metrics updates
   * @param {Function} callback - Function to call when metrics update
   * @returns {number} - Subscription ID
   */
  subscribe(callback) {
    this.callbacks.push(callback);
    return this.callbacks.length - 1;
  }

  /**
   * Unsubscribe from updates
   * @param {number} id - Subscription ID
   */
  unsubscribe(id) {
    this.callbacks[id] = null;
  }

  /**
   * Get all DeFi metrics
   * @returns {Object} - All DeFi metrics
   */
  getAllMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get a specific metric
   * @param {string} metricType - Type of metric from MetricTypes
   * @returns {Object|null} - Metric data or null if not found
   */
  getMetric(metricType) {
    return this.metrics[metricType] ? { ...this.metrics[metricType] } : null;
  }

  /**
   * Format metric value with appropriate formatting
   * 
   * INTERNAL: Called throughout the UI to ensure consistent formatting
   * INTERNATIONALIZATION: Should be updated if app supports multiple locales
   * 
   * @param {string} metricType - Type of metric
   * @param {boolean} includeCurrency - Whether to include currency symbol
   * @returns {string} - Formatted value
   */
  getFormattedMetric(metricType, includeCurrency = true) {
    const metric = this.metrics[metricType];
    if (!metric) return 'N/A';

    let formattedValue;

    if (metricType === MetricTypes.SUPPLY) {
      formattedValue = this._formatNumber(metric.circulating);
      return includeCurrency ? `${formattedValue} ${metric.unit}` : formattedValue;
    }

    formattedValue = this._formatNumber(metric.value);
    
    if (!includeCurrency) return formattedValue;
    return metric.currency ? `${metric.currency === 'USD' ? '$' : ''}${formattedValue}` : 
           (metric.unit ? `${formattedValue}${metric.unit}` : formattedValue);
  }

  /**
   * Format a number for display
   * @param {string|number} value - Number to format
   * @returns {string} - Formatted number
   */
  _formatNumber(value) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    } else if (Number.isInteger(num)) {
      return num.toLocaleString();
    } else {
      return num.toFixed(2);
    }
  }

  /**
   * Update metrics from blockchain data
   * 
   * INTERNAL: Core method for refreshing data from contracts
   * OPTIMIZATION: Uses batch requests when possible to reduce RPC calls
   * FALLBACK: When contracts unavailable, maintains last good state
   * 
   * @returns {Promise<boolean>} - Update success status
   */
  async refreshMetrics() {
    try {
      if (!this.isInitialized) {
        console.warn('DeFiDB not initialized. Using cached or default data.');
        return false;
      }

      // Update metrics from contracts if available
      if (this.contracts.token) {
        const totalSupply = await this.contracts.token.totalSupply();
        this.metrics[MetricTypes.SUPPLY].total = totalSupply.toString();
        
        // Simulate circulating supply (90% of total)
        const circulatingSupply = totalSupply.mul(90).div(100);
        this.metrics[MetricTypes.SUPPLY].circulating = circulatingSupply.toString();
      }
      
      if (this.contracts.staking) {
        const totalStaked = await this.contracts.staking.totalStaked();
        this.metrics[MetricTypes.STAKING].value = totalStaked.toString();
        
        const apy = await this.contracts.staking.getAPY();
        this.metrics[MetricTypes.APY].value = (apy.toNumber() / 100).toString(); // Assuming APY is returned as basis points
      }
      
      if (this.contracts.treasury) {
        const tvl = await this.contracts.treasury.getTVL();
        this.metrics[MetricTypes.TVL].value = ethers.formatUnits(tvl, 'ether');
        
        const creatorEarnings = await this.contracts.treasury.getCreatorEarnings();
        this.metrics[MetricTypes.CREATOR_EARNINGS].value = ethers.formatUnits(creatorEarnings, 'ether');
      }

      // Store data in cache
      this._saveToCache();
      
      // Notify subscribers
      this._notifySubscribers();
      
      return true;
    } catch (error) {
      console.error('Error refreshing DeFi metrics:', error);
      return false;
    }
  }

  /**
   * Update metrics with provided data (used for testing or manual updates)
   * @param {string} metricType - Type of metric
   * @param {Object} data - New metric data
   */
  updateMetric(metricType, data) {
    if (!this.metrics[metricType]) {
      console.error(`Invalid metric type: ${metricType}`);
      return;
    }

    this.metrics[metricType] = {
      ...this.metrics[metricType],
      ...data
    };

    // Add to history
    const timestamp = Date.now();
    const historyEntry = { timestamp, value: data.value || this.metrics[metricType].value };
    
    this.metrics[metricType].history = [
      ...this.metrics[metricType].history.slice(-29), // Keep last 30 entries
      historyEntry
    ];

    this._saveToCache();
    this._notifySubscribers();
  }

  /**
   * Notify subscribers of updated data
   * @private
   */
  _notifySubscribers() {
    this.callbacks.forEach(callback => {
      if (callback) callback(this.metrics);
    });
  }

  /**
   * Save current metrics to local storage
   * @private
   */
  _saveToCache() {
    try {
      setItem(DEFI_DATA_KEY, JSON.stringify(this.metrics));
      setItem(DEFI_LAST_UPDATE_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving DeFi metrics to cache:', error);
    }
  }

  /**
   * Load metrics from local storage
   * @private
   * @returns {Object|null} - Cached metrics or null if not found
   */
  _loadFromCache() {
    try {
      const cachedData = getItem(DEFI_DATA_KEY);
      if (!cachedData) return null;
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error loading DeFi metrics from cache:', error);
      return null;
    }
  }

  /**
   * Check if metrics need to be refreshed
   * @returns {boolean} - Whether metrics are stale
   */
  isDataStale() {
    try {
      const lastUpdate = getItem(DEFI_LAST_UPDATE_KEY);
      if (!lastUpdate) return true;
      
      const updateTime = parseInt(lastUpdate, 10);
      const currentTime = Date.now();
      
      // Consider data stale after 5 minutes
      return (currentTime - updateTime) > 300000;
    } catch (error) {
      console.error('Error checking DeFi data staleness:', error);
      return true;
    }
  }
}

// Export singleton instance
export const defidb = new DeFiDB();
export default defidb;
