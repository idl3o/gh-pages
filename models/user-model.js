/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * User Model
 * Handles user data and interactions for creators and viewers
 */

const EventEmitter = require('events');

class UserModel extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.sessions = new Map();
  }

  /**
   * Create or update a user
   * @param {Object} userData User information
   * @returns {Object} Created/updated user
   */
  async createOrUpdateUser(userData) {
    // Validate required fields
    if (!userData.walletAddress) {
      throw new Error('Wallet address is required');
    }

    const existingUser = this.users.get(userData.walletAddress);
    const updatedUser = {
      ...existingUser,
      ...userData,
      updatedAt: new Date().toISOString()
    };

    if (!existingUser) {
      updatedUser.createdAt = updatedUser.updatedAt;
      updatedUser.role = userData.role || 'viewer';
      updatedUser.id = `user_${Date.now()}`;
    }

    this.users.set(userData.walletAddress, updatedUser);
    this.emit('user:updated', updatedUser);

    return updatedUser;
  }

  /**
   * Get user by wallet address
   * @param {string} walletAddress Blockchain wallet address
   * @returns {Object|null} User or null if not found
   */
  getUserByWallet(walletAddress) {
    return this.users.get(walletAddress) || null;
  }

  /**
   * Create authentication session
   * @param {string} walletAddress User's wallet address
   * @returns {string} Session token
   */
  createSession(walletAddress) {
    const user = this.getUserByWallet(walletAddress);
    if (!user) {
      throw new Error('User not found');
    }

    const token = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    this.sessions.set(token, {
      walletAddress,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

    return token;
  }

  /**
   * Validate a session token
   * @param {string} token Session token
   * @returns {Object|null} User or null if invalid session
   */
  validateSession(token) {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    return this.getUserByWallet(session.walletAddress);
  }
}

module.exports = new UserModel();
