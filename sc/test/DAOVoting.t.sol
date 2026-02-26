// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Fixtures.sol";

/**
 * @title DAOVotingTest
 * @notice Unit tests for DAOVoting contract
 */
contract DAOVotingTest is Fixtures {
  // ============================================================================
  // Test: Fund Management
  // ============================================================================

  function test_FundDAO() public {
    uint256 amount = 10 ether;
    fundDAO(amount);

    assertEq(daoVoting.getDAOBalance(), amount);
  }

  function test_ReceiveETH() public {
    uint256 amount = 5 ether;
    vm.deal(ANVIL_ACCOUNT_1, amount);
    vm.prank(ANVIL_ACCOUNT_1);
    (bool success, ) = address(daoVoting).call{value: amount}("");
    require(success);

    assertEq(daoVoting.getDAOBalance(), amount);
  }

  // ============================================================================
  // Test: Proposal Creation
  // ============================================================================

  function test_CreateProposal() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    assertEq(proposalId, 1);
    DAOVoting.Proposal memory proposal = daoVoting.getProposal(proposalId);
    assertEq(proposal.creator, ANVIL_ACCOUNT_1);
    assertEq(proposal.recipient, ANVIL_ACCOUNT_2);
    assertEq(proposal.amount, 1 ether);
    assertEq(proposal.deadline, deadline);
    assertFalse(proposal.executed);
  }

  function test_ProposalIDIncremental() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 id1 = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);
    uint256 id2 = createProposal(ANVIL_ACCOUNT_3, 2 ether, deadline);

    assertEq(id1, 1);
    assertEq(id2, 2);
  }

  function test_RejectZeroRecipient() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: recipient cannot be zero address");
    daoVoting.createProposal(address(0), 1 ether, deadline);
  }

  function test_RejectZeroAmount() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: amount must be greater than 0");
    daoVoting.createProposal(ANVIL_ACCOUNT_2, 0, deadline);
  }

  function test_RejectPastDeadline() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp - 1;
    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: deadline must be in future");
    daoVoting.createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);
  }

  // ============================================================================
  // Test: Voting
  // ============================================================================

  function test_VoteFor() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);

    DAOVoting.Proposal memory proposal = daoVoting.getProposal(proposalId);
    assertEq(proposal.forVotes, 1);
    assertEq(proposal.againstVotes, 0);
    assertEq(proposal.abstainVotes, 0);
  }

  function test_VoteAgainst() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.AGAINST);

    DAOVoting.Proposal memory proposal = daoVoting.getProposal(proposalId);
    assertEq(proposal.forVotes, 0);
    assertEq(proposal.againstVotes, 1);
    assertEq(proposal.abstainVotes, 0);
  }

  function test_VoteAbstain() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.ABSTAIN);

    DAOVoting.Proposal memory proposal = daoVoting.getProposal(proposalId);
    assertEq(proposal.forVotes, 0);
    assertEq(proposal.againstVotes, 0);
    assertEq(proposal.abstainVotes, 1);
  }

  function test_ChangeVoteBeforeDeadline() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    // Vote FOR
    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);
    DAOVoting.Proposal memory proposal = daoVoting.getProposal(proposalId);
    assertEq(proposal.forVotes, 1);

    // Change to AGAINST
    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.AGAINST);
    proposal = daoVoting.getProposal(proposalId);
    assertEq(proposal.forVotes, 0);
    assertEq(proposal.againstVotes, 1);
  }

  function test_RejectVoteAfterDeadline() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    // Warp past deadline
    vm.warp(deadline + 1);

    vm.prank(ANVIL_ACCOUNT_3);
    vm.expectRevert("DAOVoting: voting deadline has passed");
    daoVoting.vote(proposalId, DAOVoting.VoteType.FOR);
  }

  function test_GetUserVote() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);

    DAOVoting.VoteType vote = daoVoting.getUserVote(proposalId, ANVIL_ACCOUNT_3);
    assertEq(uint8(vote), uint8(DAOVoting.VoteType.FOR));
  }

  // ============================================================================
  // Test: Execution
  // ============================================================================

  function test_ExecuteApprovedProposal() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    // Vote FOR
    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);
    castVote(proposalId, ANVIL_ACCOUNT_4, DAOVoting.VoteType.FOR);

    // Warp past deadline + safety period
    vm.warp(deadline + 7 days + 1);

    // Execute
    uint256 balanceBefore = ANVIL_ACCOUNT_2.balance;
    vm.prank(ANVIL_ACCOUNT_1);
    bool success = daoVoting.executeProposal(proposalId);

    assertTrue(success);
    assertEq(ANVIL_ACCOUNT_2.balance, balanceBefore + 1 ether);

    DAOVoting.Proposal memory proposal = daoVoting.getProposal(proposalId);
    assertTrue(proposal.executed);
  }

  function test_RejectExecutionBeforeSafetyPeriod() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);

    // Warp past deadline but not safety period
    vm.warp(deadline + 1 days);

    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: safety period not elapsed");
    daoVoting.executeProposal(proposalId);
  }

  function test_RejectExecutionIfNotApproved() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.AGAINST);
    castVote(proposalId, ANVIL_ACCOUNT_4, DAOVoting.VoteType.AGAINST);

    // Warp past deadline + safety period
    vm.warp(deadline + 7 days + 1);

    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: proposal not approved");
    daoVoting.executeProposal(proposalId);
  }

  function test_RejectExecutionIfInsufficientFunds() public {
    fundDAO(0.5 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);

    // Warp past deadline + safety period
    vm.warp(deadline + 7 days + 1);

    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: insufficient funds");
    daoVoting.executeProposal(proposalId);
  }

  function test_RejectDoubleExecution() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);

    // Warp past deadline + safety period
    vm.warp(deadline + 7 days + 1);

    // Execute
    vm.prank(ANVIL_ACCOUNT_1);
    daoVoting.executeProposal(proposalId);

    // Try to execute again
    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: proposal already executed");
    daoVoting.executeProposal(proposalId);
  }

  function test_EqualVotesDoesNotPass() public {
    fundDAO(100 ether);

    uint256 deadline = block.timestamp + 7 days;
    uint256 proposalId = createProposal(ANVIL_ACCOUNT_2, 1 ether, deadline);

    castVote(proposalId, ANVIL_ACCOUNT_3, DAOVoting.VoteType.FOR);
    castVote(proposalId, ANVIL_ACCOUNT_4, DAOVoting.VoteType.AGAINST);

    // Warp past deadline + safety period
    vm.warp(deadline + 7 days + 1);

    vm.prank(ANVIL_ACCOUNT_1);
    vm.expectRevert("DAOVoting: proposal not approved");
    daoVoting.executeProposal(proposalId);
  }
}
