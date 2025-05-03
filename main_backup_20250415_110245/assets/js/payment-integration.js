/**
 * Payment Integration Module for Web3 Crypto Streaming
 * Handles crypto payments, subscriptions and creator transactions
 */

class PaymentIntegration {
  constructor() {
    this.initialized = false;
    this.web3 = null;
    this.currentAccount = null;
    this.paymentHistory = [];
    this.pendingTransactions = [];
    this.contracts = {
      streamToken: null,
      contentPayment: null,
      subscription: null
    };
    this.gasSettings = {
      standard: { maxFeePerGas: null, maxPriorityFeePerGas: null },
      fast: { maxFeePerGas: null, maxPriorityFeePerGas: null }
    };
    this.eventListeners = {};
  }

  /**
   * Initialize the payment system
   * @param {Object} web3 - Initialized Web3 instance
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} - Whether initialization succeeded
   */
  async initialize(web3, options = {}) {
    if (this.initialized) return true;
    
    try {
      console.log('Initializing payment system...');
      
      // Store web3 instance
      this.web3 = web3;
      
      // Get current account
      const accounts = await web3.eth.getAccounts();
      this.currentAccount = accounts[0];
      
      // Contract addresses
      const contractAddresses = {
        streamToken: options.streamTokenAddress || '0x1234567890123456789012345678901234567890',
        contentPayment: options.contentPaymentAddress || '0x2345678901234567890123456789012345678901',
        subscription: options.subscriptionAddress || '0x3456789012345678901234567890123456789012'
      };
      
      // Load ABIs
      const streamTokenABI = await this._loadContractABI('streamToken');
      const contentPaymentABI = await this._loadContractABI('contentPayment');
      const subscriptionABI = await this._loadContractABI('subscription');
      
      // Initialize contracts
      this.contracts.streamToken = new web3.eth.Contract(
        streamTokenABI,
        contractAddresses.streamToken
      );
      
      this.contracts.contentPayment = new web3.eth.Contract(
        contentPaymentABI,
        contractAddresses.contentPayment
      );
      
      this.contracts.subscription = new web3.eth.Contract(
        subscriptionABI,
        contractAddresses.subscription
      );
      
      // Update gas price estimates
      await this._updateGasEstimates();
      
      // Load payment history from local storage
      this._loadPaymentHistory();
      
      // Set up event listeners
      this._setupEventListeners();
      
      this.initialized = true;
      console.log('Payment system initialized');
      
      // Emit initialization event
      this._emitEvent('initialized', { account: this.currentAccount });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize payment system:', error);
      return false;
    }
  }

  /**
   * Make a content payment
   * @param {Object} paymentDetails - Payment information
   * @returns {Promise<Object>} - Transaction result
   */
  async payForContent(paymentDetails) {
    if (!this.initialized) {
      throw new Error('Payment system not initialized');
    }
    
    const {
      contentId,
      creatorAddress,
      amount,
      currency = 'STREAM',
      metadata = {}
    } = paymentDetails;
    
    if (!contentId || !creatorAddress || !amount) {
      throw new Error('Missing required payment parameters');
    }
    
    // Start transaction monitoring
    const transactionId = this._generateTransactionId();
    this._addPendingTransaction(transactionId, 'content-purchase', paymentDetails);
    
    try {
      // Determine payment method
      let paymentMethod;
      let txReceipt;
      
      switch (currency.toUpperCase()) {
        case 'STREAM':
          // Use STREAM token for payment
          paymentMethod = 'stream-token';
          
          // Check balance
          const balance = await this._getTokenBalance('STREAM');
          if (parseFloat(balance) < parseFloat(amount)) {
            throw new Error(`Insufficient STREAM balance. Required: ${amount}, Available: ${balance}`);
          }
          
          // Approve tokens for spending
          const approvalTx = await this.contracts.streamToken.methods
            .approve(this.contracts.contentPayment._address, this._toTokenAmount(amount))
            .send({ from: this.currentAccount });
          
          console.log('Token approval transaction:', approvalTx.transactionHash);
          
          // Execute payment
          txReceipt = await this.contracts.contentPayment.methods
            .payWithToken(
              creatorAddress,
              contentId,
              this._toTokenAmount(amount),
              web3.utils.asciiToHex(JSON.stringify(metadata))
            )
            .send({ from: this.currentAccount });
          break;
          
        case 'ETH':
          // Use native ETH for payment
          paymentMethod = 'native-eth';
          
          // Execute payment
          txReceipt = await this.contracts.contentPayment.methods
            .payWithEth(
              creatorAddress, 
              contentId,
              web3.utils.asciiToHex(JSON.stringify(metadata))
            )
            .send({ 
              from: this.currentAccount,
              value: web3.utils.toWei(amount.toString(), 'ether')
            });
          break;
          
        default:
          throw new Error(`Unsupported payment currency: ${currency}`);
      }
      
      // Transaction succeeded
      const receipt = {
        transactionId,
        contentId,
        creatorAddress,
        amount,
        currency,
        txHash: txReceipt.transactionHash,
        timestamp: Date.now(),
        status: 'completed',
        paymentMethod,
        metadata: {
          ...metadata,
          blockNumber: txReceipt.blockNumber,
          gasUsed: txReceipt.gasUsed
        }
      };
      
      // Remove from pending and add to history
      this._removePendingTransaction(transactionId);
      this._addToPaymentHistory(receipt);
      
      // Emit payment success event
      this._emitEvent('payment-success', receipt);
      
      return receipt;
      
    } catch (error) {
      // Update pending transaction to failed
      this._updatePendingTransaction(transactionId, 'failed', { error: error.message });
      
      // Emit payment failed event
      this._emitEvent('payment-failed', {
        transactionId,
        contentId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Subscribe to a creator
   * @param {Object} subscriptionDetails - Subscription information
   * @returns {Promise<Object>} - Subscription result
   */
  async subscribe(subscriptionDetails) {
    if (!this.initialized) {
      throw new Error('Payment system not initialized');
    }
    
    const {
      creatorAddress,
      planId,
      duration = 30, // days
      amount,
      currency = 'STREAM',
      metadata = {}
    } = subscriptionDetails;
    
    if (!creatorAddress || !planId || !amount) {
      throw new Error('Missing required subscription parameters');
    }
    
    // Start transaction monitoring
    const transactionId = this._generateTransactionId();
    this._addPendingTransaction(transactionId, 'subscription', subscriptionDetails);
    
    try {
      // Similar logic to content payment, but using subscription contract
      const txReceipt = await this.contracts.subscription.methods
        .createSubscription(
          creatorAddress,
          planId,
          duration,
          this._toTokenAmount(amount),
          web3.utils.asciiToHex(JSON.stringify(metadata))
        )
        .send({ from: this.currentAccount });
      
      // Transaction succeeded
      const receipt = {
        transactionId,
        creatorAddress,
        planId,
        duration,
        amount,
        currency,
        txHash: txReceipt.transactionHash,
        timestamp: Date.now(),
        status: 'active',
        expiryDate: Date.now() + (duration * 24 * 60 * 60 * 1000),
        metadata: {
          ...metadata,
          blockNumber: txReceipt.blockNumber
        }
      };
      
      // Remove from pending and add to history
      this._removePendingTransaction(transactionId);
      this._addToPaymentHistory(receipt);
      
      // Emit subscription success event
      this._emitEvent('subscription-created', receipt);
      
      return receipt;
      
    } catch (error) {
      // Update pending transaction to failed
      this._updatePendingTransaction(transactionId, 'failed', { error: error.message });
      
      // Emit subscription failed event
      this._emitEvent('subscription-failed', {
        transactionId,
        creatorAddress,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get user payment history
   * @param {Object} options - Filtering and pagination options
   * @returns {Array} - Payment history records
   */
  getPaymentHistory(options = {}) {
    const {
      type,
      limit = 10,
      offset = 0,
      sortBy = 'timestamp',
      sortDir = 'desc'
    } = options;
    
    let filteredHistory = [...this.paymentHistory];
    
    // Apply type filter if specified
    if (type) {
      filteredHistory = filteredHistory.filter(item => item.type === type);
    }
    
    // Apply sorting
    filteredHistory.sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      
      if (sortDir === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    
    // Apply pagination
    return filteredHistory.slice(offset, offset + limit);
  }

  /**
   * Get pending transactions
   * @returns {Array} - Pending transactions
   */
  getPendingTransactions() {
    return [...this.pendingTransactions];
  }

  /**
   * Check if subscription is active
   * @param {string} creatorAddress - Creator's address to check
   * @returns {Promise<Object>} - Subscription status
   */
  async checkSubscription(creatorAddress) {
    if (!this.initialized) {
      throw new Error('Payment system not initialized');
    }
    
    try {
      const subscription = await this.contracts.subscription.methods
        .getSubscription(this.currentAccount, creatorAddress)
        .call();
      
      if (subscription.active) {
        return {
          active: true,
          expires: parseInt(subscription.expiryDate) * 1000, // Convert to milliseconds
          planId: subscription.planId,
          daysLeft: Math.ceil((parseInt(subscription.expiryDate) * 1000 - Date.now()) / (24 * 60 * 60 * 1000))
        };
      } else {
        return {
          active: false
        };
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { active: false, error: error.message };
    }
  }

  /**
   * Add event listener
   * @param {string} eventName - Event name to listen for
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    
    this.eventListeners[eventName].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback to remove
   */
  off(eventName, callback) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName] = this.eventListeners[eventName]
        .filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event to all listeners
   * @param {string} eventName - Event name to emit
   * @param {Object} data - Event data
   * @private
   */
  _emitEvent(eventName, data) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in payment event listener for ${eventName}:`, err);
        }
      });
    }
  }

  /**
   * Load contract ABI from external file or embedded objects
   * @param {string} contractName - Name of the contract
   * @returns {Promise<Object>} - Contract ABI
   * @private
   */
  async _loadContractABI(contractName) {
    // In a real implementation, ABIs would be loaded from JSON files or an API
    // For now, returning simplified mock ABIs
    const mockABIs = {
      streamToken: [
        {
          "constant": false,
          "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
          ],
          "name": "approve",
          "outputs": [{ "name": "", "type": "bool" }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [{ "name": "_owner", "type": "address" }],
          "name": "balanceOf",
          "outputs": [{ "name": "balance", "type": "uint256" }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }
      ],
      contentPayment: [
        {
          "constant": false,
          "inputs": [
            { "name": "_creator", "type": "address" },
            { "name": "_contentId", "type": "string" },
            { "name": "_amount", "type": "uint256" },
            { "name": "_metadata", "type": "bytes" }
          ],
          "name": "payWithToken",
          "outputs": [{ "name": "", "type": "bool" }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            { "name": "_creator", "type": "address" },
            { "name": "_contentId", "type": "string" },
            { "name": "_metadata", "type": "bytes" }
          ],
          "name": "payWithEth",
          "outputs": [{ "name": "", "type": "bool" }],
          "payable": true,
          "stateMutability": "payable",
          "type": "function"
        }
      ],
      subscription: [
        {
          "constant": false,
          "inputs": [
            { "name": "_creator", "type": "address" },
            { "name": "_planId", "type": "uint256" },
            { "name": "_duration", "type": "uint256" },
            { "name": "_amount", "type": "uint256" },
            { "name": "_metadata", "type": "bytes" }
          ],
          "name": "createSubscription",
          "outputs": [{ "name": "", "type": "bool" }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [
            { "name": "_subscriber", "type": "address" },
            { "name": "_creator", "type": "address" }
          ],
          "name": "getSubscription",
          "outputs": [
            {
              "components": [
                { "name": "active", "type": "bool" },
                { "name": "planId", "type": "uint256" },
                { "name": "startDate", "type": "uint256" },
                { "name": "expiryDate", "type": "uint256" }
              ],
              "name": "",
              "type": "tuple"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }
      ]
    };
    
    return mockABIs[contractName] || [];
  }

  /**
   * Update gas price estimates
   * @private
   */
  async _updateGasEstimates() {
    try {
      // In EIP-1559 compatible networks
      if (this.web3.eth.getGasPrice) {
        const gasPrice = await this.web3.eth.getGasPrice();
        const gasPriceGwei = this.web3.utils.fromWei(gasPrice, 'gwei');
        
        // Set standard and fast gas prices based on current price
        this.gasSettings.standard.maxFeePerGas = Math.floor(gasPriceGwei * 1.2).toString();
        this.gasSettings.standard.maxPriorityFeePerGas = Math.floor(gasPriceGwei * 0.3).toString();
        
        this.gasSettings.fast.maxFeePerGas = Math.floor(gasPriceGwei * 1.5).toString();
        this.gasSettings.fast.maxPriorityFeePerGas = Math.floor(gasPriceGwei * 0.5).toString();
      }
    } catch (error) {
      console.error('Error updating gas estimates:', error);
    }
  }

  /**
   * Convert decimal amount to token amount with proper decimals
   * @param {number|string} amount - Amount to convert
   * @param {number} decimals - Token decimals (default: 18)
   * @returns {string} - Token amount as string
   * @private
   */
  _toTokenAmount(amount, decimals = 18) {
    return this.web3.utils.toWei(amount.toString());
  }

  /**
   * Get token balance
   * @param {string} token - Token symbol
   * @returns {Promise<string>} - Balance as decimal string
   * @private
   */
  async _getTokenBalance(token) {
    if (token === 'STREAM') {
      const balanceWei = await this.contracts.streamToken.methods
        .balanceOf(this.currentAccount)
        .call();
      
      return this.web3.utils.fromWei(balanceWei);
    }
    
    throw new Error(`Unsupported token: ${token}`);
  }

  /**
   * Generate unique transaction ID
   * @returns {string} - Transaction ID
   * @private
   */
  _generateTransactionId() {
    return `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Add transaction to pending list
   * @param {string} id - Transaction ID
   * @param {string} type - Transaction type
   * @param {Object} details - Transaction details
   * @private
   */
  _addPendingTransaction(id, type, details) {
    const transaction = {
      id,
      type,
      details,
      status: 'pending',
      timestamp: Date.now()
    };
    
    this.pendingTransactions.push(transaction);
    this._emitEvent('transaction-added', transaction);
  }

  /**
   * Update pending transaction status
   * @param {string} id - Transaction ID
   * @param {string} status - New status
   * @param {Object} additionalInfo - Additional information
   * @private
   */
  _updatePendingTransaction(id, status, additionalInfo = {}) {
    const index = this.pendingTransactions.findIndex(tx => tx.id === id);
    
    if (index !== -1) {
      this.pendingTransactions[index] = {
        ...this.pendingTransactions[index],
        status,
        ...additionalInfo,
        updated: Date.now()
      };
      
      this._emitEvent('transaction-updated', this.pendingTransactions[index]);
    }
  }

  /**
   * Remove transaction from pending list
   * @param {string} id - Transaction ID
   * @private
   */
  _removePendingTransaction(id) {
    const index = this.pendingTransactions.findIndex(tx => tx.id === id);
    
    if (index !== -1) {
      const transaction = this.pendingTransactions[index];
      this.pendingTransactions.splice(index, 1);
      this._emitEvent('transaction-removed', transaction);
    }
  }

  /**
   * Add record to payment history
   * @param {Object} payment - Payment record
   * @private
   */
  _addToPaymentHistory(payment) {
    this.paymentHistory.push(payment);
    
    // Store in local storage
    this._savePaymentHistory();
    
    this._emitEvent('history-updated', this.paymentHistory);
  }

  /**
   * Load payment history from local storage
   * @private
   */
  _loadPaymentHistory() {
    try {
      const storedHistory = localStorage.getItem('payment-history');
      
      if (storedHistory) {
        this.paymentHistory = JSON.parse(storedHistory);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      this.paymentHistory = [];
    }
  }

  /**
   * Save payment history to local storage
   * @private
   */
  _savePaymentHistory() {
    try {
      localStorage.setItem('payment-history', JSON.stringify(this.paymentHistory));
    } catch (error) {
      console.error('Error saving payment history:', error);
    }
  }

  /**
   * Set up blockchain event listeners
   * @private
   */
  _setupEventListeners() {
    // Implement blockchain event listeners for payment contracts
    // This would depend on the specific events defined in your smart contracts
  }
}

// Create global singleton instance
window.paymentIntegration = new PaymentIntegration();
