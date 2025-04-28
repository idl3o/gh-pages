// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./StreamingToken.sol";

/**
 * @title ContentRegistry
 * @dev Registry for managing content metadata on the Web3 streaming platform
 */
contract ContentRegistry is Ownable, ReentrancyGuard {
    // Reference to the Streaming Token contract
    StreamingToken public streamingToken;

    // Content structure
    struct Content {
        string contentId;       // Unique identifier
        string contentUri;      // IPFS URI to content
        address creator;        // Creator address
        uint256 price;          // Price in STRM tokens
        uint256 createdAt;      // Timestamp when content was registered
        string metadata;        // JSON string with additional metadata
        uint256 streamCount;    // Number of times content has been streamed
        bool isActive;          // Whether content is active
    }

    // Mapping from content ID to Content struct
    mapping(string => Content) public contents;

    // Array of all content IDs for enumeration
    string[] public contentIds;

    // Mapping from creator address to their content IDs
    mapping(address => string[]) public creatorContents;

    // Events
    event ContentRegistered(string contentId, address indexed creator, string contentUri);
    event ContentUpdated(string contentId, address indexed creator);
    event ContentDeactivated(string contentId);
    event ContentActivated(string contentId);
    event StreamCountIncremented(string contentId, uint256 newCount);

    /**
     * @dev Constructor that sets the streaming token contract
     * @param _streamingToken Address of the StreamingToken contract
     */
    constructor(address _streamingToken) {
        require(_streamingToken != address(0), "StreamingToken address cannot be zero");
        streamingToken = StreamingToken(_streamingToken);
    }

    /**
     * @dev Register new content
     * @param contentId Unique identifier for the content
     * @param contentUri IPFS URI to the content
     * @param price Price in STRM tokens
     * @param metadata JSON string with additional metadata
     */
    function registerContent(
        string memory contentId,
        string memory contentUri,
        uint256 price,
        string memory metadata
    ) external nonReentrant {
        require(bytes(contentId).length > 0, "Content ID cannot be empty");
        require(bytes(contentUri).length > 0, "Content URI cannot be empty");
        require(contents[contentId].creator == address(0), "Content ID already registered");

        // Create new content
        Content memory newContent = Content({
            contentId: contentId,
            contentUri: contentUri,
            creator: msg.sender,
            price: price,
            createdAt: block.timestamp,
            metadata: metadata,
            streamCount: 0,
            isActive: true
        });

        // Store content
        contents[contentId] = newContent;
        contentIds.push(contentId);
        creatorContents[msg.sender].push(contentId);

        // Register content in the token contract too
        streamingToken.registerContent(contentId);

        emit ContentRegistered(contentId, msg.sender, contentUri);
    }

    /**
     * @dev Update content metadata
     * @param contentId Content identifier to update
     * @param newContentUri New IPFS URI (if empty, won't update)
     * @param newPrice New price (if 0, won't update)
     * @param newMetadata New metadata (if empty, won't update)
     */
    function updateContent(
        string memory contentId,
        string memory newContentUri,
        uint256 newPrice,
        string memory newMetadata
    ) external nonReentrant {
        Content storage content = contents[contentId];
        require(content.creator == msg.sender, "Only creator can update content");

        if (bytes(newContentUri).length > 0) {
            content.contentUri = newContentUri;
        }

        if (newPrice > 0) {
            content.price = newPrice;
        }

        if (bytes(newMetadata).length > 0) {
            content.metadata = newMetadata;
        }

        emit ContentUpdated(contentId, msg.sender);
    }

    /**
     * @dev Deactivate content
     * @param contentId Content identifier to deactivate
     */
    function deactivateContent(string memory contentId) external {
        Content storage content = contents[contentId];
        require(content.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(content.isActive, "Content already deactivated");

        content.isActive = false;
        emit ContentDeactivated(contentId);
    }

    /**
     * @dev Activate content
     * @param contentId Content identifier to activate
     */
    function activateContent(string memory contentId) external {
        Content storage content = contents[contentId];
        require(content.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(!content.isActive, "Content already active");

        content.isActive = true;
        emit ContentActivated(contentId);
    }

    /**
     * @dev Increment stream count for content (called by StreamingToken contract)
     * @param contentId Content identifier
     */
    function incrementStreamCount(string memory contentId) external {
        // In a production environment, you would restrict this to only be called by the streaming token contract
        // require(msg.sender == address(streamingToken), "Not authorized");

        Content storage content = contents[contentId];
        require(content.isActive, "Content is not active");

        content.streamCount++;
        emit StreamCountIncremented(contentId, content.streamCount);
    }

    /**
     * @dev Get content by ID
     * @param contentId Content identifier
     * @return Content struct
     */
    function getContent(string memory contentId) external view returns (
        string memory id,
        string memory uri,
        address creator,
        uint256 price,
        uint256 createdAt,
        string memory metadata,
        uint256 streamCount,
        bool isActive
    ) {
        Content memory content = contents[contentId];
        return (
            content.contentId,
            content.contentUri,
            content.creator,
            content.price,
            content.createdAt,
            content.metadata,
            content.streamCount,
            content.isActive
        );
    }

    /**
     * @dev Get all content IDs
     * @return string[] Array of content IDs
     */
    function getAllContentIds() external view returns (string[] memory) {
        return contentIds;
    }

    /**
     * @dev Get content IDs by creator
     * @param creator Creator address
     * @return string[] Array of content IDs
     */
    function getContentIdsByCreator(address creator) external view returns (string[] memory) {
        return creatorContents[creator];
    }

    /**
     * @dev Get content count
     * @return uint256 Number of registered contents
     */
    function getContentCount() external view returns (uint256) {
        return contentIds.length;
    }

    /**
     * @dev Check if a content exists
     * @param contentId Content identifier
     * @return bool True if content exists
     */
    function contentExists(string memory contentId) external view returns (bool) {
        return bytes(contents[contentId].contentUri).length > 0;
    }
}
