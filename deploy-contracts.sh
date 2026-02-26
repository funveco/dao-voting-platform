#!/bin/bash

##############################################################################
# DAO Voting Platform - Smart Contract Deployment Only
# 
# This script:
# 1. Verifies Anvil is running
# 2. Deploys smart contracts (MinimalForwarder + DAOVoting)
# 3. Displays contract addresses and copies to clipboard (if available)
#
# Usage: ./deploy-contracts.sh
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

# Paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SC_DIR="$PROJECT_ROOT/sc"

##############################################################################
# Check Anvil is running
##############################################################################

log_info "=== Checking Anvil Connection ==="

if ! curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; then
    log_error "Anvil is not running on http://localhost:8545"
    log_info "Start Anvil with: anvil"
    exit 1
fi

log_success "Connected to Anvil"

echo ""

##############################################################################
# Deploy Contracts
##############################################################################

log_info "=== Deploying Smart Contracts ==="

cd "$SC_DIR"

log_info "Building contracts..."
forge build

log_info "Deploying to Anvil..."
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
DEPLOYER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
DEPLOY_OUTPUT=$(forge script script/DeployLocal.s.sol \
    --rpc-url http://localhost:8545 \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    2>&1)

echo "$DEPLOY_OUTPUT" | tail -20

# Extract addresses (handles both formats)
MINIMAL_FORWARDER=$(echo "$DEPLOY_OUTPUT" | grep "MinimalForwarder deployed at:" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)
DAO_VOTING=$(echo "$DEPLOY_OUTPUT" | grep "DAOVoting deployed at:" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)

if [ -z "$MINIMAL_FORWARDER" ] || [ -z "$DAO_VOTING" ]; then
    log_error "Failed to extract contract addresses"
    exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📋 Contract Addresses (Chain ID 31337):"
echo ""
echo -e "   MinimalForwarder:"
echo -e "   ${BLUE}$MINIMAL_FORWARDER${NC}"
echo ""
echo -e "   DAOVoting:"
echo -e "   ${BLUE}$DAO_VOTING${NC}"
echo ""
echo -e "${YELLOW}📝 Add to web/.env.local:${NC}"
echo ""
echo "NEXT_PUBLIC_DAO_VOTING_ADDRESS=$DAO_VOTING"
echo "NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=$MINIMAL_FORWARDER"
echo "NEXT_PUBLIC_RPC_URL=http://localhost:8545"
echo "NEXT_PUBLIC_CHAIN_ID=31337"
echo "NEXT_PUBLIC_NETWORK_NAME=Anvil"
echo ""

# Try to copy to clipboard
if command -v xclip &> /dev/null; then
    echo "$DAO_VOTING" | xclip -selection clipboard
    log_success "DAOVoting address copied to clipboard"
elif command -v pbcopy &> /dev/null; then
    echo "$DAO_VOTING" | pbcopy
    log_success "DAOVoting address copied to clipboard (macOS)"
fi

echo ""
log_info "Next steps:"
log_info "1. Copy the addresses above to web/.env.local"
log_info "2. Run: cd web && npm run dev"
log_info "3. Open http://localhost:3000 in your browser"
