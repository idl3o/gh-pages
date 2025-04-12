/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Payment Controller
 * Handles payment processing and operations
 */

const PaymentModel = require('../models/payment-model');
const UserModel = require('../models/user-model');
const BetaController = require('./beta-controller');

class PaymentController {
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

    console.log('Payment controller initialized');
    this.initialized = true;
  }

  /**
   * Create a payment request
   * @param {Object} paymentData Payment data
   * @param {string} authToken Authentication token
   * @returns {Object} Response with payment data
   */
  async createPayment(paymentData, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Check if token staking feature is enabled for this user
      if (!BetaController.isFeatureEnabled('tokenStaking', user)) {
        return {
          success: false,
          error: 'Token staking feature not available for your account'
        };
      }

      // Set sender address from authenticated user
      const paymentWithSender = {
        ...paymentData,
        senderAddress: user.walletAddress
      };

      // Create payment request
      const payment = await PaymentModel.createPaymentRequest(paymentWithSender);

      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          recipientAddress: payment.recipientAddress,
          status: payment.status,
          expiresAt: payment.expiresAt
        }
      };
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId Payment ID
   * @param {string} authToken Authentication token
   * @returns {Object} Response with payment data
   */
  async getPaymentById(paymentId, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      const payment = PaymentModel.getPaymentById(paymentId);

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      // Check if user is authorized to view this payment
      if (payment.senderAddress !== user.walletAddress &&
          payment.recipientAddress !== user.walletAddress) {
        return {
          success: false,
          error: 'Unauthorized access to payment'
        };
      }

      return {
        success: true,
        payment
      };
    } catch (error) {
      console.error('Get payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process a payment with transaction data
   * @param {string} paymentId Payment ID
   * @param {Object} transactionData Transaction data
   * @param {string} authToken Authentication token
   * @returns {Object} Response with updated payment
   */
  async processPayment(paymentId, transactionData, authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      const payment = PaymentModel.getPaymentById(paymentId);

      if (!payment) {
        return {
          success: false,
          error: 'Payment not found'
        };
      }

      // Only the sender can process a payment
      if (payment.senderAddress !== user.walletAddress) {
        return {
          success: false,
          error: 'Only the sender can process this payment'
        };
      }

      // Process the payment with transaction data
      const updatedPayment = await PaymentModel.processPayment(paymentId, {
        ...transactionData,
        senderAddress: user.walletAddress
      });

      return {
        success: true,
        payment: updatedPayment
      };
    } catch (error) {
      console.error('Process payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user payments history
   * @param {string} authToken Authentication token
   * @returns {Object} Response with payments data
   */
  async getUserPayments(authToken) {
    try {
      // Validate session
      const user = UserModel.validateSession(authToken);
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      // Get payments where user is sender
      const sentPayments = PaymentModel.getPaymentsByWallet(user.walletAddress, 'sender');

      // Get payments where user is recipient
      const receivedPayments = PaymentModel.getPaymentsByWallet(user.walletAddress, 'recipient');

      return {
        success: true,
        payments: {
          sent: sentPayments,
          received: receivedPayments
        }
      };
    } catch (error) {
      console.error('Get user payments error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PaymentController();
