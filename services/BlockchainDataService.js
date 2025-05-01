/**
 * BlockchainDataService.js
 * Service for fetching and processing blockchain data for WebAssembly visualization
 */

const Web3 = require('web3');
const { createLogger } = require('../utils/cfig');

class BlockchainDataService {
  constructor(providerUrl) {
    this.web3 = new Web3(providerUrl || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
    this.logger = createLogger('blockchain-data-service');
    this.cache = new Map();
    this.cacheTimeout = 60 * 1000; // 1 minute cache
  }

  /**
   * Fetch block data for visualization
   * @param {number} startBlock - Starting block number
   * @param {number} count - Number of blocks to fetch
   * @returns {Promise<Array>} - Array of processed block data
   */
  async getBlocksForVisualization(startBlock, count = 10) {
    const cacheKey = `blocks-${startBlock}-${count}`;
    
    if (this.cache.has(cacheKey) && 
        (Date.now() - this.cache.get(cacheKey).timestamp) < this.cacheTimeout) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const latestBlock = await this.web3.eth.getBlockNumber();
      const start = startBlock || latestBlock - count;
      const blockPromises = [];
      
      for (let i = 0; i < count; i++) {
        blockPromises.push(this.web3.eth.getBlock(start + i, true));
      }
      
      const blocks = await Promise.all(blockPromises);
      const processedData = this.processBlocksForVisualization(blocks);
      
      // Cache the result
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: processedData
      });
      
      return processedData;
    } catch (error) {
      this.logger.error('Failed to fetch blocks', error);
      throw error;
    }
  }

  /**
   * Process raw block data into visualization-friendly format
   * @param {Array} blocks - Raw block data from Web3
   * @returns {Array} - Processed data for visualization
   */
  processBlocksForVisualization(blocks) {
    return blocks.map(block => {
      // Extract only the data needed for visualization
      return {
        number: block.number,
        timestamp: block.timestamp,
        transactions: block.transactions.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: this.web3.utils.fromWei(tx.value, 'ether'),
          gasUsed: tx.gas
        })),
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        size: block.size,
        difficulty: block.difficulty,
        miner: block.miner
      };
    });
  }

  /**
   * Get transaction details for visualization
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} - Processed transaction data
   */
  async getTransactionForVisualization(txHash) {
    const cacheKey = `tx-${txHash}`;
    
    if (this.cache.has(cacheKey) && 
        (Date.now() - this.cache.get(cacheKey).timestamp) < this.cacheTimeout) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      
      const processedTx = {
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        from: tx.from,
        to: tx.to,
        value: this.web3.utils.fromWei(tx.value, 'ether'),
        gasUsed: receipt ? receipt.gasUsed : null,
        gasPrice: this.web3.utils.fromWei(tx.gasPrice, 'gwei'),
        nonce: tx.nonce,
        status: receipt ? (receipt.status ? 'success' : 'failed') : 'pending',
        logs: receipt ? this.processLogs(receipt.logs) : []
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: processedTx
      });
      
      return processedTx;
    } catch (error) {
      this.logger.error(`Failed to fetch transaction ${txHash}`, error);
      throw error;
    }
  }

  /**
   * Process transaction logs to extract useful information
   * @param {Array} logs - Transaction logs
   * @returns {Array} - Processed logs
   */
  processLogs(logs) {
    return logs.map(log => ({
      address: log.address,
      topics: log.topics,
      data: log.data,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex
    }));
  }

  /**
   * Convert raw blockchain data to WebAssembly compatible format
   * @param {Object} data - Any blockchain data
   * @returns {ArrayBuffer} - Data in WebAssembly compatible format
   */
  packDataForWebAssembly(data) {
    // Convert complex JSON to a binary format that can be passed to WebAssembly
    // This is a simplified example - actual implementation would depend on your WebAssembly module design
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString).buffer;
  }
}

module.exports = BlockchainDataService;