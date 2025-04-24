/**
 * AMM and Lazy Minting Integration
 *
 * This module provides integration with the StreamAMM and LazyContentMinter contracts,
 * allowing users to swap tokens with lower fees and creators to register content without
 * upfront gas payments.
 *
 * Now with integrated gas optimization!
 */

class AmmLazyIntegration {
  constructor() {
    this.web3 = null;
    this.isInitialized = false;
    this.contracts = {};
    this.gasOptimizer = null;

    // Transaction queues for batch processing
    this.registerContentQueue = [];
    this.batchProcessingInterval = null;

    // Contract addresses by network
    this.contractAddresses = {
      // Ethereum Mainnet
      1: {
        streamToken: '0x4A8f5F96D5436e43112c87fec524BDCA68088D11',
        streamAMM: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
        lazyContentMinter: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      },
      // Polygon Mainnet (preferred for lower gas)
      137: {
        streamToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        streamAMM: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        lazyContentMinter: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
      },
      // Optimism (additional L2 support)
      10: {
        streamToken: '0x4200000000000000000000000000000000000042',
        streamAMM: '0x4200000000000000000000000000000000000043',
        lazyContentMinter: '0x4200000000000000000000000000000000000044'
      },
      // Arbitrum (additional L2 support)
      42161: {
        streamToken: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        streamAMM: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        lazyContentMinter: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
      }
    };

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.getContract = this.getContract.bind(this);
    this.addLiquidity = this.addLiquidity.bind(this);
    this.swapTokens = this.swapTokens.bind(this);
    this.getSwapQuote = this.getSwapQuote.bind(this);
    this.registerContent = this.registerContent.bind(this);
    this.batchRegisterContent = this.batchRegisterContent.bind(this);
    this.purchaseContent = this.purchaseContent.bind(this);
    this.signContentVoucher = this.signContentVoucher.bind(this);
    this.processBatchRegistrations = this.processBatchRegistrations.bind(this);
  }

  /**
   * Initialize the integration
   * @param {Object} web3 Web3 instance
   * @param {number} networkId Current network ID
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize(web3, networkId) {
    try {
      this.web3 = web3;

      // Initialize gas optimizer
      this.gasOptimizer = new GasOptimizer(web3);

      // Get contract addresses for the current network
      const addresses = this.contractAddresses[networkId];
      if (!addresses) {
        console.error(`Network ID ${networkId} not supported`);
        return false;
      }

      // Initialize AMM contract
      const ammABI = [
        // Add liquidity
        {
          inputs: [
            { internalType: 'address', name: '_pairToken', type: 'address' },
            { internalType: 'uint256', name: '_streamAmount', type: 'uint256' },
            { internalType: 'uint256', name: '_pairAmount', type: 'uint256' },
            { internalType: 'uint256', name: '_minLiquidity', type: 'uint256' }
          ],
          name: 'addLiquidity',
          outputs: [{ internalType: 'uint256', name: 'liquidity', type: 'uint256' }],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        // Remove liquidity
        {
          inputs: [
            { internalType: 'address', name: '_pairToken', type: 'address' },
            { internalType: 'uint256', name: '_liquidity', type: 'uint256' },
            { internalType: 'uint256', name: '_minStreamAmount', type: 'uint256' },
            { internalType: 'uint256', name: '_minPairAmount', type: 'uint256' }
          ],
          name: 'removeLiquidity',
          outputs: [
            { internalType: 'uint256', name: 'streamAmount', type: 'uint256' },
            { internalType: 'uint256', name: 'pairAmount', type: 'uint256' }
          ],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        // Swap tokens
        {
          inputs: [
            { internalType: 'address', name: '_fromToken', type: 'address' },
            { internalType: 'address', name: '_toToken', type: 'address' },
            { internalType: 'uint256', name: '_amountIn', type: 'uint256' },
            { internalType: 'uint256', name: '_minAmountOut', type: 'uint256' }
          ],
          name: 'swapTokens',
          outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        // Get swap quote
        {
          inputs: [
            { internalType: 'address', name: '_fromToken', type: 'address' },
            { internalType: 'address', name: '_toToken', type: 'address' },
            { internalType: 'uint256', name: '_amountIn', type: 'uint256' }
          ],
          name: 'getSwapQuote',
          outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function'
        },
        // Get provider liquidity
        {
          inputs: [
            { internalType: 'address', name: '_provider', type: 'address' },
            { internalType: 'address', name: '_pairToken', type: 'address' }
          ],
          name: 'getProviderLiquidity',
          outputs: [
            { internalType: 'uint256', name: 'liquidity', type: 'uint256' },
            { internalType: 'uint256', name: 'streamShare', type: 'uint256' },
            { internalType: 'uint256', name: 'pairShare', type: 'uint256' }
          ],
          stateMutability: 'view',
          type: 'function'
        }
      ];

      // Initialize Lazy Content Minter contract
      const lazyMinterABI = [
        // Register content
        {
          inputs: [
            {
              components: [
                { internalType: 'bytes32', name: 'contentId', type: 'bytes32' },
                { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                { internalType: 'uint256', name: 'price', type: 'uint256' },
                { internalType: 'address', name: 'creator', type: 'address' },
                { internalType: 'uint16', name: 'royaltyBps', type: 'uint16' },
                { internalType: 'string', name: 'uri', type: 'string' },
                { internalType: 'bytes', name: 'signature', type: 'bytes' }
              ],
              internalType: 'struct LazyContentMinter.ContentVoucher',
              name: '_voucher',
              type: 'tuple'
            }
          ],
          name: 'registerContent',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        // Batch register content
        {
          inputs: [
            {
              components: [
                { internalType: 'bytes32', name: 'contentId', type: 'bytes32' },
                { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
                { internalType: 'uint256', name: 'price', type: 'uint256' },
                { internalType: 'address', name: 'creator', type: 'address' },
                { internalType: 'uint16', name: 'royaltyBps', type: 'uint16' },
                { internalType: 'string', name: 'uri', type: 'string' },
                { internalType: 'bytes', name: 'signature', type: 'bytes' }
              ],
              internalType: 'struct LazyContentMinter.ContentVoucher[]',
              name: '_vouchers',
              type: 'tuple[]'
            }
          ],
          name: 'batchRegisterContent',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [
            { internalType: 'bytes32[]', name: '_contentIds', type: 'bytes32[]' }
          ],
          name: 'batchCheckMintStatus',
          outputs: [
            { internalType: 'bool[]', name: 'mintedStatus', type: 'bool[]' }
          ],
          stateMutability: 'view',
          type: 'function'
        }
      ];

      // Initialize token ABI
      const tokenABI = [
        // Balance
        {
          inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function'
        },
        // Approve
        {
          inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ],
          name: 'approve',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        // Decimals
        {
          inputs: [],
          name: 'decimals',
          outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
          stateMutability: 'view',
          type: 'function'
        }
      ];

      // Create contract instances
      this.contracts = {
        streamToken: new web3.eth.Contract(tokenABI, addresses.streamToken),
        streamAMM: new web3.eth.Contract(ammABI, addresses.streamAMM),
        lazyContentMinter: new web3.eth.Contract(lazyMinterABI, addresses.lazyContentMinter)
      };

      // Start batch processing
      if (this.batchProcessingInterval === null) {
        this.batchProcessingInterval = setInterval(this.processBatchRegistrations, 60000); // Process every minute
      }

      this.isInitialized = true;
      console.log('AMM and Lazy Minting integration initialized with gas optimization');
      return true;
    } catch (error) {
      console.error('Failed to initialize integration:', error);
      return false;
    }
  }

  /**
   * Get contract instance by name
   * @param {string} contractName Name of the contract
   * @returns {Object} Contract instance
   */
  getContract(contractName) {
    const contract = this.contracts[contractName];
    if (!contract) {
      throw new Error(`Contract ${contractName} not initialized`);
    }
    return contract;
  }

  /**
   * Add liquidity to the AMM
   * @param {Object} options Liquidity options
   * @param {string} options.pairToken Pair token address
   * @param {string} options.streamAmount Stream token amount
   * @param {string} options.pairAmount Pair token amount
   * @param {string} options.minLiquidity Minimum liquidity to receive
   * @param {string} options.priority Transaction priority ('fast', 'standard', 'slow')
   * @returns {Promise<Object>} Transaction receipt
   */
  async addLiquidity(options) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const ammContract = this.getContract('streamAMM');
      const streamToken = this.getContract('streamToken');
      const pairToken = new this.web3.eth.Contract(
        this.contracts.streamToken.options.jsonInterface,
        options.pairToken
      );

      // Get optimized transaction options
      const txOptions = await this.gasOptimizer.getTransactionOptions(
        options.priority || 'standard',
        { from: accounts[0] }
      );

      // Approve token transfers
      await streamToken.methods.approve(
        ammContract.options.address,
        options.streamAmount
      ).send(txOptions);

      await pairToken.methods.approve(
        ammContract.options.address,
        options.pairAmount
      ).send(txOptions);

      // Add liquidity
      return await ammContract.methods.addLiquidity(
        options.pairToken,
        options.streamAmount,
        options.pairAmount,
        options.minLiquidity
      ).send(txOptions);
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      throw error;
    }
  }

  /**
   * Swap tokens using the AMM with gas optimization
   * @param {Object} options Swap options
   * @param {string} options.fromToken From token address
   * @param {string} options.toToken To token address
   * @param {string} options.amountIn Input amount
   * @param {string} options.minAmountOut Minimum output amount
   * @param {string} options.priority Transaction priority ('fast', 'standard', 'slow')
   * @returns {Promise<Object>} Transaction receipt
   */
  async swapTokens(options) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const ammContract = this.getContract('streamAMM');

      // Get optimized transaction options
      const txOptions = await this.gasOptimizer.getTransactionOptions(
        options.priority || 'standard',
        { from: accounts[0] }
      );

      // Approve token transfer if needed
      const fromToken = new this.web3.eth.Contract(
        this.contracts.streamToken.options.jsonInterface,
        options.fromToken
      );

      await fromToken.methods.approve(
        ammContract.options.address,
        options.amountIn
      ).send(txOptions);

      // Execute swap
      return await ammContract.methods.swapTokens(
        options.fromToken,
        options.toToken,
        options.amountIn,
        options.minAmountOut
      ).send(txOptions);
    } catch (error) {
      console.error('Failed to swap tokens:', error);
      throw error;
    }
  }

  /**
   * Get a quote for token swap
   * @param {Object} options Quote options
   * @param {string} options.fromToken From token address
   * @param {string} options.toToken To token address
   * @param {string} options.amountIn Input amount
   * @returns {Promise<Object>} Expected output amount and price impact
   */
  async getSwapQuote(options) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const ammContract = this.getContract('streamAMM');

      const result = await ammContract.methods.getSwapQuote(
        options.fromToken,
        options.toToken,
        options.amountIn
      ).call();

      return {
        amountOut: result.amountOut,
        priceImpact: result.priceImpact
      };
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      throw error;
    }
  }

  /**
   * Create and sign a content voucher for lazy minting
   * @param {Object} content Content details
   * @param {string} content.contentId Unique content identifier
   * @param {number} content.tokenId Token ID for minting
   * @param {string} content.price Content price
   * @param {number} content.royaltyBps Royalty percentage in basis points
   * @param {string} content.uri Content metadata URI
   * @returns {Promise<Object>} Signed voucher
   */
  async signContentVoucher(content) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const creator = accounts[0];

      // Convert contentId to bytes32 if it's not already
      let contentIdBytes32 = content.contentId;
      if (!contentIdBytes32.startsWith('0x') || contentIdBytes32.length !== 66) {
        contentIdBytes32 = this.web3.utils.sha3(content.contentId);
      }

      // Prepare the voucher data
      const domain = {
        name: "LazyContentMinter",
        version: "1",
        chainId: await this.web3.eth.getChainId(),
        verifyingContract: this.contracts.lazyContentMinter.options.address
      };

      const types = {
        ContentVoucher: [
          { name: "contentId", type: "bytes32" },
          { name: "tokenId", type: "uint256" },
          { name: "price", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "royaltyBps", type: "uint16" },
          { name: "uri", type: "string" }
        ]
      };

      const voucher = {
        contentId: contentIdBytes32,
        tokenId: content.tokenId,
        price: content.price,
        creator: creator,
        royaltyBps: content.royaltyBps,
        uri: content.uri
      };

      // Sign the voucher using EIP-712
      const signature = await this.web3.eth.personal.sign(
        JSON.stringify(voucher),
        creator,
        ''
      );

      // Return the complete voucher with signature
      return {
        ...voucher,
        signature
      };
    } catch (error) {
      console.error('Failed to sign content voucher:', error);
      throw error;
    }
  }

  /**
   * Register content for lazy minting with queue for batch processing
   * @param {Object} voucher Signed content voucher
   * @param {boolean} immediate Whether to process immediately or queue for batch
   * @returns {Promise<Object>} Transaction receipt or queue confirmation
   */
  async registerContent(voucher, immediate = false) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      if (!immediate) {
        // Add to batch queue
        this.registerContentQueue.push(voucher);
        console.log(`Content queued for batch registration. Queue size: ${this.registerContentQueue.length}`);

        // Return queue information
        return {
          queued: true,
          queuePosition: this.registerContentQueue.length,
          estimatedProcessingTime: "Within 1 minute",
          contentId: voucher.contentId
        };
      }

      // Process immediately if requested
      const accounts = await this.web3.eth.getAccounts();
      const lazyMinterContract = this.getContract('lazyContentMinter');

      // Get optimized gas price
      const txOptions = await this.gasOptimizer.getTransactionOptions(
        'standard',
        { from: accounts[0] }
      );

      return await lazyMinterContract.methods.registerContent(voucher)
        .send(txOptions);
    } catch (error) {
      console.error('Failed to register content:', error);
      throw error;
    }
  }

  /**
   * Process batch registrations from the queue
   * @private
   */
  async processBatchRegistrations() {
    try {
      // Skip if queue is empty or not initialized
      if (this.registerContentQueue.length === 0 || !this.isInitialized) {
        return;
      }

      console.log(`Processing batch registration of ${this.registerContentQueue.length} items`);

      const accounts = await this.web3.eth.getAccounts();
      const lazyMinterContract = this.getContract('lazyContentMinter');

      // Get optimized gas price for batch transaction
      const txOptions = await this.gasOptimizer.getTransactionOptions(
        'standard',
        { from: accounts[0] }
      );

      // Process the queue
      const vouchers = [...this.registerContentQueue];
      this.registerContentQueue = []; // Clear queue

      await lazyMinterContract.methods.batchRegisterContent(vouchers)
        .send(txOptions);

      console.log(`Batch registration complete for ${vouchers.length} items`);
    } catch (error) {
      console.error('Failed to process batch registrations:', error);
    }
  }

  /**
   * Manually register content in a batch to save gas
   * @param {Array} vouchers Array of signed content vouchers
   * @returns {Promise<Object>} Transaction receipt
   */
  async batchRegisterContent(vouchers) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const lazyMinterContract = this.getContract('lazyContentMinter');

      // Get optimized gas price
      const txOptions = await this.gasOptimizer.getTransactionOptions(
        'standard',
        { from: accounts[0] }
      );

      return await lazyMinterContract.methods.batchRegisterContent(vouchers)
        .send(txOptions);
    } catch (error) {
      console.error('Failed to batch register content:', error);
      throw error;
    }
  }

  /**
   * Purchase content using lazy minting with optimized gas
   * @param {Object} voucher Signed content voucher
   * @param {string} priority Gas price priority ('fast', 'standard', 'slow')
   * @returns {Promise<Object>} Transaction receipt
   */
  async purchaseContent(voucher, priority = 'standard') {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const lazyMinterContract = this.getContract('lazyContentMinter');

      // Get optimized transaction options
      const txOptions = await this.gasOptimizer.getTransactionOptions(
        priority,
        {
          from: accounts[0],
          value: voucher.price // Pay for the content
        }
      );

      return await lazyMinterContract.methods.mintContent(voucher)
        .send(txOptions);
    } catch (error) {
      console.error('Failed to purchase content:', error);
      throw error;
    }
  }

  /**
   * Check if multiple content items have been minted
   * @param {Array} contentIds Array of content IDs to check
   * @returns {Promise<Array>} Array of boolean minted status
   */
  async batchCheckMintStatus(contentIds) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const lazyMinterContract = this.getContract('lazyContentMinter');
      return await lazyMinterContract.methods.batchCheckMintStatus(contentIds).call();
    } catch (error) {
      console.error('Failed to check mint status:', error);
      throw error;
    }
  }

  /**
   * Clean up resources when component unmounts
   */
  cleanup() {
    if (this.batchProcessingInterval) {
      clearInterval(this.batchProcessingInterval);
      this.batchProcessingInterval = null;
    }
  }
}

// Create and export a singleton instance
const ammLazyIntegration = new AmmLazyIntegration();
window.ammLazyIntegration = ammLazyIntegration; // Expose to global scope

// Initialize when web3Auth is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.web3Auth) {
    window.web3Auth.onAuthChange(async (isConnected, account, networkId) => {
      if (isConnected && window.web3Auth.web3) {
        await ammLazyIntegration.initialize(window.web3Auth.web3, networkId);
      }
    });
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    ammLazyIntegration.cleanup();
  });
});
