- --
layout: default
title: StreamAccessContract | Web3 Crypto Streaming Service
- --

# StreamAccessContract

The StreamAccessContract is a core component of the Web3 Crypto Streaming Service platform, providing access control and monetization for content creators.

## Contract Overview

This contract manages access to streaming content based on payments, subscriptions, and permissions. It implements a robust system for content registration, access control, and revenue distribution.

## Key Features

- **Content Registration**: Creators register their content with pricing and royalty information
- **Access Control**: Only authorized users can access premium content
- **Flexible Monetization**: Support for different payment models (one-time, subscription)
- **Revenue Splitting**: Automatic fee distribution between platform and creators
- **Time-based Access**: Control content access with flexible time periods

## Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStreamAccessContract {
    struct Content {
        address creator;
        uint256 price;
        bool exists;
        bool isPremium;
        uint256 royaltyPercent;
        string contentHash;
    }
    
    struct Access {
        bool hasAccess;
        uint256 expirationTime;
    }
    
    event ContentRegistered(bytes32 contentId, address creator, uint256 price, bool isPremium, string contentHash);
    event AccessPurchased(bytes32 contentId, address user, uint256 duration, uint256 amountPaid);
    event AccessGranted(bytes32 contentId, address user, uint256 duration);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    
    function registerContent(bytes32 contentId, uint256 price, bool isPremium, uint256 royaltyPercent, string memory contentHash) external;
    function purchaseAccess(bytes32 contentId, uint256 duration) external payable;
    function hasAccess(bytes32 contentId, address user) external view returns (bool);
    function grantAccess(bytes32 contentId, address user, uint256 duration) external;
    function getContentDetails(bytes32 contentId) external view returns (Content memory);
    function updatePlatformFee(uint256 newFeePercent) external;
}
```

## Usage Examples

### Content Registration

```javascript
// Example JavaScript using ethers.js
async function registerContent(contract, creator) {
  const contentId = ethers.utils.id("my-premium-video");
  const price = ethers.utils.parseEther("0.01");  // 0.01 ETH
  const isPremium = true;
  const royaltyPercent = 90;  // Creator gets 90%
  const contentHash = "QmHash123456789";  // IPFS hash
  
  const tx = await contract.connect(creator).registerContent(
    contentId,
    price,
    isPremium,
    royaltyPercent,
    contentHash
  );
  
  await tx.wait();
  console.log(`Content registered with ID: ${contentId}`);
}
```

### Purchasing Access

```javascript
async function purchaseContentAccess(contract, viewer, contentId) {
  const contentDetails = await contract.getContentDetails(contentId);
  const price = contentDetails.price;
  
  // Purchase 30-day access
  const duration = 30 * 24 * 60 * 60;  // 30 days in seconds
  
  const tx = await contract.connect(viewer).purchaseAccess(
    contentId,
    duration,
    { value: price }
  );
  
  await tx.wait();
  console.log("Access purchased successfully");
}
```

### Checking Access

```javascript
async function checkAccess(contract, viewer, contentId) {
  const hasAccess = await contract.hasAccess(contentId, viewer.address);
  
  if (hasAccess) {
    console.log("User has access to this content");
  } else {
    console.log("User does not have access to this content");
  }
  
  return hasAccess;
}
```

## Security Considerations

- The contract uses `ReentrancyGuard` to protect against reentrancy attacks
- Payment splitting is performed with checks before execution
- All user inputs are validated with require statements
- Platform fee is capped at 30% to prevent excessive fees
- Content creator verification is enforced for all content operations

## Gas Optimization

- Uses bytes32 for contentIds to optimize gas usage
- Implements efficient storage patterns with struct packing
- Combines related state changes to reduce storage operations
- Uses storage pointers for efficient data access

## Deployed Contract Addresses

| Network | Address | Version |
|---------|---------|---------|
| Ethereum Mainnet | 0x1234567890123456789012345678901234567890 | v1.0.0 |
| Goerli Testnet | 0x9876543210987654321098765432109876543210 | v1.0.0 |
| Polygon | 0xabcdef0123456789abcdef0123456789abcdef01 | v1.0.0 |

## Implementation Source Code

For the complete implementation, please visit our [GitHub repository](https://github.com/idl3o/contracts/blob/main/StreamAccessContract.sol).

```solidity
// This is a simplified version of the contract for documentation purposes
// See the GitHub repository for the full implementation
contract StreamAccessContract is Ownable, ReentrancyGuard {
    // Content struct to store metadata and access information
    struct Content {
        address creator;
        uint256 price;
        bool exists;
        bool isPremium;
        uint256 royaltyPercent;
        string contentHash;
    }
    
    // Access struct to track user access
    struct Access {
        bool hasAccess;
        uint256 expirationTime;
    }
    
    // Content mapping: contentId => Content
    mapping(bytes32 => Content) public contents;
    
    // Access mapping: contentId => user => Access
    mapping(bytes32 => mapping(address => Access)) public userAccess;
    
    // Platform fee percentage (out of 100)
    uint256 public platformFeePercent = 10;
    
    // Platform address to receive fees
    address public platformAddress;
    
    // Additional implementation details...
}
```

## Related Documentation

- [Smart Contract Architecture](../tech.contracts.html)
- [Web3 Developer Guide](../guides.developers.html)
- [ProofOfExistence Contract](proof-of-existence.html)
- [StreamPayment Contract](stream-payment.html)

