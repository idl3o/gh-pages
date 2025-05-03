/**
 * Wallet Connector Module - 2025 Edition
 * Handles wallet connection, account management, and network switching
 * Uses Web3Modal v3 with wagmi integration and supports EIP-6963
 */

import { ethers } from '/node_modules/ethers/dist/ethers.min.js';
import {
  getAccount,
  getNetwork,
  watchAccount,
  watchNetwork,
  switchNetwork,
  getBalance,
  readContract
} from '/node_modules/@wagmi/core/dist/index.js';
import { formatUnits } from '/node_modules/viem/dist/index.js';

class WalletConnector {
  constructor({ web3Modal, chains }) {
    this.web3Modal = web3Modal;
    this.chains = chains;
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.chainId = null;
    this.listeners = [];
    this.isConnecting = false;

    // Initialize
    this.init();
  }

  async init() {
    // Set up account change watchers
    this.unwatchAccount = watchAccount(account => {
      const prevAddress = this.account?.address;
      this.account = account;

      // Notify on connection change
      if (prevAddress !== account.address) {
        if (account.address) {
          this.onConnect(account.address);
        } else {
          this.onDisconnect();
        }
      }
    });

    // Set up network change watchers
    this.unwatchNetwork = watchNetwork(network => {
      const prevChainId = this.chainId;
      this.chainId = network.chain?.id;

      // Notify on network change
      if (prevChainId !== network.chain?.id && network.chain?.id) {
        this.onNetworkChange(network.chain);
      }
    });

    // Check if already connected
    this.syncState();
  }

  async syncState() {
    // Get current account if connected
    const account = getAccount();
    if (account.isConnected) {
      this.account = account;

      // Get current network
      const network = getNetwork();
      this.chainId = network.chain?.id;

      // Update provider and signer
      await this.updateProviderAndSigner();

      // Emit connect event
      this.onConnect(account.address);

      // Emit network change event
      if (network.chain) {
        this.onNetworkChange(network.chain);
      }
    }
  }

  async connect() {
    if (this.isConnecting) return;

    try {
      this.isConnecting = true;

      // Open modal
      await this.web3Modal.open();

      // Update state after connection
      await this.syncState();

      return this.account?.address;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    try {
      await this.web3Modal.disconnect();
      this.onDisconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  async updateProviderAndSigner() {
    if (!this.account?.address) return;

    try {
      // Get provider from Web3Modal
      const wagmiConfig = this.web3Modal.getWagmiConfig();
      const ethersProvider = new ethers.BrowserProvider(wagmiConfig.getPublicClient());
      this.provider = ethersProvider;

      // Get signer from provider
      this.signer = await ethersProvider.getSigner(this.account.address);
    } catch (error) {
      console.error('Failed to update provider/signer:', error);
      this.provider = null;
      this.signer = null;
    }
  }

  async switchToChain(chainId) {
    try {
      await switchNetwork({ chainId });
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }

  async getTokenBalance(tokenAddress) {
    if (!this.account?.address) return null;

    try {
      // ERC20 ABI for balanceOf
      const erc20ABI = [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function'
        },
        {
          constant: true,
          inputs: [],
          name: 'decimals',
          outputs: [{ name: '', type: 'uint8' }],
          type: 'function'
        }
      ];

      // Get decimals first
      const decimals = await readContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'decimals'
      });

      // Get balance
      const balance = await readContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [this.account.address]
      });

      return {
        raw: balance,
        formatted: formatUnits(balance, decimals)
      };
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return null;
    }
  }

  async getNativeBalance() {
    if (!this.account?.address) return null;

    try {
      const balance = await getBalance({
        address: this.account.address
      });

      return {
        raw: balance.value,
        formatted: formatUnits(balance.value, balance.decimals)
      };
    } catch (error) {
      console.error('Failed to get native balance:', error);
      return null;
    }
  }

  // Event handling
  onConnect(address) {
    this.notifyListeners('connect', { address });
  }

  onDisconnect() {
    this.provider = null;
    this.signer = null;
    this.notifyListeners('disconnect');
  }

  onNetworkChange(chain) {
    this.notifyListeners('networkChanged', { chain });
  }

  // Listener management
  addEventListener(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(
        listener => listener.event !== event || listener.callback !== callback
      );
    };
  }

  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
  }

  // Clean up
  destroy() {
    if (this.unwatchAccount) {
      this.unwatchAccount();
    }

    if (this.unwatchNetwork) {
      this.unwatchNetwork();
    }

    this.listeners = [];
  }

  // Status getters
  getAccount() {
    return this.account;
  }

  getChainId() {
    return this.chainId;
  }

  getSigner() {
    return this.signer;
  }

  getProvider() {
    return this.provider;
  }

  isConnected() {
    return Boolean(this.account?.address);
  }

  // Returns chain info for the current connection
  getCurrentChain() {
    if (!this.chainId) return null;
    return this.chains.find(chain => chain.id === this.chainId);
  }
}

export default WalletConnector;
