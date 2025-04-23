/**
 * AMM and Lazy Minting Integration
 *
 * This module provides integration with the StreamAMM and LazyContentMinter contracts,
 * allowing users to swap tokens with lower fees and creators to register content without
 * upfront gas payments.
 */

class AmmLazyIntegration {
  constructor() {
    this.web3 = null;
    this.isInitialized = false;
    this.contracts = {};

    // Contract addresses by network
    this.contractAddresses = {
      // Ethereum Mainnet
      1: {
        streamToken: '0x4A8f5F96D5436e43112c87fec524BDCA68088D11',
        streamAMM: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
        lazyContentMinter: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      },
      // Polygon Mainnet
      137: {
        streamToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        streamAMM: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        lazyContentMinter: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
      }
    };

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.getContract = this.getContract.bind(this);
    this.addLiquidity = this.addLiquidity.bind(this);
    this.swapTokens = this.swapTokens.bind(this);
    this.getSwapQuote = this.getSwapQuote.bind(this);
    this.registerContent = this.registerContent.bind(this);
    this.purchaseContent = this.purchaseContent.bind(this);
    this.signContentVoucher = this.signContentVoucher.bind(this);
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
        // Mint content (purchase)
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
          name: 'mintContent',
          outputs: [],
          stateMutability: 'payable',
          type: 'function'
        },
        // Check if content is minted
        {
          inputs: [{ internalType: 'bytes32', name: '_contentId', type: 'bytes32' }],
          name: 'isContentMinted',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function'
        },
        // Verify voucher
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
          name: 'verifyVoucher',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
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

      this.isInitialized = true;
      console.log('AMM and Lazy Minting integration initialized');
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

      // Approve token transfers
      await streamToken.methods
        .approve(ammContract.options.address, options.streamAmount)
        .send({ from: accounts[0] });

      await pairToken.methods
        .approve(ammContract.options.address, options.pairAmount)
        .send({ from: accounts[0] });

      // Add liquidity
      return await ammContract.methods
        .addLiquidity(
          options.pairToken,
          options.streamAmount,
          options.pairAmount,
          options.minLiquidity
        )
        .send({ from: accounts[0] });
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      throw error;
    }
  }

  /**
   * Swap tokens using the AMM
   * @param {Object} options Swap options
   * @param {string} options.fromToken From token address
   * @param {string} options.toToken To token address
   * @param {string} options.amountIn Input amount
   * @param {string} options.minAmountOut Minimum output amount
   * @returns {Promise<Object>} Transaction receipt
   */
  async swapTokens(options) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const ammContract = this.getContract('streamAMM');

      // Approve token transfer if needed
      const fromToken = new this.web3.eth.Contract(
        this.contracts.streamToken.options.jsonInterface,
        options.fromToken
      );

      await fromToken.methods
        .approve(ammContract.options.address, options.amountIn)
        .send({ from: accounts[0] });

      // Execute swap
      return await ammContract.methods
        .swapTokens(options.fromToken, options.toToken, options.amountIn, options.minAmountOut)
        .send({ from: accounts[0] });
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
   * @returns {Promise<string>} Expected output amount
   */
  async getSwapQuote(options) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const ammContract = this.getContract('streamAMM');

      return await ammContract.methods
        .getSwapQuote(options.fromToken, options.toToken, options.amountIn)
        .call();
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
        name: 'LazyContentMinter',
        version: '1',
        chainId: await this.web3.eth.getChainId(),
        verifyingContract: this.contracts.lazyContentMinter.options.address
      };

      const types = {
        ContentVoucher: [
          { name: 'contentId', type: 'bytes32' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'price', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'royaltyBps', type: 'uint16' },
          { name: 'uri', type: 'string' }
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
      const signature = await this.web3.eth.personal.sign(JSON.stringify(voucher), creator, '');

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
   * Register content for lazy minting
   * @param {Object} voucher Signed content voucher
   * @returns {Promise<Object>} Transaction receipt
   */
  async registerContent(voucher) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const lazyMinterContract = this.getContract('lazyContentMinter');

      return await lazyMinterContract.methods.registerContent(voucher).send({ from: accounts[0] });
    } catch (error) {
      console.error('Failed to register content:', error);
      throw error;
    }
  }

  /**
   * Purchase content using lazy minting
   * @param {Object} voucher Signed content voucher
   * @returns {Promise<Object>} Transaction receipt
   */
  async purchaseContent(voucher) {
    try {
      if (!this.isInitialized) {
        throw new Error('Integration not initialized');
      }

      const accounts = await this.web3.eth.getAccounts();
      const lazyMinterContract = this.getContract('lazyContentMinter');

      return await lazyMinterContract.methods.mintContent(voucher).send({
        from: accounts[0],
        value: voucher.price // Pay for the content
      });
    } catch (error) {
      console.error('Failed to purchase content:', error);
      throw error;
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
});
