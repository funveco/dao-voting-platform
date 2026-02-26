# Implementation Tasks: Proposal Creation & Voting System

**Feature**: `001-proposal-voting` | **Generated**: 2025-02-06 | **Status**: Ready for Sprint Planning

---

## Overview

This document breaks down the DAO Voting Platform feature into actionable implementation tasks organized by phase, layer, and priority. Each task references the specification (spec.md), implementation plan (plan.md), and Constitutional principles.

**Total Effort**: ~8-10 developer-weeks (2 FE devs + 1 BE/SC dev)

---

## Phase 0: Research & Setup *(COMPLETED)*

✅ Constitution ratified  
✅ Design system documented (globals.css + COMPONENTS_GENERATED.md)  
✅ shadcn/ui components generated (11 components)  
✅ Data model specified (data-model.md)  

**Status**: Ready for Phase 1 Development

---

## Phase 1: Frontend Component Development

### Layer 1.1: Core UI Components (shadcn/ui Integration)

**Objective**: Ensure all generated shadcn/ui components work correctly with Constitution design system.

#### T1.1.1 - Verify shadcn/ui Component Styling ✅ COMPLETED
- **Description**: Test all 11 generated components against Constitution colors and dark-mode defaults
- **Input**: web/src/components/ui/* files + globals.css
- **Tasks**:
  - [x] Run TypeScript compile check on all UI components
  - [x] Verify dark mode CSS variables in each component
  - [x] Test Button variants (default, destructive, secondary, ghost) render correct colors
  - [x] Verify Card dark mode background (bg-card token)
  - [x] Check Badge variants map to proposal lifecycle colors
  - [x] Validate Progress component bar colors (green/red/gray)
  - [x] Test Form component integration with React Hook Form
  - [x] Verify Dialog/AlertDialog dark mode styling
- **Output**: ✅ All components pass visual regression tests
- **Report**: [COMPONENT_VERIFICATION_T1.1.1.md](../../../COMPONENT_VERIFICATION_T1.1.1.md)
- **Dependencies**: None (components pre-generated)
- **Priority**: P0 (Blocker) ✅ DONE

#### T1.1.2 - Create Proposal Form Component ✅ COMPLETED
- **Description**: Build `ProposalForm.tsx` wrapper component using shadcn/ui Form + Input/Textarea
- **Input**: spec.md User Story 1 (Create Proposal), COMPONENTS_GENERATED.md Form examples
- **Tasks**:
  - [x] Create `web/src/components/ProposalForm.tsx`
  - [x] Implement form fields: title (Input), description (Textarea), optional actionData
  - [x] Integrate React Hook Form with shadcn/ui Form component
  - [x] Add validation: title max 256 chars, description required, min 10 chars
  - [x] Wire submit button to handle proposal creation (blockchain call TBD in T1.2)
  - [x] Show error Alert component for validation failures
  - [x] Add loading state while submitting to blockchain
  - [x] Test component with unit tests (Jest + React Testing Library)
- **Output**: ProposalForm.tsx + .test.tsx with 80+ assertions
- **Report**: [COMPONENT_VERIFICATION_T1.1.2.md](../../../COMPONENT_VERIFICATION_T1.1.2.md)
- **Dependencies**: T1.1.1 ✅
- **Priority**: P1 ✅ DONE
- **Acceptance**: ✅ Component renders, accepts input, validates fields, shows errors

#### T1.1.3 - Create Voting Interface Component ✅ COMPLETED
- **Description**: Build `VotingInterface.tsx` with 3 voting buttons (For/Against/Abstain) + results Progress bar
- **Input**: spec.md User Story 2 (Vote on Proposals), Constitution color mapping
- **Tasks**:
  - [x] Create `web/src/components/VotingInterface.tsx`
  - [x] Implement 3 vote buttons:
    - Button variant="default" for "Vote For" (Green)
    - Button variant="destructive" for "Vote Against" (Red)
    - Button variant="secondary" for "Abstain" (Gray)
  - [x] Add Progress component showing For/Against/Abstain percentages
  - [x] Display absolute vote counts (forCount, againstCount, abstainCount)
  - [x] Show user's voting power impact (if connected wallet)
  - [x] Wrap buttons in AlertDialog for confirmation
  - [x] Implement "You have already voted" state (disable buttons)
  - [x] Add real-time vote update hooks (WebSocket integration TBD in T2.2)
  - [x] Unit tests: button variants, vote states, accessibility
- **Output**: VotingInterface.tsx + .test.tsx with 60+ assertions
- **Report**: [COMPONENT_VERIFICATION_T1.1.3.md](../../../COMPONENT_VERIFICATION_T1.1.3.md)
- **Dependencies**: T1.1.1 ✅
- **Priority**: P1 ✅ DONE
- **Acceptance**: ✅ 3 buttons render with correct colors, results show percentages, vote confirmation dialog works

#### T1.1.4 - Create Proposal Card Component ✅ COMPLETED
- **Description**: Build reusable `ProposalCard.tsx` for proposal list display
- **Input**: spec.md User Story 3 (View Details), COMPONENTS_GENERATED.md Card examples
- **Tasks**:
  - [x] Create `web/src/components/ProposalCard.tsx`
  - [x] Display: title, description (truncated), status badge, creator, creation date
  - [x] Add status Badge with color variants: Draft (gray), Active (green), Closed (gray), Executed (blue), Failed (red)
  - [x] Show condensed voting results (For/Against/Abstain percentages)
  - [x] Add click handler to navigate to proposal detail page
  - [x] Responsive design: full width on mobile, grid on desktop
  - [x] Dark mode styling verification
  - [x] Unit tests: rendering, click handlers, status badges
- **Output**: ProposalCard.tsx + .test.tsx with 80+ assertions
- **Report**: [COMPONENT_VERIFICATION_T1.1.4.md](../../../COMPONENT_VERIFICATION_T1.1.4.md)
- **Dependencies**: T1.1.1 ✅
- **Priority**: P1 ✅ DONE
- **Acceptance**: ✅ Card displays all info, status badges correct color, click navigates

#### T1.1.5 - Create Proposal Status Badge Component ✅ COMPLETED
- **Description**: Build `ProposalStatus.tsx` status indicator with lifecycle mapping
- **Input**: spec.md User Story 4 (Track Lifecycle), Constitution lifecycle states
- **Tasks**:
  - [x] Create `web/src/components/ProposalStatus.tsx`
  - [x] Map lifecycle states to Badge variants + colors:
    - Draft → secondary (gray)
    - Active → default (green)
    - Closed → secondary (gray)
    - Executed → default (green)
    - Failed → destructive (red)
    - Cancelled → destructive (red)
  - [x] Display human-readable status name
  - [x] Optional: Add countdown timer for Active proposals (ends at votingDeadline)
  - [x] Unit tests: all status states render correct colors
- **Output**: ProposalStatus.tsx + .test.tsx with 40+ assertions + countdown tests
- **Report**: [COMPONENT_VERIFICATION_T1.1.5.md](../../../COMPONENT_VERIFICATION_T1.1.5.md)
- **Dependencies**: T1.1.1 ✅
- **Priority**: P1 ✅ DONE
- **Acceptance**: ✅ All 6 statuses show correct color badges + countdown timer

---

### Layer 1.2: Page Components

#### T1.2.1 - Create Proposal Creation Page (`/create`)
- **Description**: Build `web/src/app/proposals/create/page.tsx` for US1
- **Input**: ProposalForm component (T1.1.2), spec.md US1 scenarios
- **Tasks**:
  - [ ] Create page layout: title + instructions + ProposalForm component
  - [ ] Add MetaMask connection check (redirect to connect if not connected)
  - [ ] Wire form submission to `createProposal()` function (business logic TBD in T2.1)
  - [ ] Handle blockchain transaction submission + loading state
  - [ ] Show success Alert with transaction hash + link to blockchain explorer
  - [ ] Show error Alert on blockchain submission failure
  - [ ] Redirect to proposal detail page on success
  - [ ] Test all acceptance scenarios from spec US1
- **Output**: page.tsx + integration tests
- **Dependencies**: T1.1.2, T2.1 (blockchain integration)
- **Priority**: P1
- **Acceptance**: Can create proposal, see confirmation, redirected to detail page

#### T1.2.2 - Create Proposal List Page (`/proposals`)
- **Description**: Build `web/src/app/proposals/page.tsx` for US3 listing
- **Input**: ProposalCard component (T1.1.4), spec.md US3 scenarios
- **Tasks**:
  - [ ] Create grid layout showing ProposalCard components
  - [ ] Fetch proposals from blockchain (hook TBD in T2.2)
  - [ ] Implement filter/sort: by status (Active/Closed/Draft), by date
  - [ ] Add pagination or infinite scroll for proposal list
  - [ ] Show loading skeleton states while fetching
  - [ ] Show empty state if no proposals
  - [ ] Click card to navigate to `/proposals/[id]`
  - [ ] Real-time update hook (polling or WebSocket)
  - [ ] Unit + integration tests
- **Output**: page.tsx + components + tests
- **Dependencies**: T1.1.4, T2.2 (data fetching)
- **Priority**: P1
- **Acceptance**: List shows proposals, filter/sort work, clicking navigates

#### T1.2.3 - Create Proposal Detail Page (`/proposals/[id]`)
- **Description**: Build `web/src/app/proposals/[id]/page.tsx` for US2+US3
- **Input**: VotingInterface (T1.1.3), ProposalStatus (T1.1.5), spec.md US2+US3
- **Tasks**:
  - [ ] Create page layout with Tabs: Details | Voting Results | Timeline
  - [ ] Tab 1 (Details): title, description, creator, creation date, target action
  - [ ] Tab 2 (Voting Results): 
    - Progress bar (For/Against/Abstain)
    - Absolute counts + percentages
    - VotingInterface component (buttons + vote confirmation)
  - [ ] Tab 3 (Timeline): voting start/end times (Unix + human-readable), countdown timer
  - [ ] Fetch proposal data by ID from blockchain
  - [ ] Show ProposalStatus badge prominently
  - [ ] Real-time voting updates (hook TBD in T2.2)
  - [ ] Wire VotingInterface buttons to `submitVote()` (TBD in T2.1)
  - [ ] Handle "already voted" state (disable buttons, show message)
  - [ ] Show success/error alerts for vote submission
  - [ ] Responsive design for mobile
  - [ ] Integration tests: all tabs render, voting works, updates real-time
- **Output**: page.tsx + integrated components + tests
- **Dependencies**: T1.1.3, T1.1.5, T2.1, T2.2
- **Priority**: P1
- **Acceptance**: Detail page shows all info, can vote, results update, "already voted" state works

---

## Phase 2: Backend & Blockchain Integration

### Layer 2.1: Smart Contract Interface & Ethers.js Integration

#### T2.1.1 - Define Smart Contract Interfaces
- **Description**: Create TypeScript interface definitions for Proposal.sol and Voting.sol contracts
- **Input**: spec.md blockchain requirements, data-model.md Contract Structures
- **Tasks**:
  - [ ] Review contract spec in `specs/contracts/` (TBD)
  - [ ] Create `lib/contracts/types.ts`:
    - IProposal interface: id, title, description, creator, createdAt, votingDeadline, status
    - IVote interface: proposalId, voter, choice (0=For, 1=Against, 2=Abstain)
    - IVotingResults interface: forCount, againstCount, abstainCount, totalVotes, forPercentage, etc.
  - [ ] Create contract ABI imports from compiled contract artifacts
  - [ ] Export contract addresses from environment config
  - [ ] TypeScript tests: interface validation
- **Output**: lib/contracts/types.ts + integration with contract ABIs
- **Dependencies**: Contract development (external)
- **Priority**: P0 (Blocker for blockchain calls)

#### T2.1.2 - Create Ethers.js Contract Service Layer
- **Description**: Build `lib/contracts/ProposalService.ts` for contract interactions
- **Input**: T2.1.1 interfaces, Ethers.js v6, spec.md blockchain requirements
- **Tasks**:
  - [ ] Create ProposalService class:
    - `async getProposalById(id: string): Promise<Proposal>`
    - `async getAllProposals(): Promise<Proposal[]>`
    - `async createProposal(title, description, actionData): Promise<TransactionResponse>`
    - `async submitVote(proposalId, choice): Promise<TransactionResponse>`
    - `async getVotingResults(proposalId): Promise<VotingResults>`
    - `async getUserVote(proposalId, userAddress): Promise<VoteChoice | null>`
    - `async getUserVotingPower(userAddress): Promise<bigint>`
  - [ ] Implement error handling: network errors, contract reverts, insufficient balance
  - [ ] Add transaction receipt polling: wait for confirmation + event parsing
  - [ ] Integrate EIP-712 gasless relayer (if implemented in contracts)
  - [ ] Unit tests: mock contract calls, error scenarios
  - [ ] Integration tests: test against local Hardhat testnet
- **Output**: ProposalService.ts + mocks + tests with >85% coverage
- **Dependencies**: T2.1.1, Smart contracts deployed
- **Priority**: P0 (Blocker for voting/proposal features)

#### T2.1.3 - Create MetaMask Wallet Integration Hook
- **Description**: Build `hooks/useWallet.ts` for wallet connection + signer management
- **Input**: Ethers.js v6, spec.md User Story 1+2 wallet requirements
- **Tasks**:
  - [ ] Create useWallet hook:
    - `isConnected: boolean`
    - `address: string | null`
    - `balance: bigint | null`
    - `connectWallet(): Promise<void>`
    - `disconnectWallet(): void`
    - `getSigner(): ethers.Signer`
    - `switchNetwork(chainId): Promise<void>`
  - [ ] Handle wallet connection state (localStorage)
  - [ ] Listen to wallet events: account changes, network changes
  - [ ] Fallback to RPC provider if wallet not connected (read-only mode)
  - [ ] Error handling: user rejected, wrong network, wallet unavailable
  - [ ] Unit tests: connection flow, state management, event handlers
- **Output**: hooks/useWallet.ts + .test.ts with 90% coverage
- **Dependencies**: T2.1.2
- **Priority**: P0 (Required for all blockchain features)

---

### Layer 2.2: Data Fetching & Real-Time Synchronization

#### T2.2.1 - Create Blockchain Data Fetching Hook
- **Description**: Build `hooks/useBlockchainData.ts` for proposal list + detail data
- **Input**: ProposalService (T2.1.2), spec.md real-time requirements
- **Tasks**:
  - [ ] Create useProposals hook:
    - Fetch all proposals on mount
    - Poll blockchain every 10 seconds for updates
    - Optimistic updates: reflect local changes before blockchain confirmation
    - Caching: avoid duplicate requests within 5s window
  - [ ] Create useProposalDetail(id) hook:
    - Fetch single proposal by ID
    - Poll for voting results updates
    - Track voting deadline countdown
  - [ ] Create useVotingResults(proposalId) hook:
    - Fetch current voting stats
    - Update every 5 seconds or on vote events
  - [ ] Error handling: network failures, contract errors
  - [ ] TypeScript types for all hooks
  - [ ] Unit + integration tests with mock data
- **Output**: hooks/useBlockchainData.ts + .test.ts with >80% coverage
- **Dependencies**: T2.1.2
- **Priority**: P1
- **Acceptance**: Hooks fetch data, update on schedule, handle errors

#### T2.2.2 - Implement WebSocket Real-Time Updates (Optional Phase 2B)
- **Description**: Build real-time voting result updates via WebSocket
- **Input**: spec.md "real-time results bar updates" requirement, plan.md WebSocket mention
- **Tasks**:
  - [ ] Create Next.js API route: `app/api/ws/proposals/[id].ts` (WebSocket endpoint)
  - [ ] Server-side: listen to contract events (via ethers.js EventFilter)
  - [ ] Client-side hook: `hooks/useProposalWebSocket.ts`
    - Connect to WebSocket on component mount
    - Listen for voting update events
    - Emit to component via callback
    - Auto-disconnect on unmount
  - [ ] Fallback: if WebSocket unavailable, use polling (T2.2.1)
  - [ ] Error handling: reconnect on disconnect
  - [ ] Integration tests: mock WebSocket connection
- **Output**: WebSocket endpoint + hooks/useProposalWebSocket.ts + tests
- **Dependencies**: T2.2.1
- **Priority**: P2 (Nice-to-have for MVP)
- **Note**: Can be deferred if polling sufficient for 100 concurrent users

#### T2.2.3 - Create Vote Submission Handler
- **Description**: Build business logic for vote submission with blockchain integration
- **Input**: spec.md US2 vote scenarios, ProposalService (T2.1.2), useWallet (T2.1.3)
- **Tasks**:
  - [ ] Create `lib/voting/submitVote.ts`:
    - Validate: user connected, haven't voted yet, proposal still active
    - Call ProposalService.submitVote(proposalId, choice)
    - Handle transaction response: pending → confirmed
    - Emit "vote submitted" event for UI updates
    - Handle gasless option (if contracts support)
  - [ ] Create `lib/voting/createProposal.ts`:
    - Validate: required fields filled, user has minimum voting power
    - Call ProposalService.createProposal()
    - Wait for blockchain confirmation
    - Return proposal ID + transaction hash
  - [ ] Error handling: clear user-facing messages
  - [ ] Unit tests: validation, error scenarios, happy path
- **Output**: lib/voting/*.ts + .test.ts with >85% coverage
- **Dependencies**: T2.1.2, T2.1.3
- **Priority**: P1
- **Acceptance**: Can submit vote, handles validation errors, shows confirmation

---

### Layer 2.3: Testing & Verification

#### T2.3.1 - Write Unit Tests for Components
- **Description**: Ensure all component tests meet >80% coverage
- **Input**: All components from Layer 1.1-1.2
- **Tasks**:
  - [ ] T1.1.2: ProposalForm unit tests (render, input validation, submit)
  - [ ] T1.1.3: VotingInterface unit tests (button variants, vote state, AlertDialog)
  - [ ] T1.1.4: ProposalCard unit tests (rendering, click handler, status colors)
  - [ ] T1.1.5: ProposalStatus unit tests (all 6 status states)
  - [ ] T1.2.1-T1.2.3: Page component integration tests (routing, data loading, user flows)
  - [ ] Use Jest + React Testing Library
  - [ ] Mock Ethers.js + ProposalService
  - [ ] Generate coverage reports
- **Output**: >80% coverage on all components (visible in test output)
- **Dependencies**: All Layer 1 tasks
- **Priority**: P1 (Constitution: Test-First Development)
- **Acceptance**: `npm test` passes, coverage >80%

#### T2.3.2 - Write Integration Tests for Blockchain Flows
- **Description**: Test complete user journeys with blockchain (against testnet or hardhat)
- **Input**: spec.md acceptance scenarios, T2.1-T2.2 backend tasks
- **Tasks**:
  - [ ] Test US1: Create proposal → submitted → appears in list → status changes to Active
  - [ ] Test US2: Vote on proposal → vote recorded → results update → "already voted" state
  - [ ] Test US3: View proposal detail → all info displayed → real-time updates work
  - [ ] Test US4: Proposal lifecycle → status transitions → final state (Executed/Failed)
  - [ ] Use Hardhat local testnet for reproducible tests
  - [ ] Mock MetaMask wallet interaction
  - [ ] Verify blockchain state after each action
  - [ ] Performance tests: proposal creation <2min, vote submission <90s
- **Output**: integration test files + Hardhat setup + test documentation
- **Dependencies**: T2.1, T2.2, T1.2
- **Priority**: P1 (Constitution: Test-First Development)
- **Acceptance**: All 4 user journeys pass end-to-end

#### T2.3.3 - E2E Tests with Playwright
- **Description**: User acceptance tests simulating real DAO members
- **Input**: spec.md acceptance scenarios, all page/component implementations
- **Tasks**:
  - [ ] Create Playwright test suite: `tests/e2e/`
  - [ ] Test flows:
    - Scenario 1: Create proposal with valid data → see success message
    - Scenario 2: Try to create with missing fields → see error messages
    - Scenario 3: Vote on active proposal → see vote confirmation + results update
    - Scenario 4: Try to vote twice → see "already voted" message
    - Scenario 5: View proposal detail → see all tabs, status badge, voting timeline
    - Scenario 6: Follow proposal lifecycle → see status transitions
  - [ ] Use real or simulated blockchain (testnet)
  - [ ] Test mobile responsiveness (viewport sizes)
  - [ ] Generate HTML reports
- **Output**: tests/e2e/*.spec.ts + Playwright config + reports
- **Dependencies**: All Layer 1 + Layer 2 tasks
- **Priority**: P1
- **Acceptance**: All E2E scenarios pass, mobile tests pass

---

## Phase 3: Deployment & Documentation

### Layer 3.1: Documentation

#### T3.1.1 - Create Developer README for Feature
- **Description**: Write `docs/features/001-proposal-voting/README.md` for developers
- **Input**: All completed tasks, spec.md, plan.md
- **Tasks**:
  - [ ] Architecture overview: components, hooks, services, contract interactions
  - [ ] Setup instructions: environment variables, contracts deployment
  - [ ] Running tests: unit, integration, E2E commands
  - [ ] Common workflows: adding a new voting option, extending ProposalService
  - [ ] Troubleshooting: common issues, how to debug
  - [ ] Links to spec.md, plan.md, Constitution
- **Output**: README.md (GitHub wiki/docs folder)
- **Priority**: P2
- **Acceptance**: New dev can understand architecture, run tests, debug issues

#### T3.1.2 - Create Component Storybook
- **Description**: Document component usage patterns in Storybook (Phase 2B)
- **Input**: All UI components from Layer 1.1
- **Tasks**:
  - [ ] Create `.storybook/` folder
  - [ ] Write stories for: Button variants, Card, Form, Badge, Progress, VotingInterface, ProposalCard
  - [ ] Document dark mode toggling
  - [ ] Show Constitution color mapping in stories
  - [ ] Deploy Storybook (optional: publish to GitHub Pages)
- **Output**: Storybook site with 12+ component stories
- **Priority**: P3 (Nice-to-have for documentation)
- **Acceptance**: All components visible, dark mode toggles, colors correct

---

### Layer 3.2: Deployment

#### T3.2.1 - Deploy to Staging
- **Description**: Deploy feature to staging environment for QA testing
- **Input**: All code from Phase 1-2, contracts on testnet
- **Tasks**:
  - [ ] Set environment variables for testnet: RPC URL, contract addresses, chain ID
  - [ ] Deploy Next.js app to Vercel/staging server
  - [ ] Verify blockchain integration works with testnet
  - [ ] Run smoke tests: can create proposal, vote, see updates
  - [ ] Collect feedback from QA team
- **Output**: Staging URL, deployment documentation
- **Priority**: P1
- **Acceptance**: Staging environment functional, no critical bugs

#### T3.2.2 - Production Deployment (Phase 3B)
- **Description**: Deploy to mainnet after security audit (if required)
- **Input**: Audit reports, code review signoff, testnet validation
- **Tasks**:
  - [ ] Audit smart contracts (external)
  - [ ] Review frontend code for security issues (XSS, CSRF, input validation)
  - [ ] Switch contract addresses to mainnet
  - [ ] Update environment config for production RPC
  - [ ] Deploy to production server
  - [ ] Verify MetaMask connects to correct network
  - [ ] Monitor for errors/issues
- **Output**: Production deployment, monitoring setup
- **Priority**: P1 (post-MVP)
- **Acceptance**: Live on mainnet, no critical errors in first 24h

---

## Task Dependencies & Timeline

### Dependency Graph

```
Phase 1 (Frontend):
  T1.1.1 (Verify Components) → T1.1.2, T1.1.3, T1.1.4, T1.1.5
  T1.1.2 → T1.2.1
  T1.1.3, T1.1.5 → T1.2.3
  T1.1.4 → T1.2.2
  T1.2.1, T1.2.2, T1.2.3 → T2.3.1

Phase 2 (Backend):
  T2.1.1 (Contract Interfaces) → T2.1.2, T2.1.3
  T2.1.2, T2.1.3 → T2.2.1, T2.2.3
  T2.2.1 → T1.2.2, T1.2.3
  T2.2.3 → T1.2.1, T1.2.3
  T1.1 + T1.2 + T2.1 + T2.2 → T2.3.1, T2.3.2, T2.3.3

Phase 3 (Docs/Deploy):
  All Phase 1-2 tasks → T3.1.1, T3.2.1
  T3.2.1 → T3.2.2
```

### Estimated Timeline

| Phase | Tasks | Duration | Team |
|-------|-------|----------|------|
| **Phase 1: Frontend** | T1.1.1-T1.1.5 (Components) | 3-4 days | 1-2 FE devs |
| | T1.2.1-T1.2.3 (Pages) | 4-5 days | 1-2 FE devs |
| **Phase 2: Backend** | T2.1.1-T2.1.3 (Contracts + Ethers) | 3-4 days | 1 BE/SC dev |
| | T2.2.1-T2.2.3 (Data fetching) | 2-3 days | 1 FE dev |
| **Testing** | T2.3.1-T2.3.3 (Unit/Integration/E2E) | 3-4 days | 1 QA + 1 dev |
| **Phase 3: Docs** | T3.1.1-T3.1.2 (Documentation) | 1-2 days | 1 dev |
| **Phase 3: Deployment** | T3.2.1-T3.2.2 (Staging + Prod) | 2-3 days | 1 DevOps + 1 dev |
| **TOTAL** | **21 tasks** | **~8-10 weeks** | **2-3 devs** |

---

## Success Criteria & Acceptance

### Per-Task Acceptance

Each task includes explicit acceptance criteria. A task is "Done" when:
- ✅ Code changes pass TypeScript compilation
- ✅ Unit tests pass with >80% coverage (components/services)
- ✅ Code reviewed and approved
- ✅ Constitution compliance verified (design system, test-first, accessibility)
- ✅ Documentation updated

### Feature-Level Acceptance

**Feature "Proposal Creation & Voting System" is Complete when:**

1. **All 4 User Stories Pass**
   - US1: Can create proposal via UI, submitted to blockchain, appears in list
   - US2: Can vote on active proposals, see vote confirmation, results update in real-time
   - US3: Can view proposal details, see all voting info and timeline
   - US4: Can see proposal lifecycle status (Draft/Active/Closed/Executed/Failed)

2. **All Tests Pass**
   - Unit tests: >85% coverage on all components
   - Integration tests: All blockchain flows verified
   - E2E tests: All user scenarios pass (desktop + mobile)

3. **Constitutional Compliance**
   - ✅ Design System: All colors correct (green/red/gray), dark mode default
   - ✅ Blockchain-First: All contract interactions via Ethers.js
   - ✅ Test-First: Tests written before features shipped
   - ✅ Observability: Events logged, real-time updates working
   - ✅ Lifecycle Clarity: Status badges show correct states

4. **Performance Targets Met**
   - ✅ Proposal creation UX: <2 minutes end-to-end
   - ✅ Vote submission: <90 seconds UX flow
   - ✅ Real-time updates: <5 seconds latency
   - ✅ Frontend response: <100ms for proposal list/detail

5. **Staging Deployment**
   - ✅ No critical bugs on testnet
   - ✅ MetaMask integration works
   - ✅ QA sign-off received

---

## Notes & Considerations

### Constitution Compliance Checkpoints

- **After Phase 1**: Design System validation (T1.1.1 verifies all components)
- **After Phase 2**: Blockchain integration validation (T2.1-T2.2 tested)
- **Before Phase 3**: Test coverage & accessibility review (T2.3 validates)

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Smart contracts not ready | Start frontend with mocks (ProposalService mocks), swap in contracts later |
| Blockchain network issues | Implement retry logic, use polling instead of WebSocket |
| MetaMask integration bugs | Test with multiple wallet extensions, simulate in Playwright |
| Performance <100 concurrent users | Implement caching, pagination, lazy loading |
| Real-time updates lagging | Fallback from WebSocket to polling (T2.2.2 optional) |

### Future Phases (Post-MVP)

- Multi-sig proposal execution (requires more contract work)
- Advanced voting modes (weighted voting, delegation)
- Governance token snapshot mechanism
- Proposal comment/discussion threads
- Treasury integration for fund allocation

---

## Task Tracking

Use this section during implementation to track progress:

- [ ] Phase 1: Frontend component development
- [ ] Phase 2: Backend + blockchain integration
- [ ] Phase 3: Testing & quality validation
- [ ] Phase 4: Deployment & documentation

**Last Updated**: 2025-02-06  
**Status**: Ready for Sprint Planning  
**Next Step**: Assign tasks to team members and begin Phase 1

---

**See Also**:
- [spec.md](./spec.md) - Feature specification & acceptance scenarios
- [plan.md](./plan.md) - Implementation plan & technical context
- [data-model.md](./data-model.md) - Data structures & TypeScript interfaces
- [Constitution](../../.specify/memory/constitution.md) - Governance principles
- [COMPONENTS_GENERATED.md](../../web/COMPONENTS_GENERATED.md) - shadcn/ui component inventory
