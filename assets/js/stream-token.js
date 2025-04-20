/**
 * STREAM Token Interface
 * Provides functionality to interact with the STREAM token contract
 */

class StreamToken {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.tokenAddress = {
      // Production networks
      1: '0x1234567890123456789012345678901234567890', // Ethereum Mainnet (placeholder)
      137: '0x2345678901234567890123456789012345678901', // Polygon Mainnet (placeholder)
      
      // Test networks
      5: '0x3456789012345678901234567890123456789012', // Goerli Testnet (placeholder)
      80001: '0x4567890123456789012345678901234567890123', // Mumbai Testnet (placeholder)
    };
    this.decimals = 18;
    this.isInitialized = false;

    // ABI (Application Binary Interface) for the STREAM token contract
    this.tokenAbi = [
      // Read functions
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
      },
      // Write functions
      {
        "constant": false,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [{"name": "_from", "type": "address"}, {"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transferFrom",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      }
    ];

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.getBalance = this.getBalance.bind(this);
    this.formatAmount = this.formatAmount.bind(this);
    this.parseAmount = this.parseAmount.bind(this);
    this.transfer = this.transfer.bind(this);
    this.approve = this.approve.bind(this);
    this.watchTransfers = this.watchTransfers.bind(this);
  }

  /**
   * Initialize the STREAM token contract interface
   * @param {Object} web3 Web3 instance
   * @param {number} chainId Current network ID
   * @returns {boolean} Success status
   */
  async initialize(web3, chainId) {
    if (this.isInitialized) return true;
    if (!web3) return false;

    this.web3 = web3;
    
    // Get the correct token address for the current network
    const tokenAddress = this.tokenAddress[chainId];
    if (!tokenAddress) {
      console.error(`STREAM Token not deployed on network ${chainId}`);
      return false;
    }
    
    try {
      // Create contract instance
      this.contract = new this.web3.eth.Contract(this.tokenAbi, tokenAddress);
      
      // Get token decimals
      try {
        const decimals = await this.contract.methods.decimals().call();
        this.decimals = parseInt(decimals, 10);
      } catch (error) {
        console.warn("Couldn't fetch token decimals, using default (18):", error);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize STREAM token:', error);
      return false;
    }
  }

  /**
   * Get the STREAM token balance for an address
   * @param {string} address Wallet address to check
   * @returns {Promise<string>} Formatted balance
   */
  async getBalance(address) {
    if (!this.contract) {
      throw new Error('STREAM token contract not initialized');
    }
    
    try {
      const balance = await this.contract.methods.balanceOf(address).call();
      return this.formatAmount(balance);
    } catch (error) {
      console.error('Error getting STREAM token balance:', error);
      throw error;
    }
  }

  /**
   * Format raw token amount with decimals
   * @param {string|number} amount Raw amount (wei)
   * @returns {string} Formatted amount with decimals
   */
  formatAmount(amount) {
    if (!this.web3) return '0';
    
    return this.web3.utils.fromWei(amount.toString(), 'ether');
  }

  /**
   * Parse human-readable amount to raw token amount
   * @param {string|number} amount Amount with decimals
   * @returns {string} Raw token amount (wei)
   */
  parseAmount(amount) {
    if (!this.web3) return '0';
    
    return this.web3.utils.toWei(amount.toString(), 'ether');
  }

  /**
   * Transfer STREAM tokens to another address
   * @param {string} to Recipient address
   * @param {string|number} amount Amount to transfer (in STREAM units)
   * @param {string} from Sender address (optional, defaults to connected wallet)
   * @returns {Promise<string>} Transaction hash
   */
  async transfer(to, amount, from = null) {
    if (!this.contract) {
      throw new Error('STREAM token contract not initialized');
    }
    
    const rawAmount = this.parseAmount(amount);
    const sender = from || window.web3Auth.currentAccount;
    
    if (!sender) {
      throw new Error('No wallet connected');
    }
    
    try {
      const tx = await this.contract.methods.transfer(to, rawAmount).send({
        from: sender
      });
      
      return tx.transactionHash;
    } catch (error) {
      console.error('Error transferring STREAM tokens:', error);
      throw error;
    }
  }

  /**
   * Approve another address to spend tokens
   * @param {string} spender Address to approve
   * @param {string|number} amount Amount to approve (in STREAM units)
   * @returns {Promise<string>} Transaction hash
   */
  async approve(spender, amount) {
    if (!this.contract) {
      throw new Error('STREAM token contract not initialized');
    }
    
    const rawAmount = this.parseAmount(amount);
    const sender = window.web3Auth.currentAccount;
    
    if (!sender) {
      throw new Error('No wallet connected');
    }
    
    try {
      const tx = await this.contract.methods.approve(spender, rawAmount).send({
        from: sender
      });
      
      return tx.transactionHash;
    } catch (error) {
      console.error('Error approving STREAM tokens:', error);
      throw error;
    }
  }

  /**
   * Watch for incoming STREAM token transfers to an address
   * @param {string} address Address to watch
   * @param {function} callback Function to call when transfers are received
   * @returns {object} Subscription object
   */
  watchTransfers(address, callback) {
    if (!this.contract) {
      throw new Error('STREAM token contract not initialized');
    }
    
    try {
      const subscription = this.contract.events.Transfer({
        filter: {
          to: address
        }
      })
      .on('data', event => {
        const { from, to, value } = event.returnValues;
        const formattedValue = this.formatAmount(value);
        
        callback({
          from,
          to,
          value: formattedValue,
          timestamp: Math.floor(Date.now() / 1000),
          transactionHash: event.transactionHash
        });
      })
      .on('error', error => {
        console.error('Error watching STREAM transfers:', error);
      });
      
      return subscription;
    } catch (error) {
      console.error('Failed to watch for STREAM token transfers:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const streamToken = new StreamToken();
window.streamToken = streamToken; // Expose to global scope

// Initialize when web3Auth is ready
if (window.web3Auth) {
  window.web3Auth.onAuthChange((isConnected, account, networkId) => {
    if (isConnected && account && networkId && window.web3Auth.web3) {
      streamToken.initialize(window.web3Auth.web3, networkId);
    }
  });
}