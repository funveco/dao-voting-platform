#!/bin/bash

##############################################################################
# DAO Voting Platform - Full Deployment Script
# 
# This script:
# 1. Starts Anvil local blockchain
# 2. Deploys smart contracts (MinimalForwarder + DAOVoting)
# 3. Verifies/Updates .env.local with contract addresses
# 4. Starts the Next.js frontend dev server
#
# Requirements:
# - Foundry (forge, anvil)
# - Node.js + npm
# - pnpm (optional, for web)
#
# Usage: ./deploy-full.sh
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SC_DIR="$PROJECT_ROOT/sc"
WEB_DIR="$PROJECT_ROOT/web"
ENV_LOCAL="$WEB_DIR/.env.local"
ANVIL_PID_FILE="/tmp/anvil.pid"

##############################################################################
# Helper functions
##############################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

cleanup() {
    log_warning "Cleaning up..."
    if [ -f "$ANVIL_PID_FILE" ]; then
        PID=$(cat "$ANVIL_PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log_info "Stopping Anvil (PID: $PID)..."
            kill $PID 2>/dev/null || true
            sleep 1
        fi
        rm -f "$ANVIL_PID_FILE"
    fi
}

# Trap errors and cleanup
trap cleanup EXIT INT TERM

##############################################################################
# 1. Check Prerequisites
##############################################################################

log_info "=== Checking Prerequisites ==="

# Check Foundry
if ! command -v forge &> /dev/null; then
    log_error "Foundry not found. Install from: https://book.getfoundry.sh/"
    exit 1
fi
log_success "Foundry installed"

# Check Anvil
if ! command -v anvil &> /dev/null; then
    log_error "Anvil not found. Install Foundry first."
    exit 1
fi
log_success "Anvil installed"

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Install from: https://nodejs.org"
    exit 1
fi
log_success "Node.js installed ($(node --version))"

echo ""

##############################################################################
# 2. Start Anvil
##############################################################################

log_info "=== Starting Anvil (Local Blockchain) ==="

# Kill any existing anvil process
pkill anvil 2>/dev/null || true
sleep 1

# Start Anvil in background
anvil --host 0.0.0.0 --port 8545 > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!
echo $ANVIL_PID > "$ANVIL_PID_FILE"

log_success "Anvil started (PID: $ANVIL_PID)"
log_info "RPC URL: http://localhost:8545"
log_info "Chain ID: 31337"

# Wait for Anvil to be ready
log_info "Waiting for Anvil to be ready..."
sleep 3

# Check if Anvil is responding
for i in {1..10}; do
    if curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; then
        log_success "Anvil is ready"
        break
    fi
    if [ $i -eq 10 ]; then
        log_error "Anvil failed to start. Check /tmp/anvil.log"
        exit 1
    fi
    log_info "Waiting... ($i/10)"
    sleep 1
done

echo ""

##############################################################################
# 3. Deploy Smart Contracts
##############################################################################

log_info "=== Deploying Smart Contracts ==="

cd "$SC_DIR"

log_info "Compiling contracts..."
forge build

log_info "Deploying to Anvil..."
# Use first Anvil test account with pre-funded balance
# Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10,000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058
DEPLOYER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Run deploy script (forge always exits 1 even on success, so capture output)
DEPLOY_OUTPUT=$(forge script script/DeployLocal.s.sol \
    --rpc-url http://localhost:8545 \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    2>&1 || true)

# Check if deployment succeeded by looking for success message
if ! echo "$DEPLOY_OUTPUT" | grep -q "Script ran successfully"; then
    log_error "Deployment failed!"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "$DEPLOY_OUTPUT"

# Extract contract addresses from output (handles both formats)
MINIMAL_FORWARDER=$(echo "$DEPLOY_OUTPUT" | grep "MinimalForwarder deployed at:" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)
DAO_VOTING=$(echo "$DEPLOY_OUTPUT" | grep "DAOVoting deployed at:" | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)

if [ -z "$MINIMAL_FORWARDER" ] || [ -z "$DAO_VOTING" ]; then
    log_error "Failed to extract contract addresses from deployment output"
    exit 1
fi

log_success "MinimalForwarder: $MINIMAL_FORWARDER"
log_success "DAOVoting: $DAO_VOTING"

echo ""

##############################################################################
# 4. Verify/Update .env.local
##############################################################################

log_info "=== Verifying/Updating .env.local ==="

if [ ! -f "$ENV_LOCAL" ]; then
    log_warning ".env.local not found. Creating..."
    cat > "$ENV_LOCAL" << EOF
# Auto-generated by deploy-full.sh
NEXT_PUBLIC_DAO_VOTING_ADDRESS=$DAO_VOTING
NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=$MINIMAL_FORWARDER
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=Anvil
EOF
    log_success ".env.local created"
else
    # Check if addresses match
    EXISTING_DAO=$(grep "NEXT_PUBLIC_DAO_VOTING_ADDRESS" "$ENV_LOCAL" 2>/dev/null | cut -d'=' -f2 || echo "")
    EXISTING_FORWARDER=$(grep "NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS" "$ENV_LOCAL" 2>/dev/null | cut -d'=' -f2 || echo "")
    
    if [ "$EXISTING_DAO" != "$DAO_VOTING" ] || [ "$EXISTING_FORWARDER" != "$MINIMAL_FORWARDER" ]; then
        log_warning "Contract addresses in .env.local don't match deployment"
        log_info "Updating .env.local..."
        
        # Use sed to update addresses (portable)
        if grep -q "NEXT_PUBLIC_DAO_VOTING_ADDRESS" "$ENV_LOCAL"; then
            sed -i.bak "s|NEXT_PUBLIC_DAO_VOTING_ADDRESS=.*|NEXT_PUBLIC_DAO_VOTING_ADDRESS=$DAO_VOTING|" "$ENV_LOCAL"
        else
            echo "NEXT_PUBLIC_DAO_VOTING_ADDRESS=$DAO_VOTING" >> "$ENV_LOCAL"
        fi
        
        if grep -q "NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS" "$ENV_LOCAL"; then
            sed -i.bak "s|NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=.*|NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=$MINIMAL_FORWARDER|" "$ENV_LOCAL"
        else
            echo "NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS=$MINIMAL_FORWARDER" >> "$ENV_LOCAL"
        fi
        
        # Ensure RPC and Chain ID are set
        if ! grep -q "NEXT_PUBLIC_RPC_URL" "$ENV_LOCAL"; then
            echo "NEXT_PUBLIC_RPC_URL=http://localhost:8545" >> "$ENV_LOCAL"
        fi
        
        if ! grep -q "NEXT_PUBLIC_CHAIN_ID" "$ENV_LOCAL"; then
            echo "NEXT_PUBLIC_CHAIN_ID=31337" >> "$ENV_LOCAL"
        fi
        
        rm -f "$ENV_LOCAL.bak"
        log_success ".env.local updated"
    else
        log_success "Contract addresses in .env.local match deployment ✓"
    fi
fi

echo ""

##############################################################################
# 5. Start Frontend Dev Server
##############################################################################

log_info "=== Starting Frontend Dev Server ==="

cd "$WEB_DIR"

log_info "Installing dependencies (if needed)..."
if [ ! -d "node_modules" ]; then
    npm install
else
    log_success "Dependencies already installed"
fi

log_success "Starting Next.js dev server..."
log_info "Frontend will be available at: http://localhost:3000"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DAO Voting Platform is Ready!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📋 Contract Addresses:"
echo -e "   MinimalForwarder: ${BLUE}$MINIMAL_FORWARDER${NC}"
echo -e "   DAOVoting:        ${BLUE}$DAO_VOTING${NC}"
echo ""
echo -e "🌐 Endpoints:"
echo -e "   Anvil RPC:  ${BLUE}http://localhost:8545${NC}"
echo -e "   Frontend:   ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "📝 Test Account (pre-funded):"
echo -e "   Address: ${BLUE}0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266${NC}"
echo -e "   Balance: 10000 ETH"
echo ""
echo -e "💡 Tips:"
echo -e "   • Open http://localhost:3000 in your browser"
echo -e "   • Connect MetaMask to Anvil (Chain ID: 31337)"
echo -e "   • Use test account above to test voting"
echo -e "   • Check http://localhost:8545 for RPC health"
echo ""

# Start Next.js dev server (foreground)
npm run dev
