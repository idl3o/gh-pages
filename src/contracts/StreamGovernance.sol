// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StreamGovernance
 * @dev Governance contract for Web3 Streaming platform with adaptive mechanisms
 * to scale with user growth
 */
contract StreamGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorTimelockControl,
    Ownable
{
    // Growth-related parameters
    uint256 public creatorCount;
    uint256 public viewerCount;

    // Scaling parameters
    uint256 public quorumScalingFactor = 100; // 1.00x (basis points)
    uint256 public baseQuorumPercentage = 400; // 4.00%
    uint256 public minQuorumVotes;  // Minimum votes needed for quorum
    uint256 public lastQuorumAdjustment;
    uint256 public adjustmentPeriod = 30 days;

    // Governance parameters
    mapping(address => bool) public isCreator;
    mapping(address => uint256) public creatorVotingPower; // Extra voting power for creators

    // Adaptive proposal thresholds based on token supply
    uint256 public constant MIN_PROPOSAL_THRESHOLD_PERCENT = 50; // 0.5%
    uint256 public constant MAX_PROPOSAL_THRESHOLD_PERCENT = 200; // 2%

    // Events
    event CreatorRegistered(address indexed creator);
    event QuorumParametersUpdated(uint256 scalingFactor, uint256 basePercentage);
    event VotingPowerAdjusted(address indexed account, uint256 newPower);
    event NetworkStatisticsUpdated(uint256 creators, uint256 viewers);

    /**
     * @dev Constructor for initializing the governance contract
     */
    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 initialVotingDelay,
        uint256 initialVotingPeriod,
        uint256 initialProposalThreshold,
        uint256 _minQuorumVotes
    )
        Governor("StreamGovernance")
        GovernorSettings(
            initialVotingDelay,
            initialVotingPeriod,
            initialProposalThreshold
        )
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
    {
        minQuorumVotes = _minQuorumVotes;
        lastQuorumAdjustment = block.timestamp;
    }

    /**
     * @dev Register a new creator in the ecosystem
     * @param creator Address of the creator to register
     */
    function registerCreator(address creator) external onlyOwner {
        require(!isCreator[creator], "Already registered as creator");

        isCreator[creator] = true;
        creatorCount++;

        // Creator voting power amplification
        creatorVotingPower[creator] = 120; // 1.2x multiplier (in basis points)

        emit CreatorRegistered(creator);
    }

    /**
     * @dev Update network statistics for adaptive mechanisms
     * @param _creatorCount New count of creators
     * @param _viewerCount New count of viewers
     */
    function updateNetworkStatistics(uint256 _creatorCount, uint256 _viewerCount) external onlyOwner {
        creatorCount = _creatorCount;
        viewerCount = _viewerCount;

        // Check if it's time to adjust quorum parameters
        if (block.timestamp >= lastQuorumAdjustment + adjustmentPeriod) {
            _adjustQuorumParameters();
            lastQuorumAdjustment = block.timestamp;
        }

        emit NetworkStatisticsUpdated(_creatorCount, _viewerCount);
    }

    /**
     * @dev Adjust quorum parameters based on network growth
     */
    function _adjustQuorumParameters() internal {
        // Calculate new scaling factor based on user growth
        // Higher user counts mean we need lower thresholds as a percentage
        uint256 totalUsers = creatorCount + viewerCount;
        if (totalUsers > 10000) {
            // Slightly reduce quorum percentage as network grows
            quorumScalingFactor = 100 - ((totalUsers / 10000) * 10);
            // Ensure minimum scaling
            if (quorumScalingFactor < 50) quorumScalingFactor = 50; // Min 0.5x
        } else {
            quorumScalingFactor = 100; // 1x for small networks
        }

        emit QuorumParametersUpdated(quorumScalingFactor, baseQuorumPercentage);
    }

    /**
     * @dev Calculate and return the current quorum
     * using adaptive scaling based on network size
     */
    function quorum(uint256 blockNumber) public view override returns (uint256) {
        uint256 totalSupply = token.getPastTotalSupply(blockNumber);

        // Calculate the percentage-based quorum with scaling factor
        uint256 percentageQuorum = (totalSupply * baseQuorumPercentage * quorumScalingFactor) / 1000000;

        // Ensure we meet minimum quorum votes regardless of scaling
        return percentageQuorum > minQuorumVotes ? percentageQuorum : minQuorumVotes;
    }

    /**
     * @dev Update an individual's voting power (for rewarding active users)
     */
    function adjustVotingPower(address account, uint256 powerMultiplier) external onlyOwner {
        require(powerMultiplier >= 100, "Multiplier must be at least 100 (1x)");
        require(powerMultiplier <= 200, "Multiplier capped at 200 (2x)");

        creatorVotingPower[account] = powerMultiplier;
        emit VotingPowerAdjusted(account, powerMultiplier);
    }

    /**
     * @dev Get the adjusted proposal threshold based on token supply
     */
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        uint256 baseThreshold = GovernorSettings.proposalThreshold();
        uint256 totalSupply = token.getPastTotalSupply(block.number - 1);

        // Calculate threshold as percentage of supply (between 0.5% and 2%)
        uint256 dynamicThreshold = (totalSupply * MIN_PROPOSAL_THRESHOLD_PERCENT) / 10000;

        // For large networks, cap at dynamic threshold to improve accessibility
        return baseThreshold < dynamicThreshold ? baseThreshold : dynamicThreshold;
    }

    // Required overrides
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
