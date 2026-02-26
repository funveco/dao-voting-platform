# Implementation Plan: Smart Contracts - EIP-2771 DAO Voting System

**Branch**: `001-eip2771-dao-voting` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)

## Summary

Implement two production-ready Solidity smart contracts for a DAO voting system:
1. **MinimalForwarder**: EIP-2771 meta-transaction relayer for gasless voting
2. **DAOVoting**: Core governance contract with proposal creation, voting, and execution

This enables DAO members to participate in governance without ETH for gas fees, addressing key adoption barriers.

---

## Technical Context

**Language/Version**: Solidity ^0.8.0  
**Primary Dependencies**: 
- OpenZeppelin Contracts v5.x (ERC2771Context, ECDSA, Ownable)
- Foundry (forge, anvil, cast)
- eth-sig-util (off-chain signing in tests)

**Storage**: Contract state (on-chain storage only, no external DB)  
**Testing**: Foundry's built-in test framework (Solidity tests)  
**Target Platform**: Ethereum mainnet, testnets (Sepolia), and local (Anvil)  
**Project Type**: Single smart contract module (no separate frontend in this feature)  
**Performance Goals**: 
- Proposal creation: <100k gas
- Vote submission: <50k gas (normal), <150k gas (gasless via forwarder)
- Proposal execution: <100k gas

**Constraints**: 
- Safety period: 7 days before execution
- Minimum creation power: 10% of total balance
- No delegated voting or token weights (MVP scope)

**Scale/Scope**: 
- Single DAO instance per deployment
- Unlimited proposals (sequential IDs)
- Unlimited voters
- No rate limiting in contracts

---

## Constitution Check

✅ **All gates PASS** - No violations

- [x] **Design System Compliance**: Not applicable (smart contracts only, no UI)
  - Note: Frontend will integrate with contract ABIs and events

- [x] **Blockchain-First**: ✅ Core feature
  - Contract interactions: DAO voting and fund transfer
  - Events emitted for voting and execution
  - State changes on-chain

- [x] **Test-First**: ✅ Planned
  - Unit tests: Individual functions (create proposal, vote, execute)
  - Integration tests: Full voting flow
  - Acceptance tests: Happy path + edge cases

- [x] **Observability**: ✅ Events strategy defined
  - ProposalCreated(proposalId, creator, amount, recipient, deadline)
  - VoteCast(proposalId, voter, voteType)
  - ProposalExecuted(proposalId, success)
  - FundsReceived(from, amount)

- [x] **Performance**: ✅ Gas targets defined
  - All critical operations <150k gas
  - View functions 0 gas (read-only)

- [x] **Accessibility**: N/A for smart contracts
  - Note: Frontend integration will handle accessibility

---

## Project Structure

### Documentation (this feature)

```text
specs/001-eip2771-dao-voting/
├── spec.md                  # Feature specification
├── plan.md                  # This file
├── research.md              # Technical decisions (to be created)
├── data-model.md            # Entity definitions (to be created)
├── contracts/               # ABI schemas (to be created)
│   ├── MinimalForwarder.json
│   └── DAOVoting.json
├── quickstart.md            # Integration examples (to be created)
├── checklists/
│   └── requirements.md      # Quality checklist (✅ COMPLETE)
└── tasks.md                 # Implementation tasks (to be created)
```

### Source Code Structure

```text
sc/                                 # New Foundry project (forge init)
├── src/
│   ├── MinimalForwarder.sol        # EIP-2771 meta-transaction forwarder
│   └── DAOVoting.sol                # Main DAO governance contract
│
├── test/
│   ├── MinimalForwarder.t.sol       # Forwarder tests
│   ├── DAOVoting.t.sol               # DAOVoting tests
│   ├── DAOVotingIntegration.t.sol    # Full voting flow tests
│   └── EdgeCases.t.sol               # Edge case tests
│
├── script/
│   ├── DeployLocal.s.sol            # Local Anvil deployment
│   ├── DeploySepolia.s.sol          # Sepolia testnet deployment
│   └── Fixtures.sol                  # Test helpers
│
├── foundry.toml              # Foundry configuration
├── remappings.txt            # Foundry remappings
└── package.json              # Node.js dependencies (optional, for deployment helpers)
```

**Structure Decision**: 
- Single Solidity project (Foundry)
- Contracts in `src/` with clear separation
- Comprehensive test suite in `test/`
- Deployment scripts in `script/` for automation
- No separate frontend (integration happens in `/web` project)

---

## Phase Overview

### Phase 0: Research (if needed)
- Investigate EIP-2771 reference implementations
- Review OpenZeppelin ERC2771Context implementation
- Document best practices for meta-transaction security

**Output**: research.md

### Phase 1: Design & Contracts

**1.1 Data Model** (data-model.md)
- Proposal struct with all fields
- Vote enum (NONE, FOR, AGAINST, ABSTAIN)
- Nonce mapping for replay protection
- Balance tracking

**1.2 Contract Schemas** (contracts/)
- MinimalForwarder ABI with methods:
  - `verify(ForwardRequest, bytes)` → bool
  - `execute(ForwardRequest, bytes)` → (bool, bytes)
  - `getNonce(address)` → uint256

- DAOVoting ABI with methods:
  - `fundDAO()` → payable, no return
  - `createProposal(address, uint256, uint256)` → returns proposalId
  - `vote(uint256, VoteType)` → no return
  - `executeProposal(uint256)` → bool
  - `getProposal(uint256)` → (Proposal memory)
  - `getUserBalance(address)` → uint256

**1.3 Integration Examples** (quickstart.md)
- Off-chain signing flow for gasless voting
- Relayer submission pattern
- Event listening for vote updates

**Output**: data-model.md, contracts/, quickstart.md

### Phase 2: Implementation (speckit.tasks output)
- Task phase breakdown by user story
- Setup: Foundry project initialization
- Core: Contract implementation
- Tests: Unit, integration, edge cases
- Deployment: Scripts for Anvil and testnet

**Output**: tasks.md

### Phase 3: Execution (speckit.implement)
- Run tasks in order
- Build and test
- Deploy to Anvil for local testing
- Ready for testnet deployment

---

## Key Design Decisions

### 1. EIP-2771 Meta-Transactions
**Decision**: Implement MinimalForwarder per EIP-2771 standard  
**Rationale**: 
- Standardized approach recognized by wallets (MetaMask)
- Enables gasless voting for users
- Relayer pattern is proven and secure

**Alternative Rejected**: Custom relayer logic (non-standard, harder to integrate with frontends)

### 2. Simple Voting (1 vote per user)
**Decision**: No token-weighted voting in MVP  
**Rationale**: 
- Simpler implementation and testing
- Faster execution (no token lookups)
- Token-weighted voting added later if needed

**Alternative Rejected**: ERC20 token weight (adds complexity, requires separate token contract)

### 3. Manual Proposal Execution
**Decision**: User-triggered execution (not automatic on deadline)  
**Rationale**: 
- Cheaper gas (no automatic triggers)
- More control for governance
- Prevents accidental execution

**Alternative Rejected**: Automated execution via Chainlink keepers (adds cost, complexity)

### 4. Simple Majority (FOR > AGAINST)
**Decision**: Proposal passes if FOR votes exceed AGAINST votes  
**Rationale**: 
- Simple to understand and implement
- ABSTAIN votes don't block (encourage participation)
- Standard in DAO governance

**Alternative Rejected**: Quorum requirement (adds complexity, blocks legitimate proposals)

### 5. Safety Period (7 days)
**Decision**: 7-day delay between deadline and execution  
**Rationale**: 
- Standard governance timelock
- Gives community time to respond to controversial proposals
- Reduces upgrade risk

**Alternative Rejected**: No delay (too risky for fund transfers)

---

## Dependencies & Integrations

### External Dependencies
```
openzeppelin-contracts@5.x
├── ERC2771Context (for gasless support)
├── ECDSA (for signature verification)
├── Ownable (for admin functions)
└── ReentrancyGuard (for ETH transfers)
```

### Integration Points

**MinimalForwarder ← DAOVoting**
- DAOVoting inherits ERC2771Context
- Receives _msgSender() from forwarder
- Trusts forwarder to validate signatures

**DAOVoting ← Frontend** (web project)
- Frontend reads proposals via getProposal()
- Frontend listens to VoteCast events
- Frontend submits votes via vote() function

**MinimalForwarder ← Relayer Service**
- Relayer gets user signature off-chain
- Relayer calls execute() with signature
- DAOVoting receives _msgSender() from forwarder

---

## Non-Functional Targets

| Metric | Target | How Measured |
|--------|--------|--------------|
| Test Coverage | >95% | forge coverage |
| Gas: Create Proposal | <100k | forge snapshot |
| Gas: Cast Vote | <50k | forge snapshot |
| Gas: Execute Proposal | <100k | forge snapshot |
| Contract Size | <24KB | forge build --sizes |
| Deployment Time | <2 min | Deploy script execution |
| No Vulnerabilities | 0 | Manual review + test coverage |

---

## Risk Mitigations

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Reentrancy on ETH transfer | Use ReentrancyGuard + checks-effects-interactions | Implementation |
| Signature replay attacks | Nonce tracking + chainId binding | MinimalForwarder |
| Double-spend (vote twice) | One vote per user mapping + vote overwrite logic | DAOVoting |
| Insufficient balance on execute | Balance check before transfer | DAOVoting |
| Race condition on execution | Safety period + executor validation | DAOVoting |

---

## Success Criteria

✅ All functional requirements implemented  
✅ All user stories have passing acceptance tests  
✅ >95% code coverage  
✅ All gas targets met  
✅ Deployment scripts work on Anvil and Sepolia  
✅ No security vulnerabilities found in review  
✅ All events emitted correctly  

---

## Next Steps

1. **Phase 0**: Run research if any unknowns remain (currently none)
2. **Phase 1**: Generate data-model.md, contracts/, quickstart.md via `/speckit.plan`
3. **Phase 2**: Generate tasks.md via `/speckit.tasks`
4. **Phase 3**: Execute tasks via `/speckit.implement`

---

**Status**: ✅ Plan Complete - Ready for Phase 1 Design
