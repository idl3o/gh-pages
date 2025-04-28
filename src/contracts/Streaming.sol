// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StreamingToken
 * @dev ERC20 token for the Web3 Crypto Streaming Service platform
 * @author Team MODSIAS
 * @notice This contract manages streaming credits and content access on the platform
 * @custom:security-contact security@web3streaming.com
 * @custom:platform-version 1.0.0
 */
contract StreamingToken is ERC20, Ownable {
    /// @dev Number of streaming credits received per ETH sent
    uint256 public constant CREDITS_PER_ETH = 100;

    /**
     * @dev Mapping to track when a user's access to specific content expires
     * @notice Format: address => contentId => timestampExpiry
     */
    mapping(address => mapping(string => uint256)) public streamExpiry;

    /// @dev Events emitted by the contract
    /// @notice Emitted when a user starts streaming content
    event StreamStarted(address indexed user, string contentId, uint256 expiryTime);

    /// @notice Emitted when a user purchases streaming credits
    event CreditsPurchased(address indexed user, uint256 amount, uint256 ethValue);

    /**
     * @dev Constructor initializes the ERC20 token
     * @notice Initializes the token with name "Streaming Credits" and symbol "STRM"
     */
    constructor() ERC20("Streaming Credits", "STRM") {}

    /**
     * @notice Purchase streaming credits using ETH
     * @dev Mints new tokens to the sender based on the ETH value sent
     * @custom:example
     * To purchase 100 credits, send 1 ETH:
     * ```
     * contract.purchaseCredits({value: ethers.utils.parseEther("1.0")})
     * ```
     */
    function purchaseCredits() public payable {
        uint256 credits = msg.value * CREDITS_PER_ETH;
        _mint(msg.sender, credits);
        emit CreditsPurchased(msg.sender, credits, msg.value);
    }

    /**
     * @notice Start streaming specific content
     * @dev Burns 1 token and grants access to content for 1 hour
     * @param contentId The unique identifier of the content to stream
     * @custom:requirements User must have at least 1 STRM token
     */
    function startStream(string memory contentId) public {
        require(balanceOf(msg.sender) >= 1, "Insufficient credits");
        _burn(msg.sender, 1);
        streamExpiry[msg.sender][contentId] = block.timestamp + 1 hours;
        emit StreamStarted(msg.sender, contentId, streamExpiry[msg.sender][contentId]);
    }

    /**
     * @notice Check if a user has active access to specific content
     * @dev Returns true if the current time is less than the stream expiry time
     * @param user Address of the user to check
     * @param contentId The unique identifier of the content
     * @return bool True if the user has active access, false otherwise
     */
    function canStream(address user, string memory contentId) public view returns (bool) {
        return streamExpiry[user][contentId] > block.timestamp;
    }
}
