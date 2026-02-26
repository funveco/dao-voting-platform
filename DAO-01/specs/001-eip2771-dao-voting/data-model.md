# Data Model: Smart Contracts - EIP-2771 DAO Voting

**Feature**: [001-eip2771-dao-voting](spec.md)  
**Date**: 2026-02-11

---

## Core Entities

### 1. Proposal

Represents a governance proposal with voting data and execution state.

```solidity
struct Proposal {
    uint256 id;              // Unique sequential ID (1, 2, 3...)
    address creator;         // Account that created proposal
    address recipient;       // Beneficiary if executed (ETH transfer target)
    uint256 amount;          // ETH amount to transfer if approved (in wei)
    uint256 deadline;        // Voting deadline (Unix timestamp, seconds)
    uint256 forVotes;        // Count of FOR votes
    uint256 againstVotes;    // Count of AGAINST votes
    uint256 abstainVotes;    // Count of ABSTAIN votes
    bool executed;           // Has been executed (prevents double-execution)
    uint256 createdAt;       // Creation timestamp (Unix timestamp)
}
```

**Invariants**:
- `id` starts at 1 and increments by 1 for each new proposal
- `amount` > 0 (cannot create zero-amount proposals)
- `recipient` != address(0) (cannot send to null address)
- `deadline` > block.timestamp when created
- `executed` can only transition false → true, never back
- Vote counts only increase (never decrease)
- Only one of `creator`'s votes per proposal counted

**Storage**:
- Mapping: `mapping(uint256 proposalId => Proposal) public proposals`
- Counter: `uint256 public proposalCount` (incremented on creation)

**Lifecycle**:
1. Created: All fields initialized, votes = 0, executed = false
2. Voting Phase: Users vote (FOR/AGAINST/ABSTAIN) until deadline
3. After Deadline: No new votes accepted
4. Execution Phase: After 7-day safety period, anyone can execute
5. Executed: Funds transferred to recipient, executed = true

---

### 2. Vote Type (Enum)

Represents the three voting options.

```solidity
enum VoteType {
    NONE,       // 0 - Default (user has not voted)
    FOR,        // 1 - In favor of proposal
    AGAINST,    // 2 - Against proposal
    ABSTAIN     // 3 - Abstention (neither for nor against)
}
```

**Usage**:
- Default is NONE (maps to 0)
- Users call `vote(proposalId, VoteType.FOR)` to vote
- Internal tracking: `mapping(uint256 proposalId => mapping(address voter => VoteType)) userVotes`

---

### 3. User Vote Record

Tracks which vote type each user cast on each proposal.

```solidity
mapping(uint256 proposalId => mapping(address voter => VoteType)) userVotes;
```

**Invariants**:
- Only one entry per (proposal, voter) pair
- Value is VoteType.NONE (0) if user hasn't voted
- Value can change before deadline (vote override)
- Value is immutable after deadline

**Operations**:
- Get vote: `userVotes[proposalId][msg.sender]` returns VoteType
- Check voted: `userVotes[proposalId][msg.sender] != VoteType.NONE`
- Change vote: Update mapping and adjust vote counts accordingly

---

### 4. User Nonce (MinimalForwarder)

Prevents replay attacks for gasless meta-transactions.

```solidity
mapping(address user => uint256) nonces;
```

**Invariants**:
- Initialized to 0 for all new users
- Incremented by exactly 1 on each successful execute()
- Must match signed value in ForwardRequest
- Not reset per proposal (global per user)

**Operations**:
- Get nonce: `nonces[user]` returns current nonce
- Increment: `nonces[user]++` after execution

---

## Relationships

### Proposal → Votes
- 1 Proposal has many VoteType entries (one per voter, before deadline)
- Vote counts (forVotes, againstVotes, abstainVotes) aggregate all votes
- Vote changes handled via override: remove old vote, add new vote

**Example**:
```
Proposal 5:
├── User A votes FOR → forVotes++
├── User B votes AGAINST → againstVotes++
├── User A changes to AGAINST → forVotes--, againstVotes++
└── User C votes ABSTAIN → abstainVotes++

Result: forVotes=0, againstVotes=2, abstainVotes=1
```

### MinimalForwarder → DAOVoting
- Forwarder validates signature with user's nonce
- Forwarder executes DAOVoting function call
- DAOVoting receives _msgSender() from forwarder (trusts it)
- DAOVoting records _msgSender() as voter

**Example**:
```
User signs: "Vote FOR on proposal 5, nonce=3"
  ↓
Relayer submits to MinimalForwarder.execute()
  ↓
MinimalForwarder validates signature with nonce 3
  ↓
MinimalForwarder calls DAOVoting.vote(5, FOR)
  ↓
DAOVoting sees _msgSender() = User (trusts forwarder)
  ↓
DAOVoting records User's FOR vote, increments forVotes
```

---

## State Transitions

### Proposal Execution Timeline

```
T=0: Proposal created
  └─ deadline = T + 7 days (example)

T=1-7 days: Voting phase active
  └─ Users can vote, change vote
  └─ Vote counts update in real-time

T=7 days: Deadline reached
  └─ No new votes accepted

T=7-14 days: Safety period
  └─ No execution allowed yet
  └─ Gives community time to respond

T=14 days: Executable
  └─ Anyone can call executeProposal()
  └─ If FOR > AGAINST: Transfer amount to recipient
  └─ Set executed = true
  └─ Emit ProposalExecuted event

T=15+ days: Executed
  └─ Cannot execute again (idempotent protection)
  └─ Proposal final
```

---

## Vote Count Update Logic

When a user votes or changes their vote:

```solidity
VoteType previousVote = userVotes[proposalId][msg.sender];

// Remove old vote count
if (previousVote == VoteType.FOR) forVotes--;
else if (previousVote == VoteType.AGAINST) againstVotes--;
else if (previousVote == VoteType.ABSTAIN) abstainVotes--;

// Add new vote count
if (newVote == VoteType.FOR) forVotes++;
else if (newVote == VoteType.AGAINST) againstVotes++;
else if (newVote == VoteType.ABSTAIN) abstainVotes++;

// Record vote
userVotes[proposalId][msg.sender] = newVote;
```

**Invariants maintained**:
- Total votes never decreases (only changes distribution)
- User's vote always in one category (0 or 1, never split)
- Vote counts reflect current votes (accurate at query time)

---

## Creation Power Requirement

User can create proposal only if:

```solidity
uint256 userBalance = getUserBalance(msg.sender);
uint256 minPower = address(this).balance / 10;  // 10% of total DAO balance

require(userBalance >= minPower, "Insufficient power to create");
```

**Invariants**:
- Threshold = 10% of total DAO balance (contract's ETH balance)
- Recalculated per proposal creation (threshold can change as DAO grows)
- Non-zero balance required (prevents free spam with 0.0001 ETH)

---

## Execution Eligibility

Proposal is executable if:

```solidity
bool isExecutable = 
    block.timestamp >= (proposal.deadline + 7 days) &&  // Safety period elapsed
    proposal.forVotes > proposal.againstVotes &&         // FOR > AGAINST
    !proposal.executed &&                                 // Not already executed
    address(this).balance >= proposal.amount;            // Sufficient funds
```

**All conditions must be true** for execution to succeed.

---

## Events (for state change observability)

### ProposalCreated
```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    address indexed creator,
    address indexed recipient,
    uint256 amount,
    uint256 deadline
);
```

**Emitted**: When new proposal created  
**Use**: Off-chain listening for new proposals

### VoteCast
```solidity
event VoteCast(
    uint256 indexed proposalId,
    address indexed voter,
    VoteType voteType,
    uint256 forVotes,
    uint256 againstVotes,
    uint256 abstainVotes
);
```

**Emitted**: When vote cast or changed  
**Use**: Off-chain listening for vote updates, real-time result refresh

### ProposalExecuted
```solidity
event ProposalExecuted(
    uint256 indexed proposalId,
    bool success,
    uint256 amount,
    address recipient
);
```

**Emitted**: When proposal executed (success or failure)  
**Use**: Off-chain confirmation of execution

### FundsReceived
```solidity
event FundsReceived(
    address indexed from,
    uint256 amount
);
```

**Emitted**: When DAO receives ETH  
**Use**: Off-chain tracking of DAO balance changes

---

## View Functions (Read-Only)

These return current state without modifying storage:

### getProposal(uint256 proposalId) → Proposal
- Returns full Proposal struct
- Can read all vote counts and metadata
- Works for executed proposals

### getUserBalance(address user) → uint256
- Returns user's voting power as percentage (0-100)
- Calculated as: (0 if user balance = 0 else user's eth balance / total DAO balance * 100)
- Read-only, no state change

### getUserVote(uint256 proposalId, address voter) → VoteType
- Returns voter's vote type on proposal
- Returns VoteType.NONE if no vote cast
- Read-only, no state change

### getDAOBalance() → uint256
- Returns total ETH balance of DAO contract
- Calculated as: address(this).balance

---

## Constraints & Validations

| Field | Constraint | Check |
|-------|-----------|-------|
| Proposal.id | > 0, sequential | Auto-incremented |
| Proposal.creator | != address(0) | msg.sender != 0 |
| Proposal.recipient | != address(0) | Require in create |
| Proposal.amount | > 0 | Require in create |
| Proposal.deadline | > now | Require: deadline > block.timestamp |
| Proposal.executed | false on creation | Initialized in create |
| VoteType | 0-3 only | Enum type check |
| Vote count | uint256 | Auto from Solidity |
| Nonce | uint256 | Auto from Solidity |

---

## Data Integrity Rules

1. **No duplicate votes**: Each (proposal, voter) pair has exactly one vote type
2. **Vote immutability**: Vote cannot be deleted, only changed
3. **Execution idempotency**: Executed proposals cannot execute again
4. **Monotonic vote counts**: Never decrease, only increase or change distribution
5. **No proposal modification**: Creator cannot change proposal details after creation
6. **No vote count rollback**: Cannot subtract votes (only change distribution)

---

## Storage Gas Optimization Notes

- Proposals use struct (efficient packing)
- Vote types use enum (uint8, 1 byte)
- Nonces use uint256 (required for ECDSA recovery)
- No dynamic arrays (fixed-size fields only)
- Mappings used for O(1) lookups

**Result**: ~3 SSTORE per proposal creation, ~5k gas per vote, <100k gas per execution

---

## Summary Table

| Entity | Type | Cardinality | Storage | Access |
|--------|------|-------------|---------|--------|
| Proposal | Struct | 1:N (proposalId) | Mapping | O(1) lookup |
| VoteType | Enum | 4 values | Constant | O(1) access |
| User Vote | Mapping | N:N (proposal, voter) | 2D Mapping | O(1) lookup |
| Nonce | Mapping | 1:1 (user) | Mapping | O(1) lookup |
| Balance | Contract State | 1 per DAO | ETH balance | O(1) read |

---

**Status**: ✅ Data Model Complete - Ready for Contract Implementation
