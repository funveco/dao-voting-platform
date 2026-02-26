# 🚀 Quick Start - 3 Options

## Option 1: One Command (Recommended) ⭐

```bash
./deploy-full.sh
```

That's it! This starts Anvil, deploys contracts, updates config, and runs the frontend.

Open **http://localhost:3000** when done.

---

## Option 2: Step-by-Step (3 Terminals)

### Terminal 1: Start Blockchain

```bash
./start-anvil.sh
```

### Terminal 2: Deploy Contracts

```bash
./deploy-contracts.sh
```

Copy the contract addresses output.

### Terminal 3: Start Frontend

```bash
cd web
npm run dev
```

Open **http://localhost:3000**

---

## Option 3: Manual (Full Control)

### Terminal 1: Anvil

```bash
anvil --host 0.0.0.0 --port 8545
```

### Terminal 2: Deploy

```bash
cd sc
forge script script/DeployLocal.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
```

Note the contract addresses.

### Manual Config

Edit `web/.env.local`:

```env
NEXT_PUBLIC_DAO_VOTING_ADDRESS=<copied address>
NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=<copied address>
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Anvil
```

### Terminal 3: Frontend

```bash
cd web
npm install
npm run dev
```

---

## 🎯 Next: MetaMask Setup

### 🦊 Show All Test Accounts

```bash
./anvil-accounts.sh
```

This shows all 10 pre-funded test accounts (10,000 ETH each) ready to import.

### Quick Steps

1. **Add Anvil Network in MetaMask:**
   - Network Name: `Anvil`
   - RPC: `http://localhost:8545`
   - Chain ID: `31337`

2. **Import Test Accounts** (see `./anvil-accounts.sh` for full list):
   - Import Account #0 (Deployer): Creates proposals
   - Import Account #1 (Voter #1): Votes FOR
   - Import Account #2 (Voter #2): Votes AGAINST
   - Add more accounts as needed (10 available)

3. **Open Browser:**
   - Go to http://localhost:3000
   - Click "Connect Wallet"
   - Approve in MetaMask

4. **Start Voting!** 🗳️

### ⚠️ No ETH After Import?

See [METAMASK_SETUP.md](./METAMASK_SETUP.md) for troubleshooting.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [METAMASK_SETUP.md](./METAMASK_SETUP.md) | 🦊 MetaMask setup & all 10 test accounts |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete setup with troubleshooting |
| [web/README.md](./web/README.md) | Frontend architecture & features |
| [sc/README.md](./sc/README.md) | Smart contracts documentation |

---

**Recommended:** Use Option 1 (`./deploy-full.sh`) - it handles everything automatically! ✨
