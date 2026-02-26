# Phase 0 Research: Proposal Creation & Voting System

**Date**: 2025-02-06 | **Status**: Complete | **Branch**: `001-proposal-voting`

## Research Questions & Resolutions

### 1. Real-time Voting Updates: WebSocket vs. Polling

**Question**: How should voting result updates be synchronized to avoid stale UI state while managing server load?

**Options Evaluated**:

| Option | Technology | Latency | Load | Complexity | Recommendation |
|--------|-----------|---------|------|------------|-----------------|
| **A** | WebSocket + Event subscription | <1s | Medium | High | ✅ **Selected** |
| **B** | Polling (5s interval) | 5s | Low | Low | Fallback |
| **C** | Server-Sent Events (SSE) | 2-3s | Medium | Medium | Alt for browsers |

**Decision**: **WebSocket + Event Subscription** (Option A)

**Rationale**:
- Achieves <5s real-time requirement from spec (actually <1s)
- Direct blockchain event subscription via Ethers.js + Hardhat event listeners
- Client-side caches proposal state; server pushes updates on-chain events
- Automatic fallback to polling if WebSocket unavailable

**Implementation**:
- Use Socket.io for WebSocket with fallback transports
- Subscribe to blockchain events: `ProposalCreated`, `VoteCast`, `VotingClosed`
- Client-side cache in React context (proposal list + details)
- Optimistic updates: UI reflects vote immediately, confirms after blockchain

**Alternatives Rejected**:
- **Polling**: Too many server requests for 1000+ concurrent members; <5s latency met but inefficient
- **SSE**: Limited browser support (older Enterprise Chrome); WebSocket more scalable

---

### 2. Voting Power Snapshot & Double-Voting Prevention

**Question**: How is voting power determined and how do we prevent members from voting multiple times?

**Decision**: **Block Number Snapshot + Contract Storage**

**Rationale**:
- Voting power = token balance at proposal creation block (standard DAO pattern)
- Snapshot prevents "flash loan" attacks where voters accumulate tokens right before voting
- Contract records vote mapping: `mapping(uint256 proposalId => mapping(address voter => bool hasVoted))`
- Gas-efficient check on-chain before accepting vote

**Technical Details**:
- Smart contract stores snapshot block in proposal struct: `uint256 snapshotBlock`
- Frontend queries token balance at snapshot block for display
- Contract's `castVote()` function checks `hasVoted[proposalId][msg.sender]` before recording
- Revert with clear error if user already voted

**Edge Case Handling**:
- If member submits vote transaction twice quickly: First tx succeeds, second reverts (contract prevents)
- Frontend disables vote button after submission until confirmed, prevents accidental double-click

---

### 3. EIP-712 Gasless Voting Implementation

**Question**: How are gasless votes enabled via EIP-712 and relayer service?

**Decision**: **MinimalForwarder Relayer Pattern**

**Rationale**:
- EIP-712: Structured data signing (MetaMask UX: "Sign this data" not "Send transaction")
- MinimalForwarder contract: Relayer-agnostic pattern from OpenZeppelin
- Member signs vote intent; relayer broadcasts transaction to chain; relayer paid separately
- Improves UX: No gas fees for voting; relayer absorbs cost or DAO subsidizes

**Technical Flow**:
1. Member selects vote + clicks "Gasless Vote"
2. Frontend creates EIP-712 signature request with vote data
3. MetaMask displays readable signing request (no gas approval needed)
4. Member signs; frontend sends signature + vote data to relayer endpoint
5. Relayer validates signature + calls `forwardCall(msg, signature)` on MinimalForwarder
6. MinimalForwarder verifies signature, executes vote via delegatecall
7. Member sees vote confirmed; relayer transaction broadcasted

**Assumptions**:
- Relayer service (centralized or decentralized) already exists and is configured
- Voting contract inherits from ERC2771Context or uses similar relayer-aware pattern
- Relayer endpoint responds <100ms

---

### 4. Proposal Status Lifecycle & Automatic Closing

**Question**: How are proposal statuses managed and who/what closes voting?

**Decision**: **Hybrid On-Chain + Off-Chain Tracking**

**Rationale**:
- Smart contract owns source of truth: proposal state stored on-chain
- Frontend queries contract for status; reflects in UI
- Voting deadline enforcement: Contract's `castVote()` checks block.timestamp < deadline; reverts if closed
- No off-chain scheduler needed: closing is reactive (lazy-evaluated)

**Status Transitions**:
- **Draft** → **Active**: When proposal submitted to blockchain + confirmed (0 → Active)
- **Active** → **Closed**: When block.timestamp >= votingDeadline OR governance action closes early
- **Closed** → **Executed**: When passing proposal's target action is executed (optional)
- **Closed** → **Failed**: If vote threshold not met (determined off-chain for display)

**Implementation**:
```solidity
// Proposal struct
struct Proposal {
  uint256 id;
  address creator;
  string title;
  string description;
  uint256 votingDeadline;
  ProposalStatus status; // Draft, Active, Closed, Executed, Failed
  uint256 forVotes;
  uint256 againstVotes;
  uint256 abstainVotes;
}

// Status check on vote
require(block.timestamp < proposal.votingDeadline, "Voting closed");
```

**Frontend**:
- Fetch proposal; check votingDeadline vs. current time
- Disable voting buttons if deadline passed
- Display countdown timer (calculated client-side)

---

### 5. Off-Chain Proposal Indexing (Optional Enhancement)

**Question**: How to efficiently query proposals and search without hitting contract for every query?

**Decision**: **PostgreSQL + Event Listener (Optional Phase 2)**

**Rationale**:
- For MVP: Query contract directly (slow but sufficient for <500 proposals/year)
- For scale (Phase 2): Index ProposalCreated + VoteCast events to PostgreSQL
- The Graph alternative: More decentralized but slower to query + requires subgraph deployment

**Phase 1 Approach** (MVP):
- Query contract's `getAllProposals()` or `getProposalsForPage(offset, limit)`
- Fetch voting results from contract state
- Cache in React for 30 seconds

**Phase 2 Approach** (Post-MVP):
- Run event listener service that stores proposals in PostgreSQL
- Frontend queries Next.js API route → DB (faster than contract queries)
- Maintains eventual consistency with blockchain (lag <1 second typical)

---

## Summary Table

| Aspect | Decision | Rationale | Risk Level |
|--------|----------|-----------|------------|
| Real-time Updates | WebSocket + event subscription | <1s latency, scalable, fallback to polling | Low |
| Voting Power | Block snapshot at proposal creation | Prevents flash loans, standard DAO pattern | Low |
| Double-Voting | Contract mapping check | Gas-efficient, immutable | Low |
| Gasless Voting | EIP-712 MinimalForwarder relayer | MetaMask UX, no gas for member | Medium (relayer availability) |
| Status Lifecycle | On-chain lazy evaluation | Contracts own truth, simple logic | Low |
| Proposal Indexing | Direct contract query (Phase 1), PostgreSQL cache (Phase 2) | MVP simplicity, later optimization | Low |
| Blockchain Chain | Ethereum/Polygon (configurable) | MetaMask supports both; EVM compatibility | Low |

---

## Technology Stack Finalized

### Frontend
- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS v4 (per constitution)
- **UI Components**: Shadcn/ui (built on Radix UI + Tailwind)
- **Web3 Integration**: Ethers.js v6
- **Real-time**: Socket.io (WebSocket with fallbacks)
- **State Management**: React Context + hooks
- **Testing**: Jest, React Testing Library, Playwright

### Smart Contracts
- **Language**: Solidity 0.8.x
- **Framework**: Hardhat with TypeScript
- **Dependencies**: OpenZeppelin Contracts (ERC20, ERC2771Context, MinimalForwarder)
- **Testing**: Hardhat Chai matchers
- **Event Indexing** (Phase 2): The Graph or custom listener

### Infrastructure
- **Hosting**: Vercel (Next.js) + Alchemy (RPC)
- **Relayer**: EIP-712 relay service (existing or OpenZeppelin Defender)
- **Off-chain Cache** (Phase 2): PostgreSQL on AWS RDS

---

## Design System Compliance

All UI components will use:
- **Colors**: Green (#10b981) for "Vote For", Red for "Vote Against", Gray for "Abstain" (Tailwind tokens from globals.css)
- **Typography**: Geist Sans for headers/labels, Geist Mono for addresses/hashes
- **Cards**: Dark mode (`bg-card text-card-foreground`), consistent `--radius: 0.625rem` padding
- **Responsive**: Mobile-first Tailwind grid system

---

## Next Phases

- **Phase 1**: Generate data-model.md, contracts/, quickstart.md with concrete implementations
- **Phase 2**: Create task breakdown (speckit.tasks) with test-first approach
- **Phase 3**: Parallel implementation by feature area (proposal creation, voting, result sync)

