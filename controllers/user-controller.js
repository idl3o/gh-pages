/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * User Controller
 * Handles user authentication and profile management
 */

const UserModel = require('../models/user-model');
const BetaController = require('./beta-controller');

class UserController {
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

    console.log('User controller initialized');
    this.initialized = true;
  }

  /**
   * Register a new user
   * @param {Object} userData User registration data
   * @returns {Object} Registration result
   */
  async register(userData) {
    try {
      // Validate data
      if (!userData.walletAddress) {
        return {
          success: false,
          error: 'Wallet address is required'
        };
      }

      // Create user
      const user = await UserModel.createOrUpdateUser(userData);

      // Create auth session
      const token = UserModel.createSession(user.walletAddress);

      // Check if user qualifies for beta
      let betaEligible = false;
      if (userData.betaSignup) {
        try {
          await BetaController.registerBetaUser({
            email: userData.email,
            walletAddress: userData.walletAddress,
            role: userData.role || 'viewer'
          });
          betaEligible = true;
        } catch (betaErr) {
          console.error('Failed to register for beta:', betaErr);
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          name: user.name,
          role: user.role,
          betaAccess: betaEligible
        },
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Authenticate user with wallet
   * @param {Object} authData Authentication data
   * @returns {Object} Authentication result
   */
  async authenticateWallet(authData) {
    try {
      const { walletAddress, signature } = authData;

      if (!walletAddress || !signature) {
        return {
          success: false,
          error: 'Wallet address and signature are required'
        };
      }

      // In a real implementation, this would verify the signature
      // For beta, we'll just check if the user exists

      let user = UserModel.getUserByWallet(walletAddress);

      // Auto-create user if not exists
      if (!user) {
        user = await UserModel.createOrUpdateUser({
          walletAddress,
          role: 'viewer'
        });
      }

      // Create auth session
      const token = UserModel.createSession(walletAddress);

      // Check if this user has beta access
      const hasBetaAccess = BetaController.betaUsers.has(user.email);

      return {
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          name: user.name,
          role: user.role,
          betaAccess: hasBetaAccess
        },
        token
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user profile
   * @param {string} userId User ID
   * @param {string} authToken Authentication token
   * @returns {Object} User profile data
   */
  async getProfile(userId, authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Only allow users to access their own profiles for now
      // Admin role could be added in the future
      if (currentUser.id !== userId) {
        return {
          success: false,
          error: 'Unauthorized access to profile'
        };
      }

      // Get enabled features for this user
      const enabledFeatures = {};
      const potentialFeatures = [
        'creatorAnalytics',
        'tokenStaking',
        'viewerRewards',
        'liveStreaming'
      ];

      potentialFeatures.forEach(feature => {
        enabledFeatures[feature] = BetaController.isFeatureEnabled(feature, currentUser);
      });

      return {
        success: true,
        profile: {
          id: currentUser.id,
          walletAddress: currentUser.walletAddress,
          name: currentUser.name,
          email: currentUser.email,
          bio: currentUser.bio,
          role: currentUser.role,
          createdAt: currentUser.createdAt,
          enabledFeatures
        }
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user profile
   * @param {string} userId User ID
   * @param {Object} profileData Profile data to update
   * @param {string} authToken Authentication token
   * @returns {Object} Update result
   */
  async updateProfile(userId, profileData, authToken) {
    try {
      // Validate session
      const currentUser = UserModel.validateSession(authToken);
      if (!currentUser) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Only allow users to update their own profiles
      if (currentUser.id !== userId) {
        return {
          success: false,
          error: 'Unauthorized profile update'
        };
      }

      // Prevent changing wallet address
      if (profileData.walletAddress && profileData.walletAddress !== currentUser.walletAddress) {
        return {
          success: false,
          error: 'Wallet address cannot be changed'
        };
      }

      // Update user
      const updatedUser = await UserModel.createOrUpdateUser({
        ...currentUser,
        ...profileData,
        walletAddress: currentUser.walletAddress // Ensure this doesn't change
      });

      return {
        success: true,
        profile: {
          id: updatedUser.id,
          walletAddress: updatedUser.walletAddress,
          name: updatedUser.name,
          email: updatedUser.email,
          bio: updatedUser.bio,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new UserController();
