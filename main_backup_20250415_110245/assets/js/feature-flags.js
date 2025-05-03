/**
 * Feature Flag System for Web3 Crypto Streaming Service
 * 
 * This module manages feature availability during beta deployment,
 * allowing for controlled feature rollout and A/B testing.
 */

class FeatureFlags {
  constructor() {
    this.flags = {};
    this.user = null;
    this.initialized = false;
    this.environment = this._detectEnvironment();
  }
  
  /**
   * Initialize the feature flags system
   * @param {Object} user Current user information if available
   * @returns {Promise} Resolves when flags are loaded and ready
   */
  async initialize(user = null) {
    if (this.initialized) return;
    
    this.user = user;
    
    try {
      // In production, fetch from API
      if (this.environment === 'production') {
        const response = await fetch('/api/feature-flags');
        this.flags = await response.json();
      } 
      // In staging, use remote config but with higher refresh rate
      else if (this.environment === 'staging') {
        const response = await fetch('/api/feature-flags?environment=staging');
        this.flags = await response.json();
      }
      // In development, use local config
      else {
        this.flags = this._getDefaultFlags();
      }
      
      // Apply user segment overrides
      this._applyUserOverrides();
      
      this.initialized = true;
      console.log('Feature flags initialized:', this.flags);
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
      // Fallback to default flags
      this.flags = this._getDefaultFlags();
      this.initialized = true;
    }
  }
  
  /**
   * Check if a feature is enabled
   * @param {string} featureKey The feature identifier
   * @returns {boolean} Whether the feature is enabled
   */
  isEnabled(featureKey) {
    if (!this.initialized) {
      console.warn('Feature flags accessed before initialization');
      return false;
    }
    
    if (!this.flags[featureKey]) {
      return false;
    }
    
    const feature = this.flags[featureKey];
    
    // Check if feature is globally enabled
    if (!feature.enabled) {
      return false;
    }
    
    // Check user level requirements
    if (feature.requiredUserLevel && this.user) {
      if (feature.requiredUserLevel !== 'any' && 
          this.user.level !== feature.requiredUserLevel) {
        return false;
      }
    }
    
    // Check percentage rollout (deterministic based on user ID)
    if (feature.userPercentage < 100 && this.user && this.user.id) {
      // Generate a hash from the user ID and feature key
      const hash = this._hashCode(`${this.user.id}-${featureKey}`);
      const normalizedHash = hash % 100;
      return normalizedHash < feature.userPercentage;
    }
    
    return true;
  }
  
  /**
   * Get environment from hostname or override
   * @returns {string} Environment name (development, staging, production)
   * @private
   */
  _detectEnvironment() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging') || hostname.includes('beta')) {
      return 'staging';
    } else {
      return 'production';
    }
  }
  
  /**
   * Apply any user-specific overrides to features
   * @private
   */
  _applyUserOverrides() {
    // Early access program enrollments
    if (this.user && this.user.earlyAccess) {
      Object.keys(this.flags).forEach(key => {
        if (this.user.earlyAccess.includes(key)) {
          this.flags[key].userPercentage = 100;
        }
      });
    }
    
    // Beta tester overrides
    if (this.user && this.user.isBetaTester) {
      Object.keys(this.flags).forEach(key => {
        if (this.flags[key].betaAccessible) {
          this.flags[key].userPercentage = 100;
        }
      });
    }
  }
  
  /**
   * Simple string hash function
   * @param {string} str String to hash
   * @returns {number} Numeric hash
   * @private
   */
  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  
  /**
   * Default feature flags for development environment
   * @returns {Object} Default flags configuration
   * @private
   */
  _getDefaultFlags() {
    return {
      creatorDashboard: {
        enabled: true,
        userPercentage: 100,
        requiredUserLevel: 'creator',
        betaAccessible: true
      },
      advancedAnalytics: {
        enabled: true,
        userPercentage: 50,
        requiredUserLevel: 'creator',
        betaAccessible: true
      },
      tokenStaking: {
        enabled: true,
        userPercentage: 100,
        requiredUserLevel: 'any',
        betaAccessible: true
      },
      liveStreaming: {
        enabled: false,
        userPercentage: 0,
        requiredUserLevel: 'creator',
        betaAccessible: false
      },
      recommendationEngine: {
        enabled: true,
        userPercentage: 80,
        requiredUserLevel: 'any',
        betaAccessible: true
      },
      multiChainSupport: {
        enabled: true,
        userPercentage: 30,
        requiredUserLevel: 'any',
        betaAccessible: true
      }
    };
  }
}

// Create singleton instance
const featureFlags = new FeatureFlags();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Try to get user from global state or localStorage
  const user = window.currentUser || JSON.parse(localStorage.getItem('user') || 'null');
  
  featureFlags.initialize(user).catch(err => {
    console.error('Feature flags initialization error:', err);
  });
});

window.featureFlags = featureFlags;
