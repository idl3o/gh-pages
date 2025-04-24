/**
 * Gas Price Manager
 *
 * This utility optimizes transaction costs by dynamically adjusting gas prices
 * based on network conditions and transaction priority.
 */

const axios = require('axios');
const Web3 = require('web3');
const LAYER2_CONFIG = require('../config/layer2-config');

class GasPriceManager {
  constructor(networkId) {
    this.networkId = networkId || LAYER2_CONFIG.DEFAULT_NETWORK_ID;
    this.web3 = new Web3(LAYER2_CONFIG.RPC_ENDPOINTS[this.networkId]);
    this.lastUpdated = 0;
    this.updateInterval = 30000; // 30 seconds
    this.gasPrices = {
      standard: '0',
      fast: '0',
      fastest: '0',
      baseFee: '0',
      maxPriorityFee: '0',
      gasUsedRatio: 0
    };
  }

  /**
   * Sets the network ID
   * @param {number} networkId - The network ID to use
   */
  setNetwork(networkId) {
    if (this.networkId !== networkId) {
      this.networkId = networkId;
      this.web3 = new Web3(LAYER2_CONFIG.RPC_ENDPOINTS[this.networkId]);
      this.lastUpdated = 0; // Force update on next call
    }
  }

  /**
   * Gets current gas price information
   * @returns {Promise<Object>} Gas price data
   */
  async getGasPrices() {
    const now = Date.now();

    // If we've updated recently, return cached data
    if (now - this.lastUpdated < this.updateInterval) {
      return this.gasPrices;
    }

    try {
      // Different networks need different gas price strategies
      switch (this.networkId) {
        case 1: // Ethereum Mainnet
          await this.updateEthereumGasPrices();
          break;
        case 137: // Polygon
          await this.updatePolygonGasPrices();
          break;
        case 42161: // Arbitrum One
          await this.updateArbitrumGasPrices();
          break;
        case 10: // Optimism
          await this.updateOptimismGasPrices();
          break;
        case 8453: // Base
          await this.updateBaseGasPrices();
          break;
        default:
          // Default method for most EVM chains
          await this.updateDefaultGasPrices();
      }

      this.lastUpdated = now;
      return this.gasPrices;
    } catch (error) {
      console.error(`Error updating gas prices for network ${this.networkId}:`, error);

      // Fallback to basic web3 gas price estimate
      try {
        const gasPrice = await this.web3.eth.getGasPrice();
        this.gasPrices = {
          standard: gasPrice,
          fast: Math.floor(gasPrice * 1.2).toString(),
          fastest: Math.floor(gasPrice * 1.5).toString(),
          baseFee: '0',
          maxPriorityFee: '0',
          gasUsedRatio: 0.5, // Assume moderate network usage
          source: 'web3.eth.getGasPrice fallback'
        };
        this.lastUpdated = now;
      } catch (fallbackError) {
        console.error('Failed to get fallback gas price:', fallbackError);
      }

      return this.gasPrices;
    }
  }

  /**
   * Update gas prices for Ethereum Mainnet using EIP-1559
   * @private
   */
  async updateEthereumGasPrices() {
    try {
      // Try to use an external gas API first
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: process.env.ETHERSCAN_API_KEY || ''
        }
      });

      if (response.data && response.data.status === '1') {
        const result = response.data.result;

        // Convert to Wei
        const toWei = (gwei) => this.web3.utils.toWei(gwei, 'gwei');

        this.gasPrices = {
          standard: toWei(result.SafeGasPrice),
          fast: toWei(result.ProposeGasPrice),
          fastest: toWei(result.FastGasPrice),
          baseFee: await this.getBaseFee(),
          maxPriorityFee: toWei(result.suggestBaseFee),
          gasUsedRatio: parseFloat(result.gasUsedRatio || '0.5'),
          source: 'Etherscan Gas Tracker'
        };
      } else {
        // Fallback to EIP-1559 calculation via web3
        await this.updateEIP1559GasPrices();
      }
    } catch (error) {
      console.error('Error fetching Ethereum gas prices:', error);
      await this.updateEIP1559GasPrices();
    }
  }

  /**
   * Update gas prices for Polygon
   * @private
   */
  async updatePolygonGasPrices() {
    try {
      // Try to use Polygon gas station API
      const response = await axios.get('https://gasstation-mainnet.matic.network/v2');

      if (response.data) {
        const result = response.data;

        // Convert to Wei
        const toWei = (gwei) => this.web3.utils.toWei(gwei.toString(), 'gwei');

        this.gasPrices = {
          standard: toWei(result.standard.maxFee),
          fast: toWei(result.fast.maxFee),
          fastest: toWei(result.fastest.maxFee),
          baseFee: toWei(result.estimatedBaseFee),
          maxPriorityFee: toWei(result.standard.maxPriorityFee),
          gasUsedRatio: 0.5, // Polygon doesn't provide this
          source: 'Polygon Gas Station'
        };
      } else {
        // Fallback to EIP-1559 calculation
        await this.updateEIP1559GasPrices();
      }
    } catch (error) {
      console.error('Error fetching Polygon gas prices:', error);
      await this.updateEIP1559GasPrices();
    }
  }

  /**
   * Update gas prices for Arbitrum
   * @private
   */
  async updateArbitrumGasPrices() {
    // Arbitrum has very different gas pricing - L1 fee and L2 fee components
    try {
      // Get L2 gas price
      const gasPrice = await this.web3.eth.getGasPrice();

      // Get latest block to estimate network congestion
      const latestBlock = await this.web3.eth.getBlock('latest');

      this.gasPrices = {
        standard: gasPrice,
        fast: gasPrice, // Arbitrum doesn't really need higher prices for faster inclusion
        fastest: gasPrice,
        baseFee: gasPrice,
        maxPriorityFee: '0', // Arbitrum doesn't use priority fees
        gasUsedRatio: latestBlock ? latestBlock.gasUsed / latestBlock.gasLimit : 0.5,
        l2GasPrice: gasPrice,
        source: 'Arbitrum RPC'
      };
    } catch (error) {
      console.error('Error fetching Arbitrum gas prices:', error);
      await this.updateDefaultGasPrices();
    }
  }

  /**
   * Update gas prices for Optimism
   * @private
   */
  async updateOptimismGasPrices() {
    try {
      // Get L2 gas price
      const gasPrice = await this.web3.eth.getGasPrice();

      // Optimism has a simpler gas model than Ethereum Mainnet
      this.gasPrices = {
        standard: gasPrice,
        fast: gasPrice, // Optimism typically has fixed gas prices
        fastest: gasPrice,
        baseFee: gasPrice,
        maxPriorityFee: '0', // Optimism doesn't use priority fees like Ethereum
        gasUsedRatio: 0.5, // Not directly applicable to Optimism
        source: 'Optimism RPC'
      };
    } catch (error) {
      console.error('Error fetching Optimism gas prices:', error);
      await this.updateDefaultGasPrices();
    }
  }

  /**
   * Update gas prices for Base
   * @private
   */
  async updateBaseGasPrices() {
    try {
      // Base is built on the Optimism stack, so gas pricing is similar
      const gasPrice = await this.web3.eth.getGasPrice();

      this.gasPrices = {
        standard: gasPrice,
        fast: gasPrice, // Base typically has fixed gas prices
        fastest: gasPrice,
        baseFee: gasPrice,
        maxPriorityFee: '0', // Base doesn't use priority fees like Ethereum
        gasUsedRatio: 0.5, // Not directly applicable to Base
        source: 'Base RPC'
      };
    } catch (error) {
      console.error('Error fetching Base gas prices:', error);
      await this.updateDefaultGasPrices();
    }
  }

  /**
   * Update gas prices using EIP-1559 model for compatible chains
   * @private
   */
  async updateEIP1559GasPrices() {
    try {
      // Get latest block to get the base fee
      const latestBlock = await this.web3.eth.getBlock('latest');

      if (!latestBlock || !latestBlock.baseFeePerGas) {
        // Chain doesn't support EIP-1559, fall back to legacy pricing
        await this.updateDefaultGasPrices();
        return;
      }

      const baseFee = latestBlock.baseFeePerGas;
      const gasUsedRatio = latestBlock.gasUsed / latestBlock.gasLimit;

      // Set priority fees based on network congestion
      const lowPriorityFee = this.web3.utils.toWei('1', 'gwei');
      const medPriorityFee = this.web3.utils.toWei(gasUsedRatio > 0.5 ? '2' : '1.5', 'gwei');
      const highPriorityFee = this.web3.utils.toWei(gasUsedRatio > 0.8 ? '3.5' : '2.5', 'gwei');

      // Calculate max fee as baseFee + priorityFee, with buffer for baseFee changes
      const baseFeeBuf = Math.floor(parseInt(baseFee) * 1.1).toString(); // 10% buffer

      this.gasPrices = {
        standard: (BigInt(baseFeeBuf) + BigInt(lowPriorityFee)).toString(),
        fast: (BigInt(baseFeeBuf) + BigInt(medPriorityFee)).toString(),
        fastest: (BigInt(baseFeeBuf) + BigInt(highPriorityFee)).toString(),
        baseFee: baseFee.toString(),
        maxPriorityFee: medPriorityFee,
        gasUsedRatio,
        source: 'EIP-1559 calculation'
      };
    } catch (error) {
      console.error('Error calculating EIP-1559 gas prices:', error);
      await this.updateDefaultGasPrices();
    }
  }

  /**
   * Get the current base fee from the latest block
   * @private
   * @returns {Promise<string>} Base fee in wei
   */
  async getBaseFee() {
    try {
      const latestBlock = await this.web3.eth.getBlock('latest');
      return latestBlock.baseFeePerGas ? latestBlock.baseFeePerGas.toString() : '0';
    } catch (error) {
      console.error('Error getting base fee:', error);
      return '0';
    }
  }

  /**
   * Fallback method for getting gas prices on any chain
   * @private
   */
  async updateDefaultGasPrices() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();

      this.gasPrices = {
        standard: gasPrice,
        fast: Math.floor(parseInt(gasPrice) * 1.2).toString(),
        fastest: Math.floor(parseInt(gasPrice) * 1.5).toString(),
        baseFee: '0',
        maxPriorityFee: '0',
        gasUsedRatio: 0.5, // Default assumption
        source: 'Legacy gas price calculation'
      };
    } catch (error) {
      console.error('Error getting default gas price:', error);

      // Last resort fallback
      const defaultGasPrice = this.web3.utils.toWei('50', 'gwei');
      this.gasPrices = {
        standard: defaultGasPrice,
        fast: defaultGasPrice,
        fastest: defaultGasPrice,
        baseFee: '0',
        maxPriorityFee: '0',
        gasUsedRatio: 0.5,
        source: 'Hardcoded fallback'
      };
    }
  }

  /**
   * Create transaction params with optimized gas settings
   * @param {Object} txParams - Base transaction parameters
   * @param {string} priority - Priority level: 'standard', 'fast', or 'fastest'
   * @returns {Promise<Object>} Transaction with gas parameters
   */
  async createOptimizedTransaction(txParams, priority = 'standard') {
    // Get updated gas prices
    const gasPrices = await this.getGasPrices();

    // Create a copy of the transaction params
    const optimizedTx = { ...txParams };

    // If the chain supports EIP-1559 transactions
    if (gasPrices.baseFee && gasPrices.baseFee !== '0') {
      // Use EIP-1559 gas parameters
      optimizedTx.maxFeePerGas = gasPrices[priority];
      optimizedTx.maxPriorityFeePerGas = gasPrices.maxPriorityFee;

      // Remove legacy gasPrice if present
      delete optimizedTx.gasPrice;
    } else {
      // Use legacy gas price parameter
      optimizedTx.gasPrice = gasPrices[priority];

      // Remove EIP-1559 parameters if present
      delete optimizedTx.maxFeePerGas;
      delete optimizedTx.maxPriorityFeePerGas;
    }

    // Estimate gas if not provided
    if (!optimizedTx.gas && !optimizedTx.gasLimit) {
      try {
        const estimatedGas = await this.web3.eth.estimateGas({
          to: optimizedTx.to,
          data: optimizedTx.data,
          from: optimizedTx.from,
          value: optimizedTx.value || '0x0'
        });

        // Add 20% buffer to avoid "out of gas" errors
        optimizedTx.gas = Math.floor(estimatedGas * 1.2);
      } catch (error) {
        console.warn('Error estimating gas, using default:', error);
        optimizedTx.gas = 500000; // Conservative default
      }
    }

    return optimizedTx;
  }

  /**
   * Gets gas cost estimate in USD for a transaction
   * @param {number} gasLimit - Estimated gas limit for the transaction
   * @param {string} priority - Priority level: 'standard', 'fast', or 'fastest'
   * @returns {Promise<Object>} Cost estimate in native token and USD
   */
  async getGasCostEstimate(gasLimit, priority = 'standard') {
    try {
      // Get current gas prices
      const gasPrices = await this.getGasPrices();

      // Calculate gas cost in native token units (wei)
      const gasCostWei = BigInt(gasLimit) * BigInt(gasPrices[priority]);

      // Convert to Ether (or native token) for better readability
      const gasCostEth = parseFloat(this.web3.utils.fromWei(gasCostWei.toString(), 'ether'));

      // Get native token price in USD from coingecko
      // In production, would use a proper price oracle or service
      let tokenPriceUSD = 0;
      const networkTokens = {
        1: 'ethereum',
        137: 'matic-network',
        42161: 'ethereum', // Arbitrum uses ETH
        10: 'ethereum',    // Optimism uses ETH
        8453: 'ethereum'   // Base uses ETH
      };

      const tokenId = networkTokens[this.networkId];
      if (tokenId) {
        try {
          const priceResponse = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
          );
          tokenPriceUSD = priceResponse.data[tokenId]?.usd || 0;
        } catch (priceError) {
          console.warn('Error fetching token price:', priceError);
          // Use fallback prices as estimate
          const fallbackPrices = {
            'ethereum': 3000,
            'matic-network': 1.5
          };
          tokenPriceUSD = fallbackPrices[tokenId] || 0;
        }
      }

      // Calculate cost in USD
      const gasCostUSD = gasCostEth * tokenPriceUSD;

      return {
        gasLimit,
        gasPriceWei: gasPrices[priority],
        gasCostWei: gasCostWei.toString(),
        gasCostEth,
        gasCostUSD,
        gasUsedRatio: gasPrices.gasUsedRatio,
        tokenPriceUSD,
        networkId: this.networkId,
        networkName: LAYER2_CONFIG.NETWORK_NAMES[this.networkId]
      };
    } catch (error) {
      console.error('Error calculating gas cost estimate:', error);
      return {
        gasLimit,
        gasPriceWei: '0',
        gasCostWei: '0',
        gasCostEth: 0,
        gasCostUSD: 0,
        error: error.message,
        networkId: this.networkId,
        networkName: LAYER2_CONFIG.NETWORK_NAMES[this.networkId]
      };
    }
  }

  /**
   * Compare gas costs across networks
   * @param {number} gasLimit - Estimated gas limit for the transaction
   * @returns {Promise<Array>} Sorted array of cost estimates across networks
   */
  async compareNetworkCosts(gasLimit) {
    // Save the current network to restore later
    const originalNetwork = this.networkId;

    const results = [];

    try {
      // Loop through the main networks to compare
      const networksToCompare = [1, 137, 42161, 10, 8453];

      for (const networkId of networksToCompare) {
        // Switch to the network
        this.setNetwork(networkId);

        // Calculate gas cost for standard priority
        const estimate = await this.getGasCostEstimate(gasLimit, 'standard');
        results.push(estimate);
      }

      // Sort by USD cost (lowest first)
      results.sort((a, b) => a.gasCostUSD - b.gasCostUSD);

      // Restore original network
      this.setNetwork(originalNetwork);

      return results;
    } catch (error) {
      console.error('Error comparing network costs:', error);

      // Restore original network
      this.setNetwork(originalNetwork);

      return results;
    }
  }

  /**
   * Get a recommended network for a transaction based on cost
   * @param {number} gasLimit - Estimated gas limit for the transaction
   * @returns {Promise<Object>} Recommended network and cost data
   */
  async getRecommendedNetwork(gasLimit) {
    try {
      const comparisons = await this.compareNetworkCosts(gasLimit);

      if (comparisons.length === 0) {
        return {
          recommended: this.networkId,
          networkName: LAYER2_CONFIG.NETWORK_NAMES[this.networkId],
          reason: 'Cost comparison failed, using current network',
          comparisons: []
        };
      }

      // Return the cheapest option and the full comparison data
      return {
        recommended: comparisons[0].networkId,
        networkName: comparisons[0].networkName,
        gasCostUSD: comparisons[0].gasCostUSD,
        reason: 'Lowest transaction cost',
        savings: comparisons[0].networkId !== 1 ?
          `${LAYER2_CONFIG.GAS_SAVINGS[comparisons[0].networkId]}% cheaper than Ethereum Mainnet` :
          'Ethereum Mainnet',
        comparisons
      };
    } catch (error) {
      console.error('Error getting recommended network:', error);
      return {
        recommended: this.networkId,
        networkName: LAYER2_CONFIG.NETWORK_NAMES[this.networkId],
        reason: 'Error during network comparison',
        error: error.message
      };
    }
  }
}

module.exports = GasPriceManager;