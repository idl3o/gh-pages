// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./StreamToken.sol";

/**
 * @title StreamEcosystem
 * @dev Homeostatic ecosystem controller that maintains equilibrium across the
 * Web3 Streaming platform by coordinating automatic adjustments to token parameters
 * based on real-time metrics.
 */
contract StreamEcosystem is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    // Connected contracts
    StreamToken public streamToken;

    // System state variables
    uint256 public lastEquilibriumUpdate;
    uint256 public equilibriumUpdateInterval = 1 days;
    bool public emergencyModeActive;

    // Ecosystem health metrics
    struct EcosystemMetrics {
        uint256 creatorToViewerRatio;     // x1000 (e.g., 20 = 2.0%)
        uint256 dailyActiveRatio;         // x1000 (e.g., 250 = 25.0%)
        uint256 avgTransactionCount;      // Per user per day (x100)
        uint256 contentCreationRate;      // New content / creator / day (x100)
        uint256 tokenVelocity;            // Txns per token per day (x100)
        uint256 rewardEfficiency;         // Creator earnings vs views (x100)
        uint256 systemStability;          // Overall health score (0-100)
    }

    // Targets represent the "homeostasis" we try to maintain
    struct EquilibriumTargets {
        uint256 optimalCreatorRatio;      // x1000 (e.g., 20 = 2.0%)
        uint256 targetActiveRatio;        // x1000 (e.g., 300 = 30.0%)
        uint256 feeFloor;                 // In basis points (e.g., 200 = 2.00%)
        uint256 feeCeiling;               // In basis points (e.g., 1500 = 15.00%)
        uint256 idealTokenVelocity;       // Txns per token per day (x100)
    }

    EcosystemMetrics public currentMetrics;
    EquilibriumTargets public targets;

    // Safety circuit breakers
    uint256 public constant EQUILIBRIUM_THRESHOLD = 20;  // 20% deviation triggers adjustment
    uint256 public constant EMERGENCY_THRESHOLD = 50;    // 50% deviation triggers emergency mode
    uint256 public constant COOL_DOWN_PERIOD = 12 hours; // Minimum time between radical adjustments
    uint256 public lastEmergencyAction;

    // Events
    event MetricsUpdated(EcosystemMetrics metrics, uint256 timestamp);
    event EquilibriumRestored(string action, uint256 adjustmentValue, uint256 timestamp);
    event TargetsUpdated(EquilibriumTargets newTargets);
    event EmergencyModeActivated(string reason, uint256 timestamp);
    event EmergencyModeDeactivated(uint256 timestamp);
    event CircuitBreakerTriggered(string metric, uint256 value, uint256 threshold);

    /**
     * @dev Constructor sets up the ecosystem with initial targets and roles
     */
    constructor(
        address _streamToken,
        address _guardian,
        address _oracle
    ) {
        streamToken = StreamToken(_streamToken);

        // Set up roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(GUARDIAN_ROLE, _guardian);
        _setupRole(ORACLE_ROLE, _oracle);

        // Initialize with sensible defaults for equilibrium
        targets = EquilibriumTargets({
            optimalCreatorRatio: 20,    // 2% creators to viewers
            targetActiveRatio: 300,     // 30% daily active users
            feeFloor: 200,              // 2% minimum fee
            feeCeiling: 1500,           // 15% maximum fee
            idealTokenVelocity: 500     // 5 transactions per token per day
        });

        lastEquilibriumUpdate = block.timestamp;
    }

    /**
     * @dev Receive ecosystem metrics from oracle and maintain homeostasis
     * This function serves as the primary feedback loop for the ecosystem
     */
    function updateMetrics(
        uint256 _creatorToViewerRatio,
        uint256 _dailyActiveRatio,
        uint256 _avgTransactionCount,
        uint256 _contentCreationRate,
        uint256 _tokenVelocity,
        uint256 _rewardEfficiency
    ) external onlyRole(ORACLE_ROLE) whenNotPaused nonReentrant {
        // Update metrics
        currentMetrics.creatorToViewerRatio = _creatorToViewerRatio;
        currentMetrics.dailyActiveRatio = _dailyActiveRatio;
        currentMetrics.avgTransactionCount = _avgTransactionCount;
        currentMetrics.contentCreationRate = _contentCreationRate;
        currentMetrics.tokenVelocity = _tokenVelocity;
        currentMetrics.rewardEfficiency = _rewardEfficiency;

        // Calculate overall system stability (0-100)
        currentMetrics.systemStability = calculateSystemStability();

        // Check if we need to restore equilibrium
        if (block.timestamp >= lastEquilibriumUpdate + equilibriumUpdateInterval) {
            restoreEquilibrium();
        }

        // Check for emergency conditions
        checkCircuitBreakers();

        emit MetricsUpdated(currentMetrics, block.timestamp);
    }

    /**
     * @dev Calculate overall system stability score based on current metrics
     */
    function calculateSystemStability() internal view returns (uint256) {
        uint256 creatorRatioScore = calculateDeviationScore(
            currentMetrics.creatorToViewerRatio,
            targets.optimalCreatorRatio,
            25
        );

        uint256 activeRatioScore = calculateDeviationScore(
            currentMetrics.dailyActiveRatio,
            targets.targetActiveRatio,
            25
        );

        uint256 velocityScore = calculateDeviationScore(
            currentMetrics.tokenVelocity,
            targets.idealTokenVelocity,
            25
        );

        uint256 contentScore = 0;
        if (currentMetrics.contentCreationRate >= 50) { // At least 0.5 content per creator per day
            contentScore = 25;
        } else {
            contentScore = (currentMetrics.contentCreationRate * 25) / 50;
        }

        return creatorRatioScore + activeRatioScore + velocityScore + contentScore;
    }

    /**
     * @dev Helper function to calculate how far a metric is from its target
     */
    function calculateDeviationScore(
        uint256 current,
        uint256 target,
        uint256 maxScore
    ) internal pure returns (uint256) {
        if (current == target) {
            return maxScore;
        }

        uint256 deviation;
        if (current > target) {
            deviation = ((current - target) * 100) / target;
        } else {
            deviation = ((target - current) * 100) / target;
        }

        // Penalize based on deviation: more deviation = lower score
        if (deviation >= 100) {
            return 0;
        }

        return maxScore * (100 - deviation) / 100;
    }

    /**
     * @dev Core homeostatic mechanism that adjusts parameters to maintain equilibrium
     */
    function restoreEquilibrium() internal {
        // Implements a complex feedback system based on current ecosystem state

        // 1. Fee adjustment based on token velocity and active users
        if (needsFeeAdjustment()) {
            uint256 newFee = calculateOptimalFee();
            streamToken.updateFee(newFee);
            emit EquilibriumRestored("FeeAdjusted", newFee, block.timestamp);
        }

        // 2. Creator incentives adjustment based on creator-to-viewer ratio
        if (needsCreatorIncentiveAdjustment()) {
            // Implementation would call a contract method to adjust creator rewards
            emit EquilibriumRestored("CreatorIncentiveAdjusted", 0, block.timestamp);
        }

        // 3. Supply adjustment if necessary (inflation or deflation)
        if (needsSupplyAdjustment()) {
            // Implementation would potentially trigger token inflation or burning
            emit EquilibriumRestored("SupplyAdjusted", 0, block.timestamp);
        }

        // Update timestamp for next equilibrium check
        lastEquilibriumUpdate = block.timestamp;
    }

    /**
     * @dev Calculate the optimal platform fee based on current conditions
     * Uses a complex formula balancing ecosystem metrics
     */
    function calculateOptimalFee() internal view returns (uint256) {
        // Base fee starts at 800 (8%)
        uint256 baseFee = 800;

        // Adjust based on token velocity
        int256 velocityAdjustment;
        if (currentMetrics.tokenVelocity < targets.idealTokenVelocity) {
            // Low velocity - reduce fees to stimulate transactions
            velocityAdjustment = -int256((targets.idealTokenVelocity - currentMetrics.tokenVelocity) / 20);
        } else {
            // High velocity - increase fees to capture value
            velocityAdjustment = int256((currentMetrics.tokenVelocity - targets.idealTokenVelocity) / 30);
        }

        // Adjust based on daily active users
        int256 activityAdjustment;
        if (currentMetrics.dailyActiveRatio < targets.targetActiveRatio) {
            // Low activity - reduce fees to encourage participation
            activityAdjustment = -int256((targets.targetActiveRatio - currentMetrics.dailyActiveRatio) / 30);
        } else {
            // High activity - can sustain slightly higher fees
            activityAdjustment = int256((currentMetrics.dailyActiveRatio - targets.targetActiveRatio) / 60);
        }

        // Apply adjustments with guardrails
        int256 adjustedFee = int256(baseFee) + velocityAdjustment + activityAdjustment;

        // Enforce min/max boundaries
        if (adjustedFee < int256(targets.feeFloor)) {
            return targets.feeFloor;
        } else if (adjustedFee > int256(targets.feeCeiling)) {
            return targets.feeCeiling;
        }

        return uint256(adjustedFee);
    }

    /**
     * @dev Check if critical metrics have deviated beyond thresholds and activate circuit breakers
     */
    function checkCircuitBreakers() internal {
        // Detect and respond to extreme ecosystem conditions

        // Check system stability score
        if (currentMetrics.systemStability < 30 && !emergencyModeActive) {
            activateEmergencyMode("System stability critical");
            return;
        }

        // Check creator ratio - if creators are disappearing rapidly
        if (targets.optimalCreatorRatio > 0 &&
            currentMetrics.creatorToViewerRatio < (targets.optimalCreatorRatio / 2)) {
            emit CircuitBreakerTriggered(
                "CreatorRatio",
                currentMetrics.creatorToViewerRatio,
                targets.optimalCreatorRatio / 2
            );

            // Take corrective action if in emergency mode or exceeds threshold
            if (emergencyModeActive ||
                currentMetrics.creatorToViewerRatio < (targets.optimalCreatorRatio / 4)) {

                // Emergency creator retention measures would be implemented here
                if (canTakeEmergencyAction()) {
                    // Example: drastically increase creator rewards temporarily
                    lastEmergencyAction = block.timestamp;
                }
            }
        }

        // Additional circuit breakers for other critical metrics...

        // If system has recovered, deactivate emergency mode
        if (emergencyModeActive && currentMetrics.systemStability > 60) {
            deactivateEmergencyMode();
        }
    }

    /**
     * @dev Activate emergency mode when system stability is threatened
     */
    function activateEmergencyMode(string memory reason) internal {
        emergencyModeActive = true;
        emit EmergencyModeActivated(reason, block.timestamp);

        // Immediate stabilization actions would be implemented here
        if (canTakeEmergencyAction()) {
            // Example emergency action:
            // Temporarily boost creator rewards, reduce fees, etc.
            lastEmergencyAction = block.timestamp;
        }
    }

    /**
     * @dev Deactivate emergency mode when stability is restored
     */
    function deactivateEmergencyMode() internal {
        emergencyModeActive = false;
        emit EmergencyModeDeactivated(block.timestamp);

        // Return to normal operations
        // Reset any emergency parameters
    }

    /**
     * @dev Check if enough time has passed since the last emergency action
     */
    function canTakeEmergencyAction() internal view returns (bool) {
        return (block.timestamp > lastEmergencyAction + COOL_DOWN_PERIOD);
    }

    /**
     * @dev Check if fee adjustment is needed
     */
    function needsFeeAdjustment() internal view returns (bool) {
        uint256 optimalFee = calculateOptimalFee();
        uint256 currentFee = streamToken.baseFee();

        // Calculate percentage difference
        uint256 difference;
        if (optimalFee > currentFee) {
            difference = ((optimalFee - currentFee) * 100) / currentFee;
        } else {
            difference = ((currentFee - optimalFee) * 100) / currentFee;
        }

        // Adjust if difference exceeds threshold
        return difference > EQUILIBRIUM_THRESHOLD;
    }

    /**
     * @dev Check if creator incentive adjustment is needed
     */
    function needsCreatorIncentiveAdjustment() internal view returns (bool) {
        uint256 current = currentMetrics.creatorToViewerRatio;
        uint256 target = targets.optimalCreatorRatio;

        // Calculate percentage difference
        uint256 difference;
        if (current > target) {
            difference = ((current - target) * 100) / target;
        } else {
            difference = ((target - current) * 100) / target;
        }

        return difference > EQUILIBRIUM_THRESHOLD;
    }

    /**
     * @dev Check if token supply adjustment is needed
     */
    function needsSupplyAdjustment() internal view returns (bool) {
        // Check metrics related to token supply/demand balance
        // (simplified for this implementation)
        return false;
    }

    /**
     * @dev Update the equilibrium targets (restricted to admin)
     */
    function updateEquilibriumTargets(
        uint256 _optimalCreatorRatio,
        uint256 _targetActiveRatio,
        uint256 _feeFloor,
        uint256 _feeCeiling,
        uint256 _idealTokenVelocity
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Apply constraints for safety
        require(_feeFloor < _feeCeiling, "Floor must be less than ceiling");
        require(_feeFloor >= 100, "Fee floor too low"); // Minimum 1%
        require(_feeCeiling <= 2000, "Fee ceiling too high"); // Maximum 20%

        targets.optimalCreatorRatio = _optimalCreatorRatio;
        targets.targetActiveRatio = _targetActiveRatio;
        targets.feeFloor = _feeFloor;
        targets.feeCeiling = _feeCeiling;
        targets.idealTokenVelocity = _idealTokenVelocity;

        emit TargetsUpdated(targets);
    }

    /**
     * @dev Force an equilibrium restoration (restricted to guardian)
     */
    function forceEquilibriumRestore() external onlyRole(GUARDIAN_ROLE) {
        restoreEquilibrium();
    }

    /**
     * @dev Pause the ecosystem (emergency measure)
     */
    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the ecosystem after emergency
     */
    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }
}
