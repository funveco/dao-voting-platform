#!/bin/bash

##############################################################################
# DAO Voting Platform - Start Anvil Only
# 
# Simple script to start Anvil with proper configuration
# Run this in Terminal 1, then run deploy-contracts.sh in Terminal 2
#
# Usage: ./start-anvil.sh
##############################################################################

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}DAO Voting Platform - Anvil Startup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if Anvil is already running
if curl -s http://localhost:8545 -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1; then
    echo "⚠️  Anvil is already running on http://localhost:8545"
    echo ""
    echo "If you want to restart:"
    echo "  pkill anvil"
    echo "  ./start-anvil.sh"
    exit 1
fi

echo "Starting Anvil..."
echo ""
echo "Network Configuration:"
echo "  Host: 127.0.0.1"
echo "  Port: 8545"
echo "  Chain ID: 31337"
echo "  RPC URL: http://localhost:8545"
echo ""
echo "Test Account (pre-funded with 10,000 ETH):"
echo "  Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "  Key:     0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058"
echo ""
echo "⏳ Starting Anvil..."
echo ""

anvil --host 0.0.0.0 --port 8545
