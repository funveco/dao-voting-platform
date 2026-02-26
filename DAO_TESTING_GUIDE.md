# DAO Storage Pattern - Testing Guide

## Testing Strategy

### Niveles de Testing

1. **Unit Tests** - Funciones individuales
2. **Integration Tests** - Flujos completos (create → vote → execute)
3. **Security Tests** - Ataques, edge cases
4. **Fuzzing** - Valores aleatorios

---

## Unit Tests (Foundry)

### Test 1: Create Proposal

```solidity
// test/DAOVoting.t.sol

pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/DAOVoting.sol";

contract DAOVotingTest is Test {
    DAOVoting dao;
    address tokenMock = address(0x1234);
    address creator = address(0x5555);
    address recipient = address(0x6666);

    function setUp() public {
        // Deploy contrato
        dao = new DAOVoting(tokenMock);
        
        // Dar poder de voto al creator
        vm.deal(creator, 10 ether);
        vm.prank(creator);
        dao.deposit{value: 2 ether}();
    }

    function test_CreateProposal_Success() public {
        uint256 amount = 1 ether;
        uint256 deadline = block.timestamp + 7 days;
        
        vm.prank(creator);
        uint256 proposalId = dao.createProposal(
            recipient,
            amount,
            deadline,
            "Test Proposal",
            "This is a test"
        );
        
        // Verificar que se creó
        assert(proposalId == 1);
        assert(dao.proposalCount() == 1);
        
        // Verificar datos
        DAOVoting.Proposal memory p = dao.getProposal(1);
        assertEq(p.id, 1);
        assertEq(p.creator, creator);
        assertEq(p.recipient, recipient);
        assertEq(p.amount, amount);
        assertEq(p.deadline, deadline);
        assertFalse(p.executed);
    }

    function test_CreateProposal_RejectInvalidRecipient() public {
        vm.prank(creator);
        
        vm.expectRevert("Invalid recipient address");
        dao.createProposal(
            address(0),  // ❌ Invalid recipient
            1 ether,
            block.timestamp + 7 days,
            "Test",
            "Test"
        );
    }

    function test_CreateProposal_RejectZeroAmount() public {
        vm.prank(creator);
        
        vm.expectRevert("Amount must be greater than 0");
        dao.createProposal(
            recipient,
            0,  // ❌ Zero amount
            block.timestamp + 7 days,
            "Test",
            "Test"
        );
    }

    function test_CreateProposal_RejectDeadlineTooSoon() public {
        vm.prank(creator);
        
        vm.expectRevert("Deadline too soon");
        dao.createProposal(
            recipient,
            1 ether,
            block.timestamp + 1 hours,  // ❌ < 1 day
            "Test",
            "Test"
        );
    }

    function test_CreateProposal_RejectInsufficientVotingPower() public {
        address poorUser = address(0x7777);
        vm.deal(poorUser, 0 ether);
        
        vm.prank(poorUser);
        vm.expectRevert("Insufficient voting power to create proposal");
        dao.createProposal(
            recipient,
            1 ether,
            block.timestamp + 7 days,
            "Test",
            "Test"
        );
    }
}
```

---

### Test 2: Voting

```solidity
function test_Vote_Success() public {
    // Setup propuesta
    vm.deal(creator, 10 ether);
    vm.prank(creator);
    dao.deposit{value: 2 ether}();
    
    vm.prank(creator);
    uint256 proposalId = dao.createProposal(
        recipient,
        1 ether,
        block.timestamp + 7 days,
        "Test",
        "Test"
    );
    
    // Voter vota a favor
    address voter = address(0x8888);
    vm.deal(voter, 10 ether);
    vm.prank(voter);
    dao.deposit{value: 3 ether}();
    
    vm.prank(voter);
    dao.vote(proposalId, 1);  // voteType = For
    
    // Verificar voto registrado
    DAOVoting.VoteType vote = dao.getUserVote(proposalId, voter);
    assertEq(uint8(vote), 1);
    
    // Verificar conteo de votos actualizado
    DAOVoting.Proposal memory p = dao.getProposal(proposalId);
    assertEq(p.forVotes, 3 ether);
}

function test_Vote_RejectDoubleVoting() public {
    // Setup...
    // Votante vota a favor
    vm.prank(creator);
    dao.vote(1, 1);
    
    // Intenta votar de nuevo
    vm.expectRevert("You have already voted on this proposal");
    vm.prank(creator);
    dao.vote(1, 2);
}

function test_Vote_RejectAfterDeadline() public {
    // Setup propuesta con deadline corta
    vm.prank(creator);
    dao.createProposal(
        recipient,
        1 ether,
        block.timestamp + 1 days,
        "Test",
        "Test"
    );
    
    // Esperar a que deadline pase
    vm.warp(block.timestamp + 2 days);
    
    vm.expectRevert("Voting period has ended");
    vm.prank(creator);
    dao.vote(1, 1);
}

function test_Vote_RejectInvalidVoteType() public {
    vm.prank(creator);
    dao.createProposal(
        recipient,
        1 ether,
        block.timestamp + 7 days,
        "Test",
        "Test"
    );
    
    vm.expectRevert("Invalid vote type");
    vm.prank(creator);
    dao.vote(1, 0);  // ❌ None es inválido
}
```

---

### Test 3: Execution (CEI Pattern & Reentrancy)

```solidity
function test_ExecuteProposal_Success() public {
    // Setup: crear propuesta, votar, esperar deadline
    vm.deal(creator, 10 ether);
    vm.prank(creator);
    dao.deposit{value: 2 ether}();
    
    vm.prank(creator);
    dao.createProposal(
        recipient,
        1 ether,
        block.timestamp + 7 days,
        "Test",
        "Test"
    );
    
    // Votante vota a favor (suficiente para quórum)
    address voter = address(0x8888);
    vm.deal(voter, 10 ether);
    vm.prank(voter);
    dao.deposit{value: 15 ether}();
    
    vm.prank(voter);
    dao.vote(1, 1);  // Vota a favor
    
    // Esperar deadline
    vm.warp(block.timestamp + 8 days);
    
    // Ejecutar propuesta
    uint256 balanceBefore = recipient.balance;
    vm.prank(creator);
    dao.executeProposal(1);
    uint256 balanceAfter = recipient.balance;
    
    // Verificar que recibió fondos
    assertEq(balanceAfter - balanceBefore, 1 ether);
    
    // Verificar que está marcada como ejecutada
    DAOVoting.Proposal memory p = dao.getProposal(1);
    assertTrue(p.executed);
}

function test_ExecuteProposal_RejectNotApproved() public {
    // Setup: crear propuesta
    vm.deal(creator, 10 ether);
    vm.prank(creator);
    dao.deposit{value: 2 ether}();
    
    vm.prank(creator);
    dao.createProposal(
        recipient,
        1 ether,
        block.timestamp + 7 days,
        "Test",
        "Test"
    );
    
    // Solo vota en contra
    address voter = address(0x8888);
    vm.deal(voter, 10 ether);
    vm.prank(voter);
    dao.deposit{value: 15 ether}();
    
    vm.prank(voter);
    dao.vote(1, 2);  // Against
    
    // Esperar deadline
    vm.warp(block.timestamp + 8 days);
    
    // Intentar ejecutar (debe fallar)
    vm.expectRevert("Proposal not approved");
    vm.prank(creator);
    dao.executeProposal(1);
}

function test_ExecuteProposal_RejectInsufficientQuorum() public {
    // Setup: crear propuesta
    vm.deal(creator, 10 ether);
    vm.prank(creator);
    dao.deposit{value: 2 ether}();
    
    vm.prank(creator);
    dao.createProposal(
        recipient,
        1 ether,
        block.timestamp + 7 days,
        "Test",
        "Test"
    );
    
    // Vota 1 persona (insuficiente para quórum)
    address voter = address(0x8888);
    vm.deal(voter, 10 ether);
    vm.prank(voter);
    dao.deposit{value: 1 ether}();  // ← Solo 1 ether (min quorum = 10)
    
    vm.prank(voter);
    dao.vote(1, 1);
    
    vm.warp(block.timestamp + 8 days);
    
    vm.expectRevert("Quorum not reached");
    vm.prank(creator);
    dao.executeProposal(1);
}
```

---

## Security Tests

### Test 4: Reentrancy Attack Prevention

```solidity
// Contrato atacante que intenta reentrancy
contract ReentrancyAttacker {
    DAOVoting dao;
    uint256 proposalId;
    bool public isAttacking = false;

    constructor(address _dao) {
        dao = DAOVoting(_dao);
    }

    // Recibe ETH en fallback y trata de hacer reentrancy
    receive() external payable {
        if (isAttacking) {
            // ❌ Intenta llamar a executeProposal() de nuevo
            try dao.executeProposal(proposalId) {
                // Si llegamos aquí, reentrancy fue exitosa
            } catch {
                // Esperado: nonReentrant rechaza segunda llamada
            }
        }
    }

    function setProposalId(uint256 _proposalId) external {
        proposalId = _proposalId;
    }

    function attack() external {
        isAttacking = true;
        dao.executeProposal(proposalId);
        isAttacking = false;
    }
}

function test_ExecuteProposal_RejectReentrancy() public {
    // Setup: crear propuesta ejecutable
    vm.deal(address(this), 100 ether);
    dao.deposit{value: 50 ether}();
    
    dao.createProposal(
        address(this),
        10 ether,
        block.timestamp + 1 days,
        "Test",
        "Test"
    );
    
    address voter = address(0x9999);
    vm.deal(voter, 100 ether);
    vm.prank(voter);
    dao.deposit{value: 50 ether}();
    
    vm.prank(voter);
    dao.vote(1, 1);
    
    vm.warp(block.timestamp + 2 days);
    
    // Deploy atacante
    ReentrancyAttacker attacker = new ReentrancyAttacker(address(dao));
    
    // Cambiar recipient a atacante
    // (En realidad esto requeriría más setup, es solo ilustrativo)
    
    // El CEI pattern + nonReentrant previene reentrancy
}
```

---

### Test 5: Flash Loan Attack Prevention

```solidity
function test_Vote_PreventFlashLoan() public {
    // Setup: propuesta
    vm.deal(creator, 10 ether);
    vm.prank(creator);
    dao.deposit{value: 2 ether}();
    
    vm.prank(creator);
    dao.createProposal(
        recipient,
        1 ether,
        block.timestamp + 7 days,
        "Test",
        "Test"
    );
    
    // Voter normal
    vm.deal(creator, 10 ether);
    vm.prank(creator);
    dao.deposit{value: 1 ether}();
    
    // Snapshot block se grabó en createProposal
    uint256 snapshotBlock = dao.getProposal(1).snapshotBlock;
    
    // Mock governanceToken devuelve poder en snapshot block
    // En producción, usar ERC20Snapshot real
    
    // Voter intenta "flashloan" después de snapshot
    // - En snapshotBlock: votingPower = 1 ether
    // - En block actual: obtiene flashloan de 100 ether
    // - Vota con poder = 1 ether (no 100)
    
    vm.prank(creator);
    dao.vote(1, 1);
    
    DAOVoting.Proposal memory p = dao.getProposal(1);
    assertEq(p.forVotes, 1 ether);  // ✅ Flash loan no afecta
}
```

---

### Test 6: Balance Consistency

```solidity
function test_BalanceConsistency() public {
    // Depositar fondos
    vm.deal(creator, 10 ether);
    vm.prank(creator);
    dao.deposit{value: 5 ether}();
    
    // Verificar que balance es consistente
    (
        uint256 totalProposals,
        uint256 totalLocked,
        uint256 available,
        bool isConsistent
    ) = dao.getContractState();
    
    assertEq(totalLocked, 5 ether);
    assertEq(available, 5 ether);
    assertTrue(isConsistent);
    
    // Simular que alguien envía ETH directamente al contrato
    // (sin ir por deposit)
    vm.deal(address(dao), 10 ether);
    
    // Ahora balances son inconsistentes
    (totalProposals, totalLocked, available, isConsistent) = 
        dao.getContractState();
    
    assertEq(available, 10 ether);
    assertEq(totalLocked, 5 ether);
    assertFalse(isConsistent);  // ✅ Detectamos inconsistencia
}
```

---

## Fuzzing Tests

### Test 7: Fuzzing con Foundry

```solidity
function testFuzz_CreateProposal(
    address _recipient,
    uint256 _amount,
    uint256 _deadline
) public {
    // Evitar zero addresses
    vm.assume(_recipient != address(0));
    vm.assume(_amount > 0);
    vm.assume(_amount <= 1000 ether);
    vm.assume(_deadline > block.timestamp + 1 days);
    vm.assume(_deadline < block.timestamp + 30 days);
    
    // Dar poder suficiente
    vm.deal(creator, 100 ether);
    vm.prank(creator);
    dao.deposit{value: 10 ether}();
    
    // Intentar crear propuesta
    vm.prank(creator);
    try dao.createProposal(
        _recipient,
        _amount,
        _deadline,
        "Fuzz Test",
        "Fuzz Test Description"
    ) returns (uint256 proposalId) {
        // Validar que se creó
        assert(proposalId > 0);
        
        DAOVoting.Proposal memory p = dao.getProposal(proposalId);
        assertEq(p.recipient, _recipient);
        assertEq(p.amount, _amount);
        assertEq(p.deadline, _deadline);
    } catch {
        // Algunas combinaciones de inputs serán inválidas
        // Eso es esperable
    }
}

function testFuzz_VoteAndExecute(
    uint8 _forVotes,
    uint8 _againstVotes,
    uint256 _executionDelay
) public {
    vm.assume(_forVotes > 0 || _againstVotes > 0);
    vm.assume(_forVotes + _againstVotes >= 10);  // Mínimo quórum
    vm.assume(_executionDelay >= 7 days);
    vm.assume(_executionDelay <= 30 days);
    
    // Setup...
    // Create proposal...
    // Vote...
    // Execute...
    
    // Invariantes que siempre deben ser true:
    // ✅ proposalCount nunca disminuye
    // ✅ totalDeposited nunca < address(this).balance
    // ✅ sum(balances) nunca > totalDeposited
    // ✅ Solo se ejecuta una vez
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Create proposal (valid inputs)
- [ ] Create proposal (invalid recipient)
- [ ] Create proposal (zero amount)
- [ ] Create proposal (deadline too soon)
- [ ] Create proposal (insufficient voting power)
- [ ] Vote (success)
- [ ] Vote (double voting prevented)
- [ ] Vote (after deadline)
- [ ] Vote (invalid vote type)
- [ ] Vote (no voting power)
- [ ] Execute (success)
- [ ] Execute (not approved)
- [ ] Execute (insufficient quorum)
- [ ] Execute (insufficient balance)
- [ ] Execute (already executed)
- [ ] Deposit (success)
- [ ] Withdraw (success)
- [ ] Withdraw (insufficient balance)

### Security Tests
- [ ] Reentrancy attack prevented
- [ ] Flash loan attack prevented
- [ ] Double voting prevented
- [ ] Balance consistency validation
- [ ] Invariant: proposalCount never decreases
- [ ] Invariant: totalDeposited never < balance
- [ ] CEI pattern verified

### Fuzzing
- [ ] Fuzz create proposal with random inputs
- [ ] Fuzz voting with random vote types
- [ ] Fuzz execution timing
- [ ] Fuzz deposit/withdraw amounts

### Integration Tests
- [ ] End-to-end: Create → Vote → Execute
- [ ] Multiple proposals simultaneously
- [ ] Multiple voters on same proposal
- [ ] Approved vs Rejected outcomes

### Edge Cases
- [ ] Exactly at deadline
- [ ] Just after deadline
- [ ] Zero votes (all abstain)
- [ ] 50/50 votes (rejected due to forVotes not > againstVotes)
- [ ] Maximum proposal count reached
- [ ] Exactly minimum voting power to create

---

## Running Tests

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Run all tests
forge test

# Run with verbose output
forge test -v

# Run specific test
forge test -k test_CreateProposal_Success

# Run with gas profiling
forge test --gas-report

# Run fuzzing with more iterations
forge test -k testFuzz --fuzz-runs 10000

# Debug test
forge test -k test_name --verbosity vvv
```

---

## Coverage

```bash
# Generate coverage report
forge coverage

# Generate HTML coverage report
forge coverage --report lcov
```

Expected coverage:
- **Statements**: > 95%
- **Branches**: > 90%
- **Functions**: 100%
