# PHASE 4: Web Frontend Integration & End-to-End Testing

**Date**: 2026-02-11  
**Branch**: `001-eip2771-dao-voting`  
**Status**: IN PROGRESS

---

## Objective

Integrate the Phase 3 smart contracts (MinimalForwarder + DAOVoting) with the Phase 2 web frontend (React/TypeScript) to create a fully functional DAO voting platform with gasless voting support.

---

## Tasks Overview

### T1: Update Contract Configuration
- [ ] Update `.env.local` with Phase 3 contract addresses
- [ ] Update ProposalService with correct contract ABIs
- [ ] Verify contract address environment variables

### T2: Integrate DAOVoting Contract
- [ ] Update ProposalService to call DAOVoting methods (createProposal, vote, executeProposal)
- [ ] Implement proposal creation flow
- [ ] Implement voting submission (normal gas)
- [ ] Implement proposal execution

### T3: Integrate MinimalForwarder (EIP-2771)
- [ ] Implement gasless voting flow
- [ ] Generate EIP-712 signatures off-chain
- [ ] Submit meta-transactions to MinimalForwarder
- [ ] Handle relayer submission

### T4: Event Integration
- [ ] Subscribe to ProposalCreated events
- [ ] Subscribe to VoteCast events
- [ ] Subscribe to ProposalExecuted events
- [ ] Subscribe to FundsReceived events
- [ ] Update EventManager with real contract events

### T5: UI Integration
- [ ] Wire ProposalService to useProposal hook
- [ ] Wire ProposalService to useProposals hook
- [ ] Integrate useVoteSubmission hook
- [ ] Update proposal detail page with real data
- [ ] Update proposals list page with real data

### T6: End-to-End Testing
- [ ] Test create proposal flow
- [ ] Test voting flow (normal)
- [ ] Test voting flow (gasless)
- [ ] Test proposal execution
- [ ] Test vote changes before deadline

### T7: Deployment to Sepolia
- [ ] Configure Sepolia testnet RPC
- [ ] Deploy contracts to Sepolia
- [ ] Update .env with Sepolia addresses
- [ ] Test frontend on Sepolia testnet

---

## Technical Details

### Contract Integration Points

**DAOVoting Contract**:
- Address: `0x34A1D3fff3958843C43aD80F30b94c510645C316` (Anvil)
- Methods to integrate:
  - `createProposal(recipient, amount, deadline)` → proposalId
  - `vote(proposalId, voteType)` → success
  - `executeProposal(proposalId)` → success
  - `getProposal(proposalId)` → Proposal struct
  - `getUserVote(proposalId, voter)` → VoteType
  - `getDAOBalance()` → uint256

**MinimalForwarder Contract**:
- Address: `0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496` (Anvil)
- Methods to integrate:
  - `execute(ForwardRequest, signature)` → (success, result)
  - `verify(ForwardRequest, signature)` → bool
  - `getNonce(user)` → uint256

### Event Subscriptions

```solidity
event ProposalCreated(uint256 indexed proposalId, address indexed creator, ...)
event VoteCast(uint256 indexed proposalId, address indexed voter, VoteType voteType, ...)
event ProposalExecuted(uint256 indexed proposalId, bool success, ...)
event FundsReceived(address indexed from, uint256 amount)
```

### Gasless Voting Flow

1. User signs voting message off-chain (no gas)
2. Frontend generates EIP-712 signature
3. Relayer submits signature to MinimalForwarder
4. MinimalForwarder validates and calls DAOVoting.vote()
5. DAOVoting records vote with _msgSender() from forwarder

---

## Success Criteria

✅ All ProposalService methods callable with real contracts  
✅ Web UI displays real proposal data  
✅ Users can create proposals via web UI  
✅ Users can vote via web UI (normal + gasless)  
✅ Event listeners work with real contract events  
✅ End-to-end tests pass on Anvil  
✅ Sepolia testnet deployment works  
✅ No design system changes (maintain shadcn/ui + Tailwind)  

---

## Files to Update

### Backend/Service Layer
- `web/src/lib/contracts/ProposalService.ts` - Add DAOVoting method calls
- `web/src/lib/contracts/types.ts` - Add DAOVoting specific types
- `web/src/lib/contracts/EventManager.ts` - Subscribe to real contract events
- `web/src/lib/contracts/utils.ts` - Add signature generation utilities

### Hooks
- `web/src/hooks/useVoteSubmission.ts` - Wire to ProposalService.submitVote()
- `web/src/hooks/useProposal.ts` - Wire to ProposalService.getProposal()
- `web/src/hooks/useProposals.ts` - Wire to ProposalService.getAllProposals()

### Pages
- `web/src/app/proposals/page.tsx` - Use useProposals hook
- `web/src/app/proposals/[id]/page.tsx` - Use useProposal + useVoteSubmission hooks
- `web/src/app/proposals/create/page.tsx` - Wire form to createProposal

### Configuration
- `web/.env.local` - Add contract addresses

---

## Next Steps After Phase 4

1. **Phase 5**: Security Audit & Optimization
   - Test coverage for all flows
   - Gas optimization
   - Security review

2. **Phase 6**: Production Deployment
   - Mainnet deployment
   - UI polish
   - Performance optimization

---

**Status**: READY TO IMPLEMENT  
**Estimated Duration**: 4-6 hours  
**Dependencies**: Phase 3 Complete ✅, Phase 2 Complete ✅
