// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

/**
 * @title DeployLocal
 * @notice Local Anvil deployment script
 *
 * Usage: forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
 */
contract DeployLocal is Script {
  function run() external {
    // Start broadcast - will use msg.sender or provided private key via CLI
    vm.startBroadcast();

    // Deploy MinimalForwarder
    MinimalForwarder forwarder = new MinimalForwarder();
    console.log("MinimalForwarder deployed at:", address(forwarder));

    // Deploy DAOVoting with forwarder
    DAOVoting daoVoting = new DAOVoting(address(forwarder));
    console.log("DAOVoting deployed at:", address(daoVoting));

    vm.stopBroadcast();
  }
}
