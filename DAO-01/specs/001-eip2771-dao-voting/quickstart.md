# Quickstart: Smart Contracts - EIP-2771 DAO Voting

**Feature**: [001-eip2771-dao-voting](spec.md)

This guide shows how to interact with the smart contracts from frontend, relayer, and test scenarios.

---

## Deployment

### Local (Anvil)

```bash
cd sc
forge build
forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
```

Output:
```
MinimalForwarder deployed at: 0x...
DAOVoting deployed at: 0x...
```

### Sepolia Testnet

```bash
forge script script/DeploySepolia.s.sol --rpc-url https://sepolia.infura.io/v3/... --broadcast
```

---

## Scenario 1: Normal Voting (User Pays Gas)

### Step 1: User receives ETH and deposits into DAO

```javascript
// Frontend integration
const daoAddress = "0x..."; // DAOVoting contract address
const userAddress = "0x..."; // Connected wallet

// Send ETH to DAOVoting
const tx = await ethers.provider.getSigner().sendTransaction({
  to: daoAddress,
  value: ethers.parseEther("1.0"), // Deposit 1 ETH
});

// Or call fundDAO() explicitly
const daoContract = new ethers.Contract(daoAddress, DAOVotingABI, signer);
await daoContract.fundDAO({ value: ethers.parseEther("1.0") });
```

### Step 2: User creates proposal

```javascript
const recipient = "0x1234..."; // Beneficiary address
const amount = ethers.parseEther("0.5"); // 0.5 ETH to transfer if approved
const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

const tx = await daoContract.createProposal(recipient, amount, deadline);
const receipt = await tx.wait();

// Extract proposalId from event
const event = receipt.events.find(e => e.event === "ProposalCreated");
const proposalId = event.args.proposalId;

console.log(`Proposal created: ${proposalId}`);
```

### Step 3: Other users vote

```javascript
const proposalId = 1;

// Vote FOR
const voteTx = await daoContract.vote(proposalId, 1); // VoteType.FOR = 1
await voteTx.wait();

// Or change vote to AGAINST
const changeVoteTx = await daoContract.vote(proposalId, 2); // VoteType.AGAINST = 2
await changeVoteTx.wait();
```

### Step 4: Query results in real-time

```javascript
// Listen for vote updates
daoContract.on("VoteCast", (proposalId, voter, voteType, forVotes, againstVotes, abstainVotes) => {
  console.log(`Proposal ${proposalId}: FOR=${forVotes} AGAINST=${againstVotes} ABSTAIN=${abstainVotes}`);
});

// Or poll manually
const proposal = await daoContract.getProposal(proposalId);
console.log(`Votes - FOR: ${proposal.forVotes}, AGAINST: ${proposal.againstVotes}, ABSTAIN: ${proposal.abstainVotes}`);
```

### Step 5: Execute after deadline + safety period

```javascript
const proposalId = 1;

// Check if executable
const proposal = await daoContract.getProposal(proposalId);
const safetyDelay = 7 * 24 * 60 * 60; // 7 days in seconds
const canExecute = 
  Date.now() / 1000 >= proposal.deadline + safetyDelay &&
  proposal.forVotes > proposal.againstVotes &&
  !proposal.executed;

if (canExecute) {
  const executeTx = await daoContract.executeProposal(proposalId);
  await executeTx.wait();
  console.log(`Proposal ${proposalId} executed!`);
}
```

---

## Scenario 2: Gasless Voting (Relayer Pays Gas)

### Step 1: User signs vote request off-chain (no blockchain interaction)

```javascript
import { ethers } from "ethers";

const userAddress = "0x..."; // Connected wallet
const minimalForwarderAddress = "0x..."; // MinimalForwarder contract
const daoAddress = "0x..."; // DAOVoting contract
const proposalId = 1;
const voteType = 1; // VoteType.FOR

// Get current nonce
const nonce = await forwarderContract.getNonce(userAddress);

// Create vote function call data
const daoInterface = new ethers.Interface(DAOVotingABI);
const callData = daoInterface.encodeFunctionData("vote", [proposalId, voteType]);

// Create ForwardRequest
const forwardRequest = {
  from: userAddress,
  to: daoAddress,
  value: 0,
  gas: 100000, // Estimate vote gas
  nonce: nonce,
  deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour deadline
  data: callData,
};

// Sign the request (EIP-712 compatible)
const domainSeparator = {
  name: "MinimalForwarder",
  version: "1",
  chainId: 31337, // Anvil chain ID (adjust for mainnet/testnet)
  verifyingContract: minimalForwarderAddress,
};

const types = {
  ForwardRequest: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "gas", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "data", type: "bytes" },
  ],
};

const signature = await userSigner._signTypedData(domainSeparator, types, forwardRequest);

console.log("User signed vote request without spending gas!");
console.log("Signature:", signature);
```

### Step 2: Relayer verifies and submits transaction

```javascript
// Relayer has a separate account/wallet with ETH
const relayerSigner = ethers.provider.getSigner(relayerAddress);
const forwarderWithSigner = forwarderContract.connect(relayerSigner);

// Verify signature is valid (optional check before relaying)
const isValid = await forwarderContract.verify(forwardRequest, signature);
if (!isValid) {
  console.error("Invalid signature, rejecting");
  return;
}

// Submit meta-transaction
const relayTx = await forwarderWithSigner.execute(forwardRequest, signature);
const receipt = await relayTx.wait();

console.log(`Meta-transaction executed!`);
console.log(`Block: ${receipt.blockNumber}`);
console.log(`Gas used: ${receipt.gasUsed}`);
console.log(`Relayer paid gas, user paid nothing!`);
```

### Step 3: User's vote is recorded without paying gas

```javascript
// User can verify their vote was recorded
const userVote = await daoContract.getUserVote(proposalId, userAddress);
console.log(`Your vote: ${voteType === userVote ? "✓ Recorded" : "✗ Failed"}`);

// Vote appears in event logs and vote counts
const proposal = await daoContract.getProposal(proposalId);
console.log(`Proposal votes - FOR: ${proposal.forVotes}, AGAINST: ${proposal.againstVotes}`);
```

---

## Scenario 3: Test Cases

### Test: User with insufficient power cannot create proposal

```solidity
// arrange
uint256 userBalance = 0.1 ether; // Too low
uint256 daoBalance = 1 ether; // 10% threshold = 0.1 ether
uint256 minPower = daoBalance / 10; // 0.1 ether

// act & assert
vm.prank(user);
vm.expectRevert("InsufficientPowerToCreate");
daoVoting.createProposal(recipient, amount, deadline);
```

### Test: User cannot vote after deadline

```solidity
// arrange
vm.warp(proposal.deadline + 1); // Move past deadline

// act & assert
vm.prank(voter);
vm.expectRevert("DeadlinePassed");
daoVoting.vote(proposalId, VoteType.FOR);
```

### Test: User can change vote before deadline

```solidity
// arrange
vm.prank(voter);
daoVoting.vote(proposalId, VoteType.FOR);
uint256 forVotesAfterFirst = daoVoting.getProposal(proposalId).forVotes;

// act
vm.prank(voter);
daoVoting.vote(proposalId, VoteType.AGAINST);
uint256 againstVotesAfterSecond = daoVoting.getProposal(proposalId).againstVotes;

// assert
assertEq(forVotesAfterFirst, 1);
assertEq(daoVoting.getProposal(proposalId).forVotes, 0); // Removed from FOR
assertEq(againstVotesAfterSecond, 1); // Added to AGAINST
```

### Test: Cannot execute before safety period

```solidity
// arrange
vm.warp(proposal.deadline); // At deadline, not after + 7 days

// act & assert
vm.expectRevert("SafetyPeriodNotElapsed");
daoVoting.executeProposal(proposalId);
```

### Test: Cannot execute if AGAINST >= FOR

```solidity
// arrange
// Setup: 2 FOR votes, 2 AGAINST votes
vm.prank(user1);
daoVoting.vote(proposalId, VoteType.FOR);
vm.prank(user2);
daoVoting.vote(proposalId, VoteType.FOR);
vm.prank(user3);
daoVoting.vote(proposalId, VoteType.AGAINST);
vm.prank(user4);
daoVoting.vote(proposalId, VoteType.AGAINST);

vm.warp(proposal.deadline + 8 days); // After safety period

// act & assert
vm.expectRevert("ProposalNotApproved");
daoVoting.executeProposal(proposalId);
```

### Test: Gasless voting via meta-transaction

```solidity
// arrange
bytes memory signature = ... // User's signed off-chain request
ForwardRequest memory req = ... // Vote request

// act
(bool success, ) = minimalForwarder.execute(req, signature);

// assert
assertTrue(success);
uint8 userVote = daoVoting.getUserVote(proposalId, userAddress);
assertEq(userVote, VoteType.FOR);
```

---

## Frontend Integration Tips

### Real-time Vote Updates

```javascript
// Setup event listener
daoContract.on("VoteCast", (proposalId, voter, voteType, forVotes, againstVotes, abstainVotes) => {
  // Update UI with new vote counts
  updateProposalUI(proposalId, { forVotes, againstVotes, abstainVotes });
});

// Listen for new proposals
daoContract.on("ProposalCreated", (proposalId, creator, recipient, amount, deadline) => {
  // Add new proposal to list
  addProposalToUI(proposalId, { creator, recipient, amount, deadline });
});

// Listen for executions
daoContract.on("ProposalExecuted", (proposalId, success, amount, recipient) => {
  // Mark proposal as executed
  markProposalExecuted(proposalId);
});

// Remove listeners when component unmounts
return () => {
  daoContract.removeAllListeners();
};
```

### Polling Fallback (if events not reliable)

```javascript
// Poll every 5 seconds
const pollInterval = setInterval(async () => {
  const proposal = await daoContract.getProposal(proposalId);
  updateProposalUI(proposalId, proposal);
}, 5000);

// Cleanup
return () => clearInterval(pollInterval);
```

---

## Deployment Script Template

```solidity
// script/DeployLocal.s.sol
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

contract DeployLocal is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy MinimalForwarder
        MinimalForwarder forwarder = new MinimalForwarder();
        console.log("MinimalForwarder deployed at:", address(forwarder));

        // Deploy DAOVoting with forwarder address
        DAOVoting daoVoting = new DAOVoting(address(forwarder));
        console.log("DAOVoting deployed at:", address(daoVoting));

        vm.stopBroadcast();
    }
}
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `InsufficientPowerToCreate` | User balance < 10% of DAO | User must contribute more ETH first |
| `DeadlinePassed` | Voting after deadline | Check proposal.deadline before voting |
| `SafetyPeriodNotElapsed` | Executing before deadline + 7 days | Wait 7 days after deadline |
| `ProposalNotApproved` | AGAINST >= FOR votes | Need more FOR votes than AGAINST |
| `AlreadyExecuted` | Attempting to execute twice | Each proposal executes once only |
| `InsufficientFunds` | DAO balance < proposal.amount | DAO must have enough ETH |
| Invalid signature | Nonce mismatch or signature corrupted | Ensure nonce matches current value |

---

## Summary

- **Normal voting**: User calls vote() directly (pays gas)
- **Gasless voting**: User signs off-chain, relayer submits (relayer pays gas)
- **Events**: Listen for VoteCast, ProposalCreated, ProposalExecuted in real-time
- **Safety**: 7-day delay before execution of fund transfers
- **Execution**: Only if FOR > AGAINST and deadline + 7 days passed

**Ready for**: Integration testing with frontend, relayer service development, deployment to testnet

---

**Status**: ✅ Quickstart Complete - Ready for Implementation
