# Phase 1 Data Model: Proposal Creation & Voting System

**Date**: 2025-02-06 | **Status**: Complete | **Branch**: `001-proposal-voting`

## Core Entities

### 1. Proposal

Represents a governance proposal in the DAO ecosystem.

**Storage Location**: Smart contract (on-chain)

**Fields**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | uint256 | Unique proposal identifier | Immutable, auto-incremented |
| `creator` | address | Member who created the proposal | Must have voting rights at creation |
| `title` | string | Proposal title | Max 256 characters, non-empty |
| `description` | string | Detailed proposal description/rationale | Max 4096 characters |
| `targetAction` | bytes (optional) | Encoded contract call if proposal will execute action | Optional; validated at creation |
| `snapshotBlock` | uint256 | Block number for voting power calculation | Set at creation; immutable |
| `votingDeadline` | uint256 | Unix timestamp when voting closes | Must be >0 and >current time |
| `status` | enum | Current lifecycle state | {Draft, Active, Closed, Executed, Failed, Cancelled} |
| `createdAt` | uint256 | Unix timestamp of proposal creation | Immutable |
| `forVotes` | uint256 | Cumulative voting power for "Vote For" | Updated on each vote |
| `againstVotes` | uint256 | Cumulative voting power for "Vote Against" | Updated on each vote |
| `abstainVotes` | uint256 | Cumulative voting power for "Abstain" | Updated on each vote |

**State Transitions**:
```
Draft → Active (on blockchain confirmation)
  ↓
Closed (when votingDeadline reached OR governance action)
  ├→ Executed (if vote passed AND action executed)
  ├→ Failed (if vote did not meet threshold)
  └→ Cancelled (if creator or governance revokes)
```

**Validation Rules**:
- Title must be non-empty and ≤256 chars
- Description must be ≤4096 chars
- votingDeadline must be > current block.timestamp
- Only Draft proposals can be cancelled by creator
- Cannot vote on proposals that are not Active

**Indexing**: Primary key `id`; indexes on `creator`, `votingDeadline`, `status`

---

### 2. Vote

Represents a single member's vote on a proposal.

**Storage Location**: Smart contract (on-chain)

**Structure**:
```solidity
mapping(uint256 proposalId => mapping(address voter => bool hasVoted)) public votes;
mapping(uint256 proposalId => mapping(address voter => VoteChoice)) public voteChoices;

enum VoteChoice { None, For, Against, Abstain }
```

**Fields**:

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `proposalId` | uint256 | Reference to proposal | Must exist and be Active |
| `voter` | address | Member casting the vote | Must have voting power > 0 at snapshot |
| `choice` | enum | Vote selection | {For, Against, Abstain} |
| `votingPower` | uint256 | Token balance at snapshot block | Determined from token contract |
| `timestamp` | uint256 | Block timestamp of vote submission | Immutable |
| `txHash` | bytes32 | Transaction hash of vote | Immutable; for audit trail |

**Validation Rules**:
- Voter must not have voted before on same proposal (checked via `hasVoted` mapping)
- Voter must have voting power > 0 at snapshot block
- Vote must be cast before votingDeadline
- Vote choice must be one of the three options (not None)

**Indexing**: Composite index on `(proposalId, voter)`; index on `timestamp`

**Double-Vote Prevention**:
```solidity
require(!hasVoted[proposalId][msg.sender], "Already voted");
require(proposal.status == Status.Active, "Voting closed");
require(block.timestamp < proposal.votingDeadline, "Deadline passed");
```

---

### 3. Member

Represents a DAO member with voting capabilities.

**Storage Location**: Off-chain (cached from token contract)

**Fields**:

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `address` | address | Token contract | Unique member identifier |
| `tokenBalance` | uint256 | Token contract | Current token holdings |
| `votingPowerAtSnapshot[proposalId]` | uint256 | Token contract historical data | Token balance at proposal snapshot block |
| `hasVotedOn[proposalId]` | bool | Voting contract | Whether member voted on proposal |

**Notes**:
- Voting power is derived from token balance at snapshot block, not current balance
- Members must hold tokens to vote (votingPower > 0)
- No explicit "membership" entity; membership is determined by token holdings

---

### 4. ProposalStatus (Enumeration)

```solidity
enum ProposalStatus {
  Draft,      // Created but not yet submitted to blockchain
  Active,     // Voting is open
  Closed,     // Voting ended (deadline reached)
  Executed,   // Passed proposal's action completed
  Failed,     // Voting ended, did not meet threshold
  Cancelled   // Proposal withdrawn
}
```

---

## Relationships

```
Proposal (1) ──→ (many) Vote
  - One proposal has many votes
  - Votes reference proposal by id
  - Constraint: Vote.proposalId must match existing Proposal.id

Proposal (creator) ──→ Member
  - Creator is a member address
  - Constraint: creator must have voting rights at time of creation

Vote (voter) ──→ Member
  - Voter is a member address
  - Constraint: voter must have voting power at snapshot block
```

---

## Data Constraints & Validation

### Proposal Constraints

```solidity
// At creation
require(bytes(title).length > 0 && bytes(title).length <= 256);
require(bytes(description).length <= 4096);
require(votingDeadline > block.timestamp);
require(member[msg.sender].votingPower > 0);

// At voting
require(proposal.status == Status.Active);
require(block.timestamp < proposal.votingDeadline);
require(!hasVoted[proposalId][voter]);
require(votingPower[voter] > 0);
```

### Vote Accumulation

Votes are summed by choice and stored as running totals:
```solidity
if (choice == VoteChoice.For) {
  proposal.forVotes += votingPower;
} else if (choice == VoteChoice.Against) {
  proposal.againstVotes += votingPower;
} else {
  proposal.abstainVotes += votingPower;
}
```

### Result Calculation

```
Total Votes = forVotes + againstVotes + abstainVotes
For %       = (forVotes / Total) * 100
Against %   = (againstVotes / Total) * 100
Abstain %   = (abstainVotes / Total) * 100

Passes if: forVotes > againstVotes (simple majority)
```

---

## Data Retention & Lifecycle

- **Proposals**: Stored indefinitely on-chain (immutable ledger)
- **Votes**: Stored indefinitely on-chain (audit trail)
- **Off-chain Cache** (Phase 2): PostgreSQL keeps 12-month rolling window; older data archived

---

## API Contracts (Functions)

### Proposal Functions

```solidity
function createProposal(
  string memory title,
  string memory description,
  bytes memory targetAction
) public returns (uint256 proposalId);
// Returns: new proposal ID
// Emits: ProposalCreated(proposalId, creator, deadline, snapshotBlock)

function getProposal(uint256 proposalId) public view returns (Proposal memory);
// Returns: Full proposal struct

function getVotingResults(uint256 proposalId) 
  public view returns (uint256 for, uint256 against, uint256 abstain);
// Returns: Vote counts by choice

function getProposalStatus(uint256 proposalId) public view returns (ProposalStatus);
// Returns: Current status (Draft, Active, Closed, etc.)
```

### Voting Functions

```solidity
function castVote(uint256 proposalId, VoteChoice choice) public;
// Preconditions: proposal Active, caller not voted, votingDeadline not passed
// Effects: Records vote, updates proposal vote counts
// Emits: VoteCast(proposalId, voter, choice, votingPower)

function hasVoted(uint256 proposalId, address voter) public view returns (bool);
// Returns: true if voter has cast a vote on this proposal

function getVote(uint256 proposalId, address voter) 
  public view returns (VoteChoice, uint256 votingPower);
// Returns: Vote choice and voting power for a member on a proposal
```

### Member Functions

```solidity
function getMemberVotingPower(address member, uint256 blockNumber) 
  public view returns (uint256);
// Returns: Token balance of member at specified block (for snapshot queries)
```

---

## Frontend Data Structures (TypeScript)

```typescript
// Derived from smart contract
interface Proposal {
  id: bigint;
  creator: string;
  title: string;
  description: string;
  targetAction?: string; // hex-encoded if present
  snapshotBlock: bigint;
  votingDeadline: bigint; // Unix timestamp
  status: "Draft" | "Active" | "Closed" | "Executed" | "Failed" | "Cancelled";
  createdAt: bigint; // Unix timestamp
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
}

interface Vote {
  proposalId: bigint;
  voter: string;
  choice: "For" | "Against" | "Abstain";
  votingPower: bigint;
  timestamp: bigint;
}

interface VotingResults {
  forCount: bigint;
  forPercentage: number; // 0-100
  againstCount: bigint;
  againstPercentage: number;
  abstainCount: bigint;
  abstainPercentage: number;
  totalVotes: bigint;
}

interface Member {
  address: string;
  tokenBalance: bigint;
  hasVoted: Record<string, boolean>; // proposalId -> bool
}
```

---

## Design System Integration

All entity displays follow constitution color/typography standards:

- **Status Badges**: Green for Active/Executed, Red for Failed, Gray for Draft/Closed
- **Vote Results**: Green bar for For votes, Red for Against, Gray for Abstain
- **Member Addresses**: Monospace font (Geist Mono)
- **Proposal Titles**: Large, bold foreground text
- **Descriptions**: Body text with muted foreground color

