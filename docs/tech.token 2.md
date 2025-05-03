- --
layout: default
title: Token Economics | Web3 Crypto Streaming Service
- --

# STREAM Token Economics

This document provides a comprehensive overview of the STREAM token's economic model, utility, and governance functionality within the Web3 Crypto Streaming Service ecosystem.

## Token Overview

| Parameter | Value |
|-----------|-------|
| **Name** | Streaming Credits |
| **Symbol** | STRM |
| **Decimals** | 18 |
| **Standard** | ERC-20 |
| **Total Supply** | Dynamic (with controlled inflation) |
| **Initial Supply** | 100,000,000 STRM |

## Token Utility

STREAM tokens are the fundamental unit of value within the platform ecosystem, with multiple utility functions:

### Access Control
- **Content Streaming**: 1 STREAM token grants 1 hour of streaming access to content
- **Premium Features**: Certain premium features require token holdings or expenditure
- **Priority Access**: Token holders receive priority access to new content releases

### Economic Functions
- **Creator Compensation**: Creators earn STREAM tokens based on content consumption
- **Viewer Rewards**: Viewers earn STREAM tokens for engagement and attention
- **Payment Streaming**: Enables per-second payment flows using the StreamPayment contract
- **Fee Reduction**: Token stakers receive reduced platform fees
- **Content Monetization**: Creators can set token payment requirements for their content
- **Cash Reward Conversion**: Viewers can convert earned tokens to cash rewards

### Governance
- **Proposal Creation**: 10,000 STREAM required to submit governance proposals
- **Voting Rights**: Token holders vote on platform parameters and upgrades
- **Treasury Management**: Decisions on platform treasury allocations

## Token Economics

### Acquisition Methods
- **Direct Purchase**: 100 STREAM tokens per ETH through the `purchaseCredits()` function
- **Content Creation**: Earn tokens by creating popular content
- **Content Consumption**: Earn tokens by watching and engaging with content
- **Viewer Activities**: Earn through platform engagement, comments, and sharing
- **Content Curation**: Earn tokens for quality curation activities
- **Participation Rewards**: Earn tokens through platform participation

### Token Sinks (Deflationary Mechanisms)
- **Content Consumption**: Tokens are burned when used to access content
- **Premium Feature Usage**: Certain features burn tokens when used
- **Governance Deposits**: Proposal submission requires token deposits
- **Quality Assurance**: Low-quality content penalties

### Velocity Control
Our economic model controls token velocity through:
- **Staking Incentives**: Rewards for long-term token holding
- **Governance Lockups**: Tokens used for governance are locked for voting periods
- **Tier-based Benefits**: Increased benefits for sustained token holdings

## Supply Distribution

The initial 100,000,000 STRM tokens are distributed as follows:

| Allocation | Percentage | Amount | Vesting |
|------------|------------|--------|---------|
| Platform Reserve | 30% | 30,000,000 | 4-year linear vesting |
| Creator Incentives | 25% | 25,000,000 | Unlocked based on milestones |
| User Growth Pool | 20% | 20,000,000 | Released through platform activity |
| Ecosystem Development | 10% | 10,000,000 | 2-year linear vesting |
| Initial Contributors | 10% | 10,000,000 | 3-year linear vesting with 1-year cliff |
| Community Treasury | 5% | 5,000,000 | Controlled by DAO governance |

## Token Mechanics

### Purchase Mechanism
```solidity
// From StreamingToken.sol
uint256 public constant CREDITS_PER_ETH = 100;

function purchaseCredits() public payable {
    uint256 credits = msg.value * CREDITS_PER_ETH;
    _mint(msg.sender, credits);
}
```

### Content Access Mechanism
```solidity
// From StreamingToken.sol
function startStream(string memory contentId) public {
    require(balanceOf(msg.sender) >= 1, "Insufficient credits");
    _burn(msg.sender, 1);
    streamExpiry[msg.sender][contentId] = block.timestamp + 1 hours;
}
```

### Stream Verification
```solidity
// From StreamingToken.sol
function canStream(address user, string memory contentId) public view returns (bool) {
    return streamExpiry[user][contentId] > block.timestamp;
}
```

## Staking Mechanism

The platform includes a staking system providing multiple benefits:

### Staking Tiers
| Tier | Required Stake | Benefits |
|------|----------------|----------|
| Bronze | 100 STREAM | 5% fee reduction, basic profile features |
| Silver | 1,000 STREAM | 10% fee reduction, enhanced discovery |
| Gold | 10,000 STREAM | 20% fee reduction, premium features, early access |
| Platinum | 100,000 STREAM | 30% fee reduction, revenue share, governance amplification |

### Staking Rewards
- **Base APY**: Stakers earn a base 5% APY in STREAM tokens
- **Activity Multipliers**: Platform participation increases staking rewards
- **Duration Bonuses**: Longer staking commitments receive enhanced rewards

## Governance System

The STREAM token enables comprehensive decentralized governance through a multi-layered approach:

### Consensus Mechanisms

The platform employs four specialized consensus mechanisms:

1. **Reputation-Weighted Proof of Stake (RWPoS)** - Combines token holdings with contributor reputation
2. **Quadratic Voting** - Prevents large stakeholder dominance for community-focused decisions
3. **Conviction Voting** - For resource allocation based on sustained support over time
4. **Delegated Expertise** - Specialized voting for technical decisions requiring domain knowledge

### Proposal Process
1. **Submission**: Token holders with 10,000+ STREAM can submit proposals
2. **Discussion**: 3-day discussion period for community feedback
3. **Voting**: 5-day voting period with voting mechanism selected based on proposal type
4. **Execution**: Automated execution of approved proposals via timelock controllers

### Governance Parameters
Each proposal type has defined thresholds and quorum requirements:

| Proposal Type | Approval Threshold | Min. Participation | Voting System |
|---------------|-------------------|-------------------|---------------|
| Protocol Upgrades | 66.7% | 30% | RWPoS |
| Parameter Updates | 60% | 20% | RWPoS |
| Resource Allocation | 51% | 15% | Conviction |
| Content Policies | 60% | 25% | Quadratic |
| Emergency Actions | 75% | 10% | Delegated |

### Risk Mitigation
- **Timelocks**: Delay periods between approval and execution (1-7 days based on impact)
- **Veto Power**: Emergency pause capability for malicious proposals
- **Parameter Bounds**: Limits on magnitude of parameter changes per proposal

## Token Metrics and Analytics

The platform provides real-time analytics on:

- **Token Circulation**: Amount of STREAM actively circulating
- **Burn Rate**: Tokens burned through platform usage
- **Creator Earnings**: Distribution of tokens to creators

## Security Considerations

The STREAM token implementation includes several security measures:

- **Controlled Minting**: Only specific platform contracts can mint new tokens
- **Rate Limiting**: Minting caps prevent unexpected inflation
- **Timelock Mechanisms**: Changes to token parameters have time delays
- **Circuit Breakers**: Emergency pause functionality for critical operations
- **Audit Trail**: Comprehensive event emission for all token operations

## Future Developments

Planned enhancements to the token economy include:

- **Layer 2 Integration**: Migration to Layer 2 solutions for reduced transaction costs
- **Cross-Chain Functionality**: Enabling STREAM to operate across multiple blockchains
- **Elastic Supply**: Algorithmic supply adjustments based on platform activity
- **Enhanced Reward Mechanisms**: More granular creator compensation models
- **NFT Integration**: STREAM token utility within NFT marketplace functions

- --

<div style="background: #f0f7ff; border-left: 4px solid #4361ee; padding: 1rem; margin-top: 2rem;">
  <h3 style="margin-top: 0;">Note on Tokenomics Evolution</h3>
  <p>
    The token economic model is designed to evolve through community governance. Parameters
    may change over time as the platform matures and the community makes decisions on its future direction.
  </p>
</div>

