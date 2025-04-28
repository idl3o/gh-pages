// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title StreamingToken
 * @dev ERC20 token for the Web3 streaming platform with built-in streaming access control
 * and token delegation for governance
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

    // Delegation mappings
    mapping(address => address) public delegates;
    mapping(address => uint256) public delegatedVotingPower;
    mapping(address => mapping(address => uint256)) public delegatedAmountFrom;

    // Events
    event StreamStarted(address indexed user, string contentId, uint256 expiryTime);
    event CreditsPurchased(address indexed user, uint256 amount, uint256 ethValue);
    event CreatorRewarded(address indexed creator, string contentId, uint256 amount);
    event ContentRegistered(string contentId, address indexed creator);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegatedVotingPowerChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

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

    /**
     * @dev Delegate voting power to another address
     * @param delegatee Address to which voting power is delegated
     */
    function delegate(address delegatee) public {
        address currentDelegate = delegates[msg.sender];
        uint256 senderBalance = balanceOf(msg.sender);
        delegates[msg.sender] = delegatee;

        emit DelegateChanged(msg.sender, currentDelegate, delegatee);

        // Update delegated voting power values
        _moveDelegatedVotingPower(currentDelegate, delegatee, senderBalance);
    }

    /**
     * @dev Get the address to which a user has delegated their voting power
     * @param delegator Address of the delegator
     * @return Address of the delegate
     */
    function getDelegate(address delegator) public view returns (address) {
        return delegates[delegator];
    }

    /**
     * @dev Get the voting power of an account, including delegated power
     * @param account Address to check voting power
     * @return Total voting power (own balance + delegated)
     */
    function getVotingPower(address account) public view returns (uint256) {
        return balanceOf(account) + delegatedVotingPower[account];
    }

    /**
     * @dev Move delegated voting power between delegates when delegation changes
     * @param fromDelegate Previous delegate
     * @param toDelegate New delegate
     * @param amount Amount of voting power to move
     */
    function _moveDelegatedVotingPower(address fromDelegate, address toDelegate, uint256 amount) internal {
        if (fromDelegate != toDelegate && amount > 0) {
            if (fromDelegate != address(0)) {
                uint256 oldFromDelegateVotingPower = delegatedVotingPower[fromDelegate];
                uint256 newFromDelegateVotingPower = oldFromDelegateVotingPower - amount;
                delegatedVotingPower[fromDelegate] = newFromDelegateVotingPower;
                delegatedAmountFrom[fromDelegate][msg.sender] = 0;
                
                emit DelegatedVotingPowerChanged(fromDelegate, oldFromDelegateVotingPower, newFromDelegateVotingPower);
            }
            
            if (toDelegate != address(0)) {
                uint256 oldToDelegateVotingPower = delegatedVotingPower[toDelegate];
                uint256 newToDelegateVotingPower = oldToDelegateVotingPower + amount;
                delegatedVotingPower[toDelegate] = newToDelegateVotingPower;
                delegatedAmountFrom[toDelegate][msg.sender] = amount;
                
                emit DelegatedVotingPowerChanged(toDelegate, oldToDelegateVotingPower, newToDelegateVotingPower);
            }
        }
    }

    /**
     * @dev Override _beforeTokenTransfer to update delegated voting power
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param amount Amount of tokens transferred
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);

        // Update delegation if this is a transfer (not mint/burn)
        if (from != address(0) && to != address(0)) {
            address fromDelegate = delegates[from];
            address toDelegate = delegates[to];

            // Update delegated amounts
            if (fromDelegate != address(0)) {
                uint256 oldFromDelegateVotingPower = delegatedVotingPower[fromDelegate];
                uint256 newFromDelegateVotingPower = oldFromDelegateVotingPower - amount;
                delegatedVotingPower[fromDelegate] = newFromDelegateVotingPower;
                delegatedAmountFrom[fromDelegate][from] -= amount;
                
                emit DelegatedVotingPowerChanged(fromDelegate, oldFromDelegateVotingPower, newFromDelegateVotingPower);
            }
            
            if (toDelegate != address(0)) {
                uint256 oldToDelegateVotingPower = delegatedVotingPower[toDelegate];
                uint256 newToDelegateVotingPower = oldToDelegateVotingPower + amount;
                delegatedVotingPower[toDelegate] = newToDelegateVotingPower;
                delegatedAmountFrom[toDelegate][to] += amount;
                
                emit DelegatedVotingPowerChanged(toDelegate, oldToDelegateVotingPower, newToDelegateVotingPower);
            }
        }
    }
}
