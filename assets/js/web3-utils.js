/**
 * Web3 Utilities
 * Common blockchain interaction utilities for the web3 streaming platform
 * Updated for Web3.js v4.x API (April 2025)
 */

// Use dynamic imports for better compatibility with different environments
async function getWeb3Instance() {
  try {
    // Import Web3 using modern syntax
    const { Web3 } = await import('web3');
    
    // Check if Web3 is already injected (MetaMask, etc.)
    if (window.ethereum) {
      return new Web3(window.ethereum);
    } else {
      // Fallback to a public provider (updated for Infura API v3)
      return new Web3('https://mainnet.infura.io/v3/your-infura-key');
    }
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
    throw new Error('Web3 initialization failed');
  }
}

/**
 * Connect to the user's wallet
 * @returns {Promise<string>} The connected wallet address
 */
async function connectWallet() {
  try {
    const web3 = await getWeb3Instance();
    
    // Request account access using the standard EIP-1102 method
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        throw new Error('User denied account access');
      }
    }
    
    // Updated for Web3.js v4.x
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }
    
    return accounts[0];
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
}

/**
 * Sign a message with the user's wallet
 * @param {string} address Wallet address
 * @param {string} message Message to sign
 * @returns {Promise<string>} Signature
 */
async function signMessage(address, message) {
  try {
    const web3 = await getWeb3Instance();
    
    // Updated for Web3.js v4.x - personal namespace doesn't need empty password parameter
    const signature = await web3.eth.personal.sign(
      message, // Web3.js v4 automatically handles utf8 conversion
      address
    );
    return signature;
  } catch (error) {
    console.error('Message signing error:', error);
    throw error;
  }
}

/**
 * Get the balance of an address
 * @param {string} address Wallet address
 * @returns {Promise<string>} Balance in ETH
 */
async function getBalance(address) {
  try {
    const web3 = await getWeb3Instance();
    const balanceWei = await web3.eth.getBalance(address);
    
    // Updated for Web3.js v4.x
    return web3.utils.fromWei(balanceWei);
  } catch (error) {
    console.error('Balance retrieval error:', error);
    throw error;
  }
}

/**
 * Get transaction history for an address
 * @param {string} address Wallet address
 * @param {number} limit Maximum number of transactions to fetch
 * @returns {Promise<Array>} Transaction history
 */
async function getTransactionHistory(address, limit = 10) {
  try {
    // Note: This is a simplified implementation
    // In production, you would use a blockchain explorer API or an indexed database
    const web3 = await getWeb3Instance();
    const blockNumber = await web3.eth.getBlockNumber();
    
    let transactions = [];
    for (let i = 0; i < limit && blockNumber - i >= 0; i++) {
      // Updated for Web3.js v4.x - need to specify returnTransactionObjects: true
      const block = await web3.eth.getBlock(blockNumber - i, { 
        includeTransactions: true 
      });
      
      if (block && block.transactions) {
        const relevantTxs = block.transactions.filter(
          tx => tx.from === address || tx.to === address
        );
        transactions.push(...relevantTxs);
        
        if (transactions.length >= limit) {
          transactions = transactions.slice(0, limit);
          break;
        }
      }
    }
    
    return transactions;
  } catch (error) {
    console.error('Transaction history error:', error);
    throw error;
  }
}

/**
 * Interact with a smart contract
 * @param {string} contractAddress Contract address
 * @param {Array} abi Contract ABI
 * @returns {Promise<Object>} Contract instance
 */
async function getContract(contractAddress, abi) {
  try {
    const web3 = await getWeb3Instance();
    
    // Updated for Web3.js v4.x - Contract instantiation syntax updated
    return new web3.eth.Contract(abi, {
      address: contractAddress
    });
  } catch (error) {
    console.error('Contract initialization error:', error);
    throw error;
  }
}

/**
 * Get network information
 * @returns {Promise<Object>} Network information
 */
async function getNetworkInfo() {
  try {
    const web3 = await getWeb3Instance();
    
    // Updated for Web3.js v4.x - getChainId() replaces deprecated getId()
    const chainId = await web3.eth.getChainId();
    
    // Handle network type mapping (replaces deprecated getNetworkType)
    let networkName;
    switch (Number(chainId)) {
      case 1:
        networkName = 'Ethereum Mainnet';
        break;
      case 5:
        networkName = 'Goerli';
        break;
      case 11155111:
        networkName = 'Sepolia'; 
        break;
      case 56:
        networkName = 'BSC Mainnet';
        break;
      case 137:
        networkName = 'Polygon Mainnet';
        break;
      case 42161:
        networkName = 'Arbitrum One';
        break;
      case 10:
        networkName = 'Optimism';
        break;
      case 8453:
        networkName = 'Base';
        break;
      default:
        networkName = `Unknown (${chainId})`;
    }
    
    return {
      id: chainId,
      name: networkName
    };
  } catch (error) {
    console.error('Network info error:', error);
    throw error;
  }
}

/**
 * Get current gas prices
 * @returns {Promise<Object>} Gas price information
 */
async function getGasPrice() {
  try {
    const web3 = await getWeb3Instance();
    const gasPrice = await web3.eth.getGasPrice();
    
    return {
      wei: gasPrice,
      gwei: web3.utils.fromWei(gasPrice, 'gwei'),
      eth: web3.utils.fromWei(gasPrice, 'ether')
    };
  } catch (error) {
    console.error('Gas price error:', error);
    throw error;
  }
}

// Export utilities
module.exports = {
  getWeb3Instance,
  connectWallet,
  signMessage,
  getBalance,
  getTransactionHistory,
  getContract,
  getNetworkInfo,
  getGasPrice
};