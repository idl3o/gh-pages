/**
 * Network Configuration Module
 *
 * Manages network-specific configurations for the Web3 streaming platform
 */

class NetworkConfig {
  constructor() {
    // Chain IDs as hexadecimal strings
    this.NETWORKS = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x13881': 'Mumbai Testnet',
      '0x89': 'Polygon Mainnet',
      '0x539': 'Local Development'
    };

    // RPC URLs for each network
    this.RPC_URLS = {
      '0x1': 'https://eth-mainnet.g.alchemy.com/v2/demo',
      '0x5': 'https://eth-goerli.g.alchemy.com/v2/demo',
      '0xaa36a7': 'https://eth-sepolia.g.alchemy.com/v2/demo',
      '0x13881': 'https://polygon-mumbai.g.alchemy.com/v2/demo',
      '0x89': 'https://polygon-mainnet.g.alchemy.com/v2/demo',
      '0x539': 'http://localhost:8545'
    };

    // Block explorers for each network
    this.BLOCK_EXPLORERS = {
      '0x1': 'https://etherscan.io',
      '0x5': 'https://goerli.etherscan.io',
      '0xaa36a7': 'https://sepolia.etherscan.io',
      '0x13881': 'https://mumbai.polygonscan.com',
      '0x89': 'https://polygonscan.com',
      '0x539': '' // Local network has no explorer
    };

    // Contract addresses for each network
    this.CONTRACT_ADDRESSES = {
      '0x1': {
        streamingToken: '0x1234567890123456789012345678901234567890', // Replace with actual address
        contentRegistry: '0x0987654321098765432109876543210987654321'  // Replace with actual address
      },
      '0x5': {
        streamingToken: '0x2345678901234567890123456789012345678901',
        contentRegistry: '0x1098765432109876543210987654321098765432'
      },
      '0xaa36a7': {
        streamingToken: '0x3456789012345678901234567890123456789012',
        contentRegistry: '0x2109876543210987654321098765432109876543'
      },
      '0x13881': {
        streamingToken: '0x4567890123456789012345678901234567890123',
        contentRegistry: '0x3210987654321098765432109876543210987654'
      },
      '0x89': {
        streamingToken: '0x5678901234567890123456789012345678901234',
        contentRegistry: '0x4321098765432109876543210987654321098765'
      },
      '0x539': { // Local development
        streamingToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Hardhat first deployed contract
        contentRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'  // Hardhat second deployed contract
      }
    };
  }

  /**
   * Get network name from chain ID
   */
  getNetworkName(chainId) {
    return this.NETWORKS[chainId] || 'Unknown Network';
  }

  /**
   * Get contract addresses for a specific network
   */
  getContractAddresses(chainId) {
    return this.CONTRACT_ADDRESSES[chainId] || {};
  }

  /**
   * Get block explorer URL for a specific network
   */
  getBlockExplorerUrl(chainId) {
    return this.BLOCK_EXPLORERS[chainId] || '';
  }

  /**
   * Get transaction URL on block explorer
   */
  getExplorerTxUrl(chainId, txHash) {
    const baseUrl = this.getBlockExplorerUrl(chainId);
    return baseUrl ? `${baseUrl}/tx/${txHash}` : '';
  }

  /**
   * Get address URL on block explorer
   */
  getExplorerAddressUrl(chainId, address) {
    const baseUrl = this.getBlockExplorerUrl(chainId);
    return baseUrl ? `${baseUrl}/address/${address}` : '';
  }

  /**
   * Get network information
   */
  getNetworkInfo(chainId) {
    if (!this.NETWORKS[chainId]) {
      return null;
    }

    return {
      name: this.NETWORKS[chainId],
      chainId: chainId,
      rpcUrl: this.RPC_URLS[chainId],
      blockExplorer: this.BLOCK_EXPLORERS[chainId],
      currencySymbol: chainId === '0x89' || chainId === '0x13881' ? 'MATIC' : 'ETH'
    };
  }
}

// For use in browser environment
if (typeof window !== 'undefined') {
  window.NetworkConfig = NetworkConfig;
}

// For use in Node.js environment
if (typeof module !== 'undefined') {
  module.exports = NetworkConfig;
}
