/**
 * Web3 Crypto Streaming Service
 * Ranking Power System
 *
 * This module handles the calculation and display of creator ranking power.
 */

class RankingPowerSystem {
  constructor() {
    this.schema = null;
    this.userMetrics = null;
    this.totalScore = 0;
    this.powerItems = [];
    this.currentRank = null;
  }

  /**
   * Initialize the ranking system
   * @returns {Promise} Promise that resolves when initialized
   */
  async initialize() {
    try {
      // Fetch the schema
      const response = await fetch('/config/ranking-schema.json');
      if (!response.ok) throw new Error('Failed to load ranking schema');

      this.schema = await response.json();
      console.log('Ranking schema loaded:', this.schema.version);

      return true;
    } catch (error) {
      console.error('Error initializing ranking system:', error);
      return false;
    }
  }

  /**
   * Load creator metrics and calculate ranking
   * @param {string} creatorId - The ID of the creator
   * @returns {Promise} Promise that resolves with the ranking data
   */
  async loadCreatorMetrics(creatorId) {
    try {
      // In production this would fetch from API
      // For demo, we'll simulate metrics
      this.userMetrics = await this.fetchMetrics(creatorId);

      // Calculate power scores for each item
      this.calculatePowerScores();

      // Determine creator rank
      this.determineRank();

      return {
        totalScore: this.totalScore,
        rank: this.currentRank,
        powerItems: this.powerItems
      };
    } catch (error) {
      console.error('Error loading creator metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate individual power scores for each item
   */
  calculatePowerScores() {
    if (!this.schema || !this.userMetrics) {
      throw new Error('Schema or user metrics not loaded');
    }

    this.powerItems = [];
    this.totalScore = 0;

    this.schema.powerItems.forEach(item => {
      // Get the metric for this item
      const metric = this.userMetrics[item.id] || {};

      // Calculate raw score based on the metric and item formula
      // In production this would use actual formula evaluation
      const rawScore = this.evaluateFormula(item, metric);

      // Cap at max points
      const score = Math.min(rawScore, item.maxPoints);

      // Apply tier weight
      const tierWeight = this.schema.tiers[item.tier]?.weight || 1.0;
      const weightedScore = score * tierWeight;

      // Add to total
      this.totalScore += weightedScore;

      // Store the item with its score
      this.powerItems.push({
        id: item.id,
        name: item.name,
        description: item.description,
        rawScore: rawScore,
        maxScore: item.maxPoints,
        score: score,
        weightedScore: weightedScore,
        percentage: (score / item.maxPoints) * 100,
        tier: item.tier,
        icon: item.icon
      });
    });

    // Sort power items by weighted score (descending)
    this.powerItems.sort((a, b) => b.weightedScore - a.weightedScore);
  }

  /**
   * Determine rank level based on total score
   */
  determineRank() {
    if (!this.schema || this.totalScore === undefined) {
      throw new Error('Schema not loaded or score not calculated');
    }

    this.currentRank = null;

    for (const rank of this.schema.rankLevels) {
      if (this.totalScore >= rank.minScore && this.totalScore <= rank.maxScore) {
        this.currentRank = rank;
        break;
      }
    }

    return this.currentRank;
  }

  /**
   * Evaluate formula for a power item
   * @param {Object} item - Power item schema
   * @param {Object} metric - User metrics for the item
   * @returns {number} Calculated score
   */
  evaluateFormula(item, metric) {
    // In production this would use a proper formula parser
    // For this demo, we'll use a simplified approach based on the item type

    switch (item.id) {
      case 'content_quality':
        return (metric.qualityScore || 0) *
               (metric.resolutionFactor || 1) *
               ((metric.completionRate || 0) / 100) *
               item.multiplier;

      case 'engagement_rate':
        return ((metric.comments || 0) +
               (metric.shares || 0) * 2 +
               (metric.reactions || 0)) /
               Math.max(1, (metric.viewCount || 1)) *
               item.multiplier;

      // Add cases for other items...

      default:
        // Default calculation - use percentage of max
        return (metric.value || 0) / 100 * item.maxPoints;
    }
  }

  /**
   * Simulates fetching metrics from an API
   * @param {string} creatorId - Creator ID
   * @returns {Promise<Object>} Creator metrics
   */
  async fetchMetrics(creatorId) {
    // In production, this would be an API call
    // For demo, return simulated metrics
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          content_quality: {
            qualityScore: 0.85,
            resolutionFactor: 1.2,
            completionRate: 78
          },
          engagement_rate: {
            comments: 1250,
            shares: 380,
            reactions: 5600,
            viewCount: 12000
          },
          stream_time: {
            hoursStreamed: 120,
            consistencyFactor: 0.9
          },
          token_earnings: {
            totalTokensEarned: 25000,
            benchmarkEarnings: 15000
          },
          subscription_growth: {
            newSubscribers: 350,
            lostSubscribers: 50,
            totalSubscribers: 1200
          },
          community_building: {
            forumPosts: 85,
            communityEvents: 3
          },
          platform_loyalty: {
            monthsActive: 9,
            exclusivityRatio: 0.7
          },
          content_diversity: {
            uniqueCategories: 5,
            uniqueFormats: 3
          },
          staking_power: {
            tokensStaked: 5000,
            stakingBenchmark: 10000
          },
          governance_participation: {
            proposalsVoted: 15,
            totalProposals: 20,
            proposalsCreated: 1
          },
          referral_power: {
            creatorsReferred: 3,
            viewersReferred: 75
          },
          innovation_bonus: {
            innovationScoreManual: 85
          }
        });
      }, 300);
    });
  }

  /**
   * Render the ranking UI to a container
   * @param {HTMLElement} container - The container element
   */
  renderRankingUI(container) {
    if (!container) return;
    if (!this.powerItems || !this.currentRank) {
      container.innerHTML = '<p>Ranking data not available</p>';
      return;
    }

    // Create the main ranking container
    container.innerHTML = `
      <div class="ranking-container">
        <div class="ranking-header">
          <div class="rank-badge" style="background-color: ${this.currentRank.color}">
            ${this.currentRank.icon}
          </div>
          <div class="rank-info">
            <h3>${this.currentRank.name} Rank</h3>
            <div class="rank-score">${Math.floor(this.totalScore)} points</div>
            <div class="rank-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${this.calculateProgressPercentage()}%"></div>
              </div>
              <div class="progress-text">
                ${this.getProgressText()}
              </div>
            </div>
          </div>
        </div>

        <div class="ranking-benefits">
          <h4>Rank Benefits</h4>
          <ul>
            ${this.currentRank.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>

        <div class="power-items-container">
          <h4>Power Items</h4>
          <div class="power-items-grid">
            ${this.renderPowerItems()}
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.addEventListeners(container);
  }

  /**
   * Calculate percentage progress to next rank
   * @returns {number} Progress percentage
   */
  calculateProgressPercentage() {
    if (!this.currentRank || this.schema.rankLevels.indexOf(this.currentRank) === this.schema.rankLevels.length - 1) {
      return 100; // Already at max rank
    }

    const currentMin = this.currentRank.minScore;
    const currentMax = this.currentRank.maxScore;
    const range = currentMax - currentMin;
    const progress = this.totalScore - currentMin;

    return Math.min(100, Math.max(0, (progress / range) * 100));
  }

  /**
   * Get text showing progress to next rank
   * @returns {string} Progress text
   */
  getProgressText() {
    const currentRankIndex = this.schema.rankLevels.findIndex(r => r === this.currentRank);

    if (currentRankIndex === this.schema.rankLevels.length - 1) {
      return 'Maximum rank achieved!';
    }

    const nextRank = this.schema.rankLevels[currentRankIndex + 1];
    const pointsNeeded = nextRank.minScore - this.totalScore;

    return `${Math.ceil(pointsNeeded)} points to ${nextRank.name} rank`;
  }

  /**
   * Render individual power items
   * @returns {string} HTML for power items
   */
  renderPowerItems() {
    return this.powerItems.map(item => {
      const tierInfo = this.schema.tiers[item.tier];

      return `
        <div class="power-item" data-id="${item.id}">
          <div class="power-item-header">
            <div class="power-icon" style="background-color: ${tierInfo.color}">
              <i class="fas fa-${item.icon}"></i>
            </div>
            <div class="power-info">
              <h5>${item.name}</h5>
              <div class="power-score">
                ${Math.floor(item.weightedScore)} / ${item.maxScore} points
              </div>
            </div>
          </div>
          <div class="power-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${item.percentage}%; background-color: ${tierInfo.color}"></div>
            </div>
          </div>
          <div class="power-description hidden">
            <p>${item.description}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Add event listeners to the ranking UI
   * @param {HTMLElement} container - Container element
   */
  addEventListeners(container) {
    // Add click listeners to power items to show/hide descriptions
    const powerItems = container.querySelectorAll('.power-item');
    powerItems.forEach(item => {
      item.addEventListener('click', () => {
        const desc = item.querySelector('.power-description');
        desc.classList.toggle('hidden');
      });
    });
  }
}

// Export the class
window.RankingPowerSystem = RankingPowerSystem;

// Initialize automatically when included
document.addEventListener('DOMContentLoaded', () => {
  window.rankingSystem = new RankingPowerSystem();
});
