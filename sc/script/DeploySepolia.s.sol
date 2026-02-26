// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

/**
 * @title DeploySepolia
 * @notice Sepolia testnet deployment script
 *
 * Usage: forge script script/DeploySepolia.s.sol --rpc-url https://sepolia.infura.io/v3/YOUR_KEY --broadcast
 */
contract DeploySepolia is Script {
  function run() external {
    require(msg.sender != address(0), "Signer not set");

    vm.startBroadcast();

    // Deploy MinimalForwarder
    MinimalForwarder forwarder = new MinimalForwarder();
    console.log("MinimalForwarder deployed at:", address(forwarder));

    // Deploy DAOVoting with forwarder
    DAOVoting daoVoting = new DAOVoting(address(forwarder));
    console.log("DAOVoting deployed at:", address(daoVoting));

    vm.stopBroadcast();

    // Print summary
    console.log("\n=== Deployment Summary ===");
    console.log("Network: Sepolia");
    console.log("MinimalForwarder:", address(forwarder));
    console.log("DAOVoting:", address(daoVoting));
  }
}
