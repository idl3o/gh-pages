/**
 * Gas Optimizer
 *
 * This utility reduces transaction costs by dynamically estimating optimal gas prices
 * based on network conditions and transaction priority.
 */

class GasOptimizer {
  constructor(web3) {
    this.web3 = web3;
    this.gasCache = {
      timestamp: 0,
      fast: 0,
      standard: 0,
      slow: 0
    };
    this.cacheDuration = 60 * 1000; // 1 minute cache
  }

  /**
   * Estimate optimal gas price based on priority and network conditions
   * @param {string} priority - 'fast', 'standard', or 'slow'
   * @returns {Promise<string>} - Gas price in wei
   */
  async getGasPrice(priority = 'standard') {
    try {
      await this.updateGasPriceCache();

      // Return cached value based on priority
      if (priority === 'fast') {
        return this.gasCache.fast;
      } else if (priority === 'slow') {
        return this.gasCache.slow;
      } else {
        return this.gasCache.standard;
      }
    } catch (error) {
      console.error('Failed to estimate gas price:', error);
      // Fall back to the network's gas price estimation
      return await this.web3.eth.getGasPrice();
    }
  }

  /**
   * Update the gas price cache if it's expired
   * @private
   */
  async updateGasPriceCache() {
    const now = Date.now();
    if (now - this.gasCache.timestamp > this.cacheDuration) {
      // Get network gas price
      const baseGasPrice = await this.web3.eth.getGasPrice();
      const gasPrice = parseInt(baseGasPrice);

      // Get network congestion level by checking the latest block
      const block = await this.web3.eth.getBlock('latest');
      const blockGasLimit = block.gasLimit;
      const blockGasUsed = block.gasUsed;
      const congestionLevel = blockGasUsed / blockGasLimit;

      // Calculate gas prices based on congestion
      let multiplierFast, multiplierStandard, multiplierSlow;

      if (congestionLevel > 0.8) {
        // High congestion
        multiplierFast = 1.5;
        multiplierStandard = 1.2;
        multiplierSlow = 1.0;
      } else if (congestionLevel > 0.5) {
        // Medium congestion
        multiplierFast = 1.3;
        multiplierStandard = 1.1;
        multiplierSlow = 0.9;
      } else {
        // Low congestion
        multiplierFast = 1.2;
        multiplierStandard = 1.0;
        multiplierSlow = 0.8;
      }

      // Update cache
      this.gasCache = {
        timestamp: now,
        fast: Math.floor(gasPrice * multiplierFast).toString(),
        standard: Math.floor(gasPrice * multiplierStandard).toString(),
        slow: Math.floor(gasPrice * multiplierSlow).toString()
      };
    }
  }

  /**
   * Generate optimal transaction options with gas price and limit
   * @param {string} priority - 'fast', 'standard', or 'slow'
   * @param {Object} options - Additional transaction options
   * @returns {Promise<Object>} - Transaction options with gas parameters
   */
  async getTransactionOptions(priority = 'standard', options = {}) {
    const gasPrice = await this.getGasPrice(priority);

    return {
      ...options,
      gasPrice,
    };
  }

  /**
   * Calculate gas savings with batch transactions
   * @param {number} singleTxGas - Gas for a single transaction
   * @param {number} batchSize - Number of operations in the batch
   * @returns {Object} - Gas usage and savings information
   */
  calculateBatchSavings(singleTxGas, batchSize) {
    // These are approximate values based on real-world testing
    const baseGasCost = 21000; // Base transaction cost
    const batchOverhead = 15000; // Additional overhead for batch processing

    const totalSingleGas = singleTxGas * batchSize;
    const batchGas = baseGasCost + batchOverhead + (singleTxGas * 0.6 * batchSize);
    const gasSavings = totalSingleGas - batchGas;
    const percentSaved = (gasSavings / totalSingleGas) * 100;

    return {
      singleTxGas,
      batchSize,
      totalSingleGas,
      batchGas,
      gasSavings,
      percentSaved
    };
  }

  /**
   * Determine if an operation should be batched or executed immediately
   * @param {number} queueSize - Current operation queue size
   * @param {number} gasLimit - User-defined gas limit for batching
   * @returns {boolean} - True if operations should be batched
   */
  shouldBatch(queueSize, gasLimit) {
    // Small operations should be batched more aggressively
    if (gasLimit < 50000) {
      return queueSize >= 3;
    }
    // Medium operations can be batched with a few items
    else if (gasLimit < 100000) {
      return queueSize >= 2;
    }
    // Large operations should only be batched with many items
    else {
      return queueSize >= 5;
    }
  }
}

// Create and export a singleton instance
if (typeof window !== 'undefined') {
  // For browser use
  window.GasOptimizer = GasOptimizer;
} else if (typeof module !== 'undefined') {
  // For Node.js use
  module.exports = GasOptimizer;
}