/**
 * @license
 * Web3 Crypto Streaming Service
 * Copyright (c) 2023-2025 idl3o-redx
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Beta Controller
 * Manages beta-specific functionality and feature flags
 */

const models = require('../models');
const fs = require('fs').promises;
const path = require('path');

class BetaController {
  constructor() {
    this.initialized = false;
    this.featureFlags = {};
    this.betaUsers = new Set();
    this.feedbackItems = [];
    this.version = models.version;
  }

  /**
   * Initialize the beta controller
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Load config if available
    try {
      const configData = await fs.readFile(path.join(__dirname, '../config.json'), 'utf8');
      const config = JSON.parse(configData);

      if (config.features) {
        this.featureFlags = {...config.features};
      }
    } catch (err) {
      console.warn('Could not load config for beta features, using defaults');
    }

    // Merge with model-defined beta features
    this.featureFlags = {
      ...this.featureFlags,
      ...models.betaFeatures,
    };

    console.log(`Beta controller initialized - version ${this.version}`);
    this.initialized = true;
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName Name of the feature to check
   * @param {Object} user User object for user-specific features
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(featureName, user = null) {
    // Feature doesn't exist
    if (this.featureFlags[featureName] === undefined) {
      return false;
    }

    // Simple boolean flag
    if (typeof this.featureFlags[featureName] === 'boolean') {
      return this.featureFlags[featureName];
    }

    // Complex feature flag with user targeting
    if (typeof this.featureFlags[featureName] === 'object') {
      const feature = this.featureFlags[featureName];

      // Feature is disabled entirely
      if (feature.enabled === false) {
        return false;
      }

      // Check user eligibility if user is provided
      if (user && feature.requiredUserLevel) {
        if (feature.requiredUserLevel !== 'any' &&
            feature.requiredUserLevel !== user.role) {
          return false;
        }
      }

      // Percentage rollout
      if (feature.userPercentage !== undefined && user) {
        // Create a deterministic hash based on feature name and user ID
        const hash = this.hashString(`${featureName}:${user.id}`);
        const percentage = hash % 100;

        if (percentage >= feature.userPercentage) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Register a user for the beta program
   * @param {Object} userData User data from registration
   * @returns {Object} Registration confirmation
   */
  async registerBetaUser(userData) {
    if (!userData.email) {
      throw new Error('Email is required for beta registration');
    }

    // In a real implementation, this would store to a database
    this.betaUsers.add(userData.email);

    return {
      success: true,
      message: "You've been registered for the beta program!",
      nextSteps: [
        "You'll receive a confirmation email shortly",
        "When the beta launches, you'll get an invitation with access instructions",
        "Early participants will receive exclusive token rewards"
      ]
    };
  }

  /**
   * Submit beta feedback
   * @param {Object} feedback Feedback data
   * @returns {Object} Feedback confirmation
   */
  async submitFeedback(feedback) {
    if (!feedback.content) {
      throw new Error('Feedback content is required');
    }

    const feedbackItem = {
      id: `feedback_${Date.now()}`,
      content: feedback.content,
      category: feedback.category || 'general',
      userEmail: feedback.userEmail,
      timestamp: new Date().toISOString(),
      status: 'new'
    };

    // In a real implementation, this would store to a database
    this.feedbackItems.push(feedbackItem);

    return {
      success: true,
      message: "Thank you for your feedback!",
      feedbackId: feedbackItem.id
    };
  }

  /**
   * Get beta program status and metrics
   * @returns {Object} Beta program status
   */
  getBetaStatus() {
    return {
      version: this.version,
      activeFeatures: Object.keys(this.featureFlags).filter(name =>
        typeof this.featureFlags[name] === 'boolean'
          ? this.featureFlags[name]
          : this.featureFlags[name].enabled
      ),
      upcomingFeatures: ['liveStreaming', 'mobileApps', 'advancedAnalytics'],
      registeredUsers: this.betaUsers.size,
      feedbackCount: this.feedbackItems.length,
      timeline: {
        launch: "Q2 2024",
        expansion: "Q3 2024",
        fullRelease: "Q4 2024"
      }
    };
  }

  /**
   * Simple string hash function for feature percentage rollout
   * @param {string} str String to hash
   * @returns {number} Hash value between 0-99
   * @private
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }
    return Math.abs(hash % 100);
  }
}

module.exports = new BetaController();
