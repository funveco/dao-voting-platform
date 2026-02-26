#!/bin/bash

##############################################################################
# Anvil Test Accounts - Display all pre-funded accounts
#
# Use these to import into MetaMask for testing
# Each account has 10,000 ETH by default
#
# Usage: ./anvil-accounts.sh
##############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "🔑 Anvil Pre-funded Test Accounts (10,000 ETH each)"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "Network: Anvil (localhost:8545)"
echo "Chain ID: 31337"
echo "Network Name in MetaMask: Anvil"
echo ""
echo "———————————————————————————————————————————————————————————————————————————"
echo ""

accounts=(
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266|0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d6c1f02960247c3bc058|Deployer (Account #0)"
  "0x70997970C51812e339D9B73B00EF75B5E667F48E|0x47e1712a7d0481fc63f1563b21e40350e6ea11db1766e6b4a591b71b4287a44a|Voter #1 (Account #1)"
  "0x3C44CdDdB6a900c6C6663891F68631f7ce391D3B|0xc526ee95bf44d8fc405a158bb884d9d1eb19dbbbbdc8b50910cda1f1fd334614|Voter #2 (Account #2)"
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906|0x8166f546bab6da521a8369cba6731fd945d294e1428cb233c612edb56da57130|Voter #3 (Account #3)"
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65|0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e|Account #4"
  "0x1CBd3b2770909D4e10f157cAEC9C7cb3b5f67F81|0x309dff3de61b67d1df5aaed429987ddbf3151b4c844ee114b763763bf4ee6604|Account #5"
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f|0x02d6725f2260a3138877d1e1fff180760d2136df366ee6cb01b0b072dd715b65|Account #6"
  "0xa0Ee7A142d267C1f36714E4a8F75759E8Cdf3d51|0x1885d3b69ce9eed202970b4dd764467d83c3f4433e99acb3cb3ad76e07d00575|Account #7"
  "0xBcd4042DE499d14e55001CcbB24a551F3b954096|0xdfc0d8d64f7c1dd1b6f26a6f6e0b0c52efcfe1e6e8c9f47a5d6c5b4a39f8e7d6|Account #8"
  "0x71bE63f3384f5fb98991E1da0113b8d4aebb3713|0xe0d4aac3276c0fb0640d1d4aeb50716e5be94185364d525360cbb7e57d6f2c83|Account #9"
)

count=0
for account in "${accounts[@]}"; do
  IFS='|' read -r address privkey description <<< "$account"
  
  echo "📌 $description"
  echo ""
  echo "   Address:     $address"
  echo "   Private Key: $privkey"
  echo "   Balance:     10,000 ETH"
  echo ""
  
  ((count++))
done

echo "———————————————————————————————————————————————————————————————————————————"
echo ""
echo "📋 HOW TO IMPORT INTO METAMASK:"
echo ""
echo "1. Open MetaMask → Account icon (top-right)"
echo "2. Click 'Import Account'"
echo "3. Paste one of the Private Keys above"
echo "4. Click 'Import'"
echo "5. Repeat for more accounts"
echo ""
echo "———————————————————————————————————————————————————————————————————————————"
echo ""
echo "⚡ QUICK TEST SCENARIO:"
echo ""
echo "1. Import Account #0 (Deployer) - creates proposals"
echo "2. Import Account #1 (Voter #1) - votes FOR"
echo "3. Import Account #2 (Voter #2) - votes AGAINST"
echo ""
echo "Then in the app:"
echo "  • Account #0: Fund DAO with 5 ETH"
echo "  • Account #0: Create proposal"
echo "  • Account #1: Vote FOR"
echo "  • Account #2: Vote AGAINST"
echo "  • Check vote counts on Proposals page"
echo ""
echo "———————————————————————————————————————————————————————————————————————————"
echo ""
echo "💡 TIP: Skip 7 days with:"
echo ""
echo "  cast rpc anvil_increaseTime 604800 --rpc-url http://localhost:8545"
echo "  cast rpc anvil_mine 1 --rpc-url http://localhost:8545"
echo ""
echo "Then execute the proposal!"
echo ""
echo "———————————————————————————————————————————————————————————————————————————"
echo ""
echo "📚 For more details, see: METAMASK_SETUP.md"
echo ""
