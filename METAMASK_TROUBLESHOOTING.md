# 🦊 MetaMask Troubleshooting Guide

## Problem: "Auto-connects without MetaMask being open"

### Symptoms
- Close MetaMask extension
- Refresh page or restart app
- Wallet reconnects automatically ❌
- "Connect Wallet" button works even when MetaMask is closed ❌

### Root Causes
1. **Browser Cache/Storage** - Browser remembers previous session
2. **MetaMask Global State** - `window.ethereum` object persists even when extension is "closed"
3. **Auto-reconnection Logic** - Hook was checking for accounts on mount without validating MetaMask availability

---

## Solutions

### Solution 1: Clear Browser Cache (Recommended First)

The browser might have cached the connection state from a previous session.

**Chrome/Edge:**
```
1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. Select "Cookies and other site data"
3. Click "Clear data"
4. Refresh the page
```

**Firefox:**
```
1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. Select "Cookies and Site Data"
3. Click "Clear Now"
4. Refresh the page
```

**Or use our script:**
```bash
./clear-browser-cache.sh
```

### Solution 2: Full App Reset

```bash
pkill anvil
pkill npm
rm -f /tmp/anvil.pid
rm -rf sc/broadcast sc/cache
rm -f web/.env.local
rm -rf web/.next          # Clear Next.js cache
./deploy-full.sh
```

Then **manually clear browser cache** (see Solution 1)

### Solution 3: Disable MetaMask Extension

Test that the app correctly detects when MetaMask is unavailable:

1. Open MetaMask extension settings
2. Click the extension icon in browser toolbar
3. Manage Extensions → MetaMask → Toggle OFF
4. Refresh app page
5. **Should show:** "MetaMask is not installed" ✓
6. Re-enable MetaMask

---

## Code Changes Made

### Updated `useWallet.ts`

**Added validation to check if MetaMask is accessible:**
```typescript
const updateAccountInfo = useCallback(async () => {
  if (!window.ethereum) return;

  try {
    // Test if MetaMask is actually accessible
    // by checking chain ID BEFORE checking accounts
    try {
      await window.ethereum.request({
        method: "eth_chainId",
      });
    } catch (err: any) {
      // MetaMask is not accessible
      setState({ isConnected: false, ... });
      return;
    }

    // Only check accounts if MetaMask is accessible
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    // ...
  }
}, []);
```

**Improved error handling in `connectWallet`:**
```typescript
const connectWallet = useCallback(async () => {
  // ... validation ...
  
  try {
    accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
  } catch (err: any) {
    if (err.code === 4001) {
      setError("MetaMask connection rejected.");
    } else if (err.code === -32603) {
      setError("MetaMask is not accessible.");
    }
    return null;
  }
  // ...
}, []);
```

---

## How It Should Work Now

### Scenario 1: MetaMask Closed
```
1. Close MetaMask extension
2. Visit app page
3. Click "Connect Wallet"
4. ❌ MetaMask popup does NOT appear
5. ✅ Show error: "MetaMask is not accessible"
```

### Scenario 2: MetaMask Closed, Page Refresh
```
1. Close MetaMask extension
2. Refresh page (F5)
3. ✅ Shows: "MetaMask is not installed" (or disconnected state)
4. ✅ Does NOT auto-connect
```

### Scenario 3: Normal Connection Flow
```
1. MetaMask is open and running
2. Click "Connect Wallet"
3. ✅ MetaMask popup appears
4. User approves connection
5. ✅ Wallet connects and shows balance
```

### Scenario 4: Close MetaMask After Connection
```
1. Wallet is connected
2. Close MetaMask extension
3. Page detects MetaMask unavailable
4. ✅ Auto-disconnects wallet
5. ✅ Shows "Connect Wallet" button
```

---

## Testing Checklist

- [ ] **Browser cache cleared** - Use Ctrl+Shift+Delete
- [ ] **MetaMask open** - Click Connect, see popup ✓
- [ ] **MetaMask closed** - Click Connect, see error ✓
- [ ] **Refresh with closed MetaMask** - Stays disconnected ✓
- [ ] **Switch accounts in MetaMask** - Auto-updates if connected ✓
- [ ] **Disable MetaMask extension** - Shows "not installed" ✓
- [ ] **Re-enable MetaMask** - Works normally ✓

---

## Still Having Issues?

### Nuclear Option (Complete Reset)
```bash
# Kill all processes
pkill anvil
pkill npm
pkill node

# Remove all caches
rm -rf web/.next
rm -rf sc/broadcast sc/cache
rm -f web/.env.local /tmp/anvil.pid

# Start fresh
./deploy-full.sh

# In browser:
# 1. Ctrl+Shift+Delete → Clear all site data
# 2. Close browser completely
# 3. Reopen browser
# 4. Visit http://localhost:3000
# 5. Try connecting
```

### Check MetaMask Logs
Open MetaMask extension → Settings → Advanced → Clear activity tab data

---

## Technical Details

### Why Auto-reconnection Happened
```
Old Flow:
┌──────────────────────────┐
│ App Mounts               │
│ ├─ updateAccountInfo()  │
│ │  └─ eth_accounts      │ ← Returns accounts if MetaMask ever connected
│ ├─ setState(connected)   │
│ └─ Return ✓ (even if closed)
└──────────────────────────┘
```

### How It's Fixed
```
New Flow:
┌──────────────────────────────┐
│ App Mounts                   │
│ ├─ updateAccountInfo()      │
│ │  ├─ eth_chainId test      │ ← Validate MetaMask is accessible
│ │  ├─ catch error           │ ← If error, disconnect
│ │  └─ eth_accounts          │ ← Only if accessible
│ ├─ setState(connected/disconnected based on test)
│ └─ Return correctly
└──────────────────────────────┘
```

---

## Files Modified
- `web/src/hooks/useWallet.ts` - Added MetaMask availability check
- `clear-browser-cache.sh` - New script to clean app cache

## Related Files
- `DISCONNECT_FIX.md` - Previous disconnect behavior fix
- `web/src/components/ConnectWallet.tsx` - Uses the hook
