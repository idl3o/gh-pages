/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Models Index
 * Entry point for all data models in the Web3 Streaming Service
 * @module models
 */

const UserModel = require('./user-model');
const ContentModel = require('./content-model');
const PaymentModel = require('./payment-model');
const StreamModel = require('./stream-model');
const InsightsModel = require('./insights-model');

module.exports = {
  UserModel,
  ContentModel,
  PaymentModel,
  StreamModel,
  InsightsModel,

  // Beta version metadata
  version: '0.9.0-beta.1',
  betaFeatures: {
    creatorAnalytics: true,
    tokenStaking: true,
    viewerRewards: true,
    futureInsights: true,
    liveStreaming: false  // Coming in next beta version
  }
};
