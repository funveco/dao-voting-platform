# DAO Storage Pattern - Quick Reference

## Mappings en Solidity

```solidity
mapping(uint256 => Proposal) public proposals;        // ID → Propuesta
mapping(uint256 => mapping(address => uint8)) votes;  // ID → (Address → Voto)
mapping(address => uint256) public balances;          // Address → Poder de voto
uint256 public proposalCount;                         // Contador secuencial
uint256 public totalDeposited;                        // Total ETH bloqueado
```

## Estados de Propuesta

```
CREADA → VOTACIÓN → APROBADA/RECHAZADA → EJECUTADA
               ↓
           deadline > block.timestamp
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uint256 | ID único (1-indexed) |
| `creator` | address | Quién creó |
| `recipient` | address | Dónde van los ETH |
| `amount` | uint256 | Cuántos ETH |
| `deadline` | uint256 | Unix timestamp para terminar votación |
| `executed` | bool | ¿Ya ejecutado? |
| `forVotes` | uint256 | Poder de voto total a favor |
| `againstVotes` | uint256 | Poder de voto en contra |
| `abstainVotes` | uint256 | Poder de voto abstenido |
| `snapshotBlock` | uint256 | Block para calcular poder de voto |

## Enums: VoteType

```solidity
enum VoteType {
  None = 0,      // Sin votar
  For = 1,       // A favor
  Against = 2,   // En contra
  Abstain = 3    // Abstenido
}
```

---

## Funciones Principales

### ✅ `createProposal(recipient, amount, deadline)`

| Validación | Código |
|-----------|--------|
| Recipient válido | `require(recipient != address(0))` |
| Monto positivo | `require(amount > 0)` |
| Balance suficiente | `require(address(this).balance >= amount)` |
| Deadline válido | `require(deadline > block.timestamp + MIN_PERIOD)` |
| Poder suficiente | `require(balances[msg.sender] >= MIN_THRESHOLD)` |

**Efecto**:
```
proposalCount++
proposals[proposalCount] = Proposal(...)
snapshotBlock = block.number  // Para seguridad de votos
```

---

### ✅ `vote(proposalId, voteType)`

| Validación | Código |
|-----------|--------|
| Propuesta existe | `require(proposalId <= proposalCount)` |
| No ha votado | `require(votes[proposalId][msg.sender] == None)` |
| Votación abierta | `require(block.timestamp <= deadline)` |
| Tiene poder | `require(balances[msg.sender] > 0)` |
| Voto válido | `require(voteType in [1,2,3])` |

**Efecto**:
```
votingPower = balanceOfAt(msg.sender, snapshotBlock)  // Seguro
votes[proposalId][msg.sender] = voteType
forVotes/againstVotes/abstainVotes += votingPower
```

---

### ✅ `canExecute(proposalId)`

```javascript
// Precondiciones TODAS deben ser true
const p = proposals[proposalId];

✅ p.id != 0                          // Existe
✅ !p.executed                        // No ejecutada
✅ block.timestamp > p.deadline       // Votación cerrada
✅ p.forVotes > p.againstVotes        // Ganó
✅ (forVotes + againstVotes + abstain) >= minQuorum  // Quórum
✅ address(this).balance >= p.amount  // Balance disponible

return all_true;
```

---

### ⚠️ `executeProposal(proposalId)` - CRÍTICO

**ORDEN CORRECTO (CEI Pattern)**:

```solidity
// 1. CHECKS - Validar estado
require(canExecute(proposalId));
Proposal storage p = proposals[proposalId];

// 2. EFFECTS - Cambiar estado (ANTES de enviar dinero)
p.executed = true;              // ← PRIMERO: marcar como ejecutado
totalDeposited -= p.amount;     // ← Actualizar contadores

// 3. INTERACTIONS - Enviar dinero (ÚLTIMO)
(bool success,) = payable(p.recipient).call{value: p.amount}("");
require(success, "Transfer failed");
```

**⚠️ ERROR CRÍTICO** (reentrancy):
```solidity
// ❌ INCORRECTO - Recipient puede hacer reentrancy
(bool success,) = payable(p.recipient).call{value: p.amount}("");
p.executed = true;  // ← Demasiado tarde
```

---

## Riesgos y Mitigaciones

### 🔴 CRÍTICOS

| Riesgo | Causa | Mitiga |
|--------|-------|--------|
| **Reentrancy** | Llamar antes de ejecutar | CEI pattern + ReentrancyGuard |
| **Double Voting** | No chequear voto previo | `require(votes[id][msg.sender] == None)` |
| **Flash Loan** | Usar balance actual | Usar `balanceOfAt(snapshotBlock)` |

### 🟠 ALTOS

| Riesgo | Causa | Mitiga |
|--------|-------|--------|
| **Balance Inconsistencia** | `totalDeposited` ≠ `address(this).balance` | Usar balance real en execute |
| **Recipient 0x0** | No validar | `require(recipient != address(0))` |
| **Fondos Insuficientes** | Verificar mal | Check justo antes de transfer |

### 🟡 MEDIOS

| Riesgo | Causa | Mitiga |
|--------|-------|--------|
| **Deadline Expirado** | No validar | `require(block.timestamp > deadline)` |
| **Votación Continua** | Deadline roto | `require(block.timestamp <= deadline)` |

---

## Ejemplo: Crear → Votar → Ejecutar

### Step 1️⃣: Frontend crea propuesta

```javascript
const recipient = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
const amount = ethers.parseEther("5");  // 5 ETH
const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

const tx = await contract.createProposal(recipient, amount, deadline);
const receipt = await tx.wait();

// Evento:
// ProposalCreated(id=1, creator=0x..., recipient=0xAb..., amount=5e18, deadline=...)
```

### Step 2️⃣: Usuarios votan (durante 7 días)

```javascript
// Usuario A vota a favor
await contract.vote(1, 1);  // voteType=For
// Event: VoteCast(proposalId=1, voter=0x..., choice=1, votingPower=150)

// Usuario B vota en contra
await contract.vote(1, 2);  // voteType=Against
// Event: VoteCast(proposalId=1, voter=0x..., choice=2, votingPower=50)

// Usuario C vota abstenido
await contract.vote(1, 3);  // voteType=Abstain
// Event: VoteCast(proposalId=1, voter=0x..., choice=3, votingPower=20)

// Estado después:
// forVotes = 150
// againstVotes = 50
// abstainVotes = 20
// totalVotes = 220
```

### Step 3️⃣: Después de deadline, alguien ejecuta

```javascript
// Día 8: deadline pasó
const canExecute = await contract.canExecute(1);
// true (porque forVotes 150 > againstVotes 50, quórum OK)

const tx = await contract.executeProposal(1);
const receipt = await tx.wait();

// Event:
// ProposalExecuted(proposalId=1, recipient=0xAb..., amount=5e18)

// Estado cambios:
// proposals[1].executed = true
// totalDeposited -= 5e18
// recipient recibe 5 ETH
```

---

## Datos que Iterar en Frontend

Después de iterar `1..proposalCount`, cada propuesta tiene:

```json
{
  "id": "1",
  "creator": "0x1234...",
  "recipient": "0xabcd...",
  "amount": "5.0",
  "amountWei": "5000000000000000000",
  "deadline": "2024-12-31T23:59:59Z",
  "executed": false,
  "forVotes": "150.0",
  "againstVotes": "50.0", 
  "abstainVotes": "20.0",
  "totalVotes": "220.0",
  "status": "voting",
  "approvalsPercentage": 68,
  "quorumReached": true,
  "snapshotBlock": "1000000"
}
```

**Cálculos en Frontend**:
```javascript
const totalVotes = forVotes + againstVotes + abstainVotes;
const approvalsPercent = (forVotes / totalVotes) * 100;
const quorumOK = totalVotes >= minimumQuorum;
const passed = forVotes > againstVotes;

// Determinar status
let status = "voting";
if (executed) status = "executed";
else if (block.timestamp > deadline) {
  status = passed && quorumOK ? "approved" : "rejected";
}
```

---

## Security Checklist

- [ ] Reentrancy: CEI pattern en `executeProposal`
- [ ] Double Voting: Validar `votes[id][msg.sender] == None`
- [ ] Flash Loans: Usar `balanceOfAt(snapshotBlock)`
- [ ] Balance: Chequear `address(this).balance` en execute
- [ ] Inputs: Validar recipient != 0x0, amount > 0, deadline futuro
- [ ] Límites: Max proposals, voting period bounds
- [ ] Eventos: Todos los cambios importantes emiten eventos
- [ ] Tests: Unit tests + fuzzing + reentrancy attack simulation

---

## Archivos Clave

- **Contrato**: `sc/src/DAOVoting.sol`
- **Frontend Service**: `web/src/lib/contracts/ProposalService.ts`
- **Types**: `web/src/lib/contracts/types.ts`
- **ABI**: `web/src/lib/contracts/abis.ts`
- **Persistencia**: `web/src/lib/storage/proposalCache.ts`

---

## Referencias

- [DAO_STORAGE_PATTERN.md](./DAO_STORAGE_PATTERN.md) - Análisis completo
- [OpenZeppelin ReentrancyGuard](https://docs.openzeppelin.com/contracts/5.x/api/security#ReentrancyGuard)
- [ERC20Snapshot](https://docs.openzeppelin.com/contracts/5.x/erc20#ERC20Snapshot)
- [ethers.js Contracts](https://docs.ethers.org/v6/api/contract/)
