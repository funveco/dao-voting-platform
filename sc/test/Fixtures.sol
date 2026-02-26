// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MinimalForwarder.sol";
import "../src/DAOVoting.sol";

/**
 * @title Fixtures
 * @notice Test helpers and setup for contract testing
 */
contract Fixtures is Test {
  // ============================================================================
  // Constants
  // ============================================================================

  address constant ANVIL_ACCOUNT_1 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  address constant ANVIL_ACCOUNT_2 = 0x70997970c51812E339d9b73B0245AD59e1Ff0Ad5;
  address constant ANVIL_ACCOUNT_3 = 0x3c44cDDdB6A900c2d0E6638CaeAd620a45f8Dc93;
  address constant ANVIL_ACCOUNT_4 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

  uint256 constant ANVIL_KEY_1 = 0xac0974bec39a17e36ba830a6e6736055b2540c5f6fa7d5d073d9d23ac6580ab1;
  uint256 constant ANVIL_KEY_2 = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
  uint256 constant ANVIL_KEY_3 = 0x5de4111afa1a4b94908f83103db8a50ba6908e8efdb9737f46552271411904f0;
  uint256 constant ANVIL_KEY_4 = 0x7c852118294e51e653712a81e05800d3cdc3a545ae24b36c8c08cb8be6d4fece;

  // ============================================================================
  // Test Contracts
  // ============================================================================

  MinimalForwarder public forwarder;
  DAOVoting public daoVoting;

  // ============================================================================
  // Setup Functions
  // ============================================================================

  /**
   * @notice Deploy contracts for testing
   */
  function setUp() public virtual {
    // Deploy MinimalForwarder
    forwarder = new MinimalForwarder();

    // Deploy DAOVoting with forwarder
    daoVoting = new DAOVoting(address(forwarder));
  }

  /**
   * @notice Fund DAO with ETH
   */
  function fundDAO(uint256 amount) public {
    vm.deal(ANVIL_ACCOUNT_1, amount);
    vm.prank(ANVIL_ACCOUNT_1);
    daoVoting.fundDAO{value: amount}();
  }

  /**
   * @notice Create a proposal
   */
  function createProposal(
    address recipient,
    uint256 amount,
    uint256 deadline
  ) public returns (uint256) {
    vm.prank(ANVIL_ACCOUNT_1);
    return daoVoting.createProposal(recipient, amount, deadline);
  }

  /**
   * @notice Cast a vote
   */
  function castVote(
    uint256 proposalId,
    address voter,
    DAOVoting.VoteType voteType
  ) public {
    vm.prank(voter);
    daoVoting.vote(proposalId, voteType);
  }

  /**
   * @notice Warp time forward
   */
  function warpTime(uint256 seconds_) public {
    vm.warp(block.timestamp + seconds_);
  }

  /**
   * @notice Get current block timestamp
   */
  function now_() public view returns (uint256) {
    return block.timestamp;
  }
}
