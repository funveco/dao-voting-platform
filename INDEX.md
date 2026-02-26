# 📚 DAO Voting Platform - Complete Index

## 🚀 Start Here

**Just want to run it?**
```bash
./deploy-full.sh
```
Then open http://localhost:3000

---

## 📖 Documentation Map

### Quick Navigation
- 🎯 **[QUICKSTART.md](./QUICKSTART.md)** - 3 deployment options (pick one)
- 📖 **[README.md](./README.md)** - Project overview & features
- 🚀 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete setup guide
- 🦊 **[METAMASK_SETUP.md](./METAMASK_SETUP.md)** - MetaMask & test accounts

### Component Documentation
- 💻 **[web/README.md](./web/README.md)** - Frontend (Next.js)
- ⚙️ **[sc/README.md](./sc/README.md)** - Smart Contracts (Foundry)

### Phase Completion
- ✅ **[PHASE4_COMPLETE.md](./PHASE4_COMPLETE.md)** - Integration status
- ✅ **[PHASE3_SMART_CONTRACTS_COMPLETE.md](./PHASE3_SMART_CONTRACTS_COMPLETE.md)** - Contracts
- ✅ **[PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md)** - Frontend
- ✅ **[PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md)** - Design

---

## 🚀 Deployment Scripts

| Script | Purpose | Use When |
|--------|---------|----------|
| **[deploy-full.sh](./deploy-full.sh)** | Complete setup | Starting fresh |
| **[deploy-contracts.sh](./deploy-contracts.sh)** | Deploy only | Anvil already running |
| **[start-anvil.sh](./start-anvil.sh)** | Blockchain only | Custom setup |
| **[anvil-accounts.sh](./anvil-accounts.sh)** | Show test accounts | View all 10 pre-funded accounts |
| **[fund-account.sh](./fund-account.sh)** | Transfer ETH | Send ETH between accounts |

### Quick Reference
```bash
./deploy-full.sh          # ⭐ Recommended: Everything in one go
./anvil-accounts.sh       # Show all 10 test accounts
./fund-account.sh <addr> <eth>  # Send ETH to account
./start-anvil.sh          # Start blockchain
./deploy-contracts.sh     # Deploy contracts (Anvil must be running)
```

---

## 📊 File Structure

```
ROOT/
├── 🚀 Scripts
│   ├── deploy-full.sh              ← One-command deployment
│   ├── deploy-contracts.sh         ← Contract deployment
│   └── start-anvil.sh              ← Blockchain startup
│
├── 📖 Documentation
│   ├── README.md                   ← Start here (overview)
│   ├── INDEX.md                    ← This file (navigation)
│   ├── QUICKSTART.md               ← 3 quick options
│   ├── DEPLOYMENT.md               ← Complete guide
│   ├── PHASE1-4_COMPLETE.md        ← Phase status
│   ├── T221-223_COMPLETION.md      ← Task completions
│   └── ... (other docs)
│
├── sc/                             ← Smart Contracts
│   ├── src/
│   │   ├── MinimalForwarder.sol    ← EIP-2771 gasless voting
│   │   ├── DAOVoting.sol            ← Core DAO contract
│   │   └── ... (other contracts)
│   ├── script/
│   │   ├── DeployLocal.s.sol       ← Deploy to Anvil
│   │   └── DeploySepolia.s.sol     ← Deploy to testnet
│   ├── test/                        ← Tests
│   ├── README.md                    ← Contract docs
│   └── foundry.toml                 ← Config
│
└── web/                             ← Frontend
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx             ← Home + user guide
    │   │   ├── layout.tsx           ← Root layout
    │   │   └── proposals/           ← Proposal pages
    │   ├── components/              ← UI components
    │   ├── hooks/                   ← Custom hooks
    │   ├── lib/contracts/           ← ethers.js service
    │   └── contexts/                ← React context
    ├── .env.local                   ← Generated automatically
    ├── package.json
    └── README.md                    ← Frontend setup
```

---

## 🎯 Common Tasks

### Deploy Locally
1. Read: [QUICKSTART.md](./QUICKSTART.md)
2. Run: `./deploy-full.sh`
3. Open: http://localhost:3000

### Understand Architecture
1. Read: [README.md](./README.md) - Overview
2. Read: [PHASE4_COMPLETE.md](./PHASE4_COMPLETE.md) - Integration
3. Read: [sc/README.md](./sc/README.md) - Contracts

### Modify Smart Contracts
1. Edit: `sc/src/DAOVoting.sol`
2. Compile: `cd sc && forge build`
3. Test: `forge test`
4. Deploy: `./deploy-contracts.sh`

### Modify Frontend
1. Edit: `web/src/...`
2. Dev server: `cd web && npm run dev`
3. Changes auto-reload in browser

### Deploy to Testnet
1. Read: [DEPLOYMENT.md](./DEPLOYMENT.md#deploy-to-sepolia-testnet)
2. Follow manual deployment steps
3. Use Sepolia RPC + deployer private key

---

## 📋 Quick Reference

### Environment Variables (Auto-Generated)
```env
NEXT_PUBLIC_DAO_VOTING_ADDRESS=0x34A1D3fff3958843C43aD80F30b94c510645C316
NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Anvil
```

### Test Accounts (Pre-Funded)
**10 accounts available with 10,000 ETH each**

Show all: `./anvil-accounts.sh`

Account #0 (Deployer):
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Key:     0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
Balance: 10,000 ETH
```

See [METAMASK_SETUP.md](./METAMASK_SETUP.md) for all 10 accounts

### Key Endpoints
- Frontend: http://localhost:3000
- RPC: http://localhost:8545
- Chain ID: 31337 (Anvil)

---

## 🔍 Troubleshooting

**Issue: "Port 8545 in use"**  
→ See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

**Issue: "Contracts not found"**  
→ Run `./deploy-contracts.sh`

**Issue: "MetaMask connection fails"**  
→ See [DEPLOYMENT.md](./DEPLOYMENT.md#metamask-setup)

**Issue: ".env.local issues"**  
→ Run `./deploy-full.sh` (auto-generates)

More: [DEPLOYMENT.md#-troubleshooting](./DEPLOYMENT.md#-troubleshooting)

---

## 📚 Learning Path

### For Users
1. **Start:** [QUICKSTART.md](./QUICKSTART.md)
2. **Setup:** Follow deployment option
3. **Guide:** http://localhost:3000 (home page)
4. **Vote:** Create proposals & vote

### For Developers
1. **Overview:** [README.md](./README.md)
2. **Architecture:** [PHASE4_COMPLETE.md](./PHASE4_COMPLETE.md)
3. **Contracts:** [sc/README.md](./sc/README.md)
4. **Frontend:** [web/README.md](./web/README.md)
5. **Code:** Explore `sc/src/` and `web/src/`

### For Contributors
1. **Setup:** `./deploy-full.sh`
2. **Tests:** `cd sc && forge test`
3. **Code Review:** Check latest phase docs
4. **Modify:** Update contracts or frontend
5. **Deploy:** Follow deployment guide

---

## ✅ Checklist Before Starting

- [ ] Foundry installed (`forge --version`)
- [ ] Node.js v18+ (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Port 8545 available (or change in scripts)
- [ ] Read [QUICKSTART.md](./QUICKSTART.md)

---

## 🎓 Phase Overview

| Phase | Status | Docs |
|-------|--------|------|
| 1 | ✅ Design | [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md) |
| 2 | ✅ Frontend | [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md) |
| 3 | ✅ Contracts | [PHASE3_SMART_CONTRACTS_COMPLETE.md](./PHASE3_SMART_CONTRACTS_COMPLETE.md) |
| 4 | ✅ Integration | [PHASE4_COMPLETE.md](./PHASE4_COMPLETE.md) |

---

## 🔗 External Resources

- [Foundry Book](https://book.getfoundry.sh/) - Forge, Cast, Anvil
- [ethers.js v6](https://docs.ethers.org/v6/) - Web3 library
- [OpenZeppelin](https://docs.openzeppelin.com/) - Smart contract libraries
- [EIP-2771](https://eips.ethereum.org/EIPS/eip-2771) - Gasless transactions
- [Next.js](https://nextjs.org/docs) - React framework

---

## 💡 Tips

- **Just starting?** Run `./deploy-full.sh`
- **Want to learn?** Read phase docs in order
- **Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md#-troubleshooting)
- **Contributing?** See development tasks below

---

## 🎯 Next Steps

1. **Run:** `./deploy-full.sh`
2. **Connect:** MetaMask wallet
3. **Create:** First proposal
4. **Vote:** On a proposal
5. **Execute:** After voting ends

---

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Updated:** 2026-02-22

For the complete guide, see [README.md](./README.md)
