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
    
    // Mapping from token ID to PRX metadata
    mapping(uint256 => PRXMetadata) private _prxMetadata;
    
    // Governance state
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public minimumVotingPeriod = 3 days;
    uint256 public minimumVotesRequired;
    uint256 public governanceThreshold = 51; // 51% majority
    
    // Events for PRX-specific actions
    event ContentLinked(uint256 indexed tokenId, uint256 indexed linkedTokenId);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 startTime, uint256 endTime);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    
    /**
     * @dev Constructor initializes with token name, symbol, and mint price
     */
    constructor(string memory _name, string memory _symbol, uint256 _mintPrice) 
        SimpleTokenChain(_name, _symbol, _mintPrice) {
        // Initialize governance parameters
        minimumVotesRequired = 3; // Start with minimum of 3 votes required
    }
    
    /**
     * @dev Enhanced mint function that includes content metadata
     * @param metadata Basic token metadata
     * @param contentURI URI pointing to the content
     * @param contentType Type of content
     * @param isPrivate Whether content is token-gated
     */
    function mintWithContent(
        string memory metadata, 
        string memory contentURI, 
        string memory contentType, 
        bool isPrivate
    ) public payable returns (uint256) {
        // Mint the base token
        uint256 tokenId = mint(metadata);
        
        // Store additional PRX metadata
        _prxMetadata[tokenId] = PRXMetadata({
            contentURI: contentURI,
            contentType: contentType,
            creator: msg.sender,
            creationBlock: block.number,
            isPrivate: isPrivate,
            linkedTokens: new uint256[](0)
        });
        
        return tokenId;
    }
    
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
        uint256[] memory linkedTokens
    ) {
        require(_exists(tokenId), "PRXTokenChain: Query for nonexistent token");
        
        PRXMetadata storage metadata = _prxMetadata[tokenId];
        return (
            metadata.contentURI,
            metadata.contentType,
            metadata.creator,
            metadata.creationBlock,
            metadata.isPrivate,
            metadata.linkedTokens
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
        
        emit ProposalExecuted(proposalId, passed);
        
        // In the future, we would execute the proposal data if passed
        // For now, just record the result
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
}