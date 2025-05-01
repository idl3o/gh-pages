// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SimpleTokenChain.sol";

/**
 * @title PRXTokenChain
 * @dev Extends SimpleTokenChain with Project RED X specific features:
 * - Enhanced token metadata (content URI, content type, privacy settings)
 * - Content linking between tokens
 * - Token-gated content access control
 * - Governance mechanism with proposals and voting
 * - Token minting quotas and rate limiting
 * - Content verification mechanism
 * - Transaction fee model and revenue distribution
 */
contract PRXTokenChain is SimpleTokenChain {
    // Token metadata structure (extends the base token)
    struct PRXMetadata {
        string contentURI;        // URI pointing to the content (IPFS hash, URL, etc)
        string contentType;       // Type of content (image, video, audio, document, etc)
        address creator;          // Original creator of the content
        uint256 creationBlock;    // Block number when the token was created
        bool isPrivate;           // Whether the content is private (token-gated)
        uint256[] linkedTokens;   // IDs of tokens linked to this token
        bytes32 contentHash;      // Hash of the content for verification
        address[] verifiers;      // Addresses that have verified this content
        mapping(address => bool) hasVerified; // Track if address has verified content
    }
    
    // Governance proposal structure
    struct Proposal {
        uint256 id;               // Proposal ID
        string description;       // Proposal description
        address proposer;         // Address that created the proposal
        uint256 startTime;        // Timestamp when voting starts
        uint256 endTime;          // Timestamp when voting ends
        bool executed;            // Whether the proposal has been executed
        bool passed;              // Whether the proposal passed or failed
        uint256 forVotes;         // Number of votes for the proposal
        uint256 againstVotes;     // Number of votes against the proposal
        bytes executionData;      // Data to be executed if proposal passes
        mapping(address => bool) hasVoted; // Tracks whether an address has already voted
    }
    
    // Rate limiting structures
    struct MintingQuota {
        uint256 dailyLimit;       // Maximum tokens an address can mint per day
        uint256 timeWindow;       // Time window in seconds for rate limiting
        uint256 windowLimit;      // Maximum tokens an address can mint within the time window
    }
    
    struct UserMintingStats {
        uint256 dailyMintCount;   // Number of tokens minted by user in current day
        uint256 dailyResetTime;   // Timestamp when daily count resets
        uint256 windowMintCount;  // Number of tokens minted in current time window
        uint256 lastMintTime;     // Timestamp of last mint
    }
    
    // Transaction fee structure
    struct FeeModel {
        uint256 transferFee;       // Fee for token transfers (in basis points, e.g., 50 = 0.5%)
        uint256 mintFee;           // Additional fee for minting (on top of mint price, in basis points)
        uint256 contentFee;        // Fee for accessing private content (flat fee in wei)
        uint256 platformShare;     // Percentage of fees that go to platform (in basis points)
        uint256 creatorShare;      // Percentage of fees that go to content creator (in basis points)
        uint256 stakeholderShare;  // Percentage of fees distributed to token holders (in basis points)
    }
    
    // Fee state variables
    FeeModel public fees;
    uint256 public accumulatedFees;       // Total fees accumulated for distribution
    uint256 public platformFeeBalance;     // Fees allocated to platform
    uint256 public lastFeeDistribution;    // Block when fees were last distributed
    uint256 public feeDistributionInterval; // Blocks between fee distributions
    
    // Mapping from token ID to PRX metadata
    mapping(uint256 => PRXMetadata) private _prxMetadata;
    
    // Governance state
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public minimumVotingPeriod = 3 days;
    uint256 public minimumVotesRequired;
    uint256 public governanceThreshold = 51; // 51% majority
    
    // Rate limiting state
    MintingQuota public mintingQuota;
    mapping(address => UserMintingStats) public userMintingStats;
    bool public quotaEnabled = true;
    mapping(address => bool) public isExemptFromQuota;
    
    // Content verification state
    uint256 public requiredVerificationsCount = 3; // Minimum verifications needed
    mapping(address => uint256) public verifierTrustScore; // Trust score for verifiers
    mapping(address => bool) public authorizedVerifiers; // Addresses authorized as official verifiers
    
    // Addresses for fee distribution
    address public platformWallet;        // Address to receive platform fees
    address public communityTreasury;     // Address for community-controlled funds
    
    // Delegation mapping - tracks who a token holder has delegated their voting power to
    mapping(address => address) public delegates;
    
    // Delegated voting power - tracks the total voting power an address has (own tokens + delegated tokens)
    mapping(address => uint256) public delegatedVotingPower;
    
    // Events for delegation
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegatedVotingPowerChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);
    
    // Events for PRX-specific actions
    event ContentLinked(uint256 indexed tokenId, uint256 indexed linkedTokenId);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startTime, uint256 endTime);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event QuotaUpdated(uint256 dailyLimit, uint256 timeWindow, uint256 windowLimit);
    event QuotaExemptionChanged(address indexed user, bool exempted);
    // New events for content verification
    event ContentHashUpdated(uint256 indexed tokenId, bytes32 contentHash);
    event ContentVerified(uint256 indexed tokenId, address indexed verifier);
    event VerifierStatusChanged(address indexed verifier, bool authorized);
    event VerifierTrustScoreChanged(address indexed verifier, uint256 trustScore);
    event MinimumVerificationsChanged(uint256 oldValue, uint256 newValue);
    // New events for fee management
    event FeeModelUpdated(uint256 transferFee, uint256 mintFee, uint256 contentFee, 
        uint256 platformShare, uint256 creatorShare, uint256 stakeholderShare);
    event FeesDistributed(uint256 totalDistributed, uint256 platformAmount, uint256 stakeholderAmount);
    event ContentAccessFee(uint256 indexed tokenId, address indexed user, uint256 amount);
    event PlatformWalletUpdated(address indexed newWallet);
    event CommunityTreasuryUpdated(address indexed newTreasury);
    // New events for governance parameter updates
    event GovernanceThresholdUpdated(uint256 newThreshold);
    event MinimumVotingPeriodUpdated(uint256 newPeriod);
    
    /**
     * @dev Constructor initializes with token name, symbol, and mint price
     */
    constructor(string memory _name, string memory _symbol, uint256 _mintPrice) 
        SimpleTokenChain(_name, _symbol, _mintPrice) {
        // Initialize governance parameters
        minimumVotesRequired = 3; // Start with minimum of 3 votes required
        
        // Initialize default minting quota
        mintingQuota = MintingQuota({
            dailyLimit: 10,        // 10 tokens per day
            timeWindow: 1 hours,   // 1 hour time window
            windowLimit: 3         // 3 tokens per hour
        });
        
        // Initialize fee model
        fees = FeeModel({
            transferFee: 25,       // 0.25% transfer fee
            mintFee: 100,          // 1% additional minting fee
            contentFee: 0.001 ether, // 0.001 ETH for accessing private content
            platformShare: 4000,    // 40% to platform
            creatorShare: 4000,     // 40% to creator
            stakeholderShare: 2000  // 20% to token holders
        });
        
        // Set fee distribution interval to ~1 day (assuming ~15 second blocks)
        feeDistributionInterval = 5760;
        
        // Contract owner is exempt from quota
        isExemptFromQuota[msg.sender] = true;
        
        // Contract owner is an authorized verifier
        authorizedVerifiers[msg.sender] = true;
        verifierTrustScore[msg.sender] = 100; // Maximum trust score
        
        // Set platform wallet to contract owner initially
        platformWallet = msg.sender;
        communityTreasury = msg.sender;
    }
    
    /**
     * @dev Modifier to check if minting is allowed based on quotas and rate limits
     */
    modifier checkMintingQuota() {
        if (quotaEnabled && !isExemptFromQuota[msg.sender]) {
            // Get user's current stats
            UserMintingStats storage stats = userMintingStats[msg.sender];
            
            // Check and reset daily quota if necessary
            if (block.timestamp >= stats.dailyResetTime) {
                stats.dailyMintCount = 0;
                stats.dailyResetTime = block.timestamp + 1 days;
            }
            
            // Check daily limit
            require(stats.dailyMintCount < mintingQuota.dailyLimit, "PRXTokenChain: Daily minting limit reached");
            
            // Check time window limit
            if (block.timestamp > stats.lastMintTime + mintingQuota.timeWindow) {
                // Reset window count if we're in a new time window
                stats.windowMintCount = 0;
            } else {
                // We're still in the same time window, check the limit
                require(stats.windowMintCount < mintingQuota.windowLimit, 
                    "PRXTokenChain: Rate limit reached, try again later");
            }
        }
        _;
        
        // Update user's stats after minting
        if (quotaEnabled && !isExemptFromQuota[msg.sender]) {
            UserMintingStats storage stats = userMintingStats[msg.sender];
            stats.dailyMintCount++;
            stats.windowMintCount++;
            stats.lastMintTime = block.timestamp;
            
            // Initialize daily reset time if this is user's first mint
            if (stats.dailyResetTime == 0) {
                stats.dailyResetTime = block.timestamp + 1 days;
            }
        }
    }
    
    /**
     * @dev Enhanced mint function that includes content metadata and verification
     * @param metadata Basic token metadata
     * @param contentURI URI pointing to the content
     * @param contentType Type of content
     * @param isPrivate Whether content is token-gated
     * @param contentHash Hash of the actual content for verification
     */
    function mintWithContent(
        string memory metadata, 
        string memory contentURI, 
        string memory contentType, 
        bool isPrivate,
        bytes32 contentHash
    ) public payable checkMintingQuota returns (uint256) {
        // Mint the base token
        uint256 tokenId = mint(metadata);
        
        // Create empty array for verifiers
        address[] memory emptyVerifiers = new address[](0);
        
        // Store additional PRX metadata
        PRXMetadata storage newMetadata = _prxMetadata[tokenId];
        newMetadata.contentURI = contentURI;
        newMetadata.contentType = contentType;
        newMetadata.creator = msg.sender;
        newMetadata.creationBlock = block.number;
        newMetadata.isPrivate = isPrivate;
        newMetadata.linkedTokens = new uint256[](0);
        newMetadata.contentHash = contentHash;
        newMetadata.verifiers = emptyVerifiers;
        
        emit ContentHashUpdated(tokenId, contentHash);
        
        return tokenId;
    }
    
    /**
     * @dev Override the mint function to apply rate limiting and fees
     * @param metadata Basic token metadata
     */
    function mint(string memory metadata) public payable checkMintingQuota returns (uint256) {
        // Calculate mint fee (base price + percentage fee)
        uint256 baseMintPrice = mintPrice;
        uint256 additionalFee = (baseMintPrice * fees.mintFee) / 10000;
        uint256 totalMintPrice = baseMintPrice + additionalFee;
        
        // Ensure correct payment sent
        require(msg.value >= totalMintPrice, "PRXTokenChain: Insufficient ETH sent for minting");
        
        // Add the fee to accumulated fees
        accumulatedFees += additionalFee;
        
        // Call parent mint function
        uint256 tokenId = super.mint(metadata);
        
        // Add the newly minted token to user's quota usage if applicable
        if (!isExemptFromQuota[msg.sender]) {
            _quotaUsage[msg.sender].count++;
            _quotaUsage[msg.sender].lastMintTime = block.timestamp;
            
            // Reset daily counter if new day
            if (block.timestamp - _quotaUsage[msg.sender].dailyStartTime > 1 days) {
                _quotaUsage[msg.sender].dailyCount = 1;
                _quotaUsage[msg.sender].dailyStartTime = block.timestamp;
            } else {
                _quotaUsage[msg.sender].dailyCount++;
            }
        }
        
        // Return any excess ETH
        uint256 excess = msg.value - totalMintPrice;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "PRXTokenChain: Failed to return excess ETH");
        }
        
        return tokenId;
    }
    
    /**
     * @dev Override token transfer to apply transfer fee
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param tokenId The token being transferred
     */
    function transferFrom(address from, address to, uint256 tokenId) public override {
        // First determine if a fee should be applied
        bool applyFee = from != address(0) &&  // Not a mint
                       !isExemptFromQuota[from]; // Not exempt from quotas/fees
        
        if (applyFee) {
            uint256 transferFeeAmount = (mintPrice * fees.transferFee) / 10000;
            
            // Collect fee from sender if not operator/owner
            if (msg.sender != from && msg.sender != ownerOf(tokenId)) {
                require(msg.value >= transferFeeAmount, "PRXTokenChain: Transfer fee required");
                accumulatedFees += transferFeeAmount;
                
                // Return any excess
                uint256 excess = msg.value - transferFeeAmount;
                if (excess > 0) {
                    (bool success, ) = payable(msg.sender).call{value: excess}("");
                    require(success, "PRXTokenChain: Failed to return excess ETH");
                }
            }
            // Collect fee from tx.origin if sender is token owner/operator
            else {
                require(msg.value >= transferFeeAmount, "PRXTokenChain: Transfer fee required");
                accumulatedFees += transferFeeAmount;
                
                // Return any excess
                uint256 excess = msg.value - transferFeeAmount;
                if (excess > 0) {
                    (bool success, ) = payable(msg.sender).call{value: excess}("");
                    require(success, "PRXTokenChain: Failed to return excess ETH");
                }
            }
        }
        
        // Call parent transferFrom
        super.transferFrom(from, to, tokenId);
    }
    
    /**
     * @dev Access private content by paying a fee
     * @param tokenId The token with private content to access
     * @return contentURI The URI of the content
     */
    function accessPrivateContent(uint256 tokenId) public payable returns (string memory contentURI) {
        require(_exists(tokenId), "PRXTokenChain: Query for nonexistent token");
        require(_prxMetadata[tokenId].isPrivate, "PRXTokenChain: Content is already public");
        
        // Token owner can access for free
        if (ownerOf(tokenId) != msg.sender) {
            // Check if enough ETH sent
            require(msg.value >= fees.contentFee, "PRXTokenChain: Insufficient fee for content access");
            
            // Distribute content fee immediately
            uint256 creatorAmount = (fees.contentFee * fees.creatorShare) / 10000;
            uint256 platformAmount = (fees.contentFee * fees.platformShare) / 10000;
            uint256 stakeholderAmount = fees.contentFee - creatorAmount - platformAmount;
            
            // Send to creator
            (bool successCreator, ) = payable(_prxMetadata[tokenId].creator).call{value: creatorAmount}("");
            require(successCreator, "PRXTokenChain: Failed to send creator fee");
            
            // Add platform share to platform fee balance
            platformFeeBalance += platformAmount;
            
            // Add stakeholder share to accumulated fees for distribution
            accumulatedFees += stakeholderAmount;
            
            // Return any excess ETH
            uint256 excess = msg.value - fees.contentFee;
            if (excess > 0) {
                (bool success, ) = payable(msg.sender).call{value: excess}("");
                require(success, "PRXTokenChain: Failed to return excess ETH");
            }
            
            emit ContentAccessFee(tokenId, msg.sender, fees.contentFee);
        }
        
        return _prxMetadata[tokenId].contentURI;
    }
    
    /**
     * @dev Distribute accumulated fees to stakeholders
     * @return success Whether the distribution was successful
     */
    function distributeFees() public returns (bool success) {
        // Check if it's time for distribution
        require(block.number >= lastFeeDistribution + feeDistributionInterval || 
                msg.sender == platformWallet, // Platform wallet can force distribution
                "PRXTokenChain: Not yet time for fee distribution");
                
        // Check if there are fees to distribute
        require(accumulatedFees > 0, "PRXTokenChain: No fees to distribute");
        
        // Calculate shares
        uint256 totalFees = accumulatedFees;
        uint256 platformAmount = (totalFees * fees.platformShare) / 10000;
        uint256 stakeholderAmount = totalFees - platformAmount;
        
        // Reset fee tracking
        accumulatedFees = 0;
        lastFeeDistribution = block.number;
        
        // Add platform share to platform fee balance
        platformFeeBalance += platformAmount;
        
        // Transfer platform fees if above threshold
        if (platformFeeBalance > 0.01 ether) {
            uint256 platformTransfer = platformFeeBalance;
            platformFeeBalance = 0;
            
            // Send to platform wallet
            (bool platformSuccess, ) = payable(platformWallet).call{value: platformTransfer}("");
            require(platformSuccess, "PRXTokenChain: Failed to send platform fees");
        }
        
        // Send stakeholder amount to community treasury for distribution
        if (stakeholderAmount > 0) {
            (bool stakeholderSuccess, ) = payable(communityTreasury).call{value: stakeholderAmount}("");
            require(stakeholderSuccess, "PRXTokenChain: Failed to send stakeholder fees");
        }
        
        emit FeesDistributed(totalFees, platformAmount, stakeholderAmount);
        return true;
    }
    
    /**
     * @dev Update fee model parameters (governance function)
     */
    function updateFeeModel(
        uint256 _transferFee,
        uint256 _mintFee,
        uint256 _contentFee,
        uint256 _platformShare,
        uint256 _creatorShare,
        uint256 _stakeholderShare
    ) public {
        // Only token holders with significant stake (20% of supply) can update fee model
        require(balanceOf(msg.sender) >= totalSupply() * 20 / 100, 
            "PRXTokenChain: Insufficient tokens to update fee model");
        
        // Validate fee percentages
        require(_transferFee <= 500, "PRXTokenChain: Transfer fee cannot exceed 5%");
        require(_mintFee <= 1000, "PRXTokenChain: Mint fee cannot exceed 10%");
        require(_platformShare + _creatorShare + _stakeholderShare == 10000, 
            "PRXTokenChain: Fee shares must sum to 100%");
        
        fees.transferFee = _transferFee;
        fees.mintFee = _mintFee;
        fees.contentFee = _contentFee;
        fees.platformShare = _platformShare;
        fees.creatorShare = _creatorShare;
        fees.stakeholderShare = _stakeholderShare;
        
        emit FeeModelUpdated(
            _transferFee,
            _mintFee,
            _contentFee, 
            _platformShare,
            _creatorShare,
            _stakeholderShare
        );
    }
    
    /**
     * @dev Update platform wallet address
     * @param newWallet Address of new platform wallet
     */
    function updatePlatformWallet(address newWallet) public {
        // Only current platform wallet can update
        require(msg.sender == platformWallet, "PRXTokenChain: Only platform wallet can update");
        require(newWallet != address(0), "PRXTokenChain: Cannot set zero address");
        
        platformWallet = newWallet;
        emit PlatformWalletUpdated(newWallet);
    }
    
    /**
     * @dev Update community treasury address
     * @param newTreasury Address of new community treasury
     */
    function updateCommunityTreasury(address newTreasury) public {
        // Require governance vote or ownership
        require(msg.sender == owner() || balanceOf(msg.sender) >= totalSupply() * 30 / 100, 
            "PRXTokenChain: Insufficient authority to update treasury");
        require(newTreasury != address(0), "PRXTokenChain: Cannot set zero address");
        
        communityTreasury = newTreasury;
        emit CommunityTreasuryUpdated(newTreasury);
    }
    
    /**
     * @dev Get list of verifiers for a token
     * @param tokenId The token ID
     * @return List of verifier addresses
     */
    function getVerifiers(uint256 tokenId) public view returns (address[] memory) {
        require(_exists(tokenId), "PRXTokenChain: Query for nonexistent token");
        return _prxMetadata[tokenId].verifiers;
    }
    
    /**
     * @dev Update the minting quota settings (governance function)
     * @param dailyLimit New daily minting limit
     * @param timeWindow New time window in seconds
     * @param windowLimit New window minting limit
     */
    function updateMintingQuota(
        uint256 dailyLimit,
        uint256 timeWindow,
        uint256 windowLimit
    ) public {
        // Only token holders with significant stake (5% of supply) can update quotas
        require(balanceOf(msg.sender) >= totalSupply() * 5 / 100, 
            "PRXTokenChain: Insufficient tokens to update quota");
            
        mintingQuota.dailyLimit = dailyLimit;
        mintingQuota.timeWindow = timeWindow;
        mintingQuota.windowLimit = windowLimit;
        
        emit QuotaUpdated(dailyLimit, timeWindow, windowLimit);
    }
    
    /**
     * @dev Enable or disable quota enforcement
     * @param enabled Whether quota should be enabled
     */
    function setQuotaEnabled(bool enabled) public {
        // Only token holders with significant stake (5% of supply) can toggle quota
        require(balanceOf(msg.sender) >= totalSupply() * 5 / 100, 
            "PRXTokenChain: Insufficient tokens to update quota status");
            
        quotaEnabled = enabled;
    }
    
    /**
     * @dev Set whether an address is exempt from quota
     * @param user Address to update
     * @param exempted Whether user should be exempt
     */
    function setQuotaExemption(address user, bool exempted) public {
        // Only token holders with significant stake (5% of supply) can set exemptions
        require(balanceOf(msg.sender) >= totalSupply() * 5 / 100, 
            "PRXTokenChain: Insufficient tokens to update quota exemptions");
            
        isExemptFromQuota[user] = exempted;
        
        emit QuotaExemptionChanged(user, exempted);
    }
    
    /**
     * @dev Get time remaining until user can mint again
     * @param user Address to check
     * @return dailyQuotaRemaining Remaining tokens for the day
     * @return windowQuotaRemaining Remaining tokens for the current time window
     * @return timeUntilWindowReset Seconds until window resets
     */
    function getMintingStatus(address user) public view returns (
        uint256 dailyQuotaRemaining, 
        uint256 windowQuotaRemaining,
        uint256 timeUntilWindowReset
    ) {
        if (!quotaEnabled || isExemptFromQuota[user]) {
            return (type(uint256).max, type(uint256).max, 0);
        }
        
        UserMintingStats storage stats = userMintingStats[user];
        
        // Calculate daily quota
        if (block.timestamp >= stats.dailyResetTime) {
            // If daily reset time has passed, full quota is available
            dailyQuotaRemaining = mintingQuota.dailyLimit;
        } else {
            // Otherwise calculate remaining tokens
            dailyQuotaRemaining = mintingQuota.dailyLimit > stats.dailyMintCount ?
                mintingQuota.dailyLimit - stats.dailyMintCount : 0;
        }
        
        // Calculate window quota
        if (stats.lastMintTime == 0 || block.timestamp > stats.lastMintTime + mintingQuota.timeWindow) {
            // If never minted or window has passed, full window quota is available
            windowQuotaRemaining = mintingQuota.windowLimit;
            timeUntilWindowReset = 0;
        } else {
            // Calculate remaining tokens in current window
            windowQuotaRemaining = mintingQuota.windowLimit > stats.windowMintCount ?
                mintingQuota.windowLimit - stats.windowMintCount : 0;
            
            // Calculate time until window resets
            timeUntilWindowReset = stats.lastMintTime + mintingQuota.timeWindow - block.timestamp;
        }
        
        return (dailyQuotaRemaining, windowQuotaRemaining, timeUntilWindowReset);
    }
    
    // Content verification functions
    
    /**
     * @dev Get PRX metadata for a token
     * @param tokenId The ID of the token
     */
    function prxMetadata(uint256 tokenId) public view returns (
        string memory contentURI,
        string memory contentType,
        address creator,
        uint256 creationBlock,
        bool isPrivate,
        uint256[] memory linkedTokens,
        bytes32 contentHash
    ) {
        require(_exists(tokenId), "PRXTokenChain: Query for nonexistent token");
        
        PRXMetadata storage metadata = _prxMetadata[tokenId];
        return (
            metadata.contentURI,
            metadata.contentType,
            metadata.creator,
            metadata.creationBlock,
            metadata.isPrivate,
            metadata.linkedTokens,
            metadata.contentHash
        );
    }
    
    /**
     * @dev Link one token's content to another token
     * @param tokenId The source token ID
     * @param linkedTokenId The target token ID to link to
     */
    function linkContent(uint256 tokenId, uint256 linkedTokenId) public {
        require(_exists(tokenId) && _exists(linkedTokenId), "PRXTokenChain: Token does not exist");
        require(tokenOwner(tokenId) == msg.sender, "PRXTokenChain: Not token owner");
        require(tokenId != linkedTokenId, "PRXTokenChain: Cannot link to self");
        
        // Check if the link already exists
        bool linkExists = false;
        for (uint i = 0; i < _prxMetadata[tokenId].linkedTokens.length; i++) {
            if (_prxMetadata[tokenId].linkedTokens[i] == linkedTokenId) {
                linkExists = true;
                break;
            }
        }
        
        // Add the link if it doesn't exist
        if (!linkExists) {
            _prxMetadata[tokenId].linkedTokens.push(linkedTokenId);
            emit ContentLinked(tokenId, linkedTokenId);
        }
    }
    
    /**
     * @dev Get linked content for a token
     * @param tokenId The token ID
     * @return An array of linked token IDs
     */
    function getLinkedContent(uint256 tokenId) public view returns (uint256[] memory) {
        require(_exists(tokenId), "PRXTokenChain: Query for nonexistent token");
        return _prxMetadata[tokenId].linkedTokens;
    }
    
    /**
     * @dev Check if an address can access a token's content
     * @param user The address to check
     * @param tokenId The token ID
     * @return Whether the user can access the content
     */
    function canAccessContent(address user, uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "PRXTokenChain: Query for nonexistent token");
        
        PRXMetadata storage metadata = _prxMetadata[tokenId];
        
        // If content is public, anyone can access it
        if (!metadata.isPrivate) {
            return true;
        }
        
        // If content is private, only the token owner can access it
        return tokenOwner(tokenId) == user;
    }
    
    /**
     * @dev Create a new governance proposal
     * @param description The proposal description
     * @param votingPeriod The voting period in seconds (must be >= minimumVotingPeriod)
     * @param executionData The data to execute if proposal passes
     */
    function createProposal(
        string memory description,
        uint256 votingPeriod,
        bytes memory executionData
    ) public returns (uint256) {
        require(balanceOf(msg.sender) > 0, "PRXTokenChain: Must own tokens to create proposal");
        require(votingPeriod >= minimumVotingPeriod, "PRXTokenChain: Voting period too short");
        
        // Check if user has enough tokens (1% of total supply)
        uint256 requiredBalance = totalSupply() / 100;
        require(balanceOf(msg.sender) >= requiredBalance, "PRXTokenChain: Insufficient tokens to create proposal");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.id = proposalId;
        newProposal.description = description;
        newProposal.proposer = msg.sender;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;
        newProposal.executed = false;
        newProposal.passed = false;
        newProposal.executionData = executionData;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            newProposal.startTime,
            newProposal.endTime
        );
        
        return proposalId;
    }
    
    /**
     * @dev Vote on a proposal
     * @param proposalId The proposal ID
     * @param support Whether to support the proposal or not
     */
    function vote(uint256 proposalId, bool support) public {
        require(proposalId < proposalCount, "PRXTokenChain: Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp <= proposal.endTime, "PRXTokenChain: Voting period ended");
        require(!proposal.hasVoted[msg.sender], "PRXTokenChain: Already voted");
        require(balanceOf(msg.sender) > 0, "PRXTokenChain: Must own tokens to vote");
        
        // Record the vote
        proposal.hasVoted[msg.sender] = true;
        uint256 votes = balanceOf(msg.sender);
        
        if (support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }
        
        emit Voted(proposalId, msg.sender, support, votes);
    }
    
    /**
     * @dev Execute a proposal after the voting period has ended
     * @param proposalId The proposal ID
     */
    function executeProposal(uint256 proposalId) public {
        require(proposalId < proposalCount, "PRXTokenChain: Invalid proposal ID");
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp > proposal.endTime, "PRXTokenChain: Voting period not ended");
        require(!proposal.executed, "PRXTokenChain: Already executed");
        
        // Check if the proposal has enough votes
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        require(totalVotes >= minimumVotesRequired, "PRXTokenChain: Not enough votes");
        
        // Calculate if the proposal passed based on the governance threshold
        uint256 forPercentage = (proposal.forVotes * 100) / totalVotes;
        bool passed = forPercentage >= governanceThreshold;
        
        proposal.executed = true;
        proposal.passed = passed;
        
        if (passed) {
            // Execute the proposal using the stored execution data
            // First 4 bytes of the execution data is the function selector
            require(proposal.executionData.length >= 4, "PRXTokenChain: Invalid execution data");
            
            bytes4 selector = bytes4(proposal.executionData[:4]);
            
            // Execute the appropriate action based on the function selector
            bool success = executeAction(selector, proposal.executionData);
            require(success, "PRXTokenChain: Proposal execution failed");
        }
        
        emit ProposalExecuted(proposalId, passed);
    }
    
    /**
     * @dev Execute a governance action based on function selector
     * @param selector The function selector (first 4 bytes of function signature hash)
     * @param data The complete call data
     * @return success Whether the execution was successful
     */
    function executeAction(bytes4 selector, bytes memory data) internal returns (bool success) {
        // Define supported governance actions by their function selectors
        bytes4 updateFeeModelSelector = this.updateFeeModel.selector;
        bytes4 updateMintingQuotaSelector = this.updateMintingQuota.selector;
        bytes4 setQuotaEnabledSelector = this.setQuotaEnabled.selector;
        bytes4 setQuotaExemptionSelector = this.setQuotaExemption.selector;
        bytes4 updatePlatformWalletSelector = this.updatePlatformWallet.selector;
        bytes4 updateCommunityTreasurySelector = this.updateCommunityTreasury.selector;
        bytes4 updateRequiredVerificationsCountSelector = bytes4(keccak256("updateRequiredVerificationsCount(uint256)"));
        bytes4 updateGovernanceThresholdSelector = bytes4(keccak256("updateGovernanceThreshold(uint256)"));
        bytes4 updateMinimumVotingPeriodSelector = bytes4(keccak256("updateMinimumVotingPeriod(uint256)"));
        
        // Check if the selector matches one of our supported actions
        if (selector == updateFeeModelSelector) {
            // Extract parameters from calldata
            // updateFeeModel(uint256,uint256,uint256,uint256,uint256,uint256)
            (uint256 transferFee, uint256 mintFee, uint256 contentFee, 
             uint256 platformShare, uint256 creatorShare, uint256 stakeholderShare) = 
             abi.decode(data[4:], (uint256, uint256, uint256, uint256, uint256, uint256));
            
            // Execute the action with governance authority (bypassing normal restrictions)
            _updateFeeModelInternal(transferFee, mintFee, contentFee, platformShare, creatorShare, stakeholderShare);
            return true;
        }
        else if (selector == updateMintingQuotaSelector) {
            // Extract parameters from calldata
            // updateMintingQuota(uint256,uint256,uint256)
            (uint256 dailyLimit, uint256 timeWindow, uint256 windowLimit) = 
                abi.decode(data[4:], (uint256, uint256, uint256));
            
            // Execute the action with governance authority
            _updateMintingQuotaInternal(dailyLimit, timeWindow, windowLimit);
            return true;
        }
        else if (selector == setQuotaEnabledSelector) {
            // Extract parameters from calldata
            // setQuotaEnabled(bool)
            bool enabled = abi.decode(data[4:], (bool));
            
            // Execute the action with governance authority
            quotaEnabled = enabled;
            return true;
        }
        else if (selector == setQuotaExemptionSelector) {
            // Extract parameters from calldata
            // setQuotaExemption(address,bool)
            (address user, bool exempted) = abi.decode(data[4:], (address, bool));
            
            // Execute the action with governance authority
            isExemptFromQuota[user] = exempted;
            emit QuotaExemptionChanged(user, exempted);
            return true;
        }
        else if (selector == updatePlatformWalletSelector) {
            // Extract parameters from calldata
            // updatePlatformWallet(address)
            address newWallet = abi.decode(data[4:], (address));
            
            // Execute the action with governance authority
            require(newWallet != address(0), "PRXTokenChain: Cannot set zero address");
            platformWallet = newWallet;
            emit PlatformWalletUpdated(newWallet);
            return true;
        }
        else if (selector == updateCommunityTreasurySelector) {
            // Extract parameters from calldata
            // updateCommunityTreasury(address)
            address newTreasury = abi.decode(data[4:], (address));
            
            // Execute the action with governance authority
            require(newTreasury != address(0), "PRXTokenChain: Cannot set zero address");
            communityTreasury = newTreasury;
            emit CommunityTreasuryUpdated(newTreasury);
            return true;
        }
        else if (selector == updateRequiredVerificationsCountSelector) {
            // Extract parameters from calldata
            // updateRequiredVerificationsCount(uint256)
            uint256 newCount = abi.decode(data[4:], (uint256));
            
            // Execute the action with governance authority
            uint256 oldCount = requiredVerificationsCount;
            requiredVerificationsCount = newCount;
            emit MinimumVerificationsChanged(oldCount, newCount);
            return true;
        }
        else if (selector == updateGovernanceThresholdSelector) {
            // Extract parameters from calldata
            // updateGovernanceThreshold(uint256)
            uint256 newThreshold = abi.decode(data[4:], (uint256));
            
            // Validate threshold is reasonable (between 51% and 90%)
            require(newThreshold >= 51 && newThreshold <= 90, "PRXTokenChain: Invalid governance threshold");
            
            // Execute the action with governance authority
            governanceThreshold = newThreshold;
            emit GovernanceThresholdUpdated(newThreshold);
            return true;
        }
        else if (selector == updateMinimumVotingPeriodSelector) {
            // Extract parameters from calldata
            // updateMinimumVotingPeriod(uint256)
            uint256 newPeriod = abi.decode(data[4:], (uint256));
            
            // Validate period is reasonable (between 1 day and 30 days)
            require(newPeriod >= 1 days && newPeriod <= 30 days, "PRXTokenChain: Invalid voting period");
            
            // Execute the action with governance authority
            minimumVotingPeriod = newPeriod;
            emit MinimumVotingPeriodUpdated(newPeriod);
            return true;
        }
        
        // If we reach here, the selector is not recognized
        return false;
    }
    
    /**
     * @dev Internal function to update fee model (without restrictions)
     */
    function _updateFeeModelInternal(
        uint256 _transferFee,
        uint256 _mintFee,
        uint256 _contentFee,
        uint256 _platformShare,
        uint256 _creatorShare,
        uint256 _stakeholderShare
    ) internal {
        // Validate fee percentages
        require(_transferFee <= 500, "PRXTokenChain: Transfer fee cannot exceed 5%");
        require(_mintFee <= 1000, "PRXTokenChain: Mint fee cannot exceed 10%");
        require(_platformShare + _creatorShare + _stakeholderShare == 10000, 
            "PRXTokenChain: Fee shares must sum to 100%");
        
        fees.transferFee = _transferFee;
        fees.mintFee = _mintFee;
        fees.contentFee = _contentFee;
        fees.platformShare = _platformShare;
        fees.creatorShare = _creatorShare;
        fees.stakeholderShare = _stakeholderShare;
        
        emit FeeModelUpdated(
            _transferFee,
            _mintFee,
            _contentFee, 
            _platformShare,
            _creatorShare,
            _stakeholderShare
        );
    }
    
    /**
     * @dev Internal function to update minting quota (without restrictions)
     */
    function _updateMintingQuotaInternal(
        uint256 dailyLimit,
        uint256 timeWindow,
        uint256 windowLimit
    ) internal {
        mintingQuota.dailyLimit = dailyLimit;
        mintingQuota.timeWindow = timeWindow;
        mintingQuota.windowLimit = windowLimit;
        
        emit QuotaUpdated(dailyLimit, timeWindow, windowLimit);
    }
    
    // Additional governance parameter update functions
    
    /**
     * @dev Update the minimum required verifications count for content
     * @param newCount The new minimum verifications count
     */
    function updateRequiredVerificationsCount(uint256 newCount) public {
        // Only governance or significant token holders can update
        require(msg.sender == owner() || balanceOf(msg.sender) >= totalSupply() * 10 / 100, 
            "PRXTokenChain: Insufficient authority");
            
        uint256 oldCount = requiredVerificationsCount;
        requiredVerificationsCount = newCount;
        emit MinimumVerificationsChanged(oldCount, newCount);
    }
    
    /**
     * @dev Update the governance voting threshold
     * @param newThreshold The new threshold (in percentage)
     */
    function updateGovernanceThreshold(uint256 newThreshold) public {
        // Only governance or significant token holders can update
        require(msg.sender == owner() || balanceOf(msg.sender) >= totalSupply() * 20 / 100, 
            "PRXTokenChain: Insufficient authority");
            
        // Validate threshold is reasonable (between 51% and 90%)
        require(newThreshold >= 51 && newThreshold <= 90, "PRXTokenChain: Invalid governance threshold");
        
        governanceThreshold = newThreshold;
        emit GovernanceThresholdUpdated(newThreshold);
    }
    
    /**
     * @dev Update the minimum voting period for proposals
     * @param newPeriod The new minimum voting period in seconds
     */
    function updateMinimumVotingPeriod(uint256 newPeriod) public {
        // Only governance or significant token holders can update
        require(msg.sender == owner() || balanceOf(msg.sender) >= totalSupply() * 20 / 100, 
            "PRXTokenChain: Insufficient authority");
            
        // Validate period is reasonable (between 1 day and 30 days)
        require(newPeriod >= 1 days && newPeriod <= 30 days, "PRXTokenChain: Invalid voting period");
        
        minimumVotingPeriod = newPeriod;
        emit MinimumVotingPeriodUpdated(newPeriod);
    }
    
    /**
     * @dev Override transfer function to maintain governance integrity
     * @param to The address to transfer to
     * @param tokenId The token ID
     */
    function transfer(address to, uint256 tokenId) public override {
        super.transfer(to, tokenId);
        
        // Additional logic could be added here to handle governance implications
        // For example, removing votes from active proposals when tokens are transferred
    }
    
    /**
     * @dev Get the address delegated to by `delegator`
     * @param delegator The address to get the delegate of
     * @return The delegate address
     */
    function getDelegate(address delegator) public view returns (address) {
        return delegates[delegator];
    }

    /**
     * @dev Get the total voting power of an address (own tokens + delegated tokens)
     * @param delegatee The address to get the voting power of
     * @return The total voting power
     */
    function getVotingPower(address delegatee) public view returns (uint256) {
        return balanceOf(delegatee) + delegatedVotingPower[delegatee];
    }

    /**
     * @dev Delegate voting power to another address
     * @param delegatee The address to delegate to
     */
    function delegate(address delegatee) public {
        address delegator = msg.sender;
        address currentDelegate = delegates[delegator];
        
        // Don't allow delegation to zero address
        require(delegatee != address(0), "PRXTokenChain: Cannot delegate to zero address");
        
        // Don't allow circular delegation
        require(delegates[delegatee] != delegator, "PRXTokenChain: Cannot create delegation cycle");
        
        // Update delegated voting power
        uint256 delegatorBalance = balanceOf(delegator);
        
        // Remove delegation from current delegate if exists
        if (currentDelegate != address(0)) {
            uint256 previousDelegatedPower = delegatedVotingPower[currentDelegate];
            delegatedVotingPower[currentDelegate] = previousDelegatedPower > delegatorBalance ? 
                previousDelegatedPower - delegatorBalance : 0;
            
            emit DelegatedVotingPowerChanged(
                currentDelegate,
                previousDelegatedPower,
                delegatedVotingPower[currentDelegate]
            );
        }
        
        // Add delegation to new delegate
        if (delegatee != address(0)) {
            uint256 previousDelegatedPower = delegatedVotingPower[delegatee];
            delegatedVotingPower[delegatee] = previousDelegatedPower + delegatorBalance;
            
            emit DelegatedVotingPowerChanged(
                delegatee,
                previousDelegatedPower,
                delegatedVotingPower[delegatee]
            );
        }
        
        // Update delegate mapping
        delegates[delegator] = delegatee;
        
        emit DelegateChanged(delegator, currentDelegate, delegatee);
    }
    
    /**
     * @dev Remove delegation (equivalent to delegating to zero address)
     */
    function undelegate() public {
        delegate(address(0));
    }
    
    /**
     * @dev Contract can receive ETH
     */
    receive() external payable {
        // Add to accumulated fees
        accumulatedFees += msg.value;
    }
}