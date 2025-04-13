// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TokenGatedContent
 * @dev ERC721 token that provides token gating functionality for streaming content
 */
contract TokenGatedContent is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Content tiers with access rights
    enum ContentTier { BASIC, PREMIUM, EXCLUSIVE }
    
    // Mapping from token ID to content tier
    mapping(uint256 => ContentTier) private _tokenTiers;
    
    // Mapping from content ID to minimum tier required
    mapping(bytes32 => ContentTier) private _contentRequirements;
    
    // Base URI for metadata
    string private _baseTokenURI;

    event ContentAdded(bytes32 contentId, ContentTier tier);
    event ContentAccessed(address user, bytes32 contentId);

    constructor(string memory name, string memory symbol, string memory baseURI) 
        ERC721(name, symbol) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Sets the base URI for token metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Mints a new NFT to the given address with specified tier
     * @param to Address to mint to
     * @param tier Content tier for the token
     * @return tokenId The ID of the minted token
     */
    function mintToken(address to, ContentTier tier) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(to, newTokenId);
        _tokenTiers[newTokenId] = tier;
        
        return newTokenId;
    }
    
    /**
     * @dev Adds content with tier restriction
     * @param contentId Hash of content identifier
     * @param tier Minimum tier required to access
     */
    function addContent(bytes32 contentId, ContentTier tier) external onlyOwner {
        _contentRequirements[contentId] = tier;
        emit ContentAdded(contentId, tier);
    }
    
    /**
     * @dev Checks if an address has access to content
     * @param user Address to check
     * @param contentId Hash of content to check access for
     * @return boolean Whether the user has access
     */
    function hasAccess(address user, bytes32 contentId) external returns (bool) {
        ContentTier requiredTier = _contentRequirements[contentId];
        
        // Find the highest tier token owned by user
        ContentTier highestTier = ContentTier.BASIC;
        uint256 balance = balanceOf(user);
        
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(user, i);
            ContentTier tokenTier = _tokenTiers[tokenId];
            
            if (uint256(tokenTier) > uint256(highestTier)) {
                highestTier = tokenTier;
            }
        }
        
        bool hasAccess = uint256(highestTier) >= uint256(requiredTier);
        
        if (hasAccess) {
            emit ContentAccessed(user, contentId);
        }
        
        return hasAccess;
    }
    
    /**
     * @dev Returns the tier of a token
     * @param tokenId ID of the token
     * @return ContentTier The tier of the token
     */
    function getTokenTier(uint256 tokenId) external view returns (ContentTier) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenTiers[tokenId];
    }
    
    /**
     * @dev Override base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Token of owner by index (simplified for example)
     * @param owner Address to query
     * @param index Token index
     * @return uint256 Token ID
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) internal view returns (uint256) {
        // This is simplified for the example - in a real contract use ERC721Enumerable
        // or implement proper enumeration
        return index + 1; // Placeholder implementation
    }
}