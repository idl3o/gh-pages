// Example of content purchase transaction
async function purchaseContent(contentId, amount) {
  try {
    // 1. Get content details and creator address
    const content = await contentContract.getContent(contentId);

    // 2. Calculate fee distribution with dynamic fee structure
    const networkMetrics = await getNetworkMetrics();
    const currentFee = await calculateDynamicFee(networkMetrics);

    const creatorAmount = amount * ((10000 - currentFee) / 10000); // Fee in basis points
    const platformFee = amount * (currentFee / 10000);

    // 3. Execute token transfer through smart contract
    const tx = await streamTokenContract.contentPurchase(
      content.creatorAddress,
      contentId,
      creatorAmount,
      platformFee
    );

    // 4. Wait for transaction confirmation
    await tx.wait();

    // 5. Grant access to content
    await accessControlContract.grantAccess(currentUser, contentId);

    // 6. Update creator statistics for scaled rewards
    await creatorRewardsContract.recordContentPurchase(
      content.creatorAddress,
      amount,
      networkMetrics.totalCreators
    );

    return {
      success: true,
      transactionHash: tx.hash,
      fee: currentFee / 100, // Convert basis points to percentage
      creatorAmount,
      platformFee
    };
  } catch (error) {
    console.error("Purchase failed:", error);
    return { success: false, error };
  }
}

// Calculate dynamic fee based on network metrics
async function calculateDynamicFee(metrics) {
  const {
    networkGrowthRate,
    tokenVelocity,
    creatorRetentionRate,
    totalUsers
  } = metrics;

  // Base fee in basis points (10%)
  let baseFee = 1000;

  // Scaling factors
  const growthAdjustment = networkGrowthRate * 0.4;
  const velocityAdjustment = tokenVelocity * 0.3;
  const retentionAdjustment = creatorRetentionRate * 0.3;

  // Users scale - as user base grows, gradually reduce fees
  const userScaleFactor = Math.min(1.0, Math.log10(totalUsers) / 6); // Max reduction at 1M users

  // Calculate adjusted fee
  let adjustedFee = baseFee -
    (growthAdjustment + velocityAdjustment + retentionAdjustment) * userScaleFactor * 500;

  // Ensure fee stays within bounds (5-15%)
  adjustedFee = Math.max(500, Math.min(1500, adjustedFee));

  return Math.round(adjustedFee);
}

// Get current network metrics for scaling calculations
async function getNetworkMetrics() {
  // In production, this would fetch actual data from the platform's analytics
  const networkData = await analyticsContract.getMetrics();

  return {
    networkGrowthRate: networkData.monthlyGrowthPercent, // e.g., 5 for 5%
    tokenVelocity: networkData.avgTransactionsPerToken, // Transactions per token per month
    creatorRetentionRate: networkData.creatorRetention, // Percentage of creators retained
    totalCreators: networkData.activeCreators,
    totalViewers: networkData.activeViewers,
    totalUsers: networkData.activeCreators + networkData.activeViewers,
    avgContentPrice: networkData.avgContentPrice,
    stakingRatio: networkData.stakedTokens / networkData.totalSupply
  };
}

// Creator reward enhancement based on contribution quality
async function calculateCreatorBonus(creatorAddress, contentValue) {
  const creatorMetrics = await creatorContract.getMetrics(creatorAddress);
  const networkMetrics = await getNetworkMetrics();

  // Base reward is 90% of content value
  const baseReward = contentValue * 0.9;

  // Calculate quality multiplier
  const qualityMultiplier = 1 + (creatorMetrics.avgRating - 3) / 10; // 0.8-1.2x based on 1-5 rating

  // Calculate retention multiplier
  const retentionMultiplier = 1 + (creatorMetrics.viewerRetentionRate / 100) * 0.2; // 1-1.2x

  // Calculate ecosystem contribution multiplier
  const contributionRatio = creatorMetrics.contentCount / networkMetrics.totalCreators;
  const contributionMultiplier = 1 + Math.log10(contributionRatio * 100 + 1) * 0.1; // 1-1.3x

  // Growth phase multiplier - gradually decreases as platform matures
  const growthPhaseMultiplier = 1.5 - (Math.min(networkMetrics.totalUsers, 1000000) / 1000000) * 0.5; // 1.5x to 1x

  // Calculate final bonus
  const totalMultiplier = qualityMultiplier * retentionMultiplier *
                          contributionMultiplier * growthPhaseMultiplier;

  return {
    baseReward,
    finalReward: baseReward * totalMultiplier,
    multiplier: totalMultiplier,
    components: {
      quality: qualityMultiplier,
      retention: retentionMultiplier,
      contribution: contributionMultiplier,
      growthPhase: growthPhaseMultiplier
    }
  };
}

// Staking reward calculation with dynamic APY
async function calculateStakingReward(address, amount, duration) {
  const networkMetrics = await getNetworkMetrics();
  const utilization = networkMetrics.totalUsers > 0 ?
    networkMetrics.dailyActiveUsers / networkMetrics.totalUsers : 0;

  // Base APY (e.g., 5%)
  const baseAPY = 0.05;

  // Calculate dynamic APY based on utilization
  const dynamicAPY = baseAPY * (1 + (utilization - 0.5) * 0.5);

  // Time factor (in years)
  const timeYears = duration / (365 * 24 * 60 * 60);

  // Calculate reward
  const reward = amount * dynamicAPY * timeYears;

  return {
    reward,
    apy: dynamicAPY * 100, // Convert to percentage
    utilization: utilization * 100 // Convert to percentage
  };
}

module.exports = {
  purchaseContent,
  calculateDynamicFee,
  getNetworkMetrics,
  calculateCreatorBonus,
  calculateStakingReward
};
