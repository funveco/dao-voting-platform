# Feature Specification: Proposal Creation & Voting System

**Feature Branch**: `001-proposal-voting`  
**Created**: 2025-02-06  
**Status**: Draft  
**Input**: Create and vote on DAO governance proposals with real-time voting results, proposal status tracking, and blockchain integration

**CONSTITUTION NOTE**: All features must comply with Design System Consistency, Blockchain-First Architecture, Test-First Development, and Proposal Lifecycle Clarity principles. See `.specify/memory/constitution.md` for details.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Governance Proposal (Priority: P1)

DAO members need to submit governance proposals that will be voted on by the community. A proposal creator specifies the proposal details, rationale, and any associated actions (e.g., fund allocation, parameter changes). The proposal is submitted to the blockchain and becomes visible to all DAO members.

**Why this priority**: This is the foundational feature—without proposals, voting cannot occur. Required for MVP.

**Independent Test**: A DAO member can create a proposal through the web interface, see it appear in the proposal list with "Draft" status, submit it to blockchain, and watch its status change to "Active".

**Acceptance Scenarios**:

1. **Given** a DAO member is authenticated and connected via MetaMask, **When** they click "Create Proposal", **Then** they see a form with fields for proposal title, description, and optional target contract action.
2. **Given** a member has filled all required fields, **When** they click "Submit Proposal", **Then** the proposal is sent to the blockchain and a success message confirms submission with the transaction hash.
3. **Given** a proposal has been submitted, **When** the blockchain confirms the transaction, **Then** the proposal status changes from "Draft" to "Active" and is visible in the DAO's proposal feed.
4. **Given** a member is creating a proposal, **When** they attempt to submit with incomplete required fields, **Then** they see clear error messages indicating which fields are missing.

---

### User Story 2 - Vote on Active Proposals (Priority: P1)

DAO members need to cast their votes (For, Against, or Abstain) on active proposals. Each member's voting power is determined by their token balance. Votes are recorded on-chain and contribute to the proposal's outcome determination.

**Why this priority**: Core governance function. Must work alongside proposal creation to form MVP.

**Independent Test**: A DAO member can view an active proposal, select a voting option (For/Against/Abstain), submit their vote, and see their vote reflected in the real-time voting results bar.

**Acceptance Scenarios**:

1. **Given** an active proposal is displayed, **When** the member views the voting interface, **Then** they see three voting buttons (For/Against/Abstain) and a real-time results bar showing vote distribution and their own voting power impact.
2. **Given** a member has selected a voting option, **When** they click "Submit Vote", **Then** the vote is recorded on-chain with a confirmation message displaying the transaction hash.
3. **Given** a member has already voted on a proposal, **When** they attempt to vote again, **Then** they see a message indicating they have already voted and cannot vote twice.
4. **Given** voting is in progress, **When** multiple members are voting simultaneously, **Then** the voting results bar updates in real-time showing the latest vote distribution.
5. **Given** a member initiates a vote submission, **When** they are offered a gasless transaction option via MetaMask, **Then** they can choose to use a relayer-funded transaction or pay gas fees themselves.

---

### User Story 3 - View Proposal Details & Voting Results (Priority: P1)

DAO members need to view detailed information about proposals, including description, voting timeline, current vote distribution, and proposal status. This information helps them make informed voting decisions.

**Why this priority**: Essential for enabling informed governance. Users must understand proposals before voting.

**Independent Test**: A member can click on any proposal and see all its details, voting timeline, current results, and status on a dedicated proposal page.

**Acceptance Scenarios**:

1. **Given** a member views the proposal list, **When** they click on a proposal, **Then** they see a detailed page with title, description, creator, creation date, voting deadline, and current vote distribution visualized.
2. **Given** a proposal page is displayed, **When** the member scrolls down, **Then** they see a progress bar showing For/Against/Abstain vote percentages and absolute vote counts.
3. **Given** a proposal is active, **When** the member checks the voting timeline, **Then** they see the start time, end time, and remaining time in human-readable format plus Unix timestamps for precision.
4. **Given** voting is ongoing, **When** the member refreshes the page or waits, **Then** the voting results update automatically without requiring manual refresh.

---

### User Story 4 - Track Proposal Lifecycle (Priority: P2)

DAO members need to understand the current state of proposals throughout their lifecycle (Draft → Active → Closed → Executed/Failed). Clear status indicators and timeline visualization help members track governance activities.

**Why this priority**: Enhances usability and transparency. Builds member confidence in governance process.

**Independent Test**: A member can view a proposal and clearly identify its current status (Active, Closed, Executed, or Failed) and understand what actions are available at each stage.

**Acceptance Scenarios**:

1. **Given** a proposal is displayed, **When** the member looks at the status section, **Then** they see a badge clearly indicating the current lifecycle state (Draft/Active/Closed/Executed/Failed).
2. **Given** a proposal is active with a voting deadline approaching, **When** the member views the proposal, **Then** they see a countdown timer showing hours and minutes remaining.
3. **Given** voting has closed on a proposal, **When** the member views it, **Then** they see it marked as "Closed" with the voting results locked and a clear indication of whether it passed or failed.
4. **Given** a proposal has passed and is being executed, **When** the member views the execution status, **Then** they see real-time updates as the proposed action is executed on-chain.

---

### Edge Cases

- What happens when a proposal creator attempts to create a proposal but has insufficient voting rights/token balance?
- How does the system handle network outages or blockchain transaction failures during proposal submission or voting?
- What is the behavior when the voting deadline is reached while a member is in the middle of voting?
- How are duplicate votes prevented if a member submits the vote transaction twice quickly?

## UI Component Specifications *(mandatory)*

### shadcn/ui Components (Design System Compliance)

All UI components must use shadcn/ui library with Radix UI primitives and Tailwind CSS v4. Components are styled per Constitution Principle I (Design System Consistency).

#### Voting Action Buttons (Constitutional Color Mapping)

| Action | shadcn/ui Variant | Constitution Color | Tailwind Token | Semantics |
|--------|-------------------|-------------------|---|---|
| Vote For | `default` | Green (#10b981) | `bg-primary` / `primary` | Positive action, consensus |
| Vote Against | `destructive` | Red | `bg-destructive` | Negative action, dissent |
| Abstain | `secondary` | Gray | `bg-secondary` / `muted` | Neutral, no position |
| Submit Actions (Create, Confirm) | `default` | Primary Blue | `bg-primary` | Primary call-to-action |
| Cancel / Close | `ghost` | Transparent Gray | `ghost` | Secondary action, low priority |

**Implementation Notes**:
- Button component: `from "@/components/ui/button"`
- Vote buttons disabled until proposal Active + voting deadline not reached
- Voting buttons in VotingInterface component display real-time vote counts
- All buttons fully keyboard-accessible (focus-visible ring, aria labels)

---

#### Proposal Display Components

| Component | shadcn/ui | Purpose | Constitution Alignment |
|-----------|-----------|---------|---|
| Proposal Card | `Card` | Display proposal in list with title, creator, status | Dark mode (bg-card), consistent padding |
| Proposal Status Badge | `Badge` | Show proposal lifecycle state (Active/Closed/Failed/Executed) | Color semantic: green=Active, gray=Closed, red=Failed, blue=Executed |
| Voting Results Bar | `Progress` | Visualize vote distribution (For/Against/Abstain) | Three sections: green (For) + red (Against) + gray (Abstain) |
| Proposal Dialog | `Dialog` | Confirm vote submission + show transaction hash | Dark mode, accessible focus management |

---

#### Form Components (Create Proposal)

| Field | Component | Validation | Accessibility |
|-------|-----------|-----------|---|
| Title | `Input` (text) | Required, max 256 chars, non-empty | `label` + `aria-required` |
| Description | `Textarea` | Required, max 4096 chars | `label` + `aria-required` |
| Target Action (Optional) | `Input` (text/code) | Optional, validate hex if provided | `label` + help text |
| Submit Button | `Button` (default variant) | Form validation before submit | `type="submit"`, loading state during tx |

**Implementation Notes**:
- Use shadcn/ui `Form` component with React Hook Form
- Validation: Real-time client-side + contract-side validation on blockchain
- Error messages use `Alert` component (color: destructive)
- Success messages use `Alert` component (color: primary)

---

#### Status Indicator Components

| Status | Badge Color | Tailwind Class | Description |
|--------|-------------|---|---|
| Draft | Gray | `bg-muted` | Proposal created, not yet active |
| Active | Green | `bg-primary` | Voting open, members can vote |
| Closed | Gray | `bg-muted` | Voting ended, results final |
| Executed | Blue | `bg-accent` | Passed proposal action completed |
| Failed | Red | `bg-destructive` | Did not meet voting threshold |
| Cancelled | Red | `bg-destructive/50` | Cancelled by creator/governance |

---

### Component Implementation Structure

```typescript
// Proposal list page: web/src/app/proposals/page.tsx
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Proposal detail page: web/src/app/proposals/[id]/page.tsx
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Create proposal form: web/src/components/proposal/ProposalForm.tsx
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Voting interface: web/src/components/proposal/VotingInterface.tsx
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog"
```

---

### Color & Typography Standards

**All components must follow Constitution Design System Requirements (Section: Design System Requirements)**:
- Font: Geist Sans (headers), Geist Mono (addresses/hashes)
- Dark mode: `dark:bg-background dark:text-foreground` 
- Borders: `border-border`
- Focus: `focus-visible:ring-ring/50`
- Disabled state: `disabled:opacity-50 disabled:pointer-events-none`

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated DAO members to create new governance proposals with title, description, and optional target contract action
- **FR-002**: System MUST validate proposal submissions and prevent empty or incomplete proposals from being created
- **FR-003**: System MUST record all proposals on-chain (blockchain) with immutable proposal metadata and creation timestamp
- **FR-004**: System MUST allow DAO members to vote on active proposals by selecting For/Against/Abstain and submitting their vote
- **FR-005**: System MUST prevent double voting—members who have already voted cannot vote again on the same proposal
- **FR-006**: System MUST calculate voting power based on member token balance at proposal creation time (or snapshot block)
- **FR-007**: System MUST display real-time voting results showing vote counts and percentages for each option (For/Against/Abstain)
- **FR-008**: System MUST display proposal status lifecycle (Draft → Active → Closed → Executed/Failed) with clear visual indicators
- **FR-009**: System MUST automatically close voting when the voting deadline is reached
- **FR-010**: System MUST support gasless voting transactions via EIP-712 relayer pattern (MetaMask integration)
- **FR-011**: System MUST log all proposal creation and voting events on-chain with transaction hashes and timestamps
- **FR-012**: System MUST display voting deadlines in both human-readable format and Unix timestamp format
- **FR-013**: System MUST handle proposal execution state transitions (e.g., when a passed proposal begins execution)

### Key Entities

- **Proposal**: Represents a governance proposal with metadata (id, title, description, creator, createdAt, votingDeadline, status)
- **Vote**: Represents an individual member's vote with metadata (proposalId, voter, choice [For/Against/Abstain], timestamp, votingPower)
- **ProposalStatus**: Enumeration of proposal states (Draft, Active, Closed, Executed, Failed, Cancelled)
- **Member**: DAO member with token balance and voting rights (address, tokenBalance, votingPower)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Members can create a proposal and submit it to blockchain within 2 minutes from page load to confirmation
- **SC-002**: Voting results update in real-time across all open proposal pages (latency <5 seconds from blockchain confirmation)
- **SC-003**: A member can cast a vote on an active proposal within 90 seconds
- **SC-004**: 100% of proposals created via the interface are recorded on-chain with valid metadata
- **SC-005**: 100% of votes cast are recorded on-chain and cannot be modified or deleted after submission
- **SC-006**: Voting deadline enforcement is accurate within 1 minute (prevents voting after deadline) on all chains
- **SC-007**: System supports at least 100 concurrent members viewing and voting on proposals without performance degradation
- **SC-008**: 90% of members successfully complete their first vote without encountering errors or ambiguity
- **SC-009**: Proposal status transitions are reflected in the UI within 30 seconds of blockchain confirmation
- **SC-010**: Gasless voting transactions succeed 95% of the time (relayer availability and gas estimation)

## Assumptions

- **Blockchain Integration**: Smart contracts for proposal and voting logic are already deployed and functional
- **Authentication**: Members are authenticated via MetaMask wallet connection and member identity is verified on-chain
- **Voting Power Snapshot**: Voting power is determined by token balance at the time of proposal creation (standard DAO pattern)
- **Voting Window**: Default voting duration is 7 days (configurable per proposal via constitution governance later)
- **Relayer Service**: A relayer service is available and configured to process gasless (EIP-712) transactions
- **Real-time Updates**: WebSocket or polling mechanism will be implemented for real-time voting result updates

## Out of Scope

- Advanced proposal scheduling or timed execution
- Multi-sig proposal approval workflows
- Delegation of voting rights to other members
- Proposal cancellation or veto mechanisms (addressed in future features)
- Treasury management operations beyond proposal voting
