// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ProofOfExistence
 * @dev Enhanced contract for establishing proof of content ownership and existence
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
    
    // Events
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
     * @dev Verify if a proof exists for content
     * @param contentHash Hash of the content to verify
     * @return bool Whether proof exists
     */
    function verifyProof(bytes32 contentHash) external returns (bool) {
        bool exists = proofs[contentHash].exists;
        
        if (exists) {
            emit ProofVerified(
                contentHash,
                true,
                proofs[contentHash].timestamp
            );
        }
        
        return exists;
    }
    
    /**
     * @dev Get proof details
     * @param contentHash Hash of the content
     * @return quantumSignature The quantum signature
     * @return timestamp When the proof was registered
     * @return confidence Confidence level
     * @return registeredBy Who registered the proof
     */
    function getProofDetails(bytes32 contentHash) external view returns (
        bytes32 quantumSignature,
        uint256 timestamp,
        uint256 confidence,
        address registeredBy
    ) {
        require(proofs[contentHash].exists, "Proof does not exist");
        
        Proof storage proof = proofs[contentHash];
        return (
            proof.quantumSignature,
            proof.timestamp,
            proof.confidence,
            proof.registeredBy
        );
    }
    
    /**
     * @dev Get timestamp when a hash was registered
     * @param contentHash Hash of the content
     * @return uint256 Timestamp when registered
     */
    function getTimestamp(bytes32 contentHash) external view returns (uint256) {
        require(proofs[contentHash].exists, "Proof does not exist");
        return proofs[contentHash].timestamp;
    }
    
    /**
     * @dev Get confidence level for a registered proof
     * @param contentHash Hash of the content
     * @return uint256 Confidence level (0-10000)
     */
    function getConfidence(bytes32 contentHash) external view returns (uint256) {
        require(proofs[contentHash].exists, "Proof does not exist");
        return proofs[contentHash].confidence;
    }
    
    /**
     * @dev Register proof with certificate information for educational content
     * @param contentHash Hash of the content
     * @param certificateSignature Signature for the certificate
     * @param completionScore Score of completion (0-10000)
     */
    function registerProofWithCertificate(
        bytes32 contentHash,
        bytes32 certificateSignature,
        uint256 completionScore
    ) external {
        require(contentHash != bytes32(0), "Content hash cannot be empty");
        require(!proofs[contentHash].exists, "Proof already exists");
        require(completionScore <= 10000, "Score must be <= 10000");
        
        proofs[contentHash] = Proof({
            quantumSignature: certificateSignature,
            timestamp: block.timestamp,
            confidence: completionScore,
            registeredBy: msg.sender,
            exists: true
        });
        
        emit ProofRegistered(
            contentHash,
            certificateSignature,
            block.timestamp,
            completionScore,
            msg.sender
        );
    }
}
