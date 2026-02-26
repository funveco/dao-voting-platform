# Developer Quickstart: Proposal Creation & Voting System

**Date**: 2025-02-06 | **Status**: Complete | **Branch**: `001-proposal-voting`

## Overview

This guide walks through setting up the development environment for the DAO voting feature and testing the core flows.

---

## Prerequisites

- Node.js 20+
- npm/pnpm/yarn
- Git
- MetaMask or similar Web3 wallet
- Local blockchain (Hardhat or Anvil)

---

## Part 1: Smart Contract Setup

### Clone & Install

```bash
cd /home/jav/apps/codecrypto/11.DAO-Voting-Platform

# Install dependencies
pnpm install

# Navigate to contracts directory
cd sc/
pnpm install
```

### Compile Contracts

```bash
pnpm hardhat compile
```

Output should show:
```
Compiling 5 files with 0.8.x
✓ GovernanceProposal.sol
✓ EIP712VotingForwarder.sol
✓ MockERC20.sol
✓ ... (other contracts)
```

### Run Local Blockchain

```bash
# In one terminal
pnpm hardhat node
```

This starts a local Hardhat node at `http://127.0.0.1:8545` with 20 pre-funded test accounts.

### Deploy Contracts

```bash
# In another terminal, from sc/ directory
pnpm hardhat run scripts/deploy.js --network localhost
```

Expected output:
```
Deploying MockERC20 token...
Token deployed to: 0x5FbDB2315678afccda9B0766FADdB0C8eb5c9D2E

Deploying GovernanceProposal contract...
Proposal contract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

Token owner granted to proposal contract.

✅ Contracts ready for testing!
```

Save these addresses—you'll need them in the frontend setup.

### Run Contract Tests

```bash
pnpm hardhat test

# Output
#  Proposal Lifecycle
#    ✓ Create a proposal (95ms)
#    ✓ Activate proposal (64ms)
#    ✓ Cast vote (for choice) (125ms)
#    ✓ Prevent double voting (98ms)
#    ✓ Reject vote after deadline (87ms)
#    ✓ Calculate voting results (103ms)
#
#  Gasless Voting (EIP-712)
#    ✓ Cast vote via relayer signature (156ms)
#
#  7 passing (728ms)
```

---

## Part 2: Frontend Setup

### Install Dependencies

```bash
cd /home/jav/apps/codecrypto/11.DAO-Voting-Platform/web
pnpm install
```

### Configure Environment Variables

Create `.env.local`:

```bash
# Blockchain RPC (points to local Hardhat node)
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Contract addresses (from deployment step above)
NEXT_PUBLIC_PROPOSAL_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=0x5FbDB2315678afccda9B0766FADdB0C8eb5c9D2E

# Chain ID (Hardhat = 31337)
NEXT_PUBLIC_CHAIN_ID=31337

# WebSocket for real-time updates
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8545
```

### Generate shadcn/ui Components

Before starting the development server, generate the required shadcn/ui components:

```bash
cd web/

# Generate core components for proposal voting
pnpm shadcn-ui add card
pnpm shadcn-ui add form
pnpm shadcn-ui add input
pnpm shadcn-ui add textarea
pnpm shadcn-ui add label
pnpm shadcn-ui add badge
pnpm shadcn-ui add progress
pnpm shadcn-ui add alert-dialog
pnpm shadcn-ui add alert
pnpm shadcn-ui add dialog
pnpm shadcn-ui add tabs

# Verify components generated
ls -la src/components/ui/
```

Expected output:
```
src/components/ui/
├── button.tsx (already exists)
├── card.tsx
├── form.tsx
├── input.tsx
├── textarea.tsx
├── label.tsx
├── badge.tsx
├── progress.tsx
├── alert-dialog.tsx
├── alert.tsx
├── dialog.tsx
└── tabs.tsx
```

### Start Development Server

```bash
pnpm dev
```

Open browser to `http://localhost:3000`

You should see:
- Header with "Proposal Voting System"
- Wallet connection button (Connect MetaMask)
- Empty proposal list with "Create Proposal" button (styled with shadcn/ui Button component)
- Dark mode applied (per Constitution design system)

---

## Part 3: Testing the User Flows

### Step 1: Connect MetaMask to Local Network

1. Open MetaMask extension
2. Click network dropdown → "Add network"
3. Enter:
   - **Network name**: Localhost Hardhat
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency**: ETH
4. Click Save and switch to this network

### Step 2: Import a Test Account

1. In Hardhat node output, copy first private key (starts with `0x...`)
2. MetaMask → Settings → Import Account
3. Paste private key, click Import
4. Account should show balance (e.g., 9999.xyz ETH)

### Step 3: Create a Proposal

1. On frontend, click "Connect MetaMask"
2. MetaMask popup → approve connection
3. Click "Create Proposal"
4. Fill form:
   - **Title**: "Increase DAO Treasury funding"
   - **Description**: "Proposal to allocate 10 ETH to development fund"
5. Click "Submit Proposal"
6. MetaMask popup → approve transaction
7. Wait for confirmation (~5 seconds on local network)
8. Proposal appears in list with status "Active"

### Step 4: Vote on Proposal

1. Click on proposal card
2. Proposal details page opens showing:
   - Title, description, creator
   - Voting deadline (7 days from creation)
   - Vote counts: 0 For, 0 Against, 0 Abstain
   - Voting buttons (For | Against | Abstain)
3. Click "For" button
4. MetaMask popup → approve vote transaction
5. Vote submitted; results update in real-time (should show your voting power)

### Step 5: Cast Multiple Votes (Different Accounts)

1. Import another test account from Hardhat
2. Switch MetaMask account
3. Frontend automatically updates (wallet address changes)
4. Repeat voting on same proposal
5. Results bar updates to show multiple votes

### Step 6: Test Double-Vote Prevention

1. From same account, try to vote again on same proposal
2. Expected: MetaMask shows error "AlreadyVoted"
3. Frontend displays error message

### Step 7: Close Voting & View Results

1. Wait for voting deadline to pass (or manually advance time in Hardhat)
   ```bash
   # In Hardhat console (or script)
   await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
   await ethers.provider.send("evm_mine");
   ```
2. Proposal status changes from "Active" to "Closed"
3. Vote counts locked; voting buttons disabled
4. Result shows clear winner (if any)

---

## Part 4: Testing Gasless Voting (Optional, Phase 2)

Gasless voting requires a relayer service. For now, regular voting works and is fully functional.

To test gasless later:
1. Deploy relayer service (EIP-712 forwarder)
2. Update frontend with relayer endpoint
3. Select "Gasless Vote" checkbox before voting
4. User signs transaction without paying gas
5. Relayer broadcasts on user's behalf

---

## Key Files & Structure

```
web/
├── src/
│   ├── components/
│   │   └── proposal/
│   │       ├── ProposalCard.tsx          # Proposal list item
│   │       ├── ProposalForm.tsx          # Create proposal form
│   │       ├── VotingInterface.tsx       # Vote buttons + results
│   │       └── ProposalStatus.tsx        # Status badge
│   ├── app/
│   │   ├── proposals/
│   │   │   ├── page.tsx                  # Proposals list page
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Proposal details page
│   │   └── globals.css                   # Tailwind + theme variables
│   └── services/
│       ├── proposalService.ts            # Contract interaction (Ethers.js)
│       ├── votingService.ts              # Voting logic
│       └── web3Service.ts                # Wallet connection
└── tests/
    ├── unit/
    │   └── VotingInterface.test.tsx      # Component tests
    └── e2e/
        └── voting.e2e.ts                 # End-to-end user flows

sc/
├── contracts/
│   ├── GovernanceProposal.sol            # Main proposal contract
│   ├── EIP712VotingForwarder.sol         # Gasless relay
│   └── MockERC20.sol                     # Test token
├── test/
│   └── GovernanceProposal.test.js        # Hardhat tests
└── scripts/
    └── deploy.js                         # Deployment script
```

---

## Common Issues & Solutions

### MetaMask: "Invalid RPC URL"
- Ensure Hardhat node is running: `pnpm hardhat node`
- Check .env.local has correct RPC_URL (http://127.0.0.1:8545)

### Frontend shows "No proposals found"
- Ensure contracts deployed: `pnpm hardhat run scripts/deploy.js --network localhost`
- Contract addresses in .env.local match deployment output

### Vote transaction fails: "AlreadyVoted"
- Reload page to sync frontend with blockchain state
- Switch to different account to vote

### Voting deadline not advancing
- Manually advance time:
  ```bash
  # In Hardhat node console
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine");
  ```

---

## Next Steps

1. ✅ Smart contracts working (compile + test pass)
2. ✅ Frontend connected to contracts (proposals display + voting works)
3. ⏳ E2E tests: Playwright tests for user journeys
4. ⏳ Real-time updates: WebSocket for live vote results
5. ⏳ Gasless voting: Relayer service integration (Phase 2)
6. ⏳ Production deployment: Mainnet/Polygon contract setup

---

## Testing Checklist

- [ ] Contracts compile without errors
- [ ] Contract tests pass (7+ passing)
- [ ] Frontend connects to wallet
- [ ] Can create a proposal
- [ ] Can vote on proposal
- [ ] Double-vote prevention works
- [ ] Voting results display in real-time
- [ ] Status transitions correctly (Active → Closed)
- [ ] Mobile responsiveness verified (dark mode)

---

## Performance Baseline

On local Hardhat network with single tester:

| Action | Time |
|--------|------|
| Create Proposal | ~3-5 seconds (local) |
| Cast Vote | ~2-3 seconds (local) |
| Fetch Proposal Details | <100ms |
| Update Results | <1 second (real-time) |

On testnet (Sepolia/Mumbai): Add 1-2 minutes for blockchain confirmation.

---

## References

- [Spec](./spec.md) - Full feature specification
- [Data Model](./data-model.md) - Entity definitions
- [Contract Interfaces](./contracts/interfaces.md) - Smart contract API
- [Research](./research.md) - Design decisions & rationale
- [Constitution](../.specify/memory/constitution.md) - Project governance principles

