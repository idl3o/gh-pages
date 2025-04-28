// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ProofOfExistence {
    // Mapping from hash to timestamp
    mapping(string => uint256) private proofs;
    
    // Events
    event HashStored(string contentHash, address sender, uint256 timestamp);
    event HashVerified(string contentHash, bool exists, uint256 timestamp);
    
    // Store a hash on the blockchain
    function storeHash(string memory contentHash) public {
        require(proofs[contentHash] == 0, "Hash already exists");
        proofs[contentHash] = block.timestamp;
        emit HashStored(contentHash, msg.sender, block.timestamp);
    }
    
    // Verify if a hash exists
    function verifyHash(string memory contentHash) public view returns (bool) {
        return proofs[contentHash] != 0;
    }
    
    // Get the timestamp when a hash was stored
    function getTimestamp(string memory contentHash) public view returns (uint256) {
        require(proofs[contentHash] != 0, "Hash does not exist");
        return proofs[contentHash];
    }
}
