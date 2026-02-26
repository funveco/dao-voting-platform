# 🦊 MetaMask Setup Guide - DAO Voting Platform

## ⚠️ Why No 10,000 ETH?

When you import a private key **AFTER** Anvil starts, MetaMask shows the account address but with **0 ETH balance** because:
- Anvil pre-funds accounts **when it launches**
- MetaMask imports the address but doesn't know about Anvil's pre-funded balances
- The balance only syncs if the account existed before Anvil started

**Solution:** Import accounts **BEFORE** you make transactions, or restart Anvil after importing.

---

## 🔧 Setup Steps

### 1️⃣ Configure Anvil Network in MetaMask

If not already done:

1. **Open MetaMask** → Click network dropdown (top-left)
2. **Click "Add Network"** (or "Add Network Manually")
3. Fill in:
   ```
   Network Name:     Anvil
   RPC URL:          http://localhost:8545
   Chain ID:         31337
   Currency Symbol:  ETH
   Block Explorer:   (leave blank)
   ```
4. **Save**

---

### 2️⃣ Import Pre-funded Test Accounts

Anvil automatically generates 10 pre-funded accounts with **10,000 ETH each**.

**How to import:**

1. **Open MetaMask** → Click account icon (top-right)
2. **Click "Import Account"**
3. **Paste private key** (see list below)
4. **Click Import**
5. Repeat for each account you want

---

## 💰 Anvil Test Accounts (10,000 ETH each)

| Account | Address | Private Key |
|---------|---------|-------------|
| **#0** (Deployer) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058` |
| **#1** | `0x70997970C51812e339D9B73B00EF75B5E667F48E` | `0x47e1712a7d0481fc63f1563b21e40350e6ea11db1766e6b4a591b71b4287a44a` |
| **#2** | `0x3C44CdDdB6a900c6C6663891F68631f7ce391D3B` | `0xc526ee95bf44d8fc405a158bb884d9d1eb19dbbbbdc8b50910cda1f1fd334614` |
| **#3** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x8166f546bab6da521a8369cba6731fd945d294e1428cb233c612edb56da57130` |
| **#4** | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e` |
| **#5** | `0x1CBd3b2770909D4e10f157cAEC9C7cb3b5f67F81` | `0x309dff3de61b67d1df5aaed429987ddbf3151b4c844ee114b763763bf4ee6604` |
| **#6** | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` | `0x02d6725f2260a3138877d1e1fff180760d2136df366ee6cb01b0b072dd715b65` |
| **#7** | `0xa0Ee7A142d267C1f36714E4a8F75759E8Cdf3d51` | `0x1885d3b69ce9eed202970b4dd764467d83c3f4433e99acb3cb3ad76e07d00575` |
| **#8** | `0xBcd4042DE499d14e55001CcbB24a551F3b954096` | `0xdfc0d8d64f7c1dd1b6f26a6f6e0b0c52efcfe1e6e8c9f47a5d6c5b4a39f8e7d6` |
| **#9** | `0x71bE63f3384f5fb98991E1da0113b8d4aebb3713` | `0xe0d4aac3276c0fb0640d1d4aeb50716e5be94185364d525360cbb7e57d6f2c83` |

---

## ✅ Verify Import was Successful

After importing:

1. **Make sure Anvil is running**:
   ```bash
   ./start-anvil.sh
   # OR
   anvil
   ```

2. **Switch to Anvil network** in MetaMask (network dropdown)

3. **Check balance** - should show ~10,000 ETH ✓

---

## 🔄 If Still Showing 0 ETH

### Fix #1: Restart Everything

```bash
# Kill Anvil
pkill anvil

# Start fresh
./deploy-full.sh
```

Then import accounts **AFTER** Anvil starts but **BEFORE** Anvil is restarted.

### Fix #2: Manual Transfer (if one account has ETH)

If Account #0 has ETH but your imported account doesn't:

```bash
cast send <imported-address> --value 1ether \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
```

Replace `<imported-address>` with your account's address.

### Fix #3: Use Connected Account

If you just connected without importing:
1. MetaMask shows your connected address
2. Anvil doesn't auto-fund external addresses
3. **Transfer ETH from Account #0** to your address

---

## 🧪 Test the Setup

1. **Connect MetaMask** to the app at http://localhost:3000
2. **Switch to Anvil network**
3. **View wallet details** - should show ~10,000 ETH
4. **Create a proposal** - confirm gas fee works
5. **Fund the DAO** - send 1 ETH
6. **Vote** - test voting functionality

---

## 📋 Using Multiple Accounts for Testing

### Scenario: Test Voting With 3 Accounts

1. **Import Account #0** (10,000 ETH) - Admin/Creator
2. **Import Account #1** (10,000 ETH) - Voter #1
3. **Import Account #2** (10,000 ETH) - Voter #2

Then in the app:
1. **Switch to Account #0** → Create proposal
2. **Switch to Account #1** → Vote FOR
3. **Switch to Account #2** → Vote AGAINST
4. **Switch to Account #0** → Execute after deadline

---

## 🚀 Common Testing Flows

### Test Proposal Creation
```
1. Account #0: Fund DAO with 10 ETH
2. Account #0: Create proposal (send 5 ETH to Account #1)
3. Done ✓
```

### Test Voting
```
1. Account #0: Create proposal
2. Account #0: Vote FOR
3. Account #1: Vote AGAINST
4. Account #2: Vote ABSTAIN
5. Check vote counts ✓
```

### Test Execution
```
1. Account #0: Fund DAO with 10 ETH
2. Account #0: Create proposal (5 ETH → Account #1)
3. Account #0: Vote FOR
4. Account #1: Vote FOR (2 FOR > 0 AGAINST)
5. Wait 7 days OR advance time with:
   cast rpc anvil_increaseTime 604800 --rpc-url http://localhost:8545
6. Account #0: Execute proposal ✓
```

---

## ⏭️ Time Manipulation (For Testing)

Since 7 days is long, Anvil lets you skip time:

```bash
# Skip 7 days (604800 seconds)
cast rpc anvil_increaseTime 604800 --rpc-url http://localhost:8545

# Mine a block to apply the time change
cast rpc anvil_mine 1 --rpc-url http://localhost:8545
```

After running this, your proposals will be ready to execute!

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Wrong network" alert | Switch MetaMask to Anvil (Chain ID 31337) |
| 0 ETH balance | Restart Anvil and import accounts again |
| Account locked | MetaMask password incorrect or session expired |
| Can't send transaction | Ensure account has ETH (>0.01 for gas) |
| Proposal won't execute | Wait 7 days or use `cast rpc anvil_increaseTime` |

---

## 📚 Learn More

- [MetaMask Docs](https://docs.metamask.io/)
- [Anvil Documentation](https://book.getfoundry.sh/reference/anvil/)
- [Foundry Cast](https://book.getfoundry.sh/cast/) - For command-line transactions
- [EIP-2771 Standard](https://eips.ethereum.org/EIPS/eip-2771) - Gasless voting

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-22
