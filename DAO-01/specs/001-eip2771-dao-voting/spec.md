# Smart Contracts - EIP-2771 DAO Voting System

## Overview

Implement two core Solidity smart contracts for a decentralized autonomous organization (DAO) voting system with support for gasless voting via EIP-2771 meta-transactions.

---

## User Stories

### US1: Users can execute transactions without paying gas
**Priority:** P1

As a DAO member, I want to vote on proposals without paying gas fees, so I can participate in governance even if I don't have ETH for transaction costs.

**Acceptance Scenarios:**
1. User signs voting message off-chain
2. Relayer submits signature to MinimalForwarder
3. ForwarderContract validates signature and executes vote
4. Vote is recorded on-chain without user paying gas
5. Nonce incremented to prevent replay attacks

---

### US2: Users can create governance proposals
**Priority:** P1

As a DAO member with sufficient voting power, I want to create proposals so that the DAO can vote on governance decisions.

**Acceptance Scenarios:**
1. User with ≥10% of total DAO balance can create proposal
2. Proposal stores recipient address and ETH amount
3. Proposal has configurable voting deadline
4. Proposal is assigned sequential ID (1, 2, 3...)
5. User with <10% balance is rejected with clear error

---

### US3: Users can vote on active proposals
**Priority:** P1

As a DAO member, I want to vote on active proposals (FOR, AGAINST, ABSTAIN) so I can influence DAO decisions.

**Acceptance Scenarios:**
1. User can vote on any open proposal (before deadline)
2. User can change vote before deadline
3. Each user has one vote per proposal
4. Three vote types supported (FOR, AGAINST, ABSTAIN)
5. User voting after deadline is rejected
6. Vote count is updated in real-time

---

### US4: DAO can execute approved proposals automatically
**Priority:** P1

As a DAO governance system, I want to automatically execute approved proposals so that passed votes result in immediate action.

**Acceptance Scenarios:**
1. After deadline passes and safety period elapses, proposal is executable
2. Executable if: FOR votes > AGAINST votes
3. Execute transfers ETH to beneficiary address
4. Proposal marked as executed (cannot execute twice)
5. Balance check prevents transfer if insufficient funds

---

### US5: DAO receives and tracks funding
**Priority:** P2

As a DAO treasury system, I want to receive ETH and track total balance so members know available funds.

**Acceptance Scenarios:**
1. Contract accepts ETH via payable fallback or receive function
2. Total DAO balance is tracked and queryable
3. Users can view their voting power (ETH balance / total balance)
4. Balance updates are reflected immediately after deposits

---

### US6: Users can verify their voting power
**Priority:** P2

As a DAO member, I want to check my voting power so I know if I'm eligible to create proposals.

**Acceptance Scenarios:**
1. Any user can query their voting power (balance / total DAO balance)
2. Result reflects current DAO state
3. Voting power must be ≥10% for proposal creation eligibility
4. Query returns zero if user has no balance

---

## Functional Requirements

### Proposal Management
- FR1: Proposals have unique sequential IDs (1, 2, 3...)
- FR2: Each proposal stores: recipient address, ETH amount, deadline, vote counts
- FR3: Proposal states: PENDING, EXECUTED, or FAILED (visible in vote counts)
- FR4: Only users with ≥10% of total balance can create proposals
- FR5: Deadline is configurable per proposal (Unix timestamp)
- FR6: Proposals cannot be created with zero amount or zero address

### Voting System
- FR7: Only one vote per user per proposal
- FR8: Users can change vote before deadline
- FR9: Three vote types: FOR (1), AGAINST (2), ABSTAIN (3)
- FR10: Voting stops immediately after deadline
- FR11: Vote weight = 1 per user (simple voting, not token-weighted for US1-4)
- FR12: Vote counts maintained separately: forVotes, againstVotes, abstainVotes

### Execution
- FR13: Executable only after deadline AND safety period (7 days)
- FR14: Executable only if: forVotes > againstVotes
- FR15: Execution transfers exact ETH amount from DAO to recipient
- FR16: Execution fails if DAO balance insufficient
- FR17: Executed proposals cannot be executed again (idempotent protection)
- FR18: Execution emits event with proposal ID and transaction details

### Meta-Transactions (MinimalForwarder)
- FR19: ForwarderContract implements EIP-2771 standard
- FR20: ForwarderContract validates ECDSA signatures
- FR21: ForwarderContract maintains nonce per user for replay protection
- FR22: ForwarderContract executes arbitrary calls on behalf of users
- FR23: DAOVoting inherits ERC2771Context to receive _msgSender()

### Fund Management
- FR24: DAO receives ETH via receive() function
- FR25: Total DAO balance tracked and queryable
- FR26: No maximum balance limit

---

## Success Criteria

### Functional Success
1. Proposals can be created by eligible users with correct parameters
2. Users can vote on open proposals without restrictions
3. Proposals execute correctly after deadline with correct vote results
4. Voting power is accurately calculated and enforced
5. Gasless voting works: signature → execution without user paying gas

### Performance Success
1. Proposal creation ≤ 100k gas
2. Vote submission ≤ 50k gas (normal) or ≤ 150k gas (gasless with forwarding)
3. Proposal execution ≤ 100k gas
4. View functions (getProposal, getUserBalance) instant (0 gas, read-only)

### Security Success
1. Only valid signatures accepted in meta-transactions
2. Replay attacks prevented via nonce tracking
3. Proposal execution cannot be replayed (idempotent)
4. Balance checks prevent execution without funds
5. No reentrancy vulnerabilities

### Testing Success
1. 100% test coverage for core voting logic
2. All edge cases tested (double-vote, vote after deadline, etc.)
3. Both normal and gasless voting paths tested
4. Deployment scripts work on Anvil (local) and testnet

---

## Data Model

### Proposal
```solidity
struct Proposal {
  uint256 id;              // Sequential ID
  address creator;         // Who created it
  address recipient;       // ETH transfer recipient
  uint256 amount;          // ETH amount to transfer
  uint256 deadline;        // Voting deadline (Unix timestamp)
  uint256 forVotes;        // Count of FOR votes
  uint256 againstVotes;    // Count of AGAINST votes
  uint256 abstainVotes;    // Count of ABSTAIN votes
  bool executed;           // Has been executed
  uint256 createdAt;       // Creation timestamp
}
```

### Vote
```solidity
enum VoteType {
  NONE,        // 0 - Default (not voted)
  FOR,         // 1 - In favor
  AGAINST,     // 2 - Against
  ABSTAIN      // 3 - Abstention
}
```

### Nonce (MinimalForwarder)
```solidity
mapping(address user => uint256) nonce;  // Incremented per execute()
```

---

## Constraints & Assumptions

### Technical Constraints
- Smart contracts written in Solidity ^0.8.0
- Developed with Foundry (forge/cast/anvil)
- Must use OpenZeppelin Contracts library for ERC2771Context, ECDSA
- Gas limits assume Ethereum L1 (not optimized for L2)

### Business Constraints
- Safety period for execution: 7 days after deadline
- Minimum creation power: 10% of total balance
- One vote per user per proposal (simple voting)
- No token weights or delegation (US1-4)

### Assumptions
- Users have separate ETH balance (stored in DAO contract balance, not ERC20 token)
- Voting deadline is enforced on-chain (no off-chain oracle)
- Execution is manually triggered (not automatic on deadline)
- MetaMask or similar EIP-191 signer used for off-chain signing
- Relayer pays gas for gasless votes (not incentivized in contract)

---

## Dependencies & Integrations

### External Dependencies
- OpenZeppelin Contracts (ERC2771Context, ECDSA, Ownable, etc.)
- Foundry (forge, anvil, cast)
- eth-sig-util or ethers.js (for off-chain signature generation in tests)

### Integration Points
- MinimalForwarder ← DAOVoting (forwards votes as meta-transactions)
- DAOVoting ← Frontend (submit votes, create proposals)
- DAOVoting ← Relayer Service (submits gasless votes)

---

## Non-Functional Requirements

### Security
- NFR1: Contracts pass OpenZeppelin security best practices
- NFR2: No known vulnerabilities in dependencies
- NFR3: Reentrancy guards on ETH transfers

### Auditability
- NFR4: All state changes emit events
- NFR5: Events include indexed parameters for filtering
- NFR6: Constructor parameters logged

### Testability
- NFR7: Full test coverage (>95%) for core logic
- NFR8: Tests include both happy path and error cases
- NFR9: Tests cover both normal and gasless voting paths

---

## Out of Scope

- Token-weighted voting (US1-4 are 1-vote-per-user only)
- Automated execution (triggered manually)
- DAO governance (no treasury management beyond basic transfer)
- Frontend UI (only smart contracts)
- Proposal amendments or cancellation
- Voting delegation or proxies

---

## Success Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Test Coverage | >95% | Coverage report from forge |
| Gas Cost (Proposal) | <100k | forge gas snapshot |
| Gas Cost (Vote) | <50k normal, <150k gasless | forge gas snapshot |
| All Tests Pass | 100% | `forge test` exit code 0 |
| No Security Issues | 0 | Manual review + test coverage |
| Deployment Works | 100% on Anvil + testnet | Deploy script success |

---

## Acceptance Criteria Summary

✅ MinimalForwarder implements EIP-2771  
✅ DAOVoting inherits ERC2771Context  
✅ All 6 user stories have defined flows  
✅ Proposal creation validates 10% power requirement  
✅ Voting works (create, vote, execute)  
✅ Gasless voting supported via meta-transactions  
✅ All edge cases handled (double vote, insufficient balance, etc.)  
✅ Full test coverage  
✅ Deployment scripts provided  
✅ No [NEEDS CLARIFICATION] markers  
