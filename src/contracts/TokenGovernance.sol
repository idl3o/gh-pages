// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./StreamingToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenGovernance
 * @dev Governance contract that leverages the StreamingToken delegation system for voting
 */
contract TokenGovernance is Ownable, ReentrancyGuard {
    // StreamingToken contract reference
    StreamingToken public token;

    // Proposal state enum
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Executed, Expired }

    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes callData;
        address targetContract;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        mapping(address => Receipt) receipts;
    }

    // Vote receipt structure
    struct Receipt {
        bool hasVoted;
        uint8 support; // 0 = against, 1 = for, 2 = abstain
        uint256 votes;
    }

    // Proposal details structure (for external view)
    struct ProposalDetails {
        uint256 id;
        address proposer;
        string title;
        string description;
        bytes callData;
        address targetContract;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        ProposalState state;
    }

    // Constants
    uint256 public constant VOTING_PERIOD = 17280; // ~3 days at 15s per block
    uint256 public constant PROPOSAL_THRESHOLD = 100_000 * 10**18; // 100,000 tokens required to submit a proposal
    uint256 public constant VOTING_DELAY = 1; // 1 block delay before voting begins

    // State variables
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    // Events
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        string title,
        string description,
        address targetContract,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes,
        string reason
    );
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);

    /**
     * @dev Constructor that sets the token address
     * @param _token StreamingToken contract address
     */
    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        token = StreamingToken(_token);
    }

    /**
     * @dev Create a new proposal
     * @param _title Title of the proposal
     * @param _description Description of the proposal
     * @param _targetContract Contract to call if the proposal succeeds
     * @param _callData Function call data to execute if the proposal succeeds
     */
    function propose(
        string memory _title,
        string memory _description,
        address _targetContract,
        bytes memory _callData
    ) public returns (uint256) {
        // Check proposer has enough voting power
        uint256 votingPower = token.getVotingPower(msg.sender);
        require(votingPower >= PROPOSAL_THRESHOLD, "Insufficient voting power to create proposal");

        // Increment proposal count
        proposalCount++;
        uint256 proposalId = proposalCount;

        // Create new proposal
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.callData = _callData;
        newProposal.targetContract = _targetContract;
        newProposal.startBlock = block.number + VOTING_DELAY;
        newProposal.endBlock = block.number + VOTING_DELAY + VOTING_PERIOD;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _title,
            _description,
            _targetContract,
            newProposal.startBlock,
            newProposal.endBlock
        );

        return proposalId;
    }

    /**
     * @dev Cast a vote on an active proposal
     * @param proposalId ID of the proposal
     * @param support 0 = against, 1 = for, 2 = abstain
     * @param reason Reason for the vote (optional)
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) public nonReentrant {
        require(state(proposalId) == ProposalState.Active, "Proposal not active");
        require(support <= 2, "Invalid vote type");

        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[msg.sender];
        require(!receipt.hasVoted, "Already voted");

        // Get voter's voting power
        uint256 votes = token.getVotingPower(msg.sender);
        require(votes > 0, "No voting power");

        // Record vote
        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        // Update vote tallies
        if (support == 0) {
            proposal.againstVotes += votes;
        } else if (support == 1) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }

        emit VoteCast(msg.sender, proposalId, support, votes, reason);
    }

    /**
     * @dev Execute a successful proposal
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) public nonReentrant {
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not successful");
        
        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;
        
        // Execute the proposal call
        (bool success, ) = proposal.targetContract.call(proposal.callData);
        require(success, "Proposal execution failed");

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal (only by proposer or if proposer drops below threshold)
     * @param proposalId ID of the proposal
     */
    function cancelProposal(uint256 proposalId) public {
        require(state(proposalId) == ProposalState.Pending || state(proposalId) == ProposalState.Active, "Cannot cancel completed proposal");

        Proposal storage proposal = proposals[proposalId];
        
        // Only proposer or if proposer no longer has enough voting power
        require(
            msg.sender == proposal.proposer || 
            token.getVotingPower(proposal.proposer) < PROPOSAL_THRESHOLD,
            "Not authorized to cancel"
        );

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Get current state of a proposal
     * @param proposalId ID of the proposal
     * @return Current ProposalState
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal id");
        
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.number < proposal.startBlock) {
            return ProposalState.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        } else if (proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        } else if (proposal.executed) {
            return ProposalState.Executed;
        } else if (block.number > proposal.endBlock + 80640) { // ~14 day grace period (at 15s blocks)
            return ProposalState.Expired;
        } else {
            return ProposalState.Succeeded;
        }
    }

    /**
     * @dev Get proposal details for a specific ID
     * @param proposalId ID of the proposal
     * @return ProposalDetails struct with all proposal information
     */
    function getProposalDetails(uint256 proposalId) public view returns (ProposalDetails memory) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal id");
        
        Proposal storage proposal = proposals[proposalId];
        
        return ProposalDetails({
            id: proposal.id,
            proposer: proposal.proposer,
            title: proposal.title,
            description: proposal.description,
            callData: proposal.callData,
            targetContract: proposal.targetContract,
            startBlock: proposal.startBlock,
            endBlock: proposal.endBlock,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            executed: proposal.executed,
            canceled: proposal.canceled,
            state: state(proposalId)
        });
    }

    /**
     * @dev Check if an address has voted on a proposal
     * @param proposalId ID of the proposal
     * @param voter Address to check
     * @return hasVoted, support, votes
     */
    function getVoterReceipt(uint256 proposalId, address voter) 
        public view 
        returns (bool, uint8, uint256) 
    {
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = proposal.receipts[voter];
        
        return (receipt.hasVoted, receipt.support, receipt.votes);
    }

    /**
     * @dev Get the current quorum requirement (simplified)
     * @return Current quorum needed for a successful vote
     */
    function quorum() public pure returns (uint256) {
        return 500_000 * 10**18; // 500,000 tokens
    }
}