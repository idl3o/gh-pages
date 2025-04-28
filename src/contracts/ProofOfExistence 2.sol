// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Proof of Existence
 * @dev Store and verify proofs of existence for content
 */
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
    
    // Event emitted when a new proof is registered
    event ProofRegistered(
        bytes32 indexed contentHash, 
        bytes32 quantumSignature, 
        uint256 timestamp,
        uint256 confidence,
        address indexed registeredBy
    );
    
    // Event emitted when a proof is verified
    event ProofVerified(
        bytes32 indexed contentHash, 
        bool exists, 
        address indexed verifiedBy
    );
    
    /**
     * @dev Register a new proof of existence
     * @param contentHash Hash of the content
     * @param quantumSignature Quantum signature of the content
     * @param confidence Confidence level (0-10000, representing 0-100.00%)
     */
    function registerProof(
        bytes32 contentHash, 
        bytes32 quantumSignature,
        uint256 confidence
    ) external {
        require(contentHash != bytes32(0), "Content hash cannot be empty");
        require(!proofs[contentHash].exists, "Proof already exists");
        require(confidence <= 10000, "Confidence must be <= 10000");
        
        proofs[contentHash] = Proof({
            quantumSignature: quantumSignature,
            timestamp: block.timestamp,
            confidence: confidence,
            registeredBy: msg.sender,
            exists: true
        });
        
        emit ProofRegistered(
            contentHash, 
            quantumSignature, 
            block.timestamp,
            confidence,
            msg.sender
        );
    }
    
    /**
     * @dev Verify if proof exists for content
     * @param contentHash Hash of the content
     * @return exists Whether proof exists
     * @return timestamp Timestamp when proof was registered
     */
    function verifyProof(bytes32 contentHash) 
        external 
        returns (bool exists, uint256 timestamp) 
    {
        Proof memory proof = proofs[contentHash];
        
        emit ProofVerified(contentHash, proof.exists, msg.sender);
        
        return (proof.exists, proof.timestamp);
    }
    
    /**
     * @dev Get detailed proof information
     * @param contentHash Hash of the content
     * @return quantumSignature Quantum signature of the content
     * @return confidence Confidence level
     * @return timestamp Timestamp when proof was registered
     * @return registeredBy Address that registered the proof
     */
    function getProofDetails(bytes32 contentHash) 
        external 
        view 
        returns (
            bytes32 quantumSignature, 
            uint256 confidence,
            uint256 timestamp,
            address registeredBy
        ) 
    {
        Proof memory proof = proofs[contentHash];
        require(proof.exists, "Proof does not exist");
        
        return (
            proof.quantumSignature,
            proof.confidence,
            proof.timestamp,
            proof.registeredBy
        );
    }
    
    /**
     * @dev Check if a proof exists (view function)
     * @param contentHash Hash of the content
     * @return Whether proof exists
     */
    function proofExists(bytes32 contentHash) external view returns (bool) {
        return proofs[contentHash].exists;
    }
}
