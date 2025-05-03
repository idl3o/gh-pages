- --
layout: default
title: Smart Contracts | Web3 Crypto Streaming Service
- --

# Smart Contract Architecture

The Web3 Crypto Streaming Service relies on a suite of interconnected smart contracts to enable its decentralized functionality. This document provides technical details about our smart contract architecture.

## Contract Overview

Our smart contracts are developed using Solidity and deployed on an EVM-compatible blockchain. The system uses a modular design with upgradeable components to allow for future improvements while maintaining security.

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Content Registry   │────▶│  Access Control     │────▶│  Payment Splitter   │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          ▲                           ▲                           ▲
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│  Creator Profiles   │────▶│  Subscription       │────▶│  Treasury           │
│                     │     │  Manager            │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          ▲                           ▲                           ▲
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      │
                              ┌───────────────────┐
                              │                   │
                              │  Governance       │
                              │                   │
                              └───────────────────┘
```

## Core Contracts

### ContentRegistry.sol

This contract manages the registration and indexing of all content on the platform.

```solidity
// ContentRegistry.sol (simplified)
contract ContentRegistry {
    struct ContentItem {
        address creator;
        string contentHash;
        string metadataHash;
        uint256 timestamp;
        ContentType contentType;
        AccessType accessType;
    }
    
    enum ContentType { VIDEO, AUDIO, DOCUMENT, OTHER }
    enum AccessType { FREE, ONETIME_PAYMENT, SUBSCRIPTION }
    
    mapping(uint256 => ContentItem) public contentItems;
    uint256 public itemCount;
    
    // Content registration function
    function registerContent(
        string memory _contentHash,
        string memory _metadataHash,
        ContentType _contentType,
        AccessType _accessType
    ) external returns (uint256) {
        // Implementation details
    }
    
    // Content query functions
    function getContentByCreator(address _creator) external view returns (uint256[] memory);
    function getContentDetails(uint256 _contentId) external view returns (ContentItem memory);
    
    // Content management functions
    function updateContentMetadata(uint256 _contentId, string memory _newMetadataHash) external;
    function removeContent(uint256 _contentId) external;
}
```

### SubscriptionManager.sol

Manages recurring payments and subscription access to content.

```solidity
// SubscriptionManager.sol (simplified)
contract SubscriptionManager {
    struct Subscription {
        address subscriber;
        address creator;
        uint256 planId;
        uint256 startTime;
        uint256 endTime;
        bool autoRenew;
    }
    
    struct SubscriptionPlan {
        address creator;
        string name;
        uint256 price; // In STREAM tokens
        uint256 duration; // In seconds
        string[] benefits;
    }
    
    mapping(uint256 => SubscriptionPlan) public subscriptionPlans;
    mapping(address => mapping(address => Subscription)) public subscriptions;
    
    // Plan management functions
    function createPlan(string memory _name, uint256 _price, uint256 _duration) external returns (uint256);
    function updatePlan(uint256 _planId, string memory _name, uint256 _price, uint256 _duration) external;
    
    // Subscription functions
    function subscribe(address _creator, uint256 _planId, bool _autoRenew) external;
    function cancelSubscription(address _creator) external;
    function renewSubscription(address _subscriber, address _creator) external;
    
    // Query functions
    function hasActiveSubscription(address _subscriber, address _creator) external view returns (bool);
    function getSubscriptionDetails(address _subscriber, address _creator) external view returns (Subscription memory);
}
```

### PaymentSplitter.sol

Handles the distribution of payments between creators, platform, and other stakeholders.

```solidity
// PaymentSplitter.sol (simplified)
contract PaymentSplitter {
    struct PaymentSplit {
        address creator;
        uint256 creatorShare; // In basis points (100 = 1%)
        uint256 platformShare; // In basis points
        uint256 treasuryShare; // In basis points
        address[] additionalRecipients;
        uint256[] additionalShares;
    }
    
    mapping(address => PaymentSplit) public paymentSplits;
    
    // Split configuration functions
    function setDefaultSplit(address _creator) external;
    function setCustomSplit(
        address _creator, 
        uint256 _creatorShare, 
        address[] memory _additionalRecipients, 
        uint256[] memory _additionalShares
    ) external;
    
    // Payment functions
    function processPayment(address _creator, uint256 _amount) external;
    function batchProcessPayments(address[] memory _creators, uint256[] memory _amounts) external;
    
    // Query functions
    function calculateSplits(address _creator, uint256 _amount) external view returns (address[] memory recipients, uint256[] memory amounts);
}
```

## Auxiliary Contracts

### CreatorProfiles.sol

Manages creator identity, verification, and profile information.

### AccessControl.sol

Handles permissions for content access based on payments or subscriptions.

### Treasury.sol

Manages community funds and platform revenue allocation.

### Governance.sol

Enables token-based voting on platform parameters and upgrades.

## Security Features

Our smart contracts implement several security measures:

- **Pausable functionality**: Critical functions can be paused in case of emergencies
- **Access control**: Role-based permissions for administrative functions
- **Reentrancy guards**: Protection against reentrancy attacks
- **Integer overflow protection**: Using SafeMath libraries or Solidity 0.8+ built-in overflow checks
- **Upgradeable patterns**: Proxy-based upgradeability for contract improvements
- **Formal verification**: Critical components undergo formal verification
- **Multiple audits**: All contracts are audited by independent security firms

## Deployments

| Contract Name | Network | Address | Version |
|---------------|---------|---------|---------|
| ContentRegistry | Mainnet | 0x1234... | v1.0.0 |
| SubscriptionManager | Mainnet | 0x2345... | v1.0.0 |
| PaymentSplitter | Mainnet | 0x3456... | v1.0.0 |
| CreatorProfiles | Mainnet | 0x4567... | v1.0.0 |
| AccessControl | Mainnet | 0x5678... | v1.0.0 |
| Treasury | Mainnet | 0x6789... | v1.0.0 |
| Governance | Mainnet | 0x7890... | v1.0.0 |

## Development Guidelines

For developers looking to integrate with our smart contracts:

1. Always use the latest deployed versions
2. Interact through our official SDKs when possible
3. Test thoroughly on testnet before mainnet deployment
4. Follow our security best practices guide
5. Submit potential bugs to our bug bounty program

## Next Steps

- View the [complete source code](https://github.com/web3-streaming/contracts)
- Read the [integration documentation](guides.developers.html)
- Explore the [governance mechanism](gov.overview.html)

- --

<div style="background: #f0f7ff; border-left: 4px solid #4361ee; padding: 1rem; margin-top: 2rem;">
  <h3 style="margin-top: 0;">Important</h3>
  <p>
    This documentation covers the conceptual architecture. For the most up-to-date technical details, 
    always refer to the official GitHub repository and deployed contract addresses.
  </p>
</div>

