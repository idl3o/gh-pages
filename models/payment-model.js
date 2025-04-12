/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Payment Model
 * Handles cryptocurrency payment processing and tracking
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class PaymentModel extends EventEmitter {
  constructor() {
    super();
    this.payments = new Map();
    this.transactions = new Map();
  }

  /**
   * Create a new payment request
   * @param {Object} paymentData Payment information
   * @returns {Object} Created payment request
   */
  async createPaymentRequest(paymentData) {
    if (!paymentData.amount || !paymentData.currency || !paymentData.recipientAddress) {
      throw new Error('Amount, currency and recipient address are required');
    }

    const paymentId = `payment_${crypto.randomBytes(8).toString('hex')}`;

    const payment = {
      id: paymentId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      recipientAddress: paymentData.recipientAddress,
      senderAddress: paymentData.senderAddress || null,
      description: paymentData.description || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
      metadata: paymentData.metadata || {}
    };

    this.payments.set(paymentId, payment);
    this.emit('payment:created', payment);

    return payment;
  }

  /**
   * Get payment by ID
   * @param {string} paymentId Payment ID
   * @returns {Object|null} Payment or null if not found
   */
  getPaymentById(paymentId) {
    return this.payments.get(paymentId) || null;
  }

  /**
   * Process a payment
   * @param {string} paymentId Payment ID
   * @param {Object} transactionData Transaction information
   * @returns {Object} Updated payment
   */
  async processPayment(paymentId, transactionData) {
    const payment = this.getPaymentById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'pending') {
      throw new Error(`Payment cannot be processed: current status is ${payment.status}`);
    }

    const transactionId = transactionData.transactionId ||
      `tx_${crypto.randomBytes(8).toString('hex')}`;

    const transaction = {
      id: transactionId,
      paymentId,
      senderAddress: transactionData.senderAddress,
      amount: transactionData.amount,
      fee: transactionData.fee || 0,
      blockNumber: transactionData.blockNumber,
      timestamp: transactionData.timestamp || new Date().toISOString(),
      confirmations: transactionData.confirmations || 0,
      status: transactionData.status || 'pending'
    };

    // Update payment status based on transaction status
    if (transaction.status === 'confirmed' && transaction.confirmations >= 1) {
      payment.status = 'completed';
      payment.completedAt = new Date().toISOString();
    } else if (transaction.status === 'failed') {
      payment.status = 'failed';
    } else {
      payment.status = 'processing';
    }

    payment.transactionId = transactionId;
    payment.updatedAt = new Date().toISOString();

    this.payments.set(paymentId, payment);
    this.transactions.set(transactionId, transaction);

    this.emit('payment:updated', payment);
    this.emit('transaction:recorded', transaction);

    return payment;
  }

  /**
   * Get all payments for a wallet address
   * @param {string} walletAddress Wallet address
   * @param {string} role 'sender' or 'recipient'
   * @returns {Array} Array of payments
   */
  getPaymentsByWallet(walletAddress, role = 'recipient') {
    const results = [];

    this.payments.forEach(payment => {
      if (role === 'recipient' && payment.recipientAddress === walletAddress) {
        results.push(payment);
      } else if (role === 'sender' && payment.senderAddress === walletAddress) {
        results.push(payment);
      }
    });

    return results;
  }
}

module.exports = new PaymentModel();
