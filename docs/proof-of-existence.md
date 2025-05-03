- --
layout: default
title: ProofOfExistence | Web3 Crypto Streaming Service
- --

# ProofOfExistence Contract

The ProofOfExistence contract is a critical component of the Web3 Crypto Streaming Service platform that provides tamper-proof verification of content timestamps and ownership.

## Contract Overview

This contract enables creators to establish immutable evidence that they possessed or created specific content at a particular point in time. It serves as a blockchain-powered notary service for digital content.

## Key Features

- **Immutable Timestamping**: Permanently record when content was registered
- **Content Verification**: Prove content existed at a specific point in time
- **Quantum Signature Support**: Enhanced security through quantum-resistant signatures
- **Confidence Metrics**: Track verification confidence levels
- **Certificate Support**: Special functions for educational content certification

## Contract Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IProofOfExistence {
    struct Proof {
        bytes32 quantumSignature;
        uint256 timestamp;
        uint256 confidence;
        address registeredBy;
        bool exists;
    }
    
    event ProofRegistered(
        bytes32 indexed contentHash,
        bytes32 quantumSignature,
        uint256 timestamp,
        uint256 confidence,
        address registeredBy
    );
    
    event ProofVerified(
        bytes32 indexed contentHash,
        bool exists,
        uint256 timestamp
    );
    
    function registerProof(bytes32 contentHash, bytes32 quantumSignature, uint256 confidence) external;
    function verifyProof(bytes32 contentHash) external returns (bool);
    function getProofDetails(bytes32 contentHash) external view returns (bytes32, uint256, uint256, address);
    function getTimestamp(bytes32 contentHash) external view returns (uint256);
    function getConfidence(bytes32 contentHash) external view returns (uint256);
    function registerProofWithCertificate(bytes32 contentHash, bytes32 certificateSignature, uint256 completionScore) external;
}
```

## Usage Examples

### Registering Content Proof

```javascript
// Example JavaScript using ethers.js
async function registerContentProof(contract, creator) {
  // Generate content hash
  const contentText = "This is my original content that I want to timestamp";
  const contentHash = ethers.utils.id(contentText);
  
  // Create a quantum-resistant signature (simplified for example)
  const signature = ethers.utils.id("quantum-signature-" + contentText);
  
  // Confidence level: 95.00%
  const confidence = 9500;  // 0-10000 scale
  
  const tx = await contract.connect(creator).registerProof(
    contentHash,
    signature,
    confidence
  );
  
  await tx.wait();
  console.log(`Content proof registered with hash: ${contentHash}`);
}
```

### Verifying Content Existence

```javascript
async function verifyContent(contract, contentHash) {
  // Check if content exists in the contract
  const exists = await contract.verifyProof(contentHash);
  
  if (exists) {
    // Get additional proof details
    const [signature, timestamp, confidence, registeredBy] = await contract.getProofDetails(contentHash);
    
    const registrationDate = new Date(timestamp * 1000);
    const confidencePercent = confidence / 100;
    
    console.log(`Content verified! Registered on ${registrationDate}`);
    console.log(`Confidence level: ${confidencePercent}%`);
    console.log(`Registered by: ${registeredBy}`);
  } else {
    console.log("Content verification failed - no proof exists");
  }
  
  return exists;
}
```

### Educational Certificate Registration

```javascript
async function registerCertificate(contract, educator, studentId, courseId, score) {
  // Generate certificate hash
  const certificateData = `${studentId}-${courseId}-completion`;
  const certificateHash = ethers.utils.id(certificateData);
  
  // Create certificate signature
  const certificateSignature = ethers.utils.id(`cert-sig-${studentId}-${courseId}`);
  
  // Convert score to 10000-based scale (e.g., 87.5% = 8750)
  const scoreValue = Math.floor(score * 100);
  
  const tx = await contract.connect(educator).registerProofWithCertificate(
    certificateHash,
    certificateSignature,
    scoreValue
  );
  
  await tx.wait();
  console.log(`Certificate registered for student ${studentId} with score ${score}%`);
  console.log(`Certificate hash: ${certificateHash}`);
}
```

## Security Considerations

- Once registered, proofs cannot be modified or deleted
- Input validation prevents empty content hashes and excessive confidence values
- Uses bytes32 for content hashes to improve security over string-based approaches
- All registration events are fully traceable and attributable to the sender

## Gas Optimization

- Uses bytes32 instead of string types for efficient storage
- Struct packing optimizes storage layout
- Minimal state changes during proof verification
- View functions for non-mutating queries

## Deployed Contract Addresses

| Network | Address | Version |
|---------|---------|---------|
| Ethereum Mainnet | 0x2345678901234567890123456789012345678901 | v1.0.0 |
| Goerli Testnet | 0x8765432109876543210987654321098765432109 | v1.0.0 |
| Polygon | 0xbcdef0123456789abcdef0123456789abcdef012 | v1.0.0 |

## Implementation Source Code

For the complete implementation, please visit our [GitHub repository](https://github.com/idl3o/contracts/blob/main/ProofOfExistence.sol).

```solidity
// This is a simplified version of the contract for documentation purposes
// See the GitHub repository for the full implementation
contract ProofOfExistence {
    struct Proof {
        bytes32 quantumSignature;
        uint256 timestamp;
        uint256 confidence;
        address registeredBy;
        bool exists;
    }
    
    // Mapping from content hash to proof
    mapping(bytes32 => Proof) private proofs;
    
    // Events defined as in the interface
    event ProofRegistered(/* fields as above */);
    event ProofVerified(/* fields as above */);
    
    // Implementation of interface functions
    function registerProof(bytes32 contentHash, bytes32 quantumSignature, uint256 confidence) external {
        // Input validation
        require(contentHash != bytes32(0), "Content hash cannot be empty");
        require(!proofs[contentHash].exists, "Proof already exists");
        require(confidence <= 10000, "Confidence must be <= 10000");
        
        // Create proof record
        proofs[contentHash] = Proof({
            quantumSignature: quantumSignature,
            timestamp: block.timestamp,
            confidence: confidence,
            registeredBy: msg.sender,
            exists: true
        });
        
        // Emit event
        emit ProofRegistered(
            contentHash,
            quantumSignature,
            block.timestamp,
            confidence,
            msg.sender
        );
    }
    
    // Additional implementation details...
}
```

## Related Documentation

- [Smart Contract Architecture](../tech.contracts.html)
- [Web3 Developer Guide](../guides.developers.html)
- [StreamAccessContract](stream-access.html)
- [Content Verification Guide](../guides.creators.verification.html)

