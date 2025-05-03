/**
 * Contract Manager Module
 *
 * Handles smart contract interactions for the Web3 streaming platform
 */

class ContractManager {
  constructor(options = {}) {
    this.options = {
      networkId: options.networkId || '0x1', // Default to Ethereum mainnet
      streamingTokenAddress: options.streamingTokenAddress,
      contentRegistryAddress: options.contentRegistryAddress,
      walletConnector: options.walletConnector,
      onTransactionStart: options.onTransactionStart || function () {},
      onTransactionSuccess: options.onTransactionSuccess || function () {},
      onTransactionError: options.onTransactionError || function () {}
    };

    this.contracts = {};
    this.provider = null;
    this.signer = null;

    // Initialize contracts if wallet is available
    if (this.options.walletConnector &&
        this.options.walletConnector.getConnectionState().isConnected) {
      this.initContracts();
    }
  }

  /**
   * Initialize contract instances
   */
  initContracts() {
    try {
      const connectionState = this.options.walletConnector.getConnectionState();

      if (!connectionState.isConnected) {
        console.warn('Wallet not connected, using demo mode');
        return;
      }

      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      // Initialize streaming token contract
      if (this.options.streamingTokenAddress) {
        const streamingTokenAbi = [
          'function balanceOf(address account) view returns (uint256)',
          'function purchaseCredits() payable',
          'function startStream(string memory contentId)',
          'function canStream(address user, string memory contentId) view returns (bool)',
          'function totalSupply() view returns (uint256)',
          'function streamExpiry(address user, string memory contentId) view returns (uint256)'
        ];

        this.contracts.streamingToken = new ethers.Contract(
          this.options.streamingTokenAddress,
          streamingTokenAbi,
          this.signer
        );
      }

      // Initialize content registry contract if available
      if (this.options.contentRegistryAddress) {
        const contentRegistryAbi = [
          'function registerContent(string memory contentId, string memory contentUri, uint256 price) external',
          'function getContentInfo(string memory contentId) view returns (string memory, address, uint256)',
          'function listContent(uint256 limit) view returns (string[] memory)'
        ];

        this.contracts.contentRegistry = new ethers.Contract(
          this.options.contentRegistryAddress,
          contentRegistryAbi,
          this.signer
        );
      }

      console.log('Contract manager initialized');
    } catch (error) {
      console.error('Failed to initialize contracts:', error);
    }
  }

  /**
   * Get token balance for connected account
   */
  async getBalance() {
    try {
      if (this.contracts.streamingToken) {
        const address = await this.signer.getAddress();
        return await this.contracts.streamingToken.balanceOf(address);
      }
      throw new Error('Streaming token contract not initialized');
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  /**
   * Purchase streaming credits with ETH
   */
  async purchaseCredits(ethAmount) {
    try {
      if (!this.contracts.streamingToken) {
        throw new Error('Streaming token contract not initialized');
      }

      this.options.onTransactionStart({
        method: 'Purchase Credits',
        amount: ethAmount
      });

      const tx = await this.contracts.streamingToken.purchaseCredits({
        value: ethers.utils.parseEther(ethAmount)
      });

      const receipt = await tx.wait();

      this.options.onTransactionSuccess({
        method: 'Purchase Credits',
        receipt: receipt
      });

      return receipt;
    } catch (error) {
      this.options.onTransactionError({
        method: 'Purchase Credits',
        error: error
      });
      throw error;
    }
  }

  /**
   * Start streaming a content by spending tokens
   */
  async startStream(contentId) {
    try {
      if (!this.contracts.streamingToken) {
        throw new Error('Streaming token contract not initialized');
      }

      this.options.onTransactionStart({
        method: 'Start Stream',
        contentId: contentId
      });

      const tx = await this.contracts.streamingToken.startStream(contentId);
      const receipt = await tx.wait();

      this.options.onTransactionSuccess({
        method: 'Start Stream',
        receipt: receipt,
        contentId: contentId
      });

      return receipt;
    } catch (error) {
      this.options.onTransactionError({
        method: 'Start Stream',
        error: error,
        contentId: contentId
      });
      throw error;
    }
  }

  /**
   * Check if user has access to stream a content
   */
  async checkStreamAccess(contentId) {
    try {
      if (!this.contracts.streamingToken) {
        throw new Error('Streaming token contract not initialized');
      }

      const address = await this.signer.getAddress();
      return await this.contracts.streamingToken.canStream(address, contentId);
    } catch (error) {
      console.error('Error checking stream access:', error);
      throw error;
    }
  }

  /**
   * Get stream expiry time for a content
   */
  async getStreamExpiry(contentId) {
    try {
      if (!this.contracts.streamingToken) {
        throw new Error('Streaming token contract not initialized');
      }

      const address = await this.signer.getAddress();
      return await this.contracts.streamingToken.streamExpiry(address, contentId);
    } catch (error) {
      console.error('Error getting stream expiry:', error);
      throw error;
    }
  }
}

// For use in browser environment
if (typeof window !== 'undefined') {
  window.ContractManager = ContractManager;
}

// For use in Node.js environment
if (typeof module !== 'undefined') {
  module.exports = ContractManager;
}
