<!-- 
=== SYNC IMPACT REPORT ===
Version: 0.1.0 → 1.0.0 (MINOR: First formal constitution with complete principle set)
Modified Principles: All (initial ratification)
Added Sections: Design System Compliance, Technical Stack Requirements, Security & Quality Gates
Removed Sections: None
Templates Updated:
  - plan-template.md: ✅ Aligned with Technical Stack section
  - spec-template.md: ✅ Aligned with Design System principles
  - tasks-template.md: ✅ Aligned with Testing & Observability principles
Follow-up TODOs: None - all placeholders resolved
=== END REPORT ===
-->

# DAO Voting Platform Constitution

A decentralized governance platform enabling DAO members to create, discuss, and vote on proposals through a modern web interface with blockchain integration.

## Core Principles

### I. Design System Consistency (NON-NEGOTIABLE)
All UI components and styling MUST follow the established design system defined in `web/src/app/globals.css`. This includes:
- **Dark Mode Default**: All interfaces default to dark theme using OKLch color space variables
- **Tailwind CSS v4**: All styling uses Tailwind CSS v4 with theme tokens (primary, secondary, accent, destructive)
- **Component Library**: Modular card-based UI with consistent padding (`--radius: 0.625rem`) and rounded corners
- **Color Semantic Consistency**: Green (#10b981) for "Vote For"/"Success", Red for "Vote Against", Gray for "Abstain"
- **Typography Standards**: Use Geist Sans for UI, Geist Mono for code; maintain information hierarchy with distinct section headers

**Rationale**: Ensures coherent user experience across all features; reduces cognitive load through visual consistency.

### II. Blockchain-First Architecture
Every feature involving state changes MUST integrate with smart contracts and follow Web3 patterns:
- Contract interactions defined in separate contract specification files
- Gasless transaction support via EIP-712/MinimalForwarder integration
- MetaMask wallet integration required for user authentication
- All financial/governance operations auditable on-chain
- Events emitted for all critical state changes

**Rationale**: Ensures transparency, immutability, and trustlessness required for DAO governance.

### III. Test-First Development (MANDATORY)
- Tests MUST be written before implementation (Red-Green-Refactor)
- Unit tests required for all business logic
- Integration tests required for contract interactions
- User acceptance tests aligned with spec scenarios
- No code merges without passing test suite

**Rationale**: Catches bugs early; ensures specification compliance; provides living documentation.

### IV. Observability & Debugging
- Structured logging at critical junctures (contract calls, proposal state changes)
- Real-time blockchain synchronization with timestamps (Unix + human-readable)
- Clear error messages distinguishing user errors from system errors
- All voting operations logged with transaction hashes
- Proposal lifecycle tracked and visible to governance participants

**Rationale**: Enables rapid diagnosis of issues; builds user confidence through transparency.

### V. Proposal Lifecycle Clarity
Every proposal MUST follow a strict lifecycle with well-defined states:
- **Draft**: Proposal being composed (not yet submitted)
- **Active**: Voting period open
- **Closed**: Voting period ended
- **Executed**: Proposal passed and execution initiated (if applicable)
- **Failed**: Proposal did not achieve required threshold
- **Cancelled**: Proposal withdrawn by creator or governance

Status badges and progress visualization required for all proposals.

**Rationale**: Reduces user confusion; ensures deterministic governance.

### VI. Accessibility & Performance
- All interactive elements keyboard-accessible
- Real-time proposal updates without page refresh
- Voting operations complete within 5 seconds (UX feedback)
- Smart contract transactions provide gasless option for standard voting
- Mobile-responsive design mandatory

**Rationale**: Inclusive governance; lowers barriers to participation.

## Design System Requirements

All new components and pages MUST adhere to:

1. **Color Palette** (via Tailwind tokens):
   - Primary: `bg-primary` / `text-primary-foreground`
   - Secondary: `bg-secondary` / `text-secondary-foreground`
   - Accent: `bg-accent` / `text-accent-foreground`
   - Muted (secondary UI): `bg-muted` / `text-muted-foreground`
   - Destructive (errors/cancel): `bg-destructive`
   - Card containers: `bg-card text-card-foreground`
   - Borders: `border-border`

2. **Voting UI Patterns**:
   - For votes: Green button + green progress bar
   - Against votes: Red button + red progress bar
   - Abstain votes: Gray button + gray progress bar
   - Status badges for proposal states (Active, Closed, Failed, etc.)

3. **Typography Hierarchy**:
   - Page titles: Large, bold, `text-foreground`
   - Section headers: Medium, `text-foreground`
   - Labels & helper text: Smaller, `text-muted-foreground`
   - Code/addresses: Monospace font (`font-mono`)

4. **Layout Standards**:
   - Cards use consistent padding
   - Modular grid system for proposal lists
   - Three-pane layout: Sidebar (stats/treasury) + Main (actions/forms) + Bottom (lists/feeds)
   - Responsive mobile-first design

## Technical Stack Requirements

**Frontend**:
- Next.js 15 + React 19
- Tailwind CSS v4
- TypeScript for type safety
- Component library: Shadcn/ui (or equivalent)

**Blockchain**:
- Smart contracts written in Solidity
- Contract testing via Hardhat/Foundry
- Web3.js or Ethers.js for wallet integration
- MetaMask as primary wallet provider
- EIP-712 for gasless transactions (MinimalForwarder pattern)

**Backend** (if applicable):
- Node.js/Express or Next.js API routes
- PostgreSQL for off-chain state (optional)
- Structured logging (winston/pino)
- Error tracking (Sentry)

**Testing**:
- Jest/Vitest for unit tests
- React Testing Library for component tests
- Hardhat tests for smart contracts
- E2E tests for critical user journeys (Playwright/Cypress)

## Governance

### Amendment Procedure
1. Propose change with rationale
2. Document impact on dependent templates
3. Update all affected template files
4. Version constitution according to semantic versioning
5. Record amendment date and summary

### Version Increment Rules
- **MAJOR** (X.0.0): Backward-incompatible changes (principle removed/redefined, governance model changed)
- **MINOR** (x.Y.0): New principle/section added or existing principle materially expanded
- **PATCH** (x.y.Z): Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Verification
- All PRs MUST verify constitution compliance before merge
- Constitution Check gates defined in `plan.md`
- Violations require explicit justification in PR description
- Quarterly review of compliance metrics

### Authority
This constitution supersedes all prior practices and project documentation. In case of conflict between this document and other guidance (README, contributing guides, etc.), this constitution takes precedence.

Use `.specify/memory/constitution.md` as source of truth for governance; all other documentation must align with these principles.

---

**Version**: 1.0.0 | **Ratified**: 2025-02-06 | **Last Amended**: 2025-02-06
