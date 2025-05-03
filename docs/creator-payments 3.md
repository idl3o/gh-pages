- --
layout: default
title: Creator Payment System | Web3 Crypto Streaming Service
- --

# Creator Payment System

This document details the payment mechanisms available to creators on the Web3 Crypto Streaming Service platform, explaining payment schedules, withdrawal options, and tokenomics.

## Payment Overview

Content creators on our platform can earn revenue through multiple monetization methods, with all payments tracked transparently on-chain. Our payment system offers unprecedented flexibility, transparency, and immediacy compared to traditional streaming platforms.

## Revenue Streams

### 1. Direct Payments

Creators receive direct payments through:

- **Pay-per-view access**: One-time payments from viewers purchasing access to content
- **Subscription payments**: Recurring revenue from viewer subscriptions
- **Tips/donations**: Optional additional payments from viewers

### 2. Per-Second Streaming Payments

Our innovative StreamPayment contract enables real-time payment streaming:

- Viewers can stream payments to creators at a specified rate per second
- Payments accumulate continuously while content is being watched
- Creators can withdraw available funds at any time without waiting for payment cycles

### 3. Token Rewards

Creators earn STREAM tokens through:

- Platform engagement rewards
- Content quality incentives
- Active participation in governance

## Payment Schedule

### Immediate Payments

The following payments are available to creators immediately:

| Payment Type | Availability | Withdrawal Method |
|--------------|--------------|-------------------|
| Streaming payments | Real-time accrual, instant withdrawal | Creator dashboard |
| Pay-per-view purchases | Available after 1-hour confirmation period | Creator dashboard |
| Tips/donations | Immediately after transaction confirmation | Creator dashboard |

### Scheduled Rewards

Token rewards and bonus distributions follow this schedule:

| Reward Type | Distribution Frequency | Requirements |
|-------------|------------------------|--------------|
| Engagement rewards | Weekly (every Monday) | Minimum 3 active viewers |
| Quality incentives | Monthly (1st of month) | Content quality score >70% |
| Governance rewards | After proposal completion | Active participation in voting |

## Withdrawal Options

### On-Chain Withdrawals

Creators can withdraw their earnings directly to their wallet:

```solidity
// From StreamPayment.sol
function withdraw(bytes32 streamId) public nonReentrant {
    Stream storage stream = streams[streamId];
    
    require(stream.recipient == msg.sender, "Only recipient can withdraw");
    require(stream.balance > 0, "No funds available");
    
    uint256 elapsedTime = stream.stop > 0 
        ? stream.stop - stream.start 
        : block.timestamp - stream.start;
    
    uint256 totalAccrued = elapsedTime * stream.rate;
    uint256 available = totalAccrued - stream.withdrawn;
    
    require(available > 0, "No new funds to withdraw");
    
    // Update withdrawn amount
    stream.withdrawn += available;
    
    // Transfer funds
    payable(msg.sender).transfer(available);
    
    emit Withdrawal(streamId, stream.recipient, available);
}
```

### Automated Payments

Creators can configure automatic payments:

1. **Auto-withdrawal**: Set thresholds for automatic transfers to your wallet
2. **Split payments**: Configure automatic distributions to multiple wallets
3. **HODL mode**: Automatically convert earnings to STREAM tokens for staking

## Fee Structure

Our platform uses a transparent fee model:

| Revenue Type | Platform Fee | Creator Share | Notes |
|--------------|--------------|---------------|-------|
| Pay-per-view | 10% | 90% | Fee reducible through staking |
| Subscriptions | 8% | 92% | Fee reducible through staking |
| Streaming payments | 5% | 95% | Lowest fee category |
| Tips/donations | 3% | 97% | Minimal platform fee |

Creators can reduce their fees by staking STREAM tokens (see [Token Economics](tech.token.html) for details).

## Payment Analytics

The creator dashboard provides comprehensive payment analytics:

- Real-time revenue tracking
- Viewer payment patterns and demographics
- Revenue source breakdowns
- Historical payout records
- Projection tools and revenue forecasting

## Pay Day Boost System

To incentivize regular content creation, we've implemented a "Pay Day Boost" system:

1. **Weekly Pay Day**: Every Friday, creators who published at least 3 pieces of content during the week receive a 10% bonus on all earnings
2. **Monthly Milestone**: Creators who maintain consistent weekly publishing for a full month receive a 25% bonus on that month's earnings
3. **Loyalty Multiplier**: Each consecutive month of meeting publishing targets increases the monthly bonus by 5% (up to 50%)

## Implementing Payment Streams in Your Content

Content creators can implement payment streams using our SDK:

```javascript
// Example implementation
import { web3Service } from '../services/Web3Service';

async function setupPaymentStream() {
  // Get viewer's connected wallet address
  const viewerAddress = await web3Service.getAccount();
  
  // Set payment rate (0.0001 ETH per second)
  const ratePerSecond = "0.0001";
  
  // Set initial deposit (1 ETH)
  const initialDeposit = "1";
  
  try {
    // Create the payment stream with the creator's address
    const streamId = await web3Service.createPaymentStream(
      creatorAddress,
      ratePerSecond,
      initialDeposit
    );
    
    console.log(`Payment stream created! Stream ID: ${streamId}`);
    
    // Now content playback can begin
    startContentPlayback();
    
    return streamId;
  } catch (error) {
    console.error("Failed to create payment stream:", error);
    throw error;
  }
}
```

## Security and Dispute Resolution

Our payment system includes several security features:

- **Payment verification**: All transactions are verified on-chain
- **Escrow options**: Available for large transactions or premium content
- **Dispute resolution**: On-chain evidence for payment disputes
- **Fraud protection**: Anomaly detection for suspicious payment patterns

## Next Steps

- [Set up your creator payment profile](guides.creators.payments.html)
- [Configure your automated payment rules](guides.creators.payment-settings.html)
- [Learn about tax implications](guides.creators.tax-considerations.html)
- [Optimize your revenue streams](guides.creators.monetization-strategies.html)

- --

<div style="background: #f0f7ff; border-left: 4px solid #4361ee; padding: 1rem; margin-top: 2rem;">
  <h3 style="margin-top: 0;">Important</h3>
  <p>
    All payments on the platform are handled through smart contracts with immutable code. 
    Always verify transaction details before confirming any financial operation.
  </p>
</div>

