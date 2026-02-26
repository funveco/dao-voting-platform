#!/bin/bash

##############################################################################
# Fund Account - Transfer ETH from Account #0 to another address
#
# Usage: ./fund-account.sh <recipient-address> <amount-in-eth>
#
# Example:
#   ./fund-account.sh 0x70997970C51812e339D9B73B00EF75B5E667F48E 5
#   (Sends 5 ETH to Account #1)
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check arguments
if [ $# -ne 2 ]; then
    echo ""
    echo -e "${YELLOW}Usage: ./fund-account.sh <recipient-address> <amount-in-eth>${NC}"
    echo ""
    echo "Example:"
    echo "  ./fund-account.sh 0x70997970C51812e339D9B73B00EF75B5E667F48E 5"
    echo ""
    echo "This will send 5 ETH from Account #0 (Deployer) to the recipient."
    echo ""
    exit 1
fi

RECIPIENT=$1
AMOUNT=$2
RPC_URL=${RPC_URL:-http://localhost:8545}
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
FROM_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "💸 Transfer ETH to Account"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Validate recipient
if [[ ! $RECIPIENT =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    log_error "Invalid recipient address: $RECIPIENT"
    exit 1
fi

# Validate amount
if ! [[ $AMOUNT =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
    log_error "Invalid amount: $AMOUNT"
    exit 1
fi

log_info "From:      $FROM_ADDRESS"
log_info "To:        $RECIPIENT"
log_info "Amount:    $AMOUNT ETH"
log_info "RPC URL:   $RPC_URL"
echo ""

# Check Anvil connection
log_info "Checking Anvil connection..."
if ! curl -s "$RPC_URL" -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; then
    log_error "Cannot connect to Anvil at $RPC_URL"
    log_error "Make sure Anvil is running: anvil --host 0.0.0.0 --port 8545"
    exit 1
fi

log_success "Connected to Anvil"
echo ""

# Send transaction using cast
log_info "Sending transaction..."

AMOUNT_WEI="$(echo "$AMOUNT * 10^18" | bc | cut -d. -f1)"

TX=$(cast send "$RECIPIENT" \
    --value "${AMOUNT}ether" \
    --from "$FROM_ADDRESS" \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" 2>&1)

if echo "$TX" | grep -q "TransactionHash"; then
    TX_HASH=$(echo "$TX" | grep "TransactionHash" | awk '{print $NF}')
    log_success "Transaction sent!"
    echo ""
    echo "📝 Details:"
    echo "   Hash: $TX_HASH"
    echo ""
else
    log_error "Transaction failed!"
    echo "$TX"
    exit 1
fi

# Wait for confirmation
log_info "Waiting for confirmation..."
sleep 2

# Get final balance
BALANCE=$(cast balance "$RECIPIENT" --rpc-url "$RPC_URL")
BALANCE_ETH=$(echo "scale=4; $BALANCE / 10^18" | bc)

log_success "Transaction confirmed!"
echo ""
echo "📊 Final Balance:"
echo "   Address:  $RECIPIENT"
echo "   Balance:  $BALANCE_ETH ETH"
echo ""

echo "═══════════════════════════════════════════════════════════════"
