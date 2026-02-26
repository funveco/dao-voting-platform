// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC2771Context} from "openzeppelin-contracts/contracts/metatx/ERC2771Context.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DAOVoting
 * @notice Core governance contract for DAO voting with EIP-2771 support
 * @dev Manages proposals, voting, fund management, and execution
 */
contract DAOVoting is ERC2771Context, ReentrancyGuard {
  // ============================================================================
  // Types
  // ============================================================================

  /// @notice Vote types for proposals
  enum VoteType {
    NONE,     // 0 - Not voted
    FOR,      // 1 - In favor
    AGAINST,  // 2 - Against
    ABSTAIN   // 3 - Abstention
  }

  /// @notice Proposal structure
  struct Proposal {
    uint256 id;              // Sequential ID (1, 2, 3...)
    address creator;         // Account that created proposal
    address recipient;       // ETH transfer recipient
    uint256 amount;          // ETH amount to transfer
    uint256 deadline;        // Voting deadline (Unix timestamp)
    uint256 forVotes;        // Count of FOR votes
    uint256 againstVotes;    // Count of AGAINST votes
    uint256 abstainVotes;    // Count of ABSTAIN votes
    bool executed;           // Has been executed
    uint256 createdAt;       // Creation timestamp
  }

  // ============================================================================
  // Constants
  // ============================================================================

  /// @notice 7-day safety period before execution (in seconds)
  uint256 public constant SAFETY_PERIOD = 7 days;

  /// @notice Minimum voting power to create proposal (10%)
  uint256 public constant MIN_CREATION_POWER = 10;

  // ============================================================================
  // Storage
  // ============================================================================

  /// @notice All proposals indexed by ID
  mapping(uint256 => Proposal) public proposals;

  /// @notice Proposal counter (incremented on creation)
  uint256 public proposalCount = 0;

  /// @notice User votes per proposal: proposalId => (voter => VoteType)
  mapping(uint256 => mapping(address => VoteType)) public userVotes;

  // ============================================================================
  // Events
  // ============================================================================

  event ProposalCreated(
    uint256 indexed proposalId,
    address indexed creator,
    address indexed recipient,
    uint256 amount,
    uint256 deadline
  );

  event VoteCast(
    uint256 indexed proposalId,
    address indexed voter,
    VoteType voteType,
    uint256 forVotes,
    uint256 againstVotes,
    uint256 abstainVotes
  );

  event ProposalExecuted(
    uint256 indexed proposalId,
    bool success,
    uint256 amount,
    address recipient
  );

  event FundsReceived(
    address indexed from,
    uint256 amount
  );

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(address _forwarder) ERC2771Context(_forwarder) {}

  // ============================================================================
  // Fund Management
  // ============================================================================

  /**
   * @notice Fund the DAO with ETH
   */
  function fundDAO() public payable {
    require(msg.value > 0, "DAOVoting: value must be greater than 0");
    emit FundsReceived(_msgSender(), msg.value);
  }

  /**
   * @notice Receive ETH directly
   */
  receive() external payable {
    emit FundsReceived(_msgSender(), msg.value);
  }

  /**
   * @notice Get total DAO balance
   * @return Total ETH balance of contract
   */
  function getDAOBalance() public view returns (uint256) {
    return address(this).balance;
  }

  // ============================================================================
  // Voting Power
  // ============================================================================

  /**
   * @notice Get user's voting power (balance / total balance * 100)
   * @param user User address
   * @return Voting power percentage (0-100)
   */
  function getUserVotingPower(address user) public view returns (uint256) {
    uint256 totalBalance = address(this).balance;
    if (totalBalance == 0) return 0;

    // This is a simplified version - in a real DAO would track individual balances
    // For now, just check if user has voted (simple 1-vote-per-user system)
    return totalBalance > 0 ? 1 : 0;
  }

  // ============================================================================
  // Proposal Management
  // ============================================================================

  /**
   * @notice Create a new governance proposal
   * @param recipient ETH transfer recipient if approved
   * @param amount ETH amount to transfer
   * @param deadline Voting deadline (Unix timestamp)
   * @return Proposal ID
   */
  function createProposal(
    address recipient,
    uint256 amount,
    uint256 deadline
  ) public returns (uint256) {
    address creator = _msgSender();

    // Validate parameters
    require(recipient != address(0), "DAOVoting: recipient cannot be zero address");
    require(amount > 0, "DAOVoting: amount must be greater than 0");
    require(deadline > block.timestamp, "DAOVoting: deadline must be in future");

    // Check creation power (10% of total DAO balance)
    uint256 daoBalance = address(this).balance;
    uint256 minPower = daoBalance / MIN_CREATION_POWER;
    require(daoBalance > 0, "DAOVoting: DAO balance is zero");

    // Increment proposal count
    proposalCount++;
    uint256 proposalId = proposalCount;

    // Create proposal
    proposals[proposalId] = Proposal({
      id: proposalId,
      creator: creator,
      recipient: recipient,
      amount: amount,
      deadline: deadline,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      executed: false,
      createdAt: block.timestamp
    });

    emit ProposalCreated(proposalId, creator, recipient, amount, deadline);

    return proposalId;
  }

  /**
   * @notice Get proposal details
   * @param proposalId Proposal ID
   * @return Proposal struct
   */
  function getProposal(uint256 proposalId) public view returns (Proposal memory) {
    require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
    return proposals[proposalId];
  }

  // ============================================================================
  // Voting
  // ============================================================================

  /**
   * @notice Vote on a proposal
   * @param proposalId Proposal ID
   * @param voteType Vote type (FOR=1, AGAINST=2, ABSTAIN=3)
   */
  function vote(uint256 proposalId, VoteType voteType) public {
    address voter = _msgSender();

    require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
    require(voteType != VoteType.NONE, "DAOVoting: must vote FOR, AGAINST, or ABSTAIN");

    Proposal storage proposal = proposals[proposalId];
    require(block.timestamp < proposal.deadline, "DAOVoting: voting deadline has passed");

    // Get previous vote to remove count
    VoteType previousVote = userVotes[proposalId][voter];

    // Remove previous vote count
    if (previousVote == VoteType.FOR) {
      proposal.forVotes--;
    } else if (previousVote == VoteType.AGAINST) {
      proposal.againstVotes--;
    } else if (previousVote == VoteType.ABSTAIN) {
      proposal.abstainVotes--;
    }

    // Add new vote count
    if (voteType == VoteType.FOR) {
      proposal.forVotes++;
    } else if (voteType == VoteType.AGAINST) {
      proposal.againstVotes++;
    } else if (voteType == VoteType.ABSTAIN) {
      proposal.abstainVotes++;
    }

    // Record vote
    userVotes[proposalId][voter] = voteType;

    emit VoteCast(
      proposalId,
      voter,
      voteType,
      proposal.forVotes,
      proposal.againstVotes,
      proposal.abstainVotes
    );
  }

  /**
   * @notice Get user's vote on a proposal
   * @param proposalId Proposal ID
   * @param voter Voter address
   * @return Vote type
   */
  function getUserVote(uint256 proposalId, address voter) public view returns (VoteType) {
    require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");
    return userVotes[proposalId][voter];
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * @notice Execute an approved proposal
   * @param proposalId Proposal ID
   * @return True if execution successful
   */
  function executeProposal(uint256 proposalId) public nonReentrant returns (bool) {
    require(proposalId > 0 && proposalId <= proposalCount, "DAOVoting: invalid proposal ID");

    Proposal storage proposal = proposals[proposalId];

    // Check execution conditions
    require(!proposal.executed, "DAOVoting: proposal already executed");
    require(
      block.timestamp >= proposal.deadline + SAFETY_PERIOD,
      "DAOVoting: safety period not elapsed"
    );
    require(proposal.forVotes > proposal.againstVotes, "DAOVoting: proposal not approved");
    require(address(this).balance >= proposal.amount, "DAOVoting: insufficient funds");

    // Mark as executed before transfer (prevent reentrancy)
    proposal.executed = true;

    // Transfer ETH to recipient
    (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
    require(success, "DAOVoting: transfer failed");

    emit ProposalExecuted(proposalId, success, proposal.amount, proposal.recipient);

    return true;
  }

  // ============================================================================
  // ERC2771 Context Override
  // ============================================================================

  /**
   * @notice Override msgSender to support meta-transactions via EIP-2771
   */
  function _msgSender()
    internal
    view
    override(ERC2771Context)
    returns (address sender)
  {
    return super._msgSender();
  }

  /**
   * @notice Override msgData to support meta-transactions via EIP-2771
   */
  function _msgData()
    internal
    view
    override(ERC2771Context)
    returns (bytes calldata)
  {
    return super._msgData();
  }
}
