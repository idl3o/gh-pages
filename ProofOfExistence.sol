// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ProofOfExistence
 * @dev Store and verify proofs of existence for digital content
 * @author Team MODSIAS
 * @notice This contract provides immutable timestamping and verification for digital content
 * @custom:security-contact security@web3streaming.com
 * @custom:platform-version 1.0.0
 */
contract ProofOfExistence {
    /**
     * @dev Structure to store proof details
     * @custom:entity-type Proof
     */
    struct Proof {
        bytes32 quantumSignature;  // Quantum-resistant signature of content
        uint256 timestamp;         // When the proof was registered
        uint256 confidence;        // Confidence level (0-10000, representing 0-100.00%)
        address registeredBy;      // Address that registered this proof
        bool exists;               // Whether this proof exists
    }

    /**
     * @dev Mapping from content hash to proof
     * @notice Stores all registered proofs indexed by content hash
     */
    mapping(bytes32 => Proof) private proofs;

    /**
     * @dev Event emitted when a new proof is registered
     * @param contentHash The hash of the content being proven
     * @param quantumSignature The quantum-resistant signature of the content
     * @param timestamp When the proof was registered
     * @param confidence Confidence level of the proof
     * @param registeredBy Address that registered this proof
     */
    event ProofRegistered(
        bytes32 indexed contentHash,
        bytes32 quantumSignature,
        uint256 timestamp,
        uint256 confidence,
        address indexed registeredBy
    );

    /**
     * @dev Event emitted when a proof is verified
     * @param contentHash The hash of the content being verified
     * @param exists Whether the proof exists
     * @param verifiedBy Address that requested verification
     */
    event ProofVerified(
        bytes32 indexed contentHash,
        bool exists,
        address indexed verifiedBy
    );

    /**
     * @notice Register a new proof of existence for content
     * @dev Creates an immutable record linking content to a timestamp and quantum signature
     * @param contentHash Hash of the content
     * @param quantumSignature Quantum signature of the content
     * @param confidence Confidence level (0-10000, representing 0-100.00%)
     * @custom:example
     * ```
     * // Register proof with 99.5% confidence
     * contract.registerProof(
     *   ethers.utils.id("content-hash"),
     *   ethers.utils.id("quantum-signature"),
     *   9950
     * )
     * ```
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
     * @notice Verify if proof exists for content
     * @dev Checks existence and emits verification event
     * @param contentHash Hash of the content
     * @return exists Whether proof exists
     * @return timestamp Timestamp when proof was registered
     * @custom:security Non-view function intentionally to log verification attempts
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
     * @notice Get detailed proof information
     * @dev Retrieves all stored details about a proof
     * @param contentHash Hash of the content
     * @return quantumSignature Quantum signature of the content
     * @return confidence Confidence level
     * @return timestamp Timestamp when proof was registered
     * @return registeredBy Address that registered the proof
     * @custom:requirements Proof must exist for the given content hash
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
     * @notice Check if a proof exists without logging
     * @dev View function that doesn't emit events, for efficient queries
     * @param contentHash Hash of the content
     * @return bool Whether proof exists
     */
    function proofExists(bytes32 contentHash) external view returns (bool) {
        return proofs[contentHash].exists;
    }
}
