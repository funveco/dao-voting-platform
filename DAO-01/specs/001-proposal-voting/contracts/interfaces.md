# Smart Contract Interfaces: Proposal & Voting

**Date**: 2025-02-06 | **Status**: Complete | **Branch**: `001-proposal-voting`

## Overview

This document specifies the smart contract interfaces required for the DAO voting system. The implementation uses Solidity 0.8.x with OpenZeppelin patterns (ERC2771Context for EIP-712 support, ERC20 integration for voting power).

---

## Contract: GovernanceProposal

Main contract managing proposal lifecycle and voting logic.

### Storage

```solidity
// Proposal tracking
mapping(uint256 => Proposal) public proposals;
uint256 public proposalCount;
uint256 public constant VOTING_PERIOD = 7 days; // Default voting duration

// Vote tracking
mapping(uint256 proposalId => mapping(address voter => bool)) public hasVoted;
mapping(uint256 proposalId => mapping(address voter => VoteChoice)) public voteChoices;

// Snapshot block for voting power calculation
mapping(uint256 proposalId => uint256) public snapshotBlocks;

// Token contract reference (ERC20)
IERC20 public governanceToken;
```

### Data Structures

```solidity
enum VoteChoice { None, For, Against, Abstain }

enum ProposalStatus { Draft, Active, Closed, Executed, Failed, Cancelled }

struct Proposal {
  uint256 id;
  address creator;
  string title;
  string description;
  bytes targetAction;          // Optional: encoded call for execution
  uint256 snapshotBlock;       // Block for voting power calculation
  uint256 votingDeadline;      // Timestamp when voting closes
  ProposalStatus status;       // Current lifecycle state
  uint256 createdAt;           // Timestamp of creation
  uint256 forVotes;            // Cumulative voting power
  uint256 againstVotes;        // Cumulative voting power
  uint256 abstainVotes;        // Cumulative voting power
}
```

### Events

```solidity
event ProposalCreated(
  uint256 indexed proposalId,
  address indexed creator,
  string title,
  uint256 votingDeadline,
  uint256 snapshotBlock
);

event VoteCast(
  uint256 indexed proposalId,
  address indexed voter,
  VoteChoice choice,
  uint256 votingPower,
  uint256 timestamp
);

event ProposalStatusChanged(
  uint256 indexed proposalId,
  ProposalStatus oldStatus,
  ProposalStatus newStatus,
  uint256 timestamp
);

event VotingDeadlineReached(
  uint256 indexed proposalId,
  uint256 forVotes,
  uint256 againstVotes,
  uint256 abstainVotes
);
```

### Functions

#### Write Functions (State-changing)

```solidity
/// @notice Create a new governance proposal
/// @param _title Proposal title (≤256 chars)
/// @param _description Proposal description (≤4096 chars)
/// @param _targetAction Optional encoded contract call for execution
/// @return proposalId The new proposal's ID
/// @notice Status set to Draft initially, must be activated by governance
function createProposal(
  string memory _title,
  string memory _description,
  bytes memory _targetAction
) external returns (uint256 proposalId);

// Preconditions:
//   - Caller must have voting power (token balance > 0)
//   - title.length > 0 AND ≤ 256
//   - description.length ≤ 4096
//   - votingDeadline set to current block.timestamp + VOTING_PERIOD
//   - snapshotBlock set to current block number
//   - Status set to Active (can be updated to Draft by governance)
//
// Emits: ProposalCreated(proposalId, msg.sender, _title, deadline, snapshot)
// Returns: proposalId (uint256)

---

/// @notice Cast a vote on an active proposal
/// @param _proposalId The proposal to vote on
/// @param _choice Vote choice (For=1, Against=2, Abstain=3)
/// @notice Reverts if proposal not Active, caller already voted, or deadline passed
function castVote(
  uint256 _proposalId,
  VoteChoice _choice
) external;

// Preconditions:
//   - proposal.status == Active
//   - !hasVoted[_proposalId][msg.sender]
//   - block.timestamp < proposal.votingDeadline
//   - msg.sender has voting power > 0 at snapshotBlock
//   - _choice in {For, Against, Abstain} (not None)
//
// Effects:
//   - Sets hasVoted[_proposalId][msg.sender] = true
//   - Records voteChoices[_proposalId][msg.sender] = _choice
//   - Accumulates voting power to proposal.forVotes/againstVotes/abstainVotes
//   - Updates proposal.status if deadline reached
//
// Emits: VoteCast(_proposalId, msg.sender, _choice, votingPower, timestamp)
// Reverts: "AlreadyVoted", "VotingClosed", "InsufficientPower"
```

#### Gasless Voting (EIP-712)

```solidity
/// @notice Cast vote via EIP-712 signature (gasless voting via relayer)
/// @param _proposalId The proposal to vote on
/// @param _choice Vote choice
/// @param _signature Member's EIP-712 signature
/// @notice Called by relayer on behalf of member
function castVoteGasless(
  uint256 _proposalId,
  VoteChoice _choice,
  bytes memory _signature
) external;

// Implementation:
//   - Uses EIP2771Context to extract trusted forwarder
//   - Verifies signature with EIP712Domain
//   - Executes castVote on behalf of signer
//   - Relayer pays gas, recovers from governance treasury
//
// Emits: VoteCast with _msgSender() from EIP2771
```

#### Status Management

```solidity
/// @notice Transition proposal from Draft to Active
/// @param _proposalId The proposal to activate
/// @notice Only callable by governance (multi-sig or DAO vote)
function activateProposal(uint256 _proposalId) external onlyGovernance;

// Effects:
//   - Requires proposal.status == Draft
//   - Sets proposal.status = Active
//   - Emits: ProposalStatusChanged(_proposalId, Draft, Active, timestamp)

---

/// @notice Close voting on a proposal (deadline reached or manual close)
/// @param _proposalId The proposal to close
function closeProposal(uint256 _proposalId) external;

// Preconditions:
//   - proposal.status == Active
//   - block.timestamp >= proposal.votingDeadline OR msg.sender == governance
//
// Effects:
//   - Sets proposal.status = Closed
//   - Calculates if passed (forVotes > againstVotes)
//   - Updates status to Executed/Failed based on outcome
//   - Emits: ProposalStatusChanged, VotingDeadlineReached
```

#### Read Functions (View only)

```solidity
/// @notice Get full proposal details
/// @param _proposalId The proposal ID
/// @return Proposal struct with all fields
function getProposal(uint256 _proposalId) 
  external view returns (Proposal memory);

---

/// @notice Get voting results for a proposal
/// @param _proposalId The proposal ID
/// @return for Cumulative voting power for "For"
/// @return against Cumulative voting power for "Against"
/// @return abstain Cumulative voting power for "Abstain"
function getVotingResults(uint256 _proposalId) 
  external view returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes);

---

/// @notice Check if a member has voted on a proposal
/// @param _proposalId The proposal ID
/// @param _voter The member address
/// @return bool True if member has voted
function hasVoted(uint256 _proposalId, address _voter) 
  external view returns (bool);

---

/// @notice Get member's vote choice on a proposal
/// @param _proposalId The proposal ID
/// @param _voter The member address
/// @return choice The vote choice (For, Against, Abstain)
/// @return votingPower The voting power used in this vote
function getVote(uint256 _proposalId, address _voter) 
  external view returns (VoteChoice choice, uint256 votingPower);

---

/// @notice Get proposal status
/// @param _proposalId The proposal ID
/// @return ProposalStatus enum value
function getProposalStatus(uint256 _proposalId) 
  external view returns (ProposalStatus);

---

/// @notice Calculate a member's voting power at a specific block
/// @param _member The member address
/// @param _blockNumber The block number (for historical lookup)
/// @return Voting power (token balance) at that block
function getVotingPowerAtBlock(address _member, uint256 _blockNumber) 
  external view returns (uint256);

// Uses: governanceToken.balanceOfAt(_member, _blockNumber)
// Requires: Token contract implements ERC20Snapshot
```

---

## Contract: EIP712VotingForwarder

Enables gasless voting via EIP-712 signatures. Inherits from OpenZeppelin's MinimalForwarder or custom relay handler.

### Functions

```solidity
/// @notice Execute a meta-transaction from a voter
/// @param _from Voter address (signer)
/// @param _to Target contract (GovernanceProposal)
/// @param _data Encoded castVote call
/// @param _signature EIP-712 signature
function executeMetaTx(
  address _from,
  address _to,
  bytes memory _data,
  bytes memory _signature
) external payable returns (bool, bytes memory);

// Verifies:
//   - _signature is valid for (_from, _to, _data)
//   - Nonce matches (prevents replay)
// Executes:
//   - delegatecall to _to with _data as behalf of _from
// Returns:
//   - (success, returnData)
```

### Events

```solidity
event MetaTransactionExecuted(
  address indexed from,
  address indexed to,
  bytes data,
  bytes32 signature
);
```

---

## ABI Summary (JSON)

The `contracts/` directory will contain:
- `GovernanceProposal.json` - Full ABI for proposal contract
- `EIP712VotingForwarder.json` - Full ABI for gasless relay
- `IERC20Snapshot.json` - Token interface (for voting power lookup)

These ABIs will be generated by Hardhat at compile time and used by:
- Frontend Ethers.js service to interact with contracts
- E2E tests to call functions directly

---

## Deployment Assumptions

- **Network**: Ethereum mainnet, Polygon PoS, or other EVM-compatible chain (configurable)
- **Token Contract**: ERC20Snapshot token already deployed with voting power snapshots
- **Relayer**: EIP-712 relayer service deployed and configured
- **Owner**: Governance multi-sig or DAO treasury controls admin functions

---

## Gas Estimates (Reference)

| Function | Gas Cost | Notes |
|----------|----------|-------|
| createProposal | ~150,000 | Storage write, string storage |
| castVote | ~80,000 | Double-vote check, vote accumulation |
| castVoteGasless | ~85,000 | Signature verification overhead |
| getProposal | ~5,000 | View function (no state change) |
| getVotingResults | ~3,000 | View function |

Gasless voters pay 0 gas (relayer covers); regular voters pay ~80k gas at current market rates.

---

## Security Considerations

1. **Reentrancy**: No external calls in vote/proposal functions (safe from reentrancy)
2. **Double Voting**: Enforced via mapping check before vote acceptance
3. **Deadline Enforcement**: Block timestamp check prevents late votes
4. **Voting Power Snapshot**: Uses block number to prevent flash loan attacks
5. **Signature Verification**: EIP-712 prevents signature reuse across chains
6. **Access Control**: Only governance can manage proposal status transitions

