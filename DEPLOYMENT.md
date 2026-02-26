# DAO Voting Platform - Deployment Guide

Complete guide to deploy and run the DAO Voting Platform locally.

---

## 📋 Prerequisites

Ensure you have the following installed:

- **Node.js** `v18+` - [Download](https://nodejs.org)
- **Foundry** - [Install Guide](https://book.getfoundry.sh/getting-started/installation)
- **Git** (for cloning)
- **curl** (for health checks)

### Verify Installation

```bash
node --version     # v18.x.x or higher
npm --version      # 9.x.x or higher
forge --version    # 0.2.x or higher
anvil --version    # 0.2.x or higher
```

---

## 🚀 Quick Start (Automated)

### One Command to Deploy Everything

From the **project root**:

```bash
./deploy-full.sh
```

This single command will:

1. ✅ Start Anvil (local blockchain)
2. ✅ Compile smart contracts
3. ✅ Deploy MinimalForwarder and DAOVoting
4. ✅ Update `web/.env.local` with contract addresses
5. ✅ Start Next.js frontend dev server
6. ✅ Display all addresses and test account info

**Expected Output:**

```
✅ Anvil started (PID: 12345)
✅ Anvil is ready
✅ Contracts compiled
✅ MinimalForwarder: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
✅ DAOVoting: 0x34A1D3fff3958843C43aD80F30b94c510645C316
✅ .env.local updated
✅ Frontend dev server starting...
```

Open **http://localhost:3000** in your browser. Done! 🎉

---

## 🔄 Alternative: Step-by-Step Deployment

### Step 1: Start Anvil

In **Terminal 1**:

```bash
anvil --host 0.0.0.0 --port 8545
```

You should see:

```
Listening on 127.0.0.1:8545
```

### Step 2: Deploy Contracts

In **Terminal 2**:

```bash
./deploy-contracts.sh
```

This will output:

```
✅ Deployment Successful!

📋 Contract Addresses (Chain ID 31337):
   MinimalForwarder: 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
   DAOVoting:        0x34A1D3fff3958843C43aD80F30b94c510645C316

📝 Add to web/.env.local:
NEXT_PUBLIC_DAO_VOTING_ADDRESS=0x34A1D3fff3958843C43aD80F30b94c510645C316
NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Anvil
```

### Step 3: Configure Frontend

Copy the output above to `web/.env.local`:

```bash
cat > web/.env.local << 'EOF'
NEXT_PUBLIC_DAO_VOTING_ADDRESS=0x34A1D3fff3958843C43aD80F30b94c510645C316
NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Anvil
EOF
```

### Step 4: Start Frontend

In **Terminal 3**:

```bash
cd web
npm install  # only needed first time
npm run dev
```

### Step 5: Open Browser

Open **http://localhost:3000** and start voting! 🗳️

---

## 👛 MetaMask Setup

### Connect MetaMask to Anvil

1. **Open MetaMask** in your browser extension
2. **Add Network:**
   - Click network dropdown → "Add network"
   - Network Name: `Anvil`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
3. **Import Test Account:**
   - Click account menu → "Import Account"
   - Paste private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058`
   - Account will show 10,000 ETH balance ✅

### Now You're Connected!

- Go to http://localhost:3000
- Click "Connect Wallet" button
- Approve MetaMask connection
- Start creating proposals and voting 🎉

---

## 📊 Testing the Platform

### Test Scenario

1. **Connect Wallet**
   - Click "Connect Wallet" in top-right
   - Approve MetaMask connection

2. **Fund the DAO**
   - Click on "Connected" button to expand wallet details
   - Send 10 ETH to DAO contract

3. **Create Proposal**
   - Go to "Create" in navigation
   - Fill in:
     - **Recipient:** Your address (0x...)
     - **Amount:** 1.0 ETH
     - **Deadline:** 7 days (or less for testing)
   - Click "Create Proposal" and approve in MetaMask

4. **Vote on Proposal**
   - Go to "Proposals"
   - Click on your proposal
   - Vote "For" (or try gasless voting!)
   - Approve in MetaMask

5. **Execute Proposal** (after deadline)
   - Wait 7 days (in real env, test with shorter deadline)
   - Return to proposal
   - Click "Execute Proposal"
   - Funds transfer to recipient address ✅

---

## 🔍 Verification Commands

### Check Anvil Health

```bash
curl http://localhost:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Expected response:
# {"jsonrpc":"2.0","result":"0x7a69","id":1}
```

### Check DAO Balance

```bash
cast balance 0x34A1D3fff3958843C43aD80F30b94c510645C316 \
  --rpc-url http://localhost:8545
```

### Check Proposal Count

```bash
cast call 0x34A1D3fff3958843C43aD80F30b94c510645C316 \
  "proposalCount()" \
  --rpc-url http://localhost:8545
```

---

## 📁 Project Structure

```
11.DAO-Voting-Platform/
├── deploy-full.sh                 # One-command deployment
├── deploy-contracts.sh            # Deploy only contracts
├── DEPLOYMENT.md                  # This file
│
├── sc/                            # Smart Contracts
│   ├── src/
│   │   ├── MinimalForwarder.sol  # EIP-2771 Forwarder
│   │   └── DAOVoting.sol          # Core DAO Contract
│   ├── script/
│   │   └── DeployLocal.s.sol     # Anvil deployment script
│   ├── test/                      # Test files
│   ├── README.md                  # Contract documentation
│   └── foundry.toml
│
├── web/                           # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Home with instructions
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── proposals/        # Proposals pages
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks
│   │   ├── lib/contracts/        # ethers.js services
│   │   └── contexts/             # React contexts
│   ├── .env.local                # Environment variables
│   ├── package.json
│   └── next.config.ts
│
└── docs/                          # Documentation
    ├── PHASE4_COMPLETE.md
    └── Architecture Guide
```

---

## 🐛 Troubleshooting

### Issue: "Port 8545 already in use"

**Solution:** Kill existing Anvil and try again

```bash
pkill anvil
sleep 1
anvil --host 0.0.0.0 --port 8545
```

### Issue: "Contract addresses don't match .env.local"

**Solution:** Redeploy and update env

```bash
./deploy-contracts.sh
# Follow the output to update web/.env.local
```

### Issue: "Cannot read properties of undefined (reading 'connectWallet')"

**Solution:** Refresh page or clear browser cache

```bash
# Then restart frontend
cd web && npm run dev
```

### Issue: MetaMask rejects transaction

**Reasons:**
- Not enough gas (increase gas limit in MetaMask)
- Insufficient ETH balance (use test account with 10k ETH)
- Wrong network (ensure MetaMask is on Anvil, Chain ID 31337)

### Issue: "NEXT_PUBLIC_DAO_VOTING_ADDRESS is not set"

**Solution:** Create/update `web/.env.local`

```bash
cd web
# Run deployment script again
../deploy-contracts.sh
# Or manually add the addresses
```

---

## 🔧 Advanced Usage

### Deploy to Different Port

```bash
anvil --host 0.0.0.0 --port 8546
# Update RPC_URL in web/.env.local
```

### Deploy to Sepolia Testnet

```bash
cd sc
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_API_KEY"
export DEPLOYER_PRIVATE_KEY="0x..." # Your testnet account

forge script script/DeploySepolia.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

### Run Contract Tests

```bash
cd sc
forge test -vv  # verbose output
forge test --match-contract DAOVotingTest
```

---

## 📚 Documentation

- [Smart Contracts](./sc/README.md) - Contract details, ABIs, interactions
- [Frontend Setup](./web/README.md) - Next.js configuration
- [Foundry Docs](https://book.getfoundry.sh/) - Forge, Cast, Anvil
- [ethers.js Docs](https://docs.ethers.org/) - Web3 library

---

## 🛑 Stopping Services

### Stop All Services

```bash
# Stop Next.js frontend (Ctrl+C in that terminal)
# Stop Anvil (Ctrl+C in that terminal)

# Or kill all Node processes
pkill node
pkill anvil
```

---

## ✅ Checklist: Ready to Vote?

- [ ] Foundry installed (`forge --version`)
- [ ] Node.js installed (`node --version`)
- [ ] Anvil running on `http://localhost:8545`
- [ ] Contracts deployed (have addresses)
- [ ] `.env.local` configured with addresses
- [ ] Frontend running on `http://localhost:3000`
- [ ] MetaMask connected to Anvil (Chain ID 31337)
- [ ] Test account imported with 10k ETH
- [ ] Can see "Connected" button in top-right

**If all checked → You're ready to create proposals and vote!** 🗳️

---

## 🎯 Next Steps

1. **Explore the UI** - Check out all pages
2. **Create a Proposal** - Follow the step-by-step guide on home page
3. **Vote** - Test both normal and gasless voting
4. **Execute** - After voting period, execute approved proposals
5. **Read Code** - Understand the smart contracts and frontend

---

## 📞 Support

Stuck? Try:

1. Check [Foundry Troubleshooting](https://book.getfoundry.sh/guides/debugging)
2. Review [PHASE4_COMPLETE.md](./PHASE4_COMPLETE.md) for integration details
3. Check contract source: [sc/src/](./sc/src/)
4. Review frontend code: [web/src/](./web/src/)

---

**Version:** 1.0  
**Last Updated:** 2026-02-22  
**Status:** ✅ Production Ready
