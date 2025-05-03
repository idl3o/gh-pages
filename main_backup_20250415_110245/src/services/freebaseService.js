/**
 * FreeBase Service
 * Handles the freemium model for content access in the Web3 Streaming Platform
 */

// Content tiers configuration
export const ContentTiers = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  EXCLUSIVE: 'exclusive'
};

// Access requirements per tier
const tierRequirements = {
  [ContentTiers.FREE]: {
    tokensRequired: 0,
    requiresWallet: false,
    description: 'Available to all users without restrictions',
    maxDuration: 10 * 60 // 10 minutes in seconds
  },
  [ContentTiers.BASIC]: {
    tokensRequired: 0,
    requiresWallet: true,
    description: 'Requires a connected wallet',
    maxDuration: 30 * 60 // 30 minutes in seconds
  },
  [ContentTiers.PREMIUM]: {
    tokensRequired: 5,
    requiresWallet: true,
    description: 'Requires 5 STREAM tokens to access',
    maxDuration: null // unlimited
  },
  [ContentTiers.EXCLUSIVE]: {
    tokensRequired: 25,
    requiresWallet: true,
    description: 'Exclusive content for premium supporters',
    maxDuration: null // unlimited
  }
};

/**
 * Check if a user has access to content based on tier
 * @param {string} tier - Content tier level
 * @param {object} user - User object with wallet and token information
 * @returns {object} - Access status and any restrictions
 */
export function checkContentAccess(tier, user) {
  const tierInfo = tierRequirements[tier] || tierRequirements[ContentTiers.FREE];
  
  // For free content, always grant access
  if (tier === ContentTiers.FREE) {
    return {
      hasAccess: true,
      restrictions: {
        timeLimit: tierInfo.maxDuration
      }
    };
  }
  
  // Check if wallet is connected if required
  if (tierInfo.requiresWallet && !user?.walletAddress) {
    return {
      hasAccess: false,
      reason: 'wallet_required',
      message: 'This content requires a connected wallet.'
    };
  }
  
  // Check if user has enough tokens
  if (tierInfo.tokensRequired > 0) {
    const userTokens = user?.tokenBalance || 0;
    
    if (userTokens < tierInfo.tokensRequired) {
      return {
        hasAccess: false,
        reason: 'insufficient_tokens',
        message: `This content requires ${tierInfo.tokensRequired} STREAM tokens.`,
        required: tierInfo.tokensRequired,
        current: userTokens
      };
    }
  }
  
  // Grant access with any applicable restrictions
  return {
    hasAccess: true,
    restrictions: {
      timeLimit: tierInfo.maxDuration
    }
  };
}

/**
 * Get requirements for a specific content tier
 * @param {string} tier - Content tier to check
 * @returns {object} - Tier requirements
 */
export function getTierRequirements(tier) {
  return tierRequirements[tier] || tierRequirements[ContentTiers.FREE];
}

/**
 * Calculate the percentage of free content in a creator's library
 * @param {array} contentItems - Array of creator content items
 * @returns {number} - Percentage of free content (0-100)
 */
export function calculateFreeContentPercentage(contentItems) {
  if (!contentItems || contentItems.length === 0) return 0;
  
  const freeItems = contentItems.filter(item => 
    item.tier === ContentTiers.FREE
  );
  
  return Math.round((freeItems.length / contentItems.length) * 100);
}
