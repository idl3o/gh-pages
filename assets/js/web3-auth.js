/**
 * Web3 Authentication
 * Handles wallet connection and authentication for blockchain interactions
 */

class Web3Auth {
  constructor() {
    this.isInitialized = false;
    this.web3 = null;
    this.provider = null;
    this.currentAccount = null;
    this.networkId = null;
    this.isConnected = false;
    this.authListeners = [];
    
    // Supported wallet providers
    this.walletProviders = {
      metamask: {
        name: 'MetaMask',
        check: () => window.ethereum && window.ethereum.isMetaMask,
        getProvider: () => window.ethereum,
        logo: 'assets/images/metamask-logo.svg'
      },
      walletconnect: {
        name: 'WalletConnect',
        check: () => true, // Always available through library
        getProvider: async () => {
          // Dynamically load WalletConnect
          if (!window.WalletConnectProvider) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://unpkg.com/@walletconnect/web3-provider@1.7.8/dist/umd/index.min.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          
          const WalletConnectProvider = window.WalletConnectProvider.default;
          return new WalletConnectProvider({
            infuraId: '9aa3d95b3bc440fa88ea12eaa4456161', // Public Infura ID
            rpc: {
              1: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
              5: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
              137: 'https://polygon-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
              80001: 'https://polygon-mumbai.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
            },
            bridge: 'https://bridge.walletconnect.org'
          });
        },
        logo: 'assets/images/walletconnect-logo.svg'
      },
      coinbase: {
        name: 'Coinbase Wallet',
        check: () => window.ethereum && window.ethereum.isCoinbaseWallet,
        getProvider: () => window.ethereum,
        logo: 'assets/images/coinbase-logo.svg'
      }
    };
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.switchNetwork = this.switchNetwork.bind(this);
    this.getAvailableWallets = this.getAvailableWallets.bind(this);
    this.onAuthChange = this.onAuthChange.bind(this);
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
    this.handleChainChanged = this.handleChainChanged.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  /**
   * Initialize Web3 authentication module
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load Web3.js if not already loaded
      if (!window.Web3) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/web3@1.7.4/dist/web3.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Try to reconnect previously connected wallet
      const lastWallet = localStorage.getItem('web3_wallet_provider');
      const lastConnected = localStorage.getItem('web3_connected') === 'true';
      
      if (lastConnected && lastWallet) {
        try {
          await this.connect(lastWallet, true);
        } catch (error) {
          console.warn('Failed to reconnect wallet:', error);
          // Clear stored connection status on failure
          localStorage.removeItem('web3_connected');
        }
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Web3 authentication:', error);
      return false;
    }
  }

  /**
   * Connect to a wallet provider
   * @param {string} providerName Name of the provider to connect to
   * @param {boolean} silent Whether to connect silently without user prompts
   * @returns {Promise<boolean>} Connection status
   */
  async connect(providerName, silent = false) {
    try {
      const walletProvider = this.walletProviders[providerName];
      if (!walletProvider) {
        throw new Error(`Provider ${providerName} not supported`);
      }
      
      if (!walletProvider.check()) {
        if (silent) return false;
        
        if (providerName === 'metamask') {
          window.open('https://metamask.io/download/', '_blank');
        }
        throw new Error(`${walletProvider.name} is not installed`);
      }
      
      // Get provider instance
      this.provider = await walletProvider.getProvider();
      
      // Connect to the wallet
      let accounts;
      try {
        accounts = await this.provider.request({ 
          method: 'eth_requestAccounts' 
        });
      } catch (error) {
        if (error.code === 4001) {
          // User rejected the connection request
          throw new Error('Connection rejected by user');
        }
        throw error;
      }
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }
      
      // Create Web3 instance
      this.web3 = new Web3(this.provider);
      
      // Set current account
      this.currentAccount = accounts[0];
      
      // Get network ID
      this.networkId = await this.web3.eth.getChainId();
      
      // Set up event listeners
      if (this.provider.on) {
        this.provider.on('accountsChanged', this.handleAccountsChanged);
        this.provider.on('chainChanged', this.handleChainChanged);
        this.provider.on('disconnect', this.handleDisconnect);
      }
      
      // Update connection status
      this.isConnected = true;
      
      // Store connection preferences
      localStorage.setItem('web3_wallet_provider', providerName);
      localStorage.setItem('web3_connected', 'true');
      
      // Notify listeners
      this.notifyAuthChange();
      
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.currentAccount = null;
      this.networkId = null;
      this.provider = null;
      
      throw error;
    }
  }

  /**
   * Disconnect from current wallet provider
   * @returns {Promise<boolean>} Disconnection status
   */
  async disconnect() {
    try {
      // Remove event listeners
      if (this.provider && this.provider.removeListener) {
        this.provider.removeListener('accountsChanged', this.handleAccountsChanged);
        this.provider.removeListener('chainChanged', this.handleChainChanged);
        this.provider.removeListener('disconnect', this.handleDisconnect);
      }
      
      // Special handling for WalletConnect
      if (this.provider && this.provider.close) {
        await this.provider.close();
      }
      
      // Clear connection status
      this.isConnected = false;
      this.currentAccount = null;
      this.networkId = null;
      this.provider = null;
      this.web3 = null;
      
      // Clear stored connection preferences
      localStorage.removeItem('web3_connected');
      
      // Notify listeners
      this.notifyAuthChange();
      
      return true;
    } catch (error) {
      console.error('Disconnection error:', error);
      return false;
    }
  }

  /**
   * Switch to a different blockchain network
   * @param {number|string} networkId Network ID to switch to
   * @returns {Promise<boolean>} Network switch status
   */
  async switchNetwork(networkId) {
    if (!this.provider || !this.isConnected) {
      throw new Error('Not connected to a wallet');
    }
    
    // Network configurations
    const networks = {
      1: {
        chainId: '0x1', // Ethereum Mainnet
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        blockExplorerUrls: ['https://etherscan.io']
      },
      5: {
        chainId: '0x5', // Goerli Testnet
        chainName: 'Goerli Testnet',
        nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
        blockExplorerUrls: ['https://goerli.etherscan.io']
      },
      137: {
        chainId: '0x89', // Polygon Mainnet
        chainName: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com']
      },
      80001: {
        chainId: '0x13881', // Mumbai Testnet
        chainName: 'Mumbai Testnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com']
      }
    };
    
    // Convert network ID to hex for wallet compatibility
    const networkIdHex = typeof networkId === 'string' && networkId.startsWith('0x') 
      ? networkId 
      : '0x' + parseInt(networkId).toString(16);
    
    try {
      // Try to switch to the network
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkIdHex }]
      });
      
      // Update current network ID
      this.networkId = parseInt(networkIdHex, 16);
      
      // Notify listeners
      this.notifyAuthChange();
      
      return true;
    } catch (error) {
      // If the chain hasn't been added to the wallet yet
      if (error.code === 4902) {
        const networkConfig = networks[parseInt(networkId)];
        if (!networkConfig) {
          throw new Error(`Network configuration for ID ${networkId} not found`);
        }
        
        try {
          // Add the network to the wallet
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig]
          });
          
          // Try switching again
          return await this.switchNetwork(networkId);
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw addError;
        }
      }
      
      console.error('Failed to switch network:', error);
      throw error;
    }
  }

  /**
   * Get list of available wallet providers
   * @returns {Array} Available wallet providers
   */
  getAvailableWallets() {
    return Object.entries(this.walletProviders)
      .filter(([_, provider]) => provider.check())
      .map(([id, provider]) => ({
        id,
        name: provider.name,
        logo: provider.logo
      }));
  }

  /**
   * Register auth change listener
   * @param {Function} callback Callback function
   * @returns {Function} Function to unregister listener
   */
  onAuthChange(callback) {
    this.authListeners.push(callback);
    
    // Immediately notify about current state
    if (callback && typeof callback === 'function') {
      callback(this.isConnected, this.currentAccount, this.networkId);
    }
    
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all auth change listeners
   */
  notifyAuthChange() {
    this.authListeners.forEach(callback => {
      try {
        callback(this.isConnected, this.currentAccount, this.networkId);
      } catch (error) {
        console.error('Error in auth change listener:', error);
      }
    });
  }

  /**
   * Handle wallet accounts changed event
   * @param {Array} accounts New accounts array
   */
  handleAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
      // User disconnected their wallet
      this.handleDisconnect();
      return;
    }
    
    // Update current account
    this.currentAccount = accounts[0];
    
    // Notify listeners
    this.notifyAuthChange();
  }

  /**
   * Handle wallet chain/network changed event
   * @param {string} chainIdHex New chain ID in hex
   */
  handleChainChanged(chainIdHex) {
    // Update network ID (convert hex to decimal)
    this.networkId = parseInt(chainIdHex, 16);
    
    // Notify listeners
    this.notifyAuthChange();
  }

  /**
   * Handle wallet disconnection event
   */
  handleDisconnect() {
    // Update connection status
    this.isConnected = false;
    this.currentAccount = null;
    
    // Clear stored connection preferences
    localStorage.removeItem('web3_connected');
    
    // Notify listeners
    this.notifyAuthChange();
  }
}

// Create and export a singleton instance
const web3Auth = new Web3Auth();
window.web3Auth = web3Auth; // Expose to global scope

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  web3Auth.initialize();
});