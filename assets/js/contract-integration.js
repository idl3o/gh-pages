/**
 * Smart Contract Integration
 * Handles interaction with blockchain contracts for the platform
 */

class ContractIntegration {
  constructor() {
    this.web3 = null;
    this.contracts = {};
    this.isInitialized = false;

    // Contract addresses by network
    this.contractAddresses = {
      // Ethereum Mainnet
      1: {
        streamToken: '0x4A8f5F96D5436e43112c87fec524BDCA68088D11',
        proofOfExistence: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
        streamPayment: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      },
      // Goerli Testnet
      5: {
        streamToken: '0x1234567890123456789012345678901234567890',
        proofOfExistence: '0x0987654321098765432109876543210987654321',
        streamPayment: '0x5678901234567890123456789012345678901234'
      },
      // Polygon Mainnet
      137: {
        streamToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        proofOfExistence: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        streamPayment: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'
      },
      // Mumbai Testnet
      80001: {
        streamToken: '0x9876543210987654321098765432109876543210',
        proofOfExistence: '0x4321098765432109876543210987654321098765',
        streamPayment: '0x6789012345678901234567890123456789012345'
      }
    };

    // Contract ABI definitions
    this.contractABIs = {
      streamToken: [
        {
          inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function'
        },
        {
          inputs: [],
          name: 'name',
          outputs: [{ internalType: 'string', name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function'
        },
        {
          inputs: [],
          name: 'symbol',
          outputs: [{ internalType: 'string', name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function'
        },
        {
          inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ],
          name: 'transfer',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [],
          name: 'totalSupply',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function'
        },
        {
          inputs: [],
          name: 'decimals',
          outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
          stateMutability: 'view',
          type: 'function'
        }
      ],
      proofOfExistence: [
        {
          inputs: [{ internalType: 'string', name: 'document', type: 'string' }],
          name: 'notarize',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [{ internalType: 'string', name: 'document', type: 'string' }],
          name: 'checkDocument',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function'
        },
        {
          inputs: [{ internalType: 'string', name: 'document', type: 'string' }],
          name: 'getTimestamp',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function'
        }
      ],
      streamPayment: [
        {
          inputs: [
            { internalType: 'address', name: 'recipient', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ],
          name: 'createPayment',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [{ internalType: 'uint256', name: 'paymentId', type: 'uint256' }],
          name: 'releasePayment',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [{ internalType: 'uint256', name: 'paymentId', type: 'uint256' }],
          name: 'cancelPayment',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        },
        {
          inputs: [{ internalType: 'uint256', name: 'paymentId', type: 'uint256' }],
          name: 'getPaymentDetails',
          outputs: [
            { internalType: 'address', name: 'sender', type: 'address' },
            { internalType: 'address', name: 'recipient', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'uint256', name: 'releaseTime', type: 'uint256' },
            { internalType: 'bool', name: 'isReleased', type: 'bool' },
            { internalType: 'bool', name: 'isCancelled', type: 'bool' }
          ],
          stateMutability: 'view',
          type: 'function'
        }
      ]
    };

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.getContract = this.getContract.bind(this);
    this.handleNetworkChange = this.handleNetworkChange.bind(this);
    this.getTokenBalance = this.getTokenBalance.bind(this);
    this.verifyContent = this.verifyContent.bind(this);
    this.notarizeContent = this.notarizeContent.bind(this);
    this.createStreamPayment = this.createStreamPayment.bind(this);
    this.releaseStreamPayment = this.releaseStreamPayment.bind(this);
    this.formatToken = this.formatToken.bind(this);
    this.parseToken = this.parseToken.bind(this);
  }

  /**
   * Initialize contract integration
   * @param {Object} web3 Web3 instance
   * @param {number} networkId Current network ID
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize(web3, networkId) {
    try {
      if (!web3) {
        throw new Error('Web3 instance is required');
      }

      this.web3 = web3;

      // Initialize contracts for this network
      await this.handleNetworkChange(networkId);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize contract integration:', error);
      return false;
    }
  }

  /**
   * Handle network change
   * @param {number} networkId New network ID
   * @returns {Promise<void>}
   */
  async handleNetworkChange(networkId) {
    try {
      // Clear existing contracts
      this.contracts = {};

      // Get contract addresses for this network
      const addresses = this.contractAddresses[networkId];

      if (!addresses) {
        console.warn(`No contract addresses defined for network ${networkId}`);
        return;
      }

      // Initialize contracts with ABIs and addresses
      for (const [contractName, address] of Object.entries(addresses)) {
        const abi = this.contractABIs[contractName];

        if (!abi) {
          console.warn(`No ABI defined for contract ${contractName}`);
          continue;
        }

        this.contracts[contractName] = new this.web3.eth.Contract(abi, address);
      }

      console.log(`Contracts initialized for network ${networkId}`);
    } catch (error) {
      console.error('Failed to handle network change:', error);
      throw error;
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
   * Get token balance for an address
   * @param {string} address Address to check balance for
   * @returns {Promise<string>} Formatted token balance
   */
  async getTokenBalance(address) {
    try {
      const tokenContract = this.getContract('streamToken');
      const balance = await tokenContract.methods.balanceOf(address).call();
      const decimals = await tokenContract.methods.decimals().call();

      return this.formatToken(balance, decimals);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      throw error;
    }
  }

  /**
   * Verify content existence on blockchain
   * @param {string} contentHash Hash of the content to verify
   * @returns {Promise<Object>} Verification result with status and timestamp
   */
  async verifyContent(contentHash) {
    try {
      const proofContract = this.getContract('proofOfExistence');

      const exists = await proofContract.methods.checkDocument(contentHash).call();

      if (!exists) {
        return { verified: false };
      }

      const timestamp = await proofContract.methods.getTimestamp(contentHash).call();

      return {
        verified: true,
        timestamp: parseInt(timestamp) * 1000, // Convert to milliseconds
        date: new Date(parseInt(timestamp) * 1000)
      };
    } catch (error) {
      console.error('Failed to verify content:', error);
      throw error;
    }
  }

  /**
   * Notarize content on blockchain
   * @param {string} contentHash Hash of the content to notarize
   * @returns {Promise<Object>} Transaction receipt
   */
  async notarizeContent(contentHash) {
    try {
      const proofContract = this.getContract('proofOfExistence');
      const accounts = await this.web3.eth.getAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const receipt = await proofContract.methods.notarize(contentHash).send({
        from: accounts[0]
      });

      return receipt;
    } catch (error) {
      console.error('Failed to notarize content:', error);
      throw error;
    }
  }

  /**
   * Create a stream payment
   * @param {string} recipient Recipient address
   * @param {string} amount Amount in tokens
   * @returns {Promise<number>} Payment ID
   */
  async createStreamPayment(recipient, amount) {
    try {
      const streamPaymentContract = this.getContract('streamPayment');
      const tokenContract = this.getContract('streamToken');
      const accounts = await this.web3.eth.getAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      // Convert amount to token units
      const decimals = await tokenContract.methods.decimals().call();
      const tokenAmount = this.parseToken(amount, decimals);

      // Approve token transfer
      await tokenContract.methods.approve(streamPaymentContract._address, tokenAmount).send({
        from: accounts[0]
      });

      // Create payment
      const receipt = await streamPaymentContract.methods
        .createPayment(recipient, tokenAmount)
        .send({
          from: accounts[0]
        });

      // Extract payment ID from event logs
      const event = receipt.events.PaymentCreated;
      if (!event) {
        throw new Error('PaymentCreated event not found in transaction receipt');
      }

      return parseInt(event.returnValues.paymentId);
    } catch (error) {
      console.error('Failed to create stream payment:', error);
      throw error;
    }
  }

  /**
   * Release a stream payment
   * @param {number} paymentId ID of the payment to release
   * @returns {Promise<Object>} Transaction receipt
   */
  async releaseStreamPayment(paymentId) {
    try {
      const streamPaymentContract = this.getContract('streamPayment');
      const accounts = await this.web3.eth.getAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const receipt = await streamPaymentContract.methods.releasePayment(paymentId).send({
        from: accounts[0]
      });

      return receipt;
    } catch (error) {
      console.error('Failed to release stream payment:', error);
      throw error;
    }
  }

  /**
   * Format token value with proper decimals
   * @param {string|number} value Raw token value
   * @param {number} decimals Token decimals
   * @returns {string} Formatted token value
   */
  formatToken(value, decimals) {
    const divisor = BigInt(10) ** BigInt(decimals);
    const valueBI = BigInt(value);

    const integerPart = valueBI / divisor;
    const fractionalPart = valueBI % divisor;

    // Convert to string and pad with leading zeros
    let fractionalStr = fractionalPart.toString();
    fractionalStr = fractionalStr.padStart(decimals, '0');

    // Trim trailing zeros
    fractionalStr = fractionalStr.replace(/0+$/, '');

    if (fractionalStr.length === 0) {
      return integerPart.toString();
    }

    return `${integerPart}.${fractionalStr}`;
  }

  /**
   * Parse token value to raw format
   * @param {string|number} value Formatted token value
   * @param {number} decimals Token decimals
   * @returns {string} Raw token value
   */
  parseToken(value, decimals) {
    const parts = value.toString().split('.');

    let integerPart = parts[0] || '0';
    let fractionalPart = parts[1] || '';

    // Pad or truncate fractional part to match decimals
    if (fractionalPart.length > decimals) {
      fractionalPart = fractionalPart.substring(0, decimals);
    } else {
      fractionalPart = fractionalPart.padEnd(decimals, '0');
    }

    const combined = integerPart + fractionalPart;
    const result = BigInt(combined).toString();

    return result;
  }
}

// Create and export a singleton instance
const contractIntegration = new ContractIntegration();
window.contractIntegration = contractIntegration; // Expose to global scope

// Initialize when web3Auth is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.web3Auth) {
    window.web3Auth.onAuthChange(async (isConnected, account, networkId) => {
      if (isConnected && window.web3Auth.web3) {
        await contractIntegration.initialize(window.web3Auth.web3, networkId);
      }
    });
  }
});
