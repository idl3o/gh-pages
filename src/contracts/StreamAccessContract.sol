// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title StreamAccessContract
 * @dev Manages access control for crypto streaming content
 * @author Team MODSIAS
 * @notice This contract handles content registration, access control, and payment distribution
 * @custom:security-contact security@web3streaming.com
 * @custom:platform-version 1.0.0
 */
contract StreamAccessContract {
    /**
     * @dev Content struct to store metadata and access information
     * @custom:entity-type Content
     */
    struct Content {
        address creator;         // Content creator address
        uint256 price;           // Access price in wei
        bool exists;             // Whether content exists
        bool isPremium;          // Whether content is premium
        uint256 royaltyPercent;  // Creator royalty percentage (out of 100)
        string contentHash;      // IPFS or content identifier hash
    }

    /**
     * @dev Access struct to track user access
     * @custom:entity-type Access
     */
    struct Access {
        bool hasAccess;          // Whether user has access
        uint256 expirationTime;  // When access expires (0 for permanent)
    }

    /**
     * @dev Content mapping: contentId => Content
     * @notice Stores all registered content details
     */
    mapping(bytes32 => Content) public contents;

    /**
     * @dev Access mapping: contentId => user => Access
     * @notice Tracks which users have access to which content
     */
    mapping(bytes32 => mapping(address => Access)) public userAccess;

    /**
     * @dev Platform fee percentage (out of 100)
     * @notice Current percentage fee taken by the platform
     */
    uint256 public platformFeePercent = 10;

    /**
     * @dev Platform wallet to receive fees
     * @notice The wallet address where platform fees are sent
     */
    address payable public platformWallet;

    // Events
    /**
     * @dev Emitted when new content is registered
     * @param contentId The unique identifier of the registered content
     * @param creator The address of the content creator
     * @param isPremium Whether the content is premium or not
     * @param price The access price set for the content
     */
    event ContentRegistered(bytes32 indexed contentId, address indexed creator, bool isPremium, uint256 price);

    /**
     * @dev Emitted when access is granted to a user
     * @param contentId The unique identifier of the content
     * @param user The address that received access
     * @param expirationTime When the access expires (0 = permanent)
     */
    event AccessGranted(bytes32 indexed contentId, address indexed user, uint256 expirationTime);

    /**
     * @dev Emitted when content price is updated
     * @param contentId The unique identifier of the content
     * @param newPrice The new price for accessing the content
     */
    event ContentPriceUpdated(bytes32 indexed contentId, uint256 newPrice);

    /**
     * @dev Emitted when a creator receives a royalty payment
     * @param contentId The unique identifier of the content
     * @param creator The address of the content creator
     * @param amount The amount paid to the creator
     */
    event RoyaltyPaid(bytes32 indexed contentId, address indexed creator, uint256 amount);

    /**
     * @dev Emitted when platform fee is paid
     * @param contentId The unique identifier of the content
     * @param amount The amount paid to the platform
     */
    event PlatformFeePaid(bytes32 indexed contentId, uint256 amount);

    /**
     * @dev Sets the platform wallet address on contract creation
     * @param _platformWallet The wallet address that will receive platform fees
     * @notice Initializes the contract with the platform wallet that manages fee collection
     */
    constructor(address payable _platformWallet) {
        platformWallet = _platformWallet;
    }

    /**
     * @notice Register new streaming content
     * @dev Creates a new content entry in the contents mapping
     * @param contentId Unique content identifier
     * @param price Access price in wei (0 for free)
     * @param isPremium Whether the content is premium
     * @param royaltyPercent Creator royalty percentage for secondary sales
     * @param contentHash IPFS or content identifier hash
     * @custom:examples
     * ```
     * // Register a premium content with 0.1 ETH price and 80% royalty
     * contract.registerContent(
     *   ethers.utils.id("content-123"),
     *   ethers.utils.parseEther("0.1"),
     *   true,
     *   80,
     *   "ipfs://QmXyZ..."
     * )
     * ```
     */
    function registerContent(
        bytes32 contentId,
        uint256 price,
        bool isPremium,
        uint256 royaltyPercent,
        string memory contentHash
    ) external {
        require(!contents[contentId].exists, "Content already registered");
        require(royaltyPercent <= 100, "Royalty cannot exceed 100%");

        contents[contentId] = Content({
            creator: msg.sender,
            price: price,
            exists: true,
            isPremium: isPremium,
            royaltyPercent: royaltyPercent,
            contentHash: contentHash
        });

        // If free content, grant access to creator automatically
        if (price == 0) {
            userAccess[contentId][msg.sender] = Access({
                hasAccess: true,
                expirationTime: 0 // Permanent access
            });
        }

        emit ContentRegistered(contentId, msg.sender, isPremium, price);
    }

    /**
     * @notice Purchase access to content
     * @dev Processes payment, splits fees, and grants access to content
     * @param contentId Content identifier to purchase
     * @param duration Access duration in seconds (0 for permanent)
     * @custom:security This function handles payments and should be carefully audited
     */
    function purchaseAccess(bytes32 contentId, uint256 duration) external payable {
        Content memory content = contents[contentId];
        require(content.exists, "Content does not exist");
        require(msg.value >= content.price, "Insufficient payment");

        // Calculate platform fee and creator payment
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 creatorPayment = msg.value - platformFee;

        // Pay platform fee
        platformWallet.transfer(platformFee);
        emit PlatformFeePaid(contentId, platformFee);

        // Pay creator royalty
        payable(content.creator).transfer(creatorPayment);
        emit RoyaltyPaid(contentId, content.creator, creatorPayment);

        // Calculate access expiration
        uint256 expirationTime = duration > 0 ? block.timestamp + duration : 0;

        // Grant access
        userAccess[contentId][msg.sender] = Access({
            hasAccess: true,
            expirationTime: expirationTime
        });

        emit AccessGranted(contentId, msg.sender, expirationTime);
    }

    /**
     * @notice Check if a user has access to content
     * @dev Verifies access status considering expiration time
     * @param contentId Content identifier
     * @param user User address
     * @return bool Whether user has access
     */
    function hasAccess(bytes32 contentId, address user) public view returns (bool) {
        Access memory access = userAccess[contentId][user];

        if (!access.hasAccess) {
            return false;
        }

        // If expiration is 0, access is permanent
        if (access.expirationTime == 0) {
            return true;
        }

        // Otherwise, check if access has expired
        return block.timestamp <= access.expirationTime;
    }

    /**
     * @notice Grant free access to a user (creator only)
     * @dev Allows content creators to grant access to specific users
     * @param contentId Content identifier
     * @param user User address
     * @param duration Access duration in seconds (0 for permanent)
     * @custom:permissions Only the content creator can call this function
     */
    function grantAccess(bytes32 contentId, address user, uint256 duration) external {
        Content memory content = contents[contentId];
        require(content.exists, "Content does not exist");
        require(msg.sender == content.creator, "Only creator can grant access");

        // Calculate expiration
        uint256 expirationTime = duration > 0 ? block.timestamp + duration : 0;

        // Grant access
        userAccess[contentId][user] = Access({
            hasAccess: true,
            expirationTime: expirationTime
        });

        emit AccessGranted(contentId, user, expirationTime);
    }

    /**
     * @notice Update content price (creator only)
     * @dev Allows content creators to change their content's price
     * @param contentId Content identifier
     * @param newPrice New price in wei
     * @custom:permissions Only the content creator can call this function
     */
    function updateContentPrice(bytes32 contentId, uint256 newPrice) external {
        Content storage content = contents[contentId];
        require(content.exists, "Content does not exist");
        require(msg.sender == content.creator, "Only creator can update price");

        content.price = newPrice;
        emit ContentPriceUpdated(contentId, newPrice);
    }

    /**
     * @notice Update platform fee percentage (platform wallet only)
     * @dev Allows the platform to adjust its fee percentage
     * @param newFeePercent New fee percentage
     * @custom:permissions Only the platform wallet can call this function
     * @custom:limits Fee cannot exceed 30%
     */
    function updatePlatformFee(uint256 newFeePercent) external {
        require(msg.sender == platformWallet, "Only platform wallet can update fee");
        require(newFeePercent <= 30, "Fee cannot exceed 30%");
        platformFeePercent = newFeePercent;
    }

    /**
     * @notice Get content details
     * @dev Retrieves all metadata for a specific content
     * @param contentId Content identifier
     * @return creator Creator address
     * @return price Access price
     * @return isPremium Whether content is premium
     * @return royaltyPercent Creator royalty percentage
     * @return contentHash Content identifier hash
     */
    function getContentDetails(bytes32 contentId) external view returns (
        address creator,
        uint256 price,
        bool isPremium,
        uint256 royaltyPercent,
        string memory contentHash
    ) {
        Content memory content = contents[contentId];
        require(content.exists, "Content does not exist");

        return (
            content.creator,
            content.price,
            content.isPremium,
            content.royaltyPercent,
            content.contentHash
        );
    }
}
