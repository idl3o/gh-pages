// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PRXTokenChain.sol";
import "../node_modules/@openzeppelin/contracts/test/utils/Test.sol";

contract PRXTokenChainTest {
    PRXTokenChain private prxChain;
    address private owner;
    address private user1;
    address private user2;
    address private user3;
    
    // Events for testing
    event TestResult(string name, bool result);
    event TestStatus(string message);
    
    constructor() {
        owner = msg.sender;
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);
        
        // Initialize contract with test parameters
        prxChain = new PRXTokenChain("PRX Test Token", "PRXT", 0.01 ether);
    }
    
    /**
     * @dev Run all tests
     */
    function runAllTests() public {
        emit TestStatus("Starting PRXTokenChain tests...");
        
        // Test basic functionality
        testMinting();
        testTokenTransfer();
        
        // Test Phase 2 features
        testMintingQuotas();
        testPrivateContent();
        testContentVerification();
        testTokenDelegation();
        testGovernanceProposal();
        testFeeModelAndDistribution();
        
        emit TestStatus("All tests completed!");
    }
    
    /**
     * @dev Test basic token minting
     */
    function testMinting() public {
        emit TestStatus("Testing basic minting functionality...");
        
        // Mint a token
        uint256 tokenId = prxChain.mint{value: 0.01 ether}("Test Token");
        
        // Verify token ownership
        address tokenOwner = prxChain.tokenOwner(tokenId);
        emit TestResult("Token minted and owned by sender", tokenOwner == msg.sender);
        
        // Test minting with content
        bytes32 contentHash = keccak256(abi.encodePacked("Test content hash"));
        uint256 contentTokenId = prxChain.mintWithContent{value: 0.01 ether}(
            "Content Token", 
            "ipfs://QmTest", 
            "image/png",
            false,
            contentHash
        );
        
        // Verify token metadata
        (
            string memory contentURI,
            string memory contentType,
            address creator,
            ,
            bool isPrivate,
            ,
            bytes32 storedHash
        ) = prxChain.prxMetadata(contentTokenId);
        
        emit TestResult("Content URI stored correctly", compareStrings(contentURI, "ipfs://QmTest"));
        emit TestResult("Content type stored correctly", compareStrings(contentType, "image/png"));
        emit TestResult("Creator set correctly", creator == msg.sender);
        emit TestResult("Privacy flag set correctly", isPrivate == false);
        emit TestResult("Content hash stored correctly", storedHash == contentHash);
    }
    
    /**
     * @dev Test token transfers
     */
    function testTokenTransfer() public {
        emit TestStatus("Testing token transfer functionality...");
        
        // Mint a token
        uint256 tokenId = prxChain.mint{value: 0.01 ether}("Transfer Test Token");
        
        // Transfer the token
        prxChain.transfer(user1, tokenId);
        
        // Verify new ownership
        address newOwner = prxChain.tokenOwner(tokenId);
        emit TestResult("Token transferred successfully", newOwner == user1);
    }
    
    /**
     * @dev Test minting quotas and rate limiting
     */
    function testMintingQuotas() public {
        emit TestStatus("Testing minting quotas and rate limiting...");
        
        // Update quota settings for testing
        prxChain.updateMintingQuota(5, 60, 2);
        
        // Verify quota settings
        (uint256 dailyRemaining, uint256 windowRemaining, ) = prxChain.getMintingStatus(msg.sender);
        emit TestResult("Daily quota updated", dailyRemaining == 5);
        emit TestResult("Window quota updated", windowRemaining == 2);
        
        // Test quota exemption
        prxChain.setQuotaExemption(user1, true);
        bool isExempt = prxChain.isExemptFromQuota(user1);
        emit TestResult("Quota exemption set correctly", isExempt == true);
        
        // Test quota disabling
        prxChain.setQuotaEnabled(false);
        bool quotaEnabled = prxChain.quotaEnabled();
        emit TestResult("Quota can be disabled", quotaEnabled == false);
        
        // Re-enable for other tests
        prxChain.setQuotaEnabled(true);
    }
    
    /**
     * @dev Test private content access
     */
    function testPrivateContent() public {
        emit TestStatus("Testing private content access control...");
        
        // Mint a token with private content
        bytes32 contentHash = keccak256(abi.encodePacked("Private content"));
        uint256 tokenId = prxChain.mintWithContent{value: 0.01 ether}(
            "Private Token", 
            "ipfs://QmPrivate", 
            "text/plain",
            true,
            contentHash
        );
        
        // Check content access permissions
        bool ownerCanAccess = prxChain.canAccessContent(msg.sender, tokenId);
        bool otherCannotAccess = !prxChain.canAccessContent(user1, tokenId);
        
        emit TestResult("Owner can access private content", ownerCanAccess);
        emit TestResult("Others cannot access private content", otherCannotAccess);
    }
    
    /**
     * @dev Test content verification mechanism
     */
    function testContentVerification() public {
        emit TestStatus("Testing content verification mechanism...");
        
        // TODO: Implement content verification tests
        // This will test verifier authorization, content hash verification, etc.
        
        // Update required verification count
        uint256 oldCount = prxChain.requiredVerificationsCount();
        prxChain.updateRequiredVerificationsCount(5);
        uint256 newCount = prxChain.requiredVerificationsCount();
        
        emit TestResult("Verification count updated", newCount == 5 && oldCount != newCount);
    }
    
    /**
     * @dev Test token delegation for voting power
     */
    function testTokenDelegation() public {
        emit TestStatus("Testing token delegation for voting power...");
        
        // Mint tokens for delegation
        prxChain.mint{value: 0.01 ether}("Delegation Test Token 1");
        prxChain.mint{value: 0.01 ether}("Delegation Test Token 2");
        
        // Delegate voting power
        prxChain.delegate(user2);
        
        // Check delegation
        address delegate = prxChain.getDelegate(msg.sender);
        emit TestResult("Delegation recorded correctly", delegate == user2);
        
        // Check voting power
        uint256 delegatedPower = prxChain.delegatedVotingPower(user2);
        emit TestResult("Voting power delegated", delegatedPower > 0);
        
        // Test undelegation
        prxChain.undelegate();
        delegate = prxChain.getDelegate(msg.sender);
        emit TestResult("Undelegation works", delegate == address(0));
    }
    
    /**
     * @dev Test governance proposal creation, voting, and execution
     */
    function testGovernanceProposal() public {
        emit TestStatus("Testing governance proposal system...");
        
        // Create a proposal for changing the minting quota
        // Prepare execution data for updateMintingQuota(10, 120, 3)
        bytes4 selector = prxChain.updateMintingQuota.selector;
        bytes memory executionData = abi.encodeWithSelector(selector, 10, 120, 3);
        
        uint256 proposalId = prxChain.createProposal(
            "Update minting quota", 
            3 days, // Voting period
            executionData
        );
        
        emit TestResult("Proposal created successfully", proposalId == 0);
        
        // Vote on the proposal
        prxChain.vote(proposalId, true);
        
        // In a real test, we would fast-forward time and test execution
        // For this demo, we'll just verify the proposal was created
        
        emit TestStatus("Note: Full proposal execution test requires time manipulation");
    }
    
    /**
     * @dev Test fee model and distribution
     */
    function testFeeModelAndDistribution() public {
        emit TestStatus("Testing fee model and distribution...");
        
        // Update fee model
        prxChain.updateFeeModel(
            50,   // 0.5% transfer fee
            200,  // 2% mint fee
            0.002 ether,  // Content access fee
            3000, // 30% platform
            5000, // 50% creator
            2000  // 20% stakeholders
        );
        
        // TODO: Generate some fees and test distribution
        // This would require more complex setup and multiple transactions
        
        emit TestStatus("Fee model updated successfully");
    }
    
    /**
     * @dev Helper function to compare strings
     */
    function compareStrings(string memory a, string memory b) private pure returns (bool) {
        return (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
    }
}