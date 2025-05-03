const tokenDistribution = {
  // Initial allocation
  treasury: {
    percentage: 20,
    tokens: 20_000_000,
    vestingPeriod: "4 years with monthly unlocks"
  },
  team: {
    percentage: 15,
    tokens: 15_000_000,
    vestingPeriod: "4 years with 1 year cliff"
  },
  advisors: {
    percentage: 5,
    tokens: 5_000_000,
    vestingPeriod: "3 years with quarterly unlocks"
  },
  privateSale: {
    percentage: 10,
    tokens: 10_000_000,
    vestingPeriod: "2 years with monthly unlocks"
  },
  publicSale: {
    percentage: 15,
    tokens: 15_000_000,
    vestingPeriod: "1 year linear unlock"
  },

  // Ecosystem incentives
  creatorIncentives: {
    percentage: 15,
    tokens: 15_000_000,
    releaseSchedule: "10 years",
    scalingMechanism: "Dynamic allocation based on creator growth metrics"
  },
  viewerRewards: {
    percentage: 10,
    tokens: 10_000_000,
    releaseSchedule: "10 years",
    scalingMechanism: "Adjusts based on viewer engagement metrics"
  },
  liquidityProvision: {
    percentage: 5,
    tokens: 5_000_000,
    releaseSchedule: "5 years",
    scalingMechanism: "Increases with trading volume"
  },
  communityGrants: {
    percentage: 5,
    tokens: 5_000_000,
    releaseSchedule: "5 years",
    scalingMechanism: "Expands with community proposals and governance votes"
  }
};

// Scaling mechanisms for user growth
const tokenomicsScaling = {
  // Elastic supply mechanism - controlled token issuance
  elasticSupply: {
    enabled: true,
    maxAnnualInflation: 2, // Max 2% annual inflation
    inflationTrigger: "Governance vote",
    inflationConditions: [
      "Network utilization consistently above 80%",
      "Creator:viewer ratio below 1:500",
      "DAO approval with minimum 67% vote"
    ]
  },

  // Fee adjustments based on network usage
  dynamicFees: {
    baseFee: 10, // 10% platform fee
    minFee: 5,   // Minimum 5%
    maxFee: 15,  // Maximum 15%
    adjustmentFactors: [
      { metric: "networkGrowthRate", weight: 0.4 },
      { metric: "tokenVelocity", weight: 0.3 },
      { metric: "creatorRetentionRate", weight: 0.3 }
    ]
  },

  // Creator incentive scaling formula
  creatorRewards: {
    baseReward: function(contentValue, viewCount) {
      return contentValue * 0.9; // 90% to creator
    },
    scalingFunction: function(creatorCount, totalCreators) {
      // Rewards scale with creator's relative contribution to ecosystem
      return 1 + Math.log10(creatorCount / totalCreators + 1) * 0.5;
    },
    bonusPool: {
      source: "Treasury",
      trigger: "Key growth milestones",
      allocation: "Governance-determined"
    }
  },

  // Staking reward adjustments
  stakingYield: {
    baseAPY: 5, // 5% base annual percentage yield
    scalingFunction: function(networkUtilization) {
      // APY increases with network utilization
      return this.baseAPY * (1 + (networkUtilization - 0.5) * 0.5);
    },
    utilizationCalculation: "Daily active users / Total token holders"
  }
};

// Growth sustainability metrics
const sustainabilityMetrics = {
  targetCreatorRetention: 85, // 85% creator retention goal
  targetViewerGrowth: 15,     // 15% monthly viewer growth target
  treasuryReserveTarget: 10,  // Maintain 10% of total supply in treasury
  liquidityTarget: 20,        // 20% of tokens should be in liquidity pools
  governanceParticipationTarget: 30 // 30% token holder voting participation
};

module.exports = {
  tokenDistribution,
  tokenomicsScaling,
  sustainabilityMetrics
};
