/**
 * wasm-blockchain-bridge.js
 * Bridge between WebAssembly visualization code and JavaScript blockchain API
 */

const BlockchainDataService = require('../../services/BlockchainDataService');

class WasmBlockchainBridge {
  constructor(wasmModule, providerUrl) {
    this.wasmModule = wasmModule;
    this.dataService = new BlockchainDataService(providerUrl);
    this.visualizationBuffer = null;
    this.initialized = false;
    
    // Bind methods for use as callbacks
    this.onBlockDataReceived = this.onBlockDataReceived.bind(this);
    this.onTransactionDataReceived = this.onTransactionDataReceived.bind(this);
  }

  /**
   * Initialize the WebAssembly module for blockchain visualization
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    if (!this.wasmModule._initializeBlockchainVisualizer) {
      console.error('WebAssembly module does not contain initializeBlockchainVisualizer function');
      return;
    }
    
    // Allocate memory for data transfer
    this.visualizationBuffer = this.wasmModule._malloc(1024 * 1024); // 1MB buffer
    
    // Register JavaScript functions as imports to the WebAssembly module
    this.wasmModule.addFunction('requestBlockData', this.requestBlockData.bind(this));
    this.wasmModule.addFunction('requestTransactionData', this.requestTransactionData.bind(this));
    
    // Initialize the WebAssembly visualization engine
    this.wasmModule._initializeBlockchainVisualizer(this.visualizationBuffer, 1024 * 1024);
    
    this.initialized = true;
    console.log('WebAssembly blockchain visualizer initialized');
  }

  /**
   * Request block data from blockchain and pass to WebAssembly
   * @param {number} startBlock - Starting block number
   * @param {number} count - Number of blocks to fetch
   */
  async requestBlockData(startBlock, count) {
    try {
      const blockData = await this.dataService.getBlocksForVisualization(startBlock, count);
      this.onBlockDataReceived(blockData);
    } catch (error) {
      console.error('Failed to fetch block data:', error);
    }
  }

  /**
   * Request transaction data from blockchain and pass to WebAssembly
   * @param {string} txHash - Transaction hash
   */
  async requestTransactionData(txHash) {
    try {
      const txData = await this.dataService.getTransactionForVisualization(txHash);
      this.onTransactionDataReceived(txData);
    } catch (error) {
      console.error(`Failed to fetch transaction data for ${txHash}:`, error);
    }
  }

  /**
   * Process block data and send to WebAssembly module
   * @param {Array} blockData - Block data from blockchain service
   */
  onBlockDataReceived(blockData) {
    if (!this.initialized) {
      console.error('Bridge not initialized');
      return;
    }
    
    const jsonData = JSON.stringify(blockData);
    
    // Copy data to WebAssembly memory
    const stringBuffer = this.wasmModule._malloc(jsonData.length + 1);
    this.wasmModule.stringToUTF8(jsonData, stringBuffer, jsonData.length + 1);
    
    // Call WebAssembly function to process the block data
    this.wasmModule._processBlockchainData(stringBuffer, jsonData.length);
    
    // Free the allocated memory
    this.wasmModule._free(stringBuffer);
  }

  /**
   * Process transaction data and send to WebAssembly module
   * @param {Object} txData - Transaction data
   */
  onTransactionDataReceived(txData) {
    if (!this.initialized) {
      console.error('Bridge not initialized');
      return;
    }
    
    const jsonData = JSON.stringify(txData);
    
    // Copy data to WebAssembly memory
    const stringBuffer = this.wasmModule._malloc(jsonData.length + 1);
    this.wasmModule.stringToUTF8(jsonData, stringBuffer, jsonData.length + 1);
    
    // Call WebAssembly function to process the transaction data
    this.wasmModule._processTransactionData(stringBuffer, jsonData.length);
    
    // Free the allocated memory
    this.wasmModule._free(stringBuffer);
  }

  /**
   * Update the blockchain visualization
   * @param {number} timestamp - Current timestamp for animation
   */
  updateVisualization(timestamp) {
    if (!this.initialized) return;
    
    // Call WebAssembly function to update the visualization
    this.wasmModule._updateBlockchainVisualization(timestamp);
  }

  /**
   * Clean up resources when done
   */
  destroy() {
    if (this.visualizationBuffer) {
      this.wasmModule._free(this.visualizationBuffer);
      this.visualizationBuffer = null;
    }
    this.initialized = false;
  }
}

module.exports = WasmBlockchainBridge;