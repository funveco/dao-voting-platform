# Testing JSON Proposal Cache

## What Changed

Proposals are now saved to **`public/proposals.json`** via an API route.

- ✅ **Persists across page reloads** and browser sessions
- ✅ **Sequential IDs** (1, 2, 3...)
- ✅ **JSON format** - easily editable and viewable
- ✅ **Auto-loads on startup** from disk
- ✅ **Detailed logging** with emojis

## Files Modified

1. **Created**: `web/src/app/api/proposals/route.ts` - API for reading/writing JSON
2. **Created**: `web/src/lib/storage/proposalCache.ts` - Cache with API persistence
3. **Updated**: `web/src/lib/contracts/ProposalService.ts` - Uses new async cache
4. **Updated**: `web/src/hooks/useProposals.ts` - Logging

## How to Test

### 1. Start the dev server

```bash
cd web
npm run dev
```

### 2. Open browser console (F12)

Navigate to `http://localhost:3000/proposals/create`

### 3. Fill out the proposal form

- **Title**: "Test Proposal 1"
- **Description**: "This is a test proposal with at least 10 characters"
- **Recipient**: `0x1234567890123456789012345678901234567890`
- **Amount**: `1.5`

### 4. Submit the form

Watch the console:

```
📝 handleProposalSubmit: Form data received: {...}
✅ Wallet connected: 0x...
🔐 Getting signer from wallet...
✅ Signer obtained
🚀 Initializing ProposalService...
📤 Submitting proposal to ProposalService.createProposal()...
⚠️  Could not retrieve proposal count from contract: ...
⚠️  Using JSON cache for proposal storage (testing mode)
✅ Cache: Saved proposal 1 - "Test Proposal 1"
💾 Cache: Saved 1 proposals to disk
✅ Proposal saved to JSON cache
✅ Proposal created with result: {proposalId: 1n, transactionHash: "0x..."}
⏰ Redirecting to proposals list in 2 seconds...
```

### 5. Check the proposals list

Your proposal appears at `/proposals` with all the data.

### 6. **Refresh the page** (THIS IS NEW!)

✅ **Your proposal is STILL THERE** because it was saved to `public/proposals.json`

### 7. View the JSON file

Open `public/proposals.json` in your editor to see the raw data:

```json
[
  {
    "id": "1",
    "creator": "0x0000000000000000000000000000000000000000",
    "title": "Test Proposal 1",
    "description": "This is a test proposal with at least 10 characters",
    "recipient": "0x1234567890123456789012345678901234567890",
    "amount": "1500000000000000000",
    "createdAt": "1709098765",
    "votingDeadline": "1709703565",
    "snapshotBlock": "0",
    "targetAction": "recipient:0x1234567890123456789012345678901234567890|amount:1500000000000000000",
    "forVotes": "0",
    "againstVotes": "0",
    "abstainVotes": "0",
    "status": 1,
    "createdLocally": true
  }
]
```

### 8. Test persistence

1. Create another proposal
2. **Refresh the page** - both proposals still there
3. **Close the browser** and reopen - proposals still there
4. **Edit `public/proposals.json`** manually and refresh - changes reflected

## Troubleshooting

### "Wallet not connected"
- Click the MetaMask connect button

### Proposals not saving
- Check browser console (F12) for errors
- Check that `public/proposals.json` exists and is valid JSON
- Check network tab - API should POST to `/api/proposals`

### Can't see the JSON file
- Make sure you're looking at `web/public/proposals.json`
- The file is created on first proposal submission
- It's git-ignored by default (check `.gitignore`)

## Next: Clear the Cache

To delete all cached proposals and start fresh:

```bash
# Option 1: Delete the file manually
rm web/public/proposals.json

# Option 2: Use the API
curl -X DELETE http://localhost:3000/api/proposals
```

## Production Ready

Once contracts are deployed:
1. Remove the cache loading from `getAllProposals()`
2. Keep the cache as a **fallback** for when contracts fail
3. The JSON file becomes a dev-only feature or optional snapshot

---

**Status**: ✅ Ready to test - proposals now persist in JSON format!
