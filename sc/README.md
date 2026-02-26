## Smart Contracts - DAO Voting Platform

This directory contains the Solidity smart contracts for the DAO Voting Platform, built with **Foundry**.

**Contracts:**
- `MinimalForwarder.sol` - EIP-2771 meta-transaction forwarder for gasless voting
- `DAOVoting.sol` - Core DAO governance contract with proposal & voting logic

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

---

## 🚀 Quick Start

### Automated Deployment (Recommended)

From the **project root** (`../`), run:

```bash
# Full deployment: Anvil + contracts + frontend
./deploy-full.sh

# Or just deploy contracts (Anvil must be running)
./deploy-contracts.sh
```

This will:
1. Start Anvil (local blockchain on `http://localhost:8545`)
2. Compile smart contracts
3. Deploy MinimalForwarder and DAOVoting
4. Update `web/.env.local` with contract addresses
5. Start the Next.js frontend dev server
6. Display contract addresses and test account info

### Manual Deployment

#### 1. Start Anvil

```bash
anvil --host 0.0.0.0 --port 8545
```

Output:
```
                             _   _
                            (_) | |
      __ _ _ __   ___   ___ _| | |
     / _` | '_ \ / _ \ / __| | | |
    | (_| | | | | (_) | (__| | | |
     \__,_|_| |_|\___/ \___|_|_|_|

    anvil 0.2.0 (...)

    Listening on 127.0.0.1:8545
```

#### 2. Deploy Contracts

In another terminal:

```bash
cd sc/
forge script script/DeployLocal.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
```

**Output (example):**

```
...
Deploying MinimalForwarder
MinimalForwarder deployed at: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
Deploying DAOVoting
DAOVoting deployed at: 0x34A1D3fff3958843C43aD80F30b94c510645C316

=== Deployment Summary ===
Network: Anvil (local)
MinimalForwarder: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
DAOVoting: 0x34A1D3fff3958843C43aD80F30b94c510645C316
```

#### 3. Update Environment Variables

Copy the contract addresses to `web/.env.local`:

```bash
# web/.env.local
NEXT_PUBLIC_DAO_VOTING_ADDRESS=0x34A1D3fff3958843C43aD80F30b94c510645C316
NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Anvil
```

#### 4. Start Frontend

```bash
cd ../web
npm install  # if needed
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📋 Contract Details

### MinimalForwarder.sol

**Purpose:** Enable gasless voting via EIP-2771 meta-transactions

**Key Functions:**
- `execute(ForwardRequest req, bytes signature)` - Execute a meta-transaction
- `verify(ForwardRequest req, bytes signature)` - Verify a meta-transaction signature
- `getNonce(address user)` - Get user's nonce for replay protection

**Features:**
- EIP-712 signature verification
- Replay attack prevention with nonce tracking
- Gas-efficient forwarding

### DAOVoting.sol

**Purpose:** Core DAO governance with proposal creation, voting, and execution

**Key Functions:**
- `createProposal(address recipient, uint256 amount, uint256 deadline)` - Create a new proposal
- `vote(uint256 proposalId, uint8 voteType)` - Vote on a proposal (FOR=1, AGAINST=2, ABSTAIN=3)
- `executeProposal(uint256 proposalId)` - Execute an approved proposal
- `getProposal(uint256 proposalId)` - Get proposal details
- `getUserVote(uint256 proposalId, address voter)` - Get a user's vote
- `fundDAO()` - Fund the DAO treasury (payable)

**Features:**
- Proposals with 7-day voting period (configurable)
- Three vote types: FOR, AGAINST, ABSTAIN
- One vote per address per proposal
- Execution requires: voting period over + FOR votes > AGAINST votes
- ReentrancyGuard protection

**Events:**
- `ProposalCreated(uint256 proposalId, address creator, address recipient, uint256 amount, uint256 deadline)`
- `VoteCast(uint256 proposalId, address voter, uint8 voteType)`
- `ProposalExecuted(uint256 proposalId, bool success)`
- `FundsReceived(address from, uint256 amount)`

---

## 🧪 Testing

### Run All Tests

```bash
forge test
```

### Run Specific Test

```bash
forge test --match-contract DAOVotingTest
```

### Show Gas Usage

```bash
forge test --gas-report
```

### Generate Gas Snapshots

```bash
forge snapshot
```

---

## 📚 Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [EIP-2771: Gasless Transactions](https://eips.ethereum.org/EIPS/eip-2771)
- [EIP-712: Typed Structured Data Hashing](https://eips.ethereum.org/EIPS/eip-712)

---

## 🛠️ Common Commands

### Build

```bash
forge build
```

### Format Code

```bash
forge fmt
```

### Lint with Slither (optional)

```bash
pip install slither-analyzer
slither .
```

### Verify Deployment

```bash
# Check MinimalForwarder code
cast code 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496

# Check DAOVoting code
cast code 0x34A1D3fff3958843C43aD80F30b94c510645C316

# Get contract balance
cast balance 0x34A1D3fff3958843C43aD80F30b94c510645C316 --rpc-url http://localhost:8545
```

### Interact with Contracts (Cast)

```bash
# Get proposal count
cast call 0x34A1D3fff3958843C43aD80F30b94c510645C316 \
  "proposalCount()" \
  --rpc-url http://localhost:8545

# Get DAO balance
cast call 0x34A1D3fff3958843C43aD80F30b94c510645C316 \
  "getDAOBalance()" \
  --rpc-url http://localhost:8545

# Fund the DAO (1 ETH)
cast send 0x34A1D3fff3958843C43aD80F30b94c510645C316 \
  --value 1ether \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
```

---

## 🔐 Security

- ✅ Reentrancy protection via ReentrancyGuard
- ✅ EIP-712 signature verification for meta-transactions
- ✅ Replay attack prevention with nonce tracking
- ✅ One vote per address enforcement
- ✅ Explicit state transitions (checks-effects-interactions)

---

## 📦 Deployments

### Local (Anvil)

| Contract | Address |
|----------|---------|
| MinimalForwarder | `0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496` |
| DAOVoting | `0x34A1D3fff3958843C43aD80F30b94c510645C316` |

**Chain ID:** 31337  
**RPC:** http://localhost:8545

### Sepolia Testnet (Future)

Deploy with:
```bash
forge script script/DeploySepolia.s.sol \
  --rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
  --broadcast \
  --verify
```

---

## 🚨 Troubleshooting

### "Anvil is not running"
```bash
# Start Anvil in a separate terminal
anvil --host 0.0.0.0 --port 8545
```

### "Contract address doesn't match .env.local"
```bash
# Run deployment script again
./deploy-contracts.sh
# Or manually update web/.env.local
```

### "Connection refused" on localhost:8545
- Ensure Anvil is running
- Check port 8545 is not in use: `lsof -i :8545`
- Try different port: `anvil --port 8546`

### Compile errors
```bash
# Clean build directory
forge clean

# Rebuild
forge build
```

---

## 📄 License

MIT - See LICENSE file in project root

---

## 🤝 Support

For issues or questions:
1. Check the [Foundry Book](https://book.getfoundry.sh/)
2. Review [contract source code](./src/)
3. Check test files for usage examples

---

**Last Updated:** 2026-02-22  
**Status:** ✅ Production Ready
