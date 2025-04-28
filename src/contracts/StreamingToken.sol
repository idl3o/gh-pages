// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title StreamingToken
 * @dev ERC20 token for the Web3 streaming platform with built-in streaming access control
 */
contract StreamingToken is ERC20, Ownable, ReentrancyGuard {
    // Credits per ETH when purchasing
    uint256 public constant CREDITS_PER_ETH = 100;

    // Platform fee percentage (20%)
    uint256 public constant PLATFORM_FEE = 20;

    // Creator reward percentage (70%)
    uint256 public constant CREATOR_REWARD = 70;

    // Burn percentage (10%)
    uint256 public constant BURN_PERCENTAGE = 10;

    // Treasury address for platform fees
    address public treasuryAddress;

    // Mapping from user address and content ID to stream expiry timestamp
    mapping(address => mapping(string => uint256)) public streamExpiry;

    // Mapping from content ID to creator address
    mapping(string => address) public contentCreators;

    // Events
    event StreamStarted(address indexed user, string contentId, uint256 expiryTime);
    event CreditsPurchased(address indexed user, uint256 amount, uint256 ethValue);
    event CreatorRewarded(address indexed creator, string contentId, uint256 amount);
    event ContentRegistered(string contentId, address indexed creator);

    /**
     * @dev Constructor that initializes the token with name and symbol
     * @param _treasuryAddress Address for platform fees
     */
    constructor(address _treasuryAddress) ERC20("Streaming Token", "STRM") {
        require(_treasuryAddress != address(0), "Treasury address cannot be zero address");
        treasuryAddress = _treasuryAddress;

        // Mint initial supply for platform liquidity and development (optional)
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Purchase streaming credits with ETH
     */
    function purchaseCredits() public payable nonReentrant {
        require(msg.value > 0, "Must send ETH to purchase credits");

        // Calculate credits based on ETH sent (1 ETH = 100 STRM)
        uint256 credits = msg.value * CREDITS_PER_ETH;

        // Mint new tokens to the sender
        _mint(msg.sender, credits);

        emit CreditsPurchased(msg.sender, credits, msg.value);
    }

    /**
     * @dev Start a stream by spending 1 token
     * @param contentId Unique identifier for the content
     */
    function startStream(string memory contentId) public nonReentrant {
        require(balanceOf(msg.sender) >= 1 * 10**decimals(), "Insufficient credits");

        // Burn 1 token from sender
        _burn(msg.sender, 1 * 10**decimals());

        // Set stream expiry to 1 hour from now
        uint256 expiryTime = block.timestamp + 1 hours;
        streamExpiry[msg.sender][contentId] = expiryTime;

        // Distribute rewards if content has a registered creator
        address creator = contentCreators[contentId];
        if (creator != address(0)) {
            // Calculate rewards
            uint256 creatorReward = (1 * 10**decimals() * CREATOR_REWARD) / 100;
            uint256 platformFee = (1 * 10**decimals() * PLATFORM_FEE) / 100;
            uint256 burnAmount = (1 * 10**decimals() * BURN_PERCENTAGE) / 100;

            // Mint rewards to creator
            _mint(creator, creatorReward);
            emit CreatorRewarded(creator, contentId, creatorReward);

            // Mint platform fee to treasury
            _mint(treasuryAddress, platformFee);

            // Note: 1 token was already burned from user, no need to burn additional
        }

        emit StreamStarted(msg.sender, contentId, expiryTime);
    }

    /**
     * @dev Check if a user has active access to content
     * @param user Address of the user
     * @param contentId Unique identifier for the content
     * @return bool True if user has active access
     */
    function canStream(address user, string memory contentId) public view returns (bool) {
        return streamExpiry[user][contentId] > block.timestamp;
    }

    /**
     * @dev Get remaining streaming time for a user and content
     * @param user Address of the user
     * @param contentId Unique identifier for the content
     * @return uint256 Seconds remaining for access, 0 if expired
     */
    function streamingTimeRemaining(address user, string memory contentId) public view returns (uint256) {
        uint256 expiry = streamExpiry[user][contentId];
        if (expiry <= block.timestamp) {
            return 0;
        }
        return expiry - block.timestamp;
    }

    /**
     * @dev Register content with a creator address
     * @param contentId Unique identifier for the content
     */
    function registerContent(string memory contentId) public {
        require(contentCreators[contentId] == address(0), "Content already registered");
        contentCreators[contentId] = msg.sender;
        emit ContentRegistered(contentId, msg.sender);
    }

    /**
     * @dev Update treasury address (only owner)
     * @param _newTreasuryAddress New treasury address
     */
    function setTreasuryAddress(address _newTreasuryAddress) public onlyOwner {
        require(_newTreasuryAddress != address(0), "Treasury address cannot be zero address");
        treasuryAddress = _newTreasuryAddress;
    }
}
