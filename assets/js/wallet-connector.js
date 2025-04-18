/**
 * Wallet Connector Module
 *
 * Manages wallet connections for the Web3 streaming platform
 */

class WalletConnector {
  constructor(options = {}) {
    this.options = {
      contractAddress: options.contractAddress,
      contractABI: options.contractABI || [],
      onStatusChange: options.onStatusChange || function () {}
    };

    this.state = {
      isConnected: false,
      isDemoMode: false,
      address: null,
      chainId: null,
      message: 'Not connected'
    };

    // Monitor account changes if wallet is available
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this._updateState({
            isConnected: false,
            address: null,
            message: 'Wallet disconnected'
          });
        } else {
          this._updateState({
            isConnected: true,
            address: accounts[0],
            message: `Connected: ${this._formatAddress(accounts[0])}`
          });
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this._updateState({
          chainId: chainId,
          message: `Network changed to ${chainId}`
        });
        window.location.reload(); // Recommended by MetaMask to reload on chain change
      });
    }
  }

  /**
   * Connect to wallet
   */
  async connect() {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        console.log('No wallet detected, using demo mode');
        return this.activateDemoMode('No wallet found, using demo mode');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Get current chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Store connection in session
      sessionStorage.setItem('walletConnected', 'true');
      sessionStorage.setItem('walletDemo', 'false');

      const address = accounts[0];
      this._updateState({
        isConnected: true,
        isDemoMode: false,
        address: address,
        chainId: chainId,
        message: `Connected: ${this._formatAddress(address)}`
      });

      return {
        success: true,
        address: address,
        chainId: chainId,
        isDemoMode: false
      };
    } catch (error) {
      console.error('Connection error:', error);

      // Fallback to demo mode
      console.log('Using demo mode due to connection error');
      return this.activateDemoMode('Connection failed, using demo mode');
    }
  }

  /**
   * Activate demo mode (for testing without a real wallet)
   */
  activateDemoMode(message) {
    const demoAddress = '0xDemo000000000000000000000000000000000000';

    // Store demo mode in session
    sessionStorage.setItem('walletConnected', 'true');
    sessionStorage.setItem('walletDemo', 'true');

    this._updateState({
      isConnected: true,
      isDemoMode: true,
      address: demoAddress,
      chainId: '0x539', // Local development chain
      message: message || 'Demo mode active'
    });

    return {
      success: true,
      address: demoAddress,
      chainId: '0x539',
      isDemoMode: true
    };
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    // Remove session data
    sessionStorage.removeItem('walletConnected');
    sessionStorage.removeItem('walletDemo');

    this._updateState({
      isConnected: false,
      isDemoMode: false,
      address: null,
      message: 'Disconnected'
    });

    return {
      success: true
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    return { ...this.state };
  }

  /**
   * Format address for display
   * @private
   */
  _formatAddress(address) {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Update connection state and notify listeners
   * @private
   */
  _updateState(newState) {
    this.state = { ...this.state, ...newState };

    // Notify status change
    this.options.onStatusChange({
      status: this.state.isConnected ? 'connected' : 'disconnected',
      address: this.state.address,
      chainId: this.state.chainId,
      isDemoMode: this.state.isDemoMode,
      message: this.state.message
    });
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
