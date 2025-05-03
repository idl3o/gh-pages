/**
 * Stream Payment Module - 2025 Edition
 * Handles payment channels, token transfers, and streaming micropayments
 * Supports Ethereum, Polygon, Optimism, Arbitrum, and Base Layer 2 solutions
 */

import { ethers } from '/node_modules/ethers/dist/ethers.min.js';
import {
  prepareWriteContract,
  writeContract,
  waitForTransaction,
  readContract
} from '/node_modules/@wagmi/core/dist/index.js';
import { formatUnits, parseUnits } from '/node_modules/viem/dist/index.js';

// Modern payment channel implementation with state channels
class StreamPayment {
  constructor({ signer, walletConnector }) {
    this.signer = signer;
    this.walletConnector = walletConnector;
    this.paymentChannel = null;
    this.streamToken = null;
    this.listeners = [];
    this.intervalId = null;
    this.lastCommitTime = 0;
    this.streamRate = 0.00001; // STRM tokens per second
    this.autoCommit = false;
    this.autoCommitDuration = 60; // seconds
    this.offchainSignatures = [];
  }

  // Initialize with contract addresses
  async init({ streamTokenAddress, paymentChannelAddress }) {
    this.streamTokenAddress = streamTokenAddress;
    this.paymentChannelAddress = paymentChannelAddress;

    // ABIs for the contracts
    const tokenABI = [
      // ERC20 standard functions
      'function approve(address spender, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function decimals() view returns (uint8)',
      // Events
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)'
    ];

    const paymentChannelABI = [
      // Payment channel functions
      'function openChannel(address receiver, uint256 amount) returns (uint256 channelId)',
      'function closeChannel(uint256 channelId) returns (bool)',
      'function commit(uint256 channelId, uint256 amount, bytes signature) returns (bool)',
      'function commitBatch(uint256[] channelIds, uint256[] amounts, bytes[] signatures) returns (bool)',
      'function getChannel(uint256 channelId) view returns (address sender, address receiver, uint256 deposit, uint256 spent, uint256 createdAt, uint256 expiresAt, uint8 status)',
      'function getUserChannels(address user) view returns (uint256[])',
      // Events
      'event ChannelOpened(uint256 indexed channelId, address indexed sender, address indexed receiver, uint256 deposit)',
      'event ChannelClosed(uint256 indexed channelId, address indexed sender, address indexed receiver, uint256 finalAmount)',
      'event PaymentCommitted(uint256 indexed channelId, uint256 amount, uint256 totalSpent)'
    ];

    try {
      if (this.walletConnector && this.walletConnector.isConnected()) {
        this.signer = this.walletConnector.getSigner();

        if (this.signer) {
          // Connect to contracts
          const provider = await this.signer.provider;
          this.streamToken = new ethers.Contract(streamTokenAddress, tokenABI, provider);
          this.paymentChannel = new ethers.Contract(
            paymentChannelAddress,
            paymentChannelABI,
            provider
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize Stream Payment:', error);
      return false;
    }
  }

  // Connect to contracts when signer changes
  async updateSigner(signer) {
    if (!signer || !this.streamTokenAddress || !this.paymentChannelAddress) return;

    try {
      this.signer = signer;
      await this.init({
        streamTokenAddress: this.streamTokenAddress,
        paymentChannelAddress: this.paymentChannelAddress
      });
    } catch (error) {
      console.error('Failed to update signer:', error);
    }
  }

  // Get token balance
  async getTokenBalance() {
    try {
      if (!this.walletConnector || !this.walletConnector.isConnected()) {
        return null;
      }

      return await this.walletConnector.getTokenBalance(this.streamTokenAddress);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return null;
    }
  }

  // Purchase tokens with ETH using a DEX swap
  async purchaseTokens(ethAmount) {
    if (!this.signer) throw new Error('No signer available');

    // DEX Router ABI (simplified for demonstration)
    const dexRouterABI = [
      'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)'
    ];

    try {
      // Get addresses for router and WETH
      const routerAddress = '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57'; // Example: Uniswap v3 Router
      const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH

      // Create router contract instance
      const router = new ethers.Contract(routerAddress, dexRouterABI, this.signer);

      // Prepare swap parameters
      const path = [wethAddress, this.streamTokenAddress];
      const to = await this.signer.getAddress();
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const amountOutMin = 0; // Not using slippage protection here for simplicity

      // Convert ETH amount to wei
      const weiAmount = parseUnits(ethAmount.toString(), 18);

      // Calculate token amount estimate based on current price and display to user
      const expectedTokenAmount = weiAmount * 1000n; // Simplified example rate (1 ETH = 1000 STRM)

      // Notify about pending transaction
      this.notifyListeners('purchaseStarted', {
        ethAmount,
        expectedTokens: formatUnits(expectedTokenAmount, 18)
      });

      // Execute swap
      const tx = await router.swapExactETHForTokens(amountOutMin, path, to, deadline, {
        value: weiAmount
      });

      // Wait for transaction
      const receipt = await tx.wait();

      // Notify listeners
      this.notifyListeners('purchaseCompleted', {
        txHash: receipt.hash,
        ethAmount,
        success: receipt.status === 1
      });

      return {
        success: receipt.status === 1,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to purchase tokens:', error);

      this.notifyListeners('purchaseFailed', {
        error: error.message
      });

      throw error;
    }
  }

  // Open a payment channel for streaming
  async openChannel(receiverAddress, amount) {
    if (!this.signer || !this.streamToken || !this.paymentChannel) {
      throw new Error('Payment system not initialized');
    }

    try {
      // Convert amount to token units
      const decimals = await this.streamToken.decimals();
      const tokenAmount = parseUnits(amount.toString(), decimals);

      // Check allowance
      const userAddress = await this.signer.getAddress();
      const allowance = await this.streamToken.allowance(userAddress, this.paymentChannelAddress);

      // Approve tokens if needed
      if (allowance < tokenAmount) {
        this.notifyListeners('approvingTokens', { amount });

        const approveTx = await this.streamToken
          .connect(this.signer)
          .approve(this.paymentChannelAddress, tokenAmount);
        await approveTx.wait();
      }

      // Open channel
      this.notifyListeners('openingChannel', { receiver: receiverAddress, amount });

      const tx = await this.paymentChannel
        .connect(this.signer)
        .openChannel(receiverAddress, tokenAmount);

      const receipt = await tx.wait();

      // Find channel ID from event
      let channelId;
      if (receipt.status === 1) {
        const event = receipt.events.find(e => e.event === 'ChannelOpened');
        if (event && event.args) {
          channelId = event.args.channelId;
        }
      }

      this.notifyListeners('channelOpened', {
        channelId,
        receiver: receiverAddress,
        amount,
        success: receipt.status === 1
      });

      return {
        success: receipt.status === 1,
        channelId,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to open payment channel:', error);

      this.notifyListeners('channelOpenFailed', {
        error: error.message
      });

      throw error;
    }
  }

  // Close an open payment channel
  async closeChannel(channelId) {
    if (!this.signer || !this.paymentChannel) {
      throw new Error('Payment system not initialized');
    }

    try {
      // Submit the latest off-chain payment first
      await this._commitLatestPayment(channelId);

      this.notifyListeners('closingChannel', { channelId });

      const tx = await this.paymentChannel.connect(this.signer).closeChannel(channelId);
      const receipt = await tx.wait();

      this.notifyListeners('channelClosed', {
        channelId,
        success: receipt.status === 1
      });

      // Clear auto-commit interval if this was the active channel
      if (this.autoCommit && this.activeChannelId === channelId) {
        this._stopAutoCommit();
      }

      return {
        success: receipt.status === 1,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to close payment channel:', error);

      this.notifyListeners('channelCloseFailed', {
        channelId,
        error: error.message
      });

      throw error;
    }
  }

  // Start streaming payments
  async startStream(channelId, receiverAddress) {
    try {
      // Check if channel exists and is valid
      const channel = await this.getChannel(channelId);
      if (!channel || channel.status !== 1) {
        // 1 = Active
        throw new Error('Invalid or inactive payment channel');
      }

      this.activeChannelId = channelId;
      this.activeReceiver = receiverAddress;
      this.streamStartTime = Date.now() / 1000;
      this.lastCommitTime = this.streamStartTime;
      this.spentAmount = 0;

      // Start auto-commit if enabled
      if (this.autoCommit) {
        this._startAutoCommit();
      }

      this.notifyListeners('streamStarted', {
        channelId,
        receiver: receiverAddress,
        startTime: this.streamStartTime
      });

      return true;
    } catch (error) {
      console.error('Failed to start streaming:', error);

      this.notifyListeners('streamStartFailed', {
        error: error.message
      });

      return false;
    }
  }

  // Stop streaming payments
  async stopStream() {
    try {
      if (!this.activeChannelId) {
        throw new Error('No active stream to stop');
      }

      // Make a final payment commitment
      await this._commitPayment();

      // Clear streaming state
      const channelId = this.activeChannelId;
      this.activeChannelId = null;
      this.activeReceiver = null;

      // Stop auto-commit
      if (this.autoCommit) {
        this._stopAutoCommit();
      }

      this.notifyListeners('streamStopped', {
        channelId,
        totalSpent: this.spentAmount
      });

      return true;
    } catch (error) {
      console.error('Failed to stop streaming:', error);

      this.notifyListeners('streamStopFailed', {
        error: error.message
      });

      return false;
    }
  }

  // Commit a payment to the channel
  async _commitPayment() {
    if (!this.activeChannelId || !this.signer) return false;

    try {
      const now = Date.now() / 1000;
      const elapsedTime = now - this.lastCommitTime;
      const tokenAmount = elapsedTime * this.streamRate;

      if (tokenAmount <= 0) return false;

      // Add to spent amount
      this.spentAmount += tokenAmount;

      // Get token decimals
      const decimals = await this.streamToken.decimals();

      // Convert to token units
      const amountInTokenUnits = parseUnits(this.spentAmount.toFixed(6), decimals);

      // Create off-chain payment message
      const channelId = ethers.toBigInt(this.activeChannelId);
      const message = ethers.concat([
        ethers.zeroPadValue(ethers.toBeArray(channelId), 32),
        ethers.zeroPadValue(ethers.toBeArray(amountInTokenUnits), 32)
      ]);

      // Sign the payment message off-chain
      const messageHash = ethers.keccak256(message);
      const signature = await this.signer.signMessage(ethers.getBytes(messageHash));

      // Store the signature for later use
      this.offchainSignatures.push({
        channelId: this.activeChannelId,
        amount: amountInTokenUnits,
        signature
      });

      // Update last commit time
      this.lastCommitTime = now;

      this.notifyListeners('paymentSigned', {
        channelId: this.activeChannelId,
        amount: tokenAmount,
        totalSpent: this.spentAmount
      });

      return true;
    } catch (error) {
      console.error('Failed to sign off-chain payment:', error);
      return false;
    }
  }

  // Commit the latest payment on-chain
  async _commitLatestPayment(channelId) {
    // Find the latest signature for this channel
    const paymentInfo = this.offchainSignatures
      .filter(p => p.channelId === channelId)
      .sort((a, b) => b.amount - a.amount)[0];

    if (!paymentInfo) return false;

    try {
      const tx = await this.paymentChannel
        .connect(this.signer)
        .commit(paymentInfo.channelId, paymentInfo.amount, paymentInfo.signature);

      const receipt = await tx.wait();

      this.notifyListeners('paymentCommitted', {
        channelId,
        success: receipt.status === 1
      });

      return receipt.status === 1;
    } catch (error) {
      console.error('Failed to commit payment on-chain:', error);
      return false;
    }
  }

  // Get channel information
  async getChannel(channelId) {
    if (!this.paymentChannel) return null;

    try {
      const channel = await this.paymentChannel.getChannel(channelId);
      return {
        id: channelId,
        sender: channel[0],
        receiver: channel[1],
        deposit: channel[2],
        spent: channel[3],
        createdAt: Number(channel[4]),
        expiresAt: Number(channel[5]),
        status: Number(channel[6]) // 0: Pending, 1: Active, 2: Closed
      };
    } catch (error) {
      console.error('Failed to get channel:', error);
      return null;
    }
  }

  // Get all channels for the current user
  async getUserChannels() {
    if (!this.paymentChannel || !this.signer) return [];

    try {
      const address = await this.signer.getAddress();
      const channelIds = await this.paymentChannel.getUserChannels(address);

      const channels = [];
      for (const id of channelIds) {
        const channel = await this.getChannel(id);
        if (channel) {
          channels.push(channel);
        }
      }

      return channels;
    } catch (error) {
      console.error('Failed to get user channels:', error);
      return [];
    }
  }

  // Configure auto-commit
  setAutoCommit(enabled, duration = 60) {
    this.autoCommit = enabled;
    this.autoCommitDuration = duration;

    if (enabled && this.activeChannelId) {
      this._startAutoCommit();
    } else {
      this._stopAutoCommit();
    }

    this.notifyListeners('autoCommitChanged', {
      enabled,
      duration
    });
  }

  // Start auto-commit interval
  _startAutoCommit() {
    this._stopAutoCommit();

    this.intervalId = setInterval(async () => {
      if (this.activeChannelId) {
        await this._commitPayment();
      }
    }, this.autoCommitDuration * 1000);
  }

  // Stop auto-commit interval
  _stopAutoCommit() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Get streaming status
  getStreamStatus() {
    if (!this.activeChannelId) {
      return { active: false };
    }

    const now = Date.now() / 1000;
    const elapsedTime = now - this.streamStartTime;
    const currentSpent = this.spentAmount + (now - this.lastCommitTime) * this.streamRate;

    return {
      active: true,
      channelId: this.activeChannelId,
      receiver: this.activeReceiver,
      startTime: this.streamStartTime,
      elapsedTime,
      totalSpent: currentSpent
    };
  }

  // Set stream rate (tokens per second)
  setStreamRate(rate) {
    this.streamRate = rate;
  }

  // Event listeners
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
    this._stopAutoCommit();
    this.listeners = [];
  }
}

export default StreamPayment;
