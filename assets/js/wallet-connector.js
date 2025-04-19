/**
 * WalletConnector class for handling Web3 wallet connections
 * @class
 */
class WalletConnector {
  /**
   * Create a wallet connector
   * @param {Object} options - Configuration options
   * @param {Array<number>} options.supportedNetworks - List of supported network IDs
   * @param {number} options.preferredNetwork - Preferred network ID
   */
  constructor(options = {}) {
    this.supportedNetworks = options.supportedNetworks || [1, 5, 56, 97];
    this.preferredNetwork = options.preferredNetwork || 1;
    this.provider = null;
    this.accounts = [];
    this.networkId = null;
    this.eventListeners = {};
    this.initialize();
  }

  /**
   * Initialize wallet connection if previously connected
   * @private
   */
  async initialize() {
    // Check if ethereum is available
    if (window.ethereum) {
      this.provider = window.ethereum;

      // Set up event listeners
      this.setupEventListeners();

      // Check if already connected
      try {
        const accounts = await this.provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.accounts = accounts;
          this.networkId = await this.getNetworkId();

          // Validate if current network is supported
          if (!this.supportedNetworks.includes(this.networkId)) {
            console.warn(
              `Current network ID: ${this.networkId}. Supported networks are: ${this.supportedNetworks.join(', ')}`
            );
          }

          // Emit connection event
          this.triggerEvent('connectionChanged', { connected: true, address: accounts[0] });
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  }

  /**
   * Set up event listeners for the Ethereum provider
   * @private
   */
  setupEventListeners() {
    if (!this.provider) return;

    this.provider.on('accountsChanged', accounts => {
      this.accounts = accounts;
      this.triggerEvent('accountsChanged', accounts);
      this.triggerEvent('connectionChanged', {
        connected: accounts.length > 0,
        address: accounts.length > 0 ? accounts[0] : null
      });
    });

    this.provider.on('chainChanged', chainIdHex => {
      this.networkId = parseInt(chainIdHex, 16);
      this.triggerEvent('networkChanged', this.networkId);
    });

    this.provider.on('disconnect', () => {
      this.accounts = [];
      this.triggerEvent('connectionChanged', { connected: false, address: null });
    });
  }

  /**
   * Connect to wallet
   * @returns {Promise<string>} Connected account address
   */
  async connect() {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.');
    }

    this.provider = window.ethereum;
    try {
      // Request account access
      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      this.accounts = accounts;

      // Get current network
      this.networkId = await this.getNetworkId();

      // Check if network is supported
      if (!this.supportedNetworks.includes(this.networkId)) {
        await this.switchNetwork(this.preferredNetwork);
      }

      this.triggerEvent('connectionChanged', { connected: true, address: accounts[0] });
      return accounts[0];
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect() {
    // Note: There's no standard way to disconnect from browser wallets
    // We just clear our local state
    this.accounts = [];
    this.triggerEvent('connectionChanged', { connected: false, address: null });
  }

  /**
   * Get current address
   * @returns {string|null} Current account address or null if not connected
   */
  async getAddress() {
    if (this.accounts.length === 0) return null;
    return this.accounts[0];
  }

  /**
   * Check if wallet is connected
   * @returns {boolean} True if connected, false otherwise
   */
  isConnected() {
    return this.accounts.length > 0;
  }

  /**
   * Get current network ID
   * @returns {Promise<number>} Network ID
   */
  async getNetworkId() {
    if (!this.provider) return null;

    try {
      const chainIdHex = await this.provider.request({ method: 'eth_chainId' });
      return parseInt(chainIdHex, 16);
    } catch (error) {
      console.error('Error getting network ID:', error);
      throw error;
    }
  }

  /**
   * Switch to a different network
   * @param {number} networkId - Network ID to switch to
   */
  async switchNetwork(networkId) {
    if (!this.provider) throw new Error('No provider available');

    const networkMap = {
      1: { chainId: '0x1', name: 'Ethereum Mainnet' },
      5: { chainId: '0x5', name: 'Goerli Testnet' },
      56: { chainId: '0x38', name: 'Binance Smart Chain' },
      97: { chainId: '0x61', name: 'BSC Testnet' }
    };

    const network = networkMap[networkId];
    if (!network) throw new Error(`Network ID ${networkId} not supported`);

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }]
      });

      this.networkId = networkId;
      this.triggerEvent('networkChanged', networkId);
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        // Add the network
        try {
          await this.addNetwork(networkId);
        } catch (addError) {
          throw addError;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Add a network to the wallet
   * @param {number} networkId - Network ID to add
   */
  async addNetwork(networkId) {
    if (!this.provider) throw new Error('No provider available');

    const networkParams = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io']
      },
      5: {
        chainId: '0x5',
        chainName: 'Goerli Testnet',
        nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://goerli.infura.io/v3/'],
        blockExplorerUrls: ['https://goerli.etherscan.io']
      },
      56: {
        chainId: '0x38',
        chainName: 'Binance Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com']
      },
      97: {
        chainId: '0x61',
        chainName: 'BSC Testnet',
        nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        blockExplorerUrls: ['https://testnet.bscscan.com']
      }
    };

    const params = networkParams[networkId];
    if (!params) throw new Error(`Network ID ${networkId} not supported`);

    await this.provider.request({
      method: 'wallet_addEthereumChain',
      params: [params]
    });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
  }

  /**
   * Trigger event
   * @param {string} event - Event name
   * @param {any} data - Event data
   * @private
   */
  triggerEvent(event, data) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(callback => callback(data));
  }

  /**
   * Get connection state information
   * @returns {Object} Connection state
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected(),
      address: this.accounts.length > 0 ? this.accounts[0] : null,
      chainId: this.networkId,
      isDemoMode: false // For demo environments
    };
  }

  /**
   * Check if the wallet is still connected (for session recovery)
   * @returns {Promise<boolean>} True if wallet is connected
   */
  async checkConnection() {
    if (!window.ethereum) return false;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.accounts = accounts;
        this.networkId = await this.getNetworkId();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }
}

// For use in browser environment
if (typeof window !== 'undefined') {
  window.WalletConnector = WalletConnector;
}

// For use in Node.js environment
if (typeof module !== 'undefined') {
  module.exports = WalletConnector;
}
