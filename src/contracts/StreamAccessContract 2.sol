// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title StreamAccessContract
 * @dev Manages access control for streaming content
 */
contract StreamAccessContract is Ownable, ReentrancyGuard {
    // Content struct to store metadata and access information
    struct Content {
        address creator;         // Content creator address
        uint256 price;           // Access price in wei
        bool exists;             // Whether content exists
        bool isPremium;          // Whether content is premium
        uint256 royaltyPercent;  // Creator royalty percentage (out of 100)
        string contentHash;      // IPFS or content identifier hash
    }
    
    // Access struct to track user access
    struct Access {
        bool hasAccess;          // Whether user has access
        uint256 expirationTime;  // When access expires (0 for permanent)
    }
    
    // Content mapping: contentId => Content
    mapping(bytes32 => Content) public contents;
    
    // Access mapping: contentId => user => Access
    mapping(bytes32 => mapping(address => Access)) public userAccess;
    
    // Platform fee percentage (out of 100)
    uint256 public platformFeePercent = 10;
    
    // Platform address to receive fees
    address public platformAddress;
    
    // Events
    event ContentRegistered(bytes32 contentId, address creator, uint256 price, bool isPremium, string contentHash);
    event AccessPurchased(bytes32 contentId, address user, uint256 duration, uint256 amountPaid);
    event AccessGranted(bytes32 contentId, address user, uint256 duration);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @dev Constructor sets the platform address
     * @param _platformAddress Address to receive platform fees
     */
    constructor(address _platformAddress) {
        require(_platformAddress != address(0), "Invalid platform address");
        platformAddress = _platformAddress;
    }
    
    /**
     * @dev Register new content
     * @param contentId Unique identifier for the content
     * @param price Price in wei to access the content
     * @param isPremium Whether this is premium content
     * @param royaltyPercent Percentage of payment to creator (out of 100)
     * @param contentHash IPFS or content hash
     */
    function registerContent(
        bytes32 contentId,
        uint256 price,
        bool isPremium,
        uint256 royaltyPercent,
        string memory contentHash
    ) external {
        require(contentId != bytes32(0), "Content ID cannot be empty");
        require(!contents[contentId].exists, "Content already exists");
        require(royaltyPercent > 0 && royaltyPercent <= 100, "Invalid royalty percentage");
        require(bytes(contentHash).length > 0, "Content hash cannot be empty");
        
        contents[contentId] = Content({
            creator: msg.sender,
            price: price,
            exists: true,
            isPremium: isPremium,
            royaltyPercent: royaltyPercent,
            contentHash: contentHash
        });
        
        emit ContentRegistered(contentId, msg.sender, price, isPremium, contentHash);
    }
    
    /**
     * @dev Purchase access to content
     * @param contentId ID of content to purchase
     * @param duration Duration of access in seconds (0 for permanent)
     */
    function purchaseAccess(bytes32 contentId, uint256 duration) external payable nonReentrant {
        Content storage content = contents[contentId];
        require(content.exists, "Content does not exist");
        require(msg.value >= content.price, "Insufficient payment");
        
        // Calculate fee split
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 creatorPayment = msg.value - platformFee;
        
        // Process payments
        (bool platformSuccess, ) = platformAddress.call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        (bool creatorSuccess, ) = content.creator.call{value: creatorPayment}("");
        require(creatorSuccess, "Creator payment failed");
        
        // Grant access
        uint256 expiryTime = duration == 0 ? 0 : block.timestamp + duration;
        userAccess[contentId][msg.sender] = Access({
            hasAccess: true,
            expirationTime: expiryTime
        });
        
        emit AccessPurchased(contentId, msg.sender, duration, msg.value);
    }
    
    /**
     * @dev Check if user has access to content
     * @param contentId Content to check access for
     * @param user User address to check
     * @return bool Whether user has valid access
     */
    function hasAccess(bytes32 contentId, address user) public view returns (bool) {
        Access storage access = userAccess[contentId][user];
        if (!access.hasAccess) {
            return false;
        }
        if (access.expirationTime == 0) {
            return true; // Permanent access
        }
        return access.expirationTime > block.timestamp;
    }
    
    /**
     * @dev Grant access to a user (creator or admin only)
     * @param contentId Content to grant access to
     * @param user User to grant access to
     * @param duration Duration of access in seconds (0 for permanent)
     */
    function grantAccess(bytes32 contentId, address user, uint256 duration) external {
        Content storage content = contents[contentId];
        require(content.exists, "Content does not exist");
        require(msg.sender == content.creator || msg.sender == owner(), "Not authorized");
        
        uint256 expiryTime = duration == 0 ? 0 : block.timestamp + duration;
        userAccess[contentId][user] = Access({
            hasAccess: true,
            expirationTime: expiryTime
        });
        
        emit AccessGranted(contentId, user, duration);
    }
    
    /**
     * @dev Get content details
     * @param contentId Content ID to query
     * @return Content details
     */
    function getContentDetails(bytes32 contentId) external view returns (Content memory) {
        require(contents[contentId].exists, "Content does not exist");
        return contents[contentId];
    }
    
    /**
     * @dev Update platform fee (owner only)
     * @param newFeePercent New platform fee percentage (out of 100)
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 30, "Fee cannot exceed 30%");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = newFeePercent;
        emit FeeUpdated(oldFee, newFeePercent);
    }
}
