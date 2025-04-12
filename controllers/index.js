/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Controllers Index
 * Entry point for all controllers in the Web3 Streaming Service
 * @module controllers
 */

const UserController = require('./user-controller');
const ContentController = require('./content-controller');
const PaymentController = require('./payment-controller');
const BetaController = require('./beta-controller');
const InsightsController = require('./insights-controller');

// Initialize controllers
UserController.initialize();
ContentController.initialize();
PaymentController.initialize();
BetaController.initialize();
InsightsController.initialize();

module.exports = {
  UserController,
  ContentController,
  PaymentController,
  BetaController,
  InsightsController
};
