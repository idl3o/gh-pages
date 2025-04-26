/**
 * MultiChainProvider
 * A provider class that manages connections to multiple blockchain networks
 * Created: April 26, 2025
 */

class MultiChainProvider {
  constructor() {
    // Map of available providers, keyed by chain ID
    this.providers = new Map();

    // Chain configurations
    this.chains = [
      {
        id: 'ethereum',
        name: 'Ethereum Mainnet',
        chainId: '1',
        rpcUrl: 'https://mainnet.infura.io/v3/',
        blockExplorer: 'https://etherscan.io',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        icon: 'ethereum.svg',
        nonEVM: false
      },
      {
        id: 'polygon',
        name: 'Polygon',
        chainId: '137',
        rpcUrl: 'https://polygon-mainnet.infura.io/v3/',
        blockExplorer: 'https://polygonscan.com',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        icon: 'polygon.svg',
        nonEVM: false
      },
      {
        id: 'bsc',
        name: 'BNB Smart Chain',
        chainId: '56',
        rpcUrl: 'https://bsc-dataseed.binance.org/',
        blockExplorer: 'https://bscscan.com',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18
        },
        icon: 'binance.svg',
        nonEVM: false
      },
      {
        id: 'avalanche',
        name: 'Avalanche C-Chain',
        chainId: '43114',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        blockExplorer: 'https://snowtrace.io',
        nativeCurrency: {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18
        },
        icon: 'avalanche.svg',
        nonEVM: false
      },
      {
        id: 'arbitrum',
        name: 'Arbitrum One',
        chainId: '42161',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        blockExplorer: 'https://arbiscan.io',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        icon: 'arbitrum.svg',
        nonEVM: false
      },
      {
        id: 'optimism',
        name: 'Optimism',
        chainId: '10',
        rpcUrl: 'https://mainnet.optimism.io',
        blockExplorer: 'https://optimistic.etherscan.io',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        icon: 'optimism.svg',
        nonEVM: false
      },
      {
        id: 'solana',
        name: 'Solana',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        blockExplorer: 'https://explorer.solana.com',
        nativeCurrency: {
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9
        },
        icon: 'solana.svg',
        nonEVM: true
      }
    ];

    // Map of testnet configurations
    this.testnets = [
      {
        id: 'ethereum-goerli',
        name: 'Ethereum Goerli',
        chainId: '5',
        rpcUrl: 'https://goerli.infura.io/v3/',
        blockExplorer: 'https://goerli.etherscan.io',
        nativeCurrency: {
          name: 'Goerli Ether',
          symbol: 'GoerliETH',
          decimals: 18
        },
        icon: 'ethereum.svg',
        nonEVM: false,
        isTestnet: true
      },
      {
        id: 'polygon-mumbai',
        name: 'Polygon Mumbai',
        chainId: '80001',
        rpcUrl: 'https://polygon-mumbai.infura.io/v3/',
        blockExplorer: 'https://mumbai.polygonscan.com',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        icon: 'polygon.svg',
        nonEVM: false,
        isTestnet: true
      },
      {
        id: 'solana-devnet',
        name: 'Solana Devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        blockExplorer: 'https://explorer.solana.com?cluster=devnet',
        nativeCurrency: {
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9
        },
        icon: 'solana.svg',
        nonEVM: true,
        isTestnet: true
      }
    ];

    // Dynamic imports for libraries
    this.libraries = {
      ethers: null,
      web3: null,
      solana: null
    };

    // Flag for using test networks
    this.useTestnets = false;
  }

  /**
   * Toggle between mainnet and testnet
   * @param {boolean} useTestnets - Whether to use test networks
   */
  setUseTestnets(useTestnets) {
    this.useTestnets = !!useTestnets;
  }

  /**
   * Get all supported chains
   * @returns {Array} - Array of chain configurations
   */
  getSupportedChains() {
    return this.useTestnets ? this.testnets : this.chains;
  }

  /**
   * Get a specific chain configuration
   * @param {string} chainId - Chain identifier
   * @returns {Object|null} - Chain configuration object or null if not found
   */
  getChainConfig(chainId) {
    const chains = this.useTestnets ? this.testnets : this.chains;
    return chains.find(chain => chain.id === chainId) || null;
  }

  /**
   * Initialize a provider for the specified chain
   * @param {string} chainId - Chain identifier
   * @param {Object} options - Provider options
   * @returns {Promise<boolean>} - Success status
   */
  async initProvider(chainId, options = {}) {
    try {
      // Get chain configuration
      const chain = this.getChainConfig(chainId);
      if (!chain) {
        console.error(`Chain '${chainId}' not found`);
        return false;
      }

      // Default options
      const opts = {
        infuraApiKey: '',
        useWallet: false,
        ...options
      };

      // EVM-compatible chains
      if (!chain.nonEVM) {
        return await this._initEVMProvider(chain, opts);
      }
      // Solana
      else if (chain.id === 'solana' || chain.id === 'solana-devnet') {
        return await this._initSolanaProvider(chain, opts);
      }
      // Unsupported chain
      else {
        console.error(`Chain '${chainId}' provider type not supported`);
        return false;
      }
    } catch (error) {
      console.error(`Error initializing provider for chain '${chainId}':`, error);
      return false;
    }
  }

  /**
   * Initialize an EVM-compatible provider
   * @private
   * @param {Object} chain - Chain configuration
   * @param {Object} options - Provider options
   * @returns {Promise<boolean>} - Success status
   */
  async _initEVMProvider(chain, options) {
    try {
      // Try to use ethers.js first (preferred)
      try {
        if (!this.libraries.ethers) {
          // Dynamic import ethers
          this.libraries.ethers = await this._loadEthers();
        }

        // Build RPC URL
        let rpcUrl = chain.rpcUrl;
        if (rpcUrl.includes('infura.io') && options.infuraApiKey) {
          rpcUrl += options.infuraApiKey;
        }

        let provider;

        // Create provider with ethers
        if (options.useWallet) {
          // Check if window.ethereum is available
          if (window.ethereum) {
            provider = new this.libraries.ethers.providers.Web3Provider(window.ethereum);

            // Request account access if needed
            try {
              await window.ethereum.request({ method: 'eth_requestAccounts' });

              // Check if we need to switch chains
              const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

              if (currentChainId !== chain.chainId && !chain.chainId.startsWith('0x')) {
                const chainIdHex = '0x' + parseInt(chain.chainId).toString(16);

                try {
                  await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIdHex }]
                  });
                } catch (switchError) {
                  // Chain doesn't exist, add it
                  if (switchError.code === 4902) {
                    try {
                      await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                          {
                            chainId: chainIdHex,
                            chainName: chain.name,
                            nativeCurrency: chain.nativeCurrency,
                            rpcUrls: [rpcUrl],
                            blockExplorerUrls: [chain.blockExplorer]
                          }
                        ]
                      });
                    } catch (addError) {
                      console.error('Error adding chain to wallet:', addError);
                      return false;
                    }
                  } else {
                    console.error('Error switching chain in wallet:', switchError);
                    return false;
                  }
                }
              }
            } catch (error) {
              console.error('Error requesting accounts:', error);
              return false;
            }
          } else {
            console.error('No wallet detected');
            return false;
          }
        } else {
          // Use RPC provider
          provider = new this.libraries.ethers.providers.JsonRpcProvider(rpcUrl);
        }

        // Store provider
        this.providers.set(chain.id, {
          provider,
          chain,
          type: 'ethers'
        });

        return true;
      } catch (ethersError) {
        console.warn('Failed to initialize ethers provider, falling back to Web3:', ethersError);

        // Fall back to Web3.js
        if (!this.libraries.web3) {
          // Dynamic import Web3
          this.libraries.web3 = await this._loadWeb3();
        }

        // Build RPC URL
        let rpcUrl = chain.rpcUrl;
        if (rpcUrl.includes('infura.io') && options.infuraApiKey) {
          rpcUrl += options.infuraApiKey;
        }

        let provider;

        // Create provider with Web3
        if (options.useWallet && window.ethereum) {
          provider = new this.libraries.web3(window.ethereum);

          // Request accounts
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
          } catch (error) {
            console.error('Error requesting accounts:', error);
            return false;
          }
        } else {
          provider = new this.libraries.web3(
            new this.libraries.web3.providers.HttpProvider(rpcUrl)
          );
        }

        // Store provider
        this.providers.set(chain.id, {
          provider,
          chain,
          type: 'web3'
        });

        return true;
      }
    } catch (error) {
      console.error('Error initializing EVM provider:', error);
      return false;
    }
  }

  /**
   * Initialize a Solana provider
   * @private
   * @param {Object} chain - Chain configuration
   * @param {Object} options - Provider options
   * @returns {Promise<boolean>} - Success status
   */
  async _initSolanaProvider(chain, options) {
    try {
      // Load Solana web3 libraries if not already loaded
      if (!this.libraries.solana) {
        this.libraries.solana = await this._loadSolanaWeb3();
      }

      // Create connection
      const connection = new this.libraries.solana.Connection(chain.rpcUrl, 'confirmed');

      let wallet = null;

      // Connect wallet if requested
      if (options.useWallet) {
        // Check for Phantom or Sollet
        if (window.solana) {
          try {
            await window.solana.connect();

            if (window.solana.isPhantom) {
              wallet = window.solana;
            }
          } catch (error) {
            console.error('Error connecting Solana wallet:', error);
            return false;
          }
        }
        // Check for Solflare
        else if (window.solflare) {
          try {
            await window.solflare.connect();
            wallet = window.solflare;
          } catch (error) {
            console.error('Error connecting Solflare wallet:', error);
            return false;
          }
        } else {
          console.error('No Solana wallet detected');
          return false;
        }
      }

      // Store provider
      this.providers.set(chain.id, {
        provider: {
          connection,
          wallet
        },
        chain,
        type: 'solana'
      });

      return true;
    } catch (error) {
      console.error('Error initializing Solana provider:', error);
      return false;
    }
  }

  /**
   * Load ethers.js
   * @private
   * @returns {Promise<Object>} - ethers library
   */
  async _loadEthers() {
    try {
      // Check if ethers is already loaded in global scope
      if (window.ethers) {
        return window.ethers;
      }

      // Try to load from CDN
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.ethers.io/lib/ethers-5.7.umd.min.js';
        script.type = 'text/javascript';
        script.onload = () => resolve(window.ethers);
        script.onerror = () => reject(new Error('Failed to load ethers.js'));
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Error loading ethers:', error);
      throw error;
    }
  }

  /**
   * Load web3.js
   * @private
   * @returns {Promise<Object>} - Web3 library
   */
  async _loadWeb3() {
    try {
      // Check if Web3 is already loaded in global scope
      if (window.Web3) {
        return window.Web3;
      }

      // Try to load from CDN
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/web3@1.8.0/dist/web3.min.js';
        script.type = 'text/javascript';
        script.onload = () => resolve(window.Web3);
        script.onerror = () => reject(new Error('Failed to load Web3.js'));
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Error loading Web3:', error);
      throw error;
    }
  }

  /**
   * Load Solana Web3
   * @private
   * @returns {Promise<Object>} - Solana Web3 library
   */
  async _loadSolanaWeb3() {
    try {
      // Check if libraries are already loaded
      if (window.solanaWeb3 && window.solanaWeb3.Connection && window.solanaWeb3.PublicKey) {
        return window.solanaWeb3;
      }

      // Load library
      return new Promise((resolve, reject) => {
        // Load solana/web3.js
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@solana/web3.js@1.73.0/lib/index.iife.min.js';
        script.type = 'text/javascript';
        script.onload = () => {
          window.solanaWeb3 = window.solanaWeb3JS;
          resolve(window.solanaWeb3);
        };
        script.onerror = () => reject(new Error('Failed to load Solana Web3'));
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Error loading Solana Web3:', error);
      throw error;
    }
  }

  /**
   * Get balance information for the connected account
   * @returns {Promise<Object>} - Balance information
   */
  async getBalance() {
    const defaultResponse = {
      address: '',
      balance: '0',
      formatted: '0',
      symbol: ''
    };

    try {
      if (!this.currentChain) {
        throw new Error('No chain selected');
      }

      const providerInfo = this.providers.get(this.currentChain);

      if (!providerInfo) {
        throw new Error('Provider not initialized');
      }

      const { provider, chain, type } = providerInfo;

      // EVM chains using ethers.js
      if (!chain.nonEVM && type === 'ethers') {
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);

        return {
          address,
          balance: balance.toString(),
          formatted: this.libraries.ethers.utils.formatEther(balance),
          symbol: chain.nativeCurrency.symbol
        };
      }

      // EVM chains using Web3.js
      else if (!chain.nonEVM && type === 'web3') {
        const accounts = await provider.eth.getAccounts();

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts available');
        }

        const address = accounts[0];
        const balanceWei = await provider.eth.getBalance(address);
        const formatted = provider.utils.fromWei(balanceWei, 'ether');

        return {
          address,
          balance: balanceWei,
          formatted,
          symbol: chain.nativeCurrency.symbol
        };
      }

      // Solana
      else if (chain.id === 'solana' || chain.id === 'solana-devnet') {
        if (!provider.wallet || !provider.wallet.publicKey) {
          throw new Error('No Solana wallet connected');
        }

        const address = provider.wallet.publicKey.toString();
        const balance = await provider.connection.getBalance(provider.wallet.publicKey);
        const formatted = (balance / 10 ** chain.nativeCurrency.decimals).toString();

        return {
          address,
          balance: balance.toString(),
          formatted,
          symbol: chain.nativeCurrency.symbol
        };
      }

      throw new Error('Unsupported chain type');
    } catch (error) {
      console.error('Error getting balance:', error);
      return defaultResponse;
    }
  }

  /**
   * Get transaction by hash
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} - Transaction details
   */
  async getTransaction(txHash) {
    try {
      const providerInfo = this.providers.get(this.currentChain);

      if (!providerInfo) {
        throw new Error('Provider not initialized');
      }

      const { provider, chain, type } = providerInfo;

      // EVM chains using ethers.js
      if (!chain.nonEVM && type === 'ethers') {
        const tx = await provider.getTransaction(txHash);
        return tx;
      }

      // EVM chains using Web3.js
      else if (!chain.nonEVM && type === 'web3') {
        const tx = await provider.eth.getTransaction(txHash);
        return tx;
      }

      // Solana
      else if (chain.id === 'solana' || chain.id === 'solana-devnet') {
        const tx = await provider.connection.getTransaction(txHash);
        return tx;
      }

      throw new Error('Unsupported chain type');
    } catch (error) {
      console.error(`Error getting transaction ${txHash}:`, error);
      return null;
    }
  }

  /**
   * Send transaction to the network
   * @param {Object} transaction - Transaction data
   * @returns {Promise<string>} - Transaction hash
   */
  async sendTransaction(transaction) {
    try {
      const providerInfo = this.providers.get(this.currentChain);

      if (!providerInfo) {
        throw new Error('Provider not initialized');
      }

      const { provider, chain, type } = providerInfo;

      // EVM chains using ethers.js
      if (!chain.nonEVM && type === 'ethers') {
        const signer = provider.getSigner();

        // Create transaction
        const tx = {
          to: transaction.to,
          value: this.libraries.ethers.utils.parseEther(transaction.value.toString())
        };

        // Add optional parameters
        if (transaction.data) {
          tx.data = transaction.data;
        }

        if (transaction.gasLimit) {
          tx.gasLimit = transaction.gasLimit;
        }

        if (transaction.gasPrice) {
          tx.gasPrice = transaction.gasPrice;
        }

        // Send transaction
        const response = await signer.sendTransaction(tx);

        // Wait for confirmation (optional)
        if (transaction.waitForConfirmation) {
          await response.wait(1);
        }

        return response.hash;
      }

      // EVM chains using Web3.js
      else if (!chain.nonEVM && type === 'web3') {
        const accounts = await provider.eth.getAccounts();

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts available');
        }

        // Create transaction
        const tx = {
          from: accounts[0],
          to: transaction.to,
          value: provider.utils.toWei(transaction.value.toString(), 'ether')
        };

        // Add optional parameters
        if (transaction.data) {
          tx.data = transaction.data;
        }

        if (transaction.gas) {
          tx.gas = transaction.gas;
        }

        if (transaction.gasPrice) {
          tx.gasPrice = transaction.gasPrice;
        }

        // Send transaction
        const response = await provider.eth.sendTransaction(tx);

        return response.transactionHash;
      }

      // Solana
      else if (chain.id === 'solana' || chain.id === 'solana-devnet') {
        if (!provider.wallet) {
          throw new Error('No Solana wallet connected');
        }

        // This is a simplified implementation
        // Real implementation would depend on the Solana transaction structure
        const tx = new this.libraries.solana.Transaction();

        if (transaction.instructions) {
          tx.add(...transaction.instructions);
        }

        // Send transaction
        const signature = await provider.wallet.signAndSendTransaction(tx);

        // Wait for confirmation (optional)
        if (transaction.waitForConfirmation) {
          await provider.connection.confirmTransaction(signature);
        }

        return signature;
      }

      throw new Error('Unsupported chain type');
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Sign a message
   * @param {string} message - Message to sign
   * @returns {Promise<string>} - Signature
   */
  async signMessage(message) {
    try {
      const providerInfo = this.providers.get(this.currentChain);

      if (!providerInfo) {
        throw new Error('Provider not initialized');
      }

      const { provider, chain, type } = providerInfo;

      // EVM chains using ethers.js
      if (!chain.nonEVM && type === 'ethers') {
        const signer = provider.getSigner();
        const signature = await signer.signMessage(message);
        return signature;
      }

      // EVM chains using Web3.js
      else if (!chain.nonEVM && type === 'web3') {
        const accounts = await provider.eth.getAccounts();

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts available');
        }

        const address = accounts[0];

        // Sign message
        const signature = await provider.eth.personal.sign(
          provider.utils.utf8ToHex(message),
          address,
          ''
        );

        return signature;
      }

      // Solana
      else if (chain.id === 'solana' || chain.id === 'solana-devnet') {
        if (!provider.wallet) {
          throw new Error('No Solana wallet connected');
        }

        // Convert message to Uint8Array
        const messageBytes = new TextEncoder().encode(message);

        // Sign message
        const signature = await provider.wallet.signMessage(messageBytes, 'utf8');

        return signature;
      }

      throw new Error('Unsupported chain type');
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiChainProvider;
} else if (typeof window !== 'undefined') {
  window.MultiChainProvider = MultiChainProvider;
}
