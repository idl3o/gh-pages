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
