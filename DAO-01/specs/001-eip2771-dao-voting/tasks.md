# Implementation Tasks: Smart Contracts - EIP-2771 DAO Voting

**Feature**: [001-eip2771-dao-voting](spec.md)  
**Branch**: `001-eip2771-dao-voting`  
**Date**: 2026-02-11

---

## Executive Summary

Total: **27 tasks** organized in 5 phases

- **Phase 1** (Setup): 3 tasks - Project initialization
- **Phase 2** (Foundation): 2 tasks - Dependency setup
- **US1** (Gasless Voting): 6 tasks - MinimalForwarder contract
- **US2-3** (Proposal & Voting): 8 tasks - DAOVoting core features
- **US4-6** (Execution & Management): 5 tasks - Execution and fund management
- **Phase 6** (Testing & Polish): 3 tasks - Comprehensive testing

**MVP Scope**: Complete Phase 1-2 + US1-3 (Tasks T001-T018) = Minimum gasless voting feature  
**Full Scope**: All tasks (T001-T027)

**Parallel Opportunities**:
- T004-T005 (dependency setup) can run in parallel
- T007-T009 (MinimalForwarder logic) can run in parallel after T006
- T013-T015 (DAOVoting features) can run in parallel after T011
- T019-T021 (execution and fund management) can run in parallel after T018

---

## Phase 1: Project Setup

- [ ] T001 Initialize Foundry project with `forge init sc` in repository root
- [ ] T002 Install OpenZeppelin Contracts v5.x via `forge install OpenZeppelin/openzeppelin-contracts`
- [ ] T003 Create `sc/foundry.toml` with compiler version ^0.8.20 and optimizer settings

---

## Phase 2: Foundation & Configuration

- [ ] T004 [P] Create `sc/.env.example` with RPC URLs for Anvil, Sepolia, Mainnet
- [ ] T005 [P] Create `sc/remappings.txt` with OZ remapping: `@openzeppelin=lib/openzeppelin-contracts/contracts`
- [ ] T006 Create `sc/test/Fixtures.sol` with helper functions and test data setup

---

## User Story 1: Gasless Voting via EIP-2771 (US1)

User Story Goal: Enable users to vote without paying gas fees

- [ ] T007 [P] [US1] Implement `MinimalForwarder.sol` - Contract header and imports
- [ ] T008 [P] [US1] Implement `MinimalForwarder.sol` - verify() function for signature validation using ECDSA
- [ ] T009 [P] [US1] Implement `MinimalForwarder.sol` - execute() function for meta-transaction execution
- [ ] T010 [P] [US1] Implement `MinimalForwarder.sol` - getNonce() function and nonce tracking
- [ ] T011 [US1] Write unit tests for MinimalForwarder in `sc/test/MinimalForwarder.t.sol` (verify, execute, nonce)
- [ ] T012 [US1] Write signature generation tests for EIP-712 compatibility in MinimalForwarder tests

**Acceptance**: MinimalForwarder signs and executes meta-transactions, prevents replay attacks via nonce

---

## User Story 2: Create Governance Proposals (US2)

User Story Goal: Allow DAO members with sufficient voting power to create proposals

- [ ] T013 [P] [US2] Implement `DAOVoting.sol` - Contract header, inheritance from ERC2771Context, state variables
- [ ] T014 [P] [US2] Implement `DAOVoting.sol` - createProposal() function with power check (≥10%)
- [ ] T015 [P] [US2] Implement `DAOVoting.sol` - getProposal() and getUserVotingPower() view functions
- [ ] T016 [US2] Write unit tests for proposal creation in `sc/test/DAOVoting.t.sol`
- [ ] T017 [US2] Write tests for voting power calculation and 10% threshold enforcement

**Acceptance**: Proposals created with sequential IDs, power requirement enforced, vote counts initialized

---

## User Story 3: Vote on Proposals (US3)

User Story Goal: Allow users to vote FOR, AGAINST, ABSTAIN on active proposals

- [ ] T018 [P] [US3] Implement `DAOVoting.sol` - vote() function with deadline check and vote count updates
- [ ] T019 [P] [US3] Implement `DAOVoting.sol` - getUserVote() to retrieve user's vote type
- [ ] T020 [P] [US3] Implement `DAOVoting.sol` - Vote override logic (allow changing vote before deadline)
- [ ] T021 [US3] Write comprehensive unit tests for voting logic in `sc/test/DAOVoting.t.sol`
- [ ] T022 [US3] Write tests for deadline enforcement and vote change scenarios

**Acceptance**: Users vote successfully, deadline enforced, vote changes allowed, vote counts accurate

---

## User Story 4: Execute Approved Proposals (US4)

User Story Goal: Automatically transfer funds when proposals are approved and safe period elapses

- [ ] T023 [P] [US4] Implement `DAOVoting.sol` - executeProposal() function with all prerequisite checks
- [ ] T024 [P] [US4] Implement `DAOVoting.sol` - Reentrancy protection for ETH transfer (ReentrancyGuard or CEI)
- [ ] T025 [US4] Write unit tests for proposal execution in `sc/test/DAOVoting.t.sol`
- [ ] T026 [US4] Write tests for safety period enforcement, approval checks, and idempotency

**Acceptance**: Proposals execute correctly after deadline + 7 days, funds transfer, no double-execution

---

## User Story 5 & 6: Funding & Power Verification (US5-6)

User Story Goal: Manage DAO funds and allow members to check voting eligibility

- [ ] T027 [P] [US5-6] Implement `DAOVoting.sol` - fundDAO() payable function and receive() function
- [ ] T028 [P] [US5-6] Implement `DAOVoting.sol` - getDAOBalance() view function
- [ ] T029 [US5-6] Write unit tests for funding and balance tracking in `sc/test/DAOVoting.t.sol`
- [ ] T030 [US5-6] Write tests for voting power updates as DAO balance changes

**Acceptance**: DAO receives ETH, balance tracked, voting power calculation accurate

---

## Phase 5: Event Emission

- [ ] T031 Emit ProposalCreated event in createProposal()
- [ ] T032 Emit VoteCast event in vote() with updated vote counts
- [ ] T033 Emit ProposalExecuted event in executeProposal()
- [ ] T034 Emit FundsReceived event in receive() function
- [ ] T035 Emit MetaTransactionExecuted event in MinimalForwarder.execute()

**Acceptance**: All events emitted correctly, indexed parameters included, parseable by frontend

---

## Phase 6: Integration & End-to-End Testing

- [ ] T036 Write full voting flow test in `sc/test/DAOVoting Integration.t.sol` (create→vote→execute)
- [ ] T037 Write edge case tests: double vote attempt, insufficient power, balance too low, etc.
- [ ] T038 Write gasless voting integration test: sign off-chain → relayer submits → vote recorded
- [ ] T039 Test vote override: user changes vote multiple times before deadline
- [ ] T040 Test concurrent proposals: multiple proposals active simultaneously with cross-voting

**Acceptance**: All flows work end-to-end, edge cases handled, gasless voting verified

---

## Phase 7: Deployment & Documentation

- [ ] T041 Create `sc/script/DeployLocal.s.sol` for Anvil deployment
- [ ] T042 Create `sc/script/DeploySepolia.s.sol` for Sepolia testnet deployment
- [ ] T043 Create `sc/script/Helpers.s.sol` with utility functions for deployment
- [ ] T044 Write deployment documentation in `DEPLOYMENT.md`
- [ ] T045 Generate contract documentation and ABI exports

**Acceptance**: Deployments work on Anvil and Sepolia, contracts are ABI-compatible with frontend

---

## Phase 8: Gas Optimization & Final Testing

- [ ] T046 Run `forge snapshot` to measure gas costs for all key functions
- [ ] T047 Verify gas costs meet targets: create <100k, vote <50k, execute <100k
- [ ] T048 Run full test suite: `forge test` with all tests passing
- [ ] T049 Run coverage: `forge coverage` and verify >95% coverage
- [ ] T050 Final review: Code quality, security, consistency checks

**Acceptance**: All tests pass, coverage >95%, gas targets met, no security issues

---

## Dependency Graph

```
T001 (Init)
  └─→ T002 (Install OZ)
       └─→ T003 (Config)
            ├─→ T004, T005 (Setup, Parallel)
            │   └─→ T006 (Fixtures)
            │        ├─→ T007-T010 (MinimalForwarder, US1, Parallel)
            │        │   └─→ T011-T012 (Tests, Sequential)
            │        │        └─→ T013-T015 (DAOVoting Core, US2, Parallel)
            │        │             ├─→ T016-T017 (Tests, Sequential)
            │        │             └─→ T018-T020 (Voting, US3, Parallel)
            │        │                  ├─→ T021-T022 (Tests, Sequential)
            │        │                  └─→ T023-T024 (Execution, US4, Parallel)
            │        │                       ├─→ T025-T026 (Tests, Sequential)
            │        │                       └─→ T027-T030 (Funding/Power, US5-6, Parallel)
            │        │                            └─→ T031-T035 (Events)
            │        │                                 └─→ T036-T040 (Integration Tests)
            │        │                                      └─→ T041-T045 (Deployment)
            │        │                                           └─→ T046-T050 (Polish)
```

**Critical Path** (minimum tasks for MVP):
- T001 → T002 → T003 → T004-T005 (parallel) → T006 → T007-T010 (parallel) → T011-T012 → T013-T015 (parallel) → T016-T017 → T018-T020 (parallel) → T021-T022 → T036-T040 (integration)

**Total Critical Path Tasks**: ~20 (can skip some polish for MVP)

---

## Task Execution Strategy

### Phase-by-Phase Approach
1. Complete Phase 1-2 first (setup, no dependencies)
2. US1 (MinimalForwarder) can start immediately after T006
3. US2-3-4 (DAOVoting) depend on US1 completion for ERC2771Context integration
4. US5-6 (funding/power) can run parallel with US2-4
5. Integration tests after all units complete
6. Deployment and optimization last

### Parallel Task Groups
- Setup: T001-T002, T004-T005 (independent)
- MinimalForwarder Logic: T007-T010 (different functions, parallel after T006)
- DAOVoting Features: T013-T015, T018-T020, T023-T024, T027-T028 (different functions, parallel)
- Testing: All T0XX tests can run after their respective implementation

### Daily Progress Example (8 tasks/day):
- **Day 1**: T001-T005 (Setup + Foundation)
- **Day 2**: T006 (Fixtures) + T007-T010 (MinimalForwarder implementation)
- **Day 3**: T011-T012 (MinimalForwarder tests) + T013-T015 (DAOVoting core)
- **Day 4**: T016-T022 (DAOVoting tests + voting)
- **Day 5**: T023-T030 (Execution + Funding) + events
- **Day 6**: T036-T045 (Integration + Deployment)
- **Day 7**: T046-T050 (Optimization + Final Polish)

---

## Quality Gates

| Gate | Status | Check |
|------|--------|-------|
| All tests pass | ✅ Target | `forge test` exit 0 |
| Coverage >95% | ✅ Target | `forge coverage` report |
| Gas targets met | ✅ Target | create <100k, vote <50k, execute <100k |
| Events emitted | ✅ Target | All 5 events implemented |
| Deployment works | ✅ Target | Scripts run on Anvil + Sepolia |
| Security review | ✅ Target | Code review + test coverage |
| ABI compatibility | ✅ Target | matches contracts/ schemas |

---

## Success Criteria

✅ All 50 tasks completed and passing  
✅ No tests failing: `forge test --match-contract ".*" -v` passes  
✅ Coverage >95%: `forge coverage` report  
✅ Gas snapshots meet targets  
✅ Deployments successful on Anvil and Sepolia  
✅ Frontend can integrate via ABIs and events  
✅ Gasless voting flow verified end-to-end  

---

## Notes

- Each task should be independently completable (clear dependencies)
- Tests should be written as part of each task (TDD approach)
- Gas snapshots taken after all optimizations
- Documentation generated as artifacts, not manual effort
- All code follows Solidity style guide (2-space indentation, natspec comments)

---

**Status**: ✅ Tasks Complete - Ready for Implementation via `/speckit.implement`
