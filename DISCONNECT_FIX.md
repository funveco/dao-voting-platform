# 🔌 Wallet Disconnect Fix

## Problem
When you clicked "Disconnect" in the app, the wallet would disconnect temporarily but automatically reconnect without user action when:
- Refreshing the page
- Navigating away and back
- MetaMask sent any event (account/chain change)

## Root Cause
The `useWallet` hook had a `useEffect` that **unconditionally checked for connected accounts on mount** and **re-connected automatically** whenever MetaMask events fired, even after intentional disconnection.

### Code Issue (BEFORE)
```typescript
useEffect(() => {
  // ❌ This always runs on mount, auto-reconnecting
  updateAccountInfo();

  // ❌ These listeners re-connect automatically
  window.ethereum.on("accountsChanged", handleAccountsChanged);
  window.ethereum.on("chainChanged", handleChainChanged);
}, [updateAccountInfo, disconnectWallet]);
```

## Solution
Added an **`isIntentionallyDisconnected` flag** that:
1. Sets to `true` when user clicks "Disconnect"
2. Prevents auto-reconnection in the `useEffect` and event listeners
3. Clears when user explicitly clicks "Connect Wallet"

### Code Changes (AFTER)
```typescript
// Track intentional disconnection
const [isIntentionallyDisconnected, setIsIntentionallyDisconnected] = useState(false);

// disconnectWallet() now sets the flag
const disconnectWallet = useCallback(() => {
  setIsIntentionallyDisconnected(true);  // ✅ Prevent auto-reconnect
  setState({ isConnected: false, ... });
}, []);

// connectWallet() clears the flag
const connectWallet = useCallback(async () => {
  setIsIntentionallyDisconnected(false);  // ✅ Allow reconnect
  // ... rest of connection logic
}, []);

// useEffect only auto-reconnects if NOT intentionally disconnected
useEffect(() => {
  if (!isIntentionallyDisconnected) {  // ✅ Skip auto-reconnect
    updateAccountInfo();
  }
  
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsIntentionallyDisconnected(true);  // ✅ Detect MetaMask disconnect
    } else if (!isIntentionallyDisconnected) {  // ✅ Only reconnect if not intentional
      updateAccountInfo();
    }
  };
  
  // ... similar for chainChanged listener
}, [updateAccountInfo, isIntentionallyDisconnected]);
```

## Behavior After Fix

### User Clicks "Disconnect" Button
```
1. disconnectWallet() called
2. isIntentionallyDisconnected = true
3. Wallet state cleared (isConnected: false, address: null)
4. useEffect listeners disabled
5. ✅ Stays disconnected until user explicitly clicks "Connect"
```

### User Clicks "Connect Wallet" Button
```
1. connectWallet() called
2. isIntentionallyDisconnected = false
3. Connection established
4. useEffect listeners re-enabled for future changes
5. ✅ Can now auto-detect MetaMask account/chain changes
```

### User Changes Account in MetaMask
```
If intentionally disconnected:
  → No action (stays disconnected) ✓

If connected:
  → updateAccountInfo() runs
  → Wallet state updates automatically ✓
```

### User Disconnects in MetaMask Extension
```
accountsChanged event fires with empty array
→ setIsIntentionallyDisconnected(true)
→ Wallet disconnects in app ✓
```

## Files Modified
- `web/src/hooks/useWallet.ts` - Added intentional disconnect tracking

## Testing Checklist
- [ ] Connect wallet → balance shows ✓
- [ ] Click "Disconnect" → wallet disconnects ✓
- [ ] Refresh page → wallet stays disconnected ✓
- [ ] Click "Connect Wallet" → reconnects ✓
- [ ] Change account in MetaMask → auto-updates when connected ✓
- [ ] Disconnect in MetaMask → auto-detects and disconnects ✓

## Related Files
- `web/src/components/ConnectWallet.tsx` - Uses the hook
- `web/src/contexts/WalletProvider.tsx` - Provides context
