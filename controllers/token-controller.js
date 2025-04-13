/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Token Controller
 * Handles token generation, transfers, and token-related operations
 */

const TokenModel = require('../models/token-model');
const UserModel = require('../models/user-model');
const TokenGeneratorService = require('../services/token-generator-service');

class TokenController {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the controller
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Initialize dependencies
    await TokenGeneratorService.initialize();

    // Set up event listeners
    TokenGeneratorService.on('token:generated', this.handleTokenGenerated.bind(this));
    TokenGeneratorService.on('token:confirmed', this.handleTokenConfirmed.bind(this));

    console.log('Token controller initialized');
    this.initialized = true;
  }

  /**
   * Handle token generation events
   * @private
   * @param {Object} token Generated token
   */
  async handleTokenGenerated(token) {
    console.log(`Token ${token.id} generated for ${token.recipientAddress}`);
    // Any additional processing can be done here
  }

  /**
   * Handle token confirmation events
   * @private
   * @param {Object} token Confirmed token
   */
  async handleTokenConfirmed(token) {
    console.log(`Token ${token.id} confirmed on blockchain: ${token.txHash}`);
    
    // Add tokens to user's balance
    try {
      await TokenModel.addTokens(
        token.recipientAddress,
        token.amount,
        'generation',
        token.id
      );
    } catch (error) {
      console.error('Error adding tokens to balance:', error);
    }
  }

  /**
   * Generate tokens for a user
   * @param {Object} tokenRequest Token request
   * @param {string} authToken Authentication token
   * @returns {Object} Response with token data
   */
  async generateTokens(tokenRequest, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Unauthorized'
        };
      }

      // Validate token request
      if (!tokenRequest.recipientAddress || !tokenRequest.amount) {
        return {
          success: false,
          error: 'Recipient address and amount are required'
        };
      }

      // Check if admin for token generation
      if (!user.isAdmin && user.walletAddress !== tokenRequest.recipientAddress) {
        return {
          success: false,
          error: 'You can only generate tokens for your own wallet unless you are an admin'
        };
      }

      // Generate tokens
      const token = await TokenGeneratorService.generateTokens({
        recipientAddress: tokenRequest.recipientAddress,
        amount: tokenRequest.amount,
        reason: tokenRequest.reason || 'admin_generation',
        metadata: {
          generatedBy: user.walletAddress,
          ...tokenRequest.metadata
        }
      });

      return {
        success: true,
        token
      };
    } catch (error) {
      console.error('Error generating tokens:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate tokens'
      };
    }
  }

  /**
   * Award tokens for user activity
   * @param {string} walletAddress User wallet address
   * @param {string} activityType Activity type
   * @param {Object} activityData Activity data
   * @param {string} authToken Authentication token
   * @returns {Object} Response with token data
   */
  async awardActivityTokens(walletAddress, activityType, activityData, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Unauthorized'
        };
      }

      // Only admins or the activity system can award tokens
      const isSystem = authToken === process.env.SYSTEM_AUTH_TOKEN;
      if (!user.isAdmin && !isSystem && user.walletAddress !== walletAddress) {
        return {
          success: false,
          error: 'Unauthorized to award tokens'
        };
      }

      // Generate activity reward
      const token = await TokenGeneratorService.generateActivityReward(
        walletAddress,
        activityType,
        activityData
      );

      return {
        success: true,
        token
      };
    } catch (error) {
      console.error('Error awarding activity tokens:', error);
      return {
        success: false,
        error: error.message || 'Failed to award tokens'
      };
    }
  }

  /**
   * Transfer tokens between users
   * @param {Object} transferRequest Transfer request
   * @param {string} authToken Authentication token
   * @returns {Object} Response with transfer data
   */
  async transferTokens(transferRequest, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Unauthorized'
        };
      }

      // Validate transfer request
      if (!transferRequest.toAddress || !transferRequest.amount) {
        return {
          success: false,
          error: 'Recipient address and amount are required'
        };
      }

      // Ensure user is sending from their own wallet
      if (user.walletAddress !== transferRequest.fromAddress && !user.isAdmin) {
        return {
          success: false,
          error: 'You can only transfer tokens from your own wallet'
        };
      }

      // Execute the transfer
      const transfer = await TokenModel.transferTokens(
        transferRequest.fromAddress,
        transferRequest.toAddress,
        transferRequest.amount,
        transferRequest.reason || 'user_transfer'
      );

      return {
        success: true,
        transfer
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      return {
        success: false,
        error: error.message || 'Failed to transfer tokens'
      };
    }
  }

  /**
   * Get token balance for a wallet
   * @param {string} walletAddress Wallet address
   * @param {string} authToken Authentication token
   * @returns {Object} Response with balance data
   */
  async getTokenBalance(walletAddress, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Unauthorized'
        };
      }

      // Users can only check their own balance unless admin
      if (user.walletAddress !== walletAddress && !user.isAdmin) {
        return {
          success: false,
          error: 'You can only check your own token balance'
        };
      }

      // Get wallet balance
      const balance = TokenModel.getWalletBalance(walletAddress);

      return {
        success: true,
        walletAddress,
        balance
      };
    } catch (error) {
      console.error('Error getting token balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token balance'
      };
    }
  }

  /**
   * Get token transaction history
   * @param {string} walletAddress Wallet address
   * @param {string} authToken Authentication token
   * @returns {Object} Response with transaction history
   */
  async getTokenHistory(walletAddress, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Unauthorized'
        };
      }

      // Users can only check their own history unless admin
      if (user.walletAddress !== walletAddress && !user.isAdmin) {
        return {
          success: false,
          error: 'You can only view your own token history'
        };
      }

      // Get transaction history
      const transactions = TokenModel.getTransactionHistory(walletAddress);
      const generationHistory = TokenGeneratorService.getTokenHistory(walletAddress);

      return {
        success: true,
        walletAddress,
        transactions,
        generations: generationHistory
      };
    } catch (error) {
      console.error('Error getting token history:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token history'
      };
    }
  }

  /**
   * Generate token receipt and store on IPFS
   * @param {string} tokenId Token ID
   * @param {string} authToken Authentication token
   * @returns {Object} Response with receipt data
   */
  async generateTokenReceipt(tokenId, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Unauthorized'
        };
      }

      // Get token details
      const token = TokenGeneratorService.getTokenById(tokenId);
      if (!token) {
        return {
          success: false,
          error: 'Token not found'
        };
      }

      // Check if user has rights to generate receipt
      if (user.walletAddress !== token.recipientAddress && !user.isAdmin) {
        return {
          success: false,
          error: 'You can only generate receipts for your own tokens'
        };
      }

      // Generate receipt
      const receipt = await TokenGeneratorService.generateTokenReceipt(tokenId);

      return {
        success: true,
        receipt
      };
    } catch (error) {
      console.error('Error generating token receipt:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate token receipt'
      };
    }
  }
}

module.exports = new TokenController();