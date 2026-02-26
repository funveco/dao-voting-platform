# Patrón de Almacenamiento de Propuestas en DAO - Análisis Completo

## Resumen Ejecutivo

El patrón utiliza **mappings en estado** para rastrear propuestas, votos y balances, con IDs secuenciales generados por un contador (`proposalCount`). Es eficiente pero requiere validaciones estrictas para evitar reentrancy, inconsistencias de balance y manipulación de votos.

---

## 1. Funciones Principales y Lógica de Estado

### 1.1 `createProposal(recipient, amount, deadline)`

**Propósito**: Crear una nueva propuesta de transferencia de fondos.

**Precondiciones**:
- El llamador debe tener suficiente voting power (basado en `balances[msg.sender]`)
- `amount > 0` y `amount <= address(this).balance`
- `deadline > block.timestamp`
- El contrato debe tener suficientes fondos

**Cambios de estado**:
```
proposalCount += 1
proposals[proposalCount] = Proposal {
  id: proposalCount,
  creator: msg.sender,
  recipient: recipient,
  amount: amount,
  deadline: deadline,
  executed: false,
  forVotes: 0,
  againstVotes: 0,
  abstainVotes: 0,
  snapshotBlock: block.number  // para determinar voting power
}
```

**Efectos secundarios**:
- Emite evento `ProposalCreated(id, creator, recipient, amount, deadline)`
- No cambia balances

**Riesgos principales**:
- ✅ Validar que `recipient != address(0)`
- ✅ Validar que `deadline > block.timestamp + minVotingPeriod`
- ✅ Validar voting power del creador
- ⚠️ **RIESGO**: Si `amount > address(this).balance`, el execute fallará

---

### 1.2 `vote(proposalId, voteType)`

**Propósito**: Registrar voto sobre una propuesta.

**Precondiciones**:
- Propuesta debe existir (`proposalId <= proposalCount`)
- Propuesta no debe haber expirado (`block.timestamp <= deadline`)
- El votante no debe haber votado antes (`votes[proposalId][msg.sender] == VoteType.None`)
- El votante debe tener voting power > 0

**Cambios de estado**:
```
votingPower = balances[msg.sender]  // o balanceOfAt(snapshotBlock)

if voteType == For:
  proposals[proposalId].forVotes += votingPower
else if voteType == Against:
  proposals[proposalId].againstVotes += votingPower
else if voteType == Abstain:
  proposals[proposalId].abstainVotes += votingPower

votes[proposalId][msg.sender] = voteType
```

**Efectos secundarios**:
- Emite `VoteCast(proposalId, voter, voteType, votingPower)`
- No cambia balances

**Riesgos principales**:
- ⚠️ **RIESGO**: Double-voting si no se valida `votes[proposalId][msg.sender]` antes
- ✅ Usar snapshot block para evitar "voting power flashloans"
- ✅ Validar `votingPower > 0`

---

### 1.3 `canExecute(proposalId)`

**Propósito**: Determinar si una propuesta puede ejecutarse.

**Lógica**:
```
Proposal memory p = proposals[proposalId];

require(p.id != 0, "Proposal doesn't exist");
require(p.executed == false, "Already executed");
require(block.timestamp > p.deadline, "Voting not finished");

// Condiciones de aprobación
bool quorumReached = (p.forVotes + p.againstVotes + p.abstainVotes) >= minimumQuorum;
bool approvalsPass = p.forVotes > p.againstVotes;  // simple majority

require(quorumReached && approvalsPass, "Proposal not approved");
require(address(this).balance >= p.amount, "Insufficient contract balance");

return true;
```

**Riesgos principales**:
- ⚠️ **RIESGO CRÍTICO**: `address(this).balance` puede cambiar entre `canExecute()` y `executeProposal()`
- ✅ Usar `require()` en executeProposal, no confiar en `canExecute()` histórico

---

### 1.4 `executeProposal(proposalId)`

**Propósito**: Ejecutar una propuesta aprobada (transferir fondos).

**Precondiciones**:
- `canExecute(proposalId)` debe devolver true
- El contrato debe tener fondos suficientes
- No debe haber reentrancy activa

**Cambios de estado**:
```
Proposal storage p = proposals[proposalId];

require(canExecute(proposalId), "Cannot execute");

p.executed = true;

// TRANSFER (vulnerable a reentrancy si recipient es contrato)
(bool success, ) = payable(p.recipient).call{value: p.amount}("");
require(success, "Transfer failed");

totalDeposited -= p.amount;  // Actualizar contador
```

**Efectos secundarios**:
- ✅ Marca propuesta como `executed`
- ✅ Reduce `totalDeposited`
- ✅ Emite `ProposalExecuted(proposalId, p.recipient, p.amount)`

**Riesgos principales**:
- ⚠️ **RIESGO CRÍTICO - REENTRANCY**: Si `p.recipient` es un contrato, puede hacer llamadas de vuelta
  - **MITIGA**: Usar el patrón **Checks-Effects-Interactions**:
    1. ✅ Validar `canExecute()` (Checks)
    2. ✅ Marcar como `executed = true` ANTES de transfer (Effects)
    3. ✅ Hacer el transfer último (Interactions)
  - **MITIGA ALTERNATIVA**: Usar `ReentrancyGuard` de OpenZeppelin
- ⚠️ **RIESGO**: Balance inconsistente con `totalDeposited` si hay fondos externos
- ✅ Usar `call` en lugar de `transfer` (más seguro en Solidity moderno)

---

## 2. Riesgos y Checks de Seguridad

### 2.1 Matriz de Riesgos

| Riesgo | Función Afectada | Severidad | Mitigación |
|--------|-------------------|-----------|-----------|
| **Reentrancy** | `executeProposal` | 🔴 CRÍTICA | CEI pattern, ReentrancyGuard |
| **Double Voting** | `vote` | 🔴 CRÍTICA | Check `votes[id][msg.sender] == None` antes de votar |
| **Balance Inconsistency** | `executeProposal` | 🟠 ALTA | Validar balance real en execute, no confiar en `totalDeposited` |
| **Flash Loan Attack** | `vote` | 🟠 ALTA | Usar snapshot block para voting power |
| **Invalid Recipient** | `createProposal` | 🟡 MEDIA | Validar `recipient != address(0)` |
| **Insufficient Funds** | `executeProposal` | 🟡 MEDIA | Check `address(this).balance >= amount` justo antes de transfer |
| **Expired Proposal Execution** | `executeProposal` | 🟡 MEDIA | Validar `block.timestamp > deadline` |
| **Voting After Deadline** | `vote` | 🟡 MEDIA | Check `block.timestamp <= deadline` |

### 2.2 Checklist de Validación

#### En `createProposal`:
```solidity
✅ require(recipient != address(0), "Invalid recipient");
✅ require(amount > 0, "Amount must be > 0");
✅ require(deadline > block.timestamp + MIN_VOTING_PERIOD, "Deadline too soon");
✅ require(balances[msg.sender] >= MIN_PROPOSAL_POWER, "Insufficient power");
✅ require(proposalId + 1 <= MAX_PROPOSALS, "Too many proposals");
```

#### En `vote`:
```solidity
✅ require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
✅ require(block.timestamp <= proposals[proposalId].deadline, "Voting closed");
✅ require(votes[proposalId][msg.sender] == VoteType.None, "Already voted");
✅ require(balances[msg.sender] > 0, "No voting power");
✅ require(voteType != VoteType.None, "Invalid vote type");
```

#### En `executeProposal`:
```solidity
✅ require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
✅ Proposal storage p = proposals[proposalId];
✅ require(!p.executed, "Already executed");
✅ require(block.timestamp > p.deadline, "Voting not finished");
✅ require(p.forVotes > p.againstVotes, "Not approved");
✅ require(address(this).balance >= p.amount, "Insufficient balance");

// CEI Pattern:
✅ p.executed = true;  // Effects ANTES de interactions
✅ totalDeposited -= p.amount;
⚠️ (bool success,) = payable(p.recipient).call{value: p.amount}("");
✅ require(success, "Transfer failed");
```

### 2.3 Sincronía `address(this).balance` vs `totalDeposited`

**Problema**:
```solidity
// Escenario problemático:
totalDeposited = 100 ETH
address(this).balance = 50 ETH  // Alguien envió solo 50 ETH, o sacaron fondos

// Si intentas ejecutar propuesta de 60 ETH:
require(address(this).balance >= amount)  // Falla con razón ✅
// Pero totalDeposited sigue siendo 100 ETH ✅ (no es un riesgo crítico)
```

**Soluciones**:
1. **Mejor**: Usar `address(this).balance` como fuente de verdad (no `totalDeposited`)
2. **Validar en execute**: Siempre chequear balance real justo antes del transfer
3. **Remover `totalDeposited`** si no lo necesitas para lógica crítica

---

## 3. Ejemplos con ethers.js

### 3.1 Setup Básico

```javascript
import { ethers } from "ethers";

// Provider (read-only)
const provider = new ethers.JsonRpcProvider("http://localhost:8545");

// Signer (para escribir transacciones)
const signer = provider.getSigner(0);

// Contract ABI (simplificado)
const CONTRACT_ABI = [
  "function proposalCount() public view returns (uint256)",
  "function proposals(uint256) public view returns (tuple(uint256 id, address creator, address recipient, uint256 amount, uint256 deadline, bool executed, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 snapshotBlock))",
  "function votes(uint256, address) public view returns (uint8)",
  "function balances(address) public view returns (uint256)",
  "function canExecute(uint256) public view returns (bool)",
  "function createProposal(address recipient, uint256 amount, uint256 deadline) public returns (uint256)",
  "function vote(uint256 proposalId, uint8 voteType) public",
  "function executeProposal(uint256 proposalId) public",
  "event ProposalCreated(uint256 indexed proposalId, address indexed creator, address recipient, uint256 amount, uint256 deadline)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 choice, uint256 votingPower)",
  "event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount)"
];

const CONTRACT_ADDRESS = "0x...";
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
```

### 3.2 `proposalCount()`

```javascript
// Obtener número total de propuestas
async function getProposalCount() {
  const count = await contract.proposalCount();
  console.log(`Total proposals: ${count}`);
  return count;
}
```

**Output esperado**:
```
Total proposals: 3
```

---

### 3.3 `getProposal(id)` / `proposals(id)`

```javascript
// Obtener datos de una propuesta específica
async function getProposal(proposalId) {
  const proposal = await contract.proposals(proposalId);
  
  console.log({
    id: proposal.id.toString(),
    creator: proposal.creator,
    recipient: proposal.recipient,
    amount: ethers.formatEther(proposal.amount) + " ETH",
    deadline: new Date(Number(proposal.deadline) * 1000).toISOString(),
    executed: proposal.executed,
    forVotes: ethers.formatEther(proposal.forVotes),
    againstVotes: ethers.formatEther(proposal.againstVotes),
    abstainVotes: ethers.formatEther(proposal.abstainVotes),
    snapshotBlock: proposal.snapshotBlock.toString()
  });
  
  return proposal;
}
```

**Output esperado**:
```json
{
  "id": "1",
  "creator": "0x1234567890123456789012345678901234567890",
  "recipient": "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
  "amount": "5.0 ETH",
  "deadline": "2024-12-31T23:59:59.000Z",
  "executed": false,
  "forVotes": "150",
  "againstVotes": "25",
  "abstainVotes": "10",
  "snapshotBlock": "1000000"
}
```

---

### 3.4 `getUserVote(proposalId, address)` / `votes(proposalId, address)`

```javascript
// Obtener voto de un usuario en una propuesta
async function getUserVote(proposalId, address) {
  const voteType = await contract.votes(proposalId, address);
  
  const voteMap = {
    0: "None",
    1: "For",
    2: "Against",
    3: "Abstain"
  };
  
  console.log(`${address} voted: ${voteMap[voteType]}`);
  return voteType;
}
```

**Output esperado**:
```
0x1234567890... voted: For
```

---

### 3.5 `createProposal(recipient, amount, deadline)`

```javascript
// Crear una nueva propuesta
async function createProposalExample() {
  const recipient = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
  const amountInWei = ethers.parseEther("5"); // 5 ETH
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // +7 días
  
  try {
    console.log("📤 Creating proposal...");
    const tx = await contract.createProposal(
      recipient,
      amountInWei,
      deadline
    );
    
    console.log(`✅ Transaction sent: ${tx.hash}`);
    
    // Esperar confirmación
    const receipt = await tx.wait(1);
    console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
    
    // Parsear evento para obtener proposalId
    const event = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(event => event?.name === "ProposalCreated");
    
    const proposalId = event?.args?.proposalId;
    console.log(`✅ Proposal created with ID: ${proposalId}`);
    
    return proposalId;
  } catch (error) {
    console.error("❌ Error creating proposal:", error.message);
    throw error;
  }
}
```

**Output esperado**:
```
📤 Creating proposal...
✅ Transaction sent: 0xabc123...
✅ Confirmed in block 1234567
✅ Proposal created with ID: 1
```

---

### 3.6 `vote(proposalId, voteType)`

```javascript
// Votar sobre una propuesta
async function voteOnProposal(proposalId, voteType) {
  // VoteType: 0=None, 1=For, 2=Against, 3=Abstain
  const voteNames = ["None", "For", "Against", "Abstain"];
  
  try {
    console.log(`📤 Voting ${voteNames[voteType]} on proposal ${proposalId}...`);
    const tx = await contract.vote(proposalId, voteType);
    
    console.log(`✅ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait(1);
    console.log(`✅ Vote confirmed in block ${receipt.blockNumber}`);
    
    return receipt;
  } catch (error) {
    console.error(`❌ Error voting:`, error.message);
    if (error.reason === "Already voted") {
      console.error("   You already voted on this proposal");
    }
    throw error;
  }
}

// Uso:
await voteOnProposal(1, 1);  // Votar "For" en propuesta 1
```

---

### 3.7 `executeProposal(proposalId)`

```javascript
// Ejecutar una propuesta aprobada
async function executeProposalExample(proposalId) {
  try {
    // 1. Verificar que puede ejecutarse
    const canExecute = await contract.canExecute(proposalId);
    if (!canExecute) {
      throw new Error("Proposal cannot be executed (not approved or voting ongoing)");
    }
    
    // 2. Ejecutar
    console.log(`📤 Executing proposal ${proposalId}...`);
    const tx = await contract.executeProposal(proposalId);
    
    console.log(`✅ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait(1);
    console.log(`✅ Proposal executed in block ${receipt.blockNumber}`);
    
    // 3. Verificar evento
    const event = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(event => event?.name === "ProposalExecuted");
    
    if (event) {
      console.log(`✅ ${ethers.formatEther(event.args.amount)} ETH transferred to ${event.args.recipient}`);
    }
    
    return receipt;
  } catch (error) {
    console.error(`❌ Error executing proposal:`, error.message);
    throw error;
  }
}

// Uso:
await executeProposalExample(1);
```

---

## 4. Ejemplo de Frontend: Iterar y Construir Lista de Propuestas

### 4.1 Hook React `useDAOProposals`

```javascript
// web/src/hooks/useDAOProposals.ts

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export interface ProposalData {
  id: string;
  creator: string;
  recipient: string;
  amount: string; // en ETH
  amountWei: string; // en Wei
  deadline: string; // ISO date
  deadlineTimestamp: number;
  executed: boolean;
  forVotes: string; // voting power
  againstVotes: string;
  abstainVotes: string;
  totalVotes: string;
  status: "voting" | "approved" | "rejected" | "executed" | "expired";
  approvalsPercentage: number;
  quorumReached: boolean;
}

export function useDAOProposals(contractAddress: string, minQuorum: number = 100) {
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.REACT_APP_RPC_URL || "http://localhost:8545"
      );

      const ABI = [
        "function proposalCount() public view returns (uint256)",
        "function proposals(uint256) public view returns (tuple(uint256 id, address creator, address recipient, uint256 amount, uint256 deadline, bool executed, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 snapshotBlock))"
      ];

      const contract = new ethers.Contract(contractAddress, ABI, provider);

      // 1. Obtener cantidad de propuestas
      const count = await contract.proposalCount();
      const proposalCount = Number(count);

      console.log(`📊 Fetching ${proposalCount} proposals...`);

      // 2. Iterar desde 1 a proposalCount
      const proposalsList: ProposalData[] = [];

      for (let i = 1; i <= proposalCount; i++) {
        try {
          const p = await contract.proposals(i);
          const now = Math.floor(Date.now() / 1000);
          const deadlineNum = Number(p.deadline);
          
          // Calcular votos totales
          const totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
          const totalNum = Number(totalVotes);
          
          // Determinar estado
          let status: "voting" | "approved" | "rejected" | "executed" | "expired" = "voting";
          
          if (p.executed) {
            status = "executed";
          } else if (now > deadlineNum) {
            if (p.forVotes > p.againstVotes && totalNum >= minQuorum) {
              status = "approved";
            } else {
              status = rejected";
            }
          }

          proposalsList.push({
            id: i.toString(),
            creator: p.creator,
            recipient: p.recipient,
            amount: ethers.formatEther(p.amount),
            amountWei: p.amount.toString(),
            deadline: new Date(deadlineNum * 1000).toISOString(),
            deadlineTimestamp: deadlineNum,
            executed: p.executed,
            forVotes: ethers.formatEther(p.forVotes),
            againstVotes: ethers.formatEther(p.againstVotes),
            abstainVotes: ethers.formatEther(p.abstainVotes),
            totalVotes: ethers.formatEther(totalVotes),
            status,
            approvalsPercentage: totalNum > 0 
              ? Math.round((Number(p.forVotes) / totalNum) * 100) 
              : 0,
            quorumReached: totalNum >= minQuorum
          });
        } catch (err) {
          console.warn(`⚠️  Failed to load proposal ${i}:`, err);
        }
      }

      setProposals(proposalsList);
    } catch (err: any) {
      setError(err.message || "Failed to fetch proposals");
      console.error("❌ Error fetching proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractAddress) {
      fetchProposals();
    }
  }, [contractAddress]);

  return { proposals, loading, error, refetch: fetchProposals };
}
```

### 4.2 Componente React: `ProposalList`

```jsx
// web/src/components/ProposalList.tsx

import React from "react";
import { useDAOProposals, ProposalData } from "@/hooks/useDAOProposals";

interface Props {
  contractAddress: string;
  minQuorum?: number;
}

const ProposalList: React.FC<Props> = ({ contractAddress, minQuorum = 100 }) => {
  const { proposals, loading, error, refetch } = useDAOProposals(
    contractAddress,
    minQuorum
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "executed":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "voting":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">⏳ Loading proposals...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded">
        <p className="text-red-600">❌ Error: {error}</p>
        <button
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (proposals.length === 0) {
    return <div className="text-center py-8 text-gray-500">No proposals yet</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Proposals ({proposals.length})</h2>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="border rounded-lg p-6 hover:shadow-lg transition"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Proposal #{proposal.id}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Created by: <code className="bg-gray-100 px-2 py-1 rounded">
                    {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}
                  </code>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(proposal.status)}`}>
                {proposal.status.toUpperCase()}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-semibold">{proposal.amount} ETH</p>
              </div>
              <div>
                <p className="text-gray-600">Recipient</p>
                <p className="font-mono text-xs break-all">
                  {proposal.recipient}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Deadline</p>
                <p className="text-sm">
                  {new Date(proposal.deadline).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Quorum</p>
                <p className={proposal.quorumReached ? "text-green-600" : "text-red-600"}>
                  {proposal.quorumReached ? "✅ Reached" : "❌ Not reached"}
                </p>
              </div>
            </div>

            {/* Votes */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="text-sm font-semibold mb-3">Voting Results</p>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>For</span>
                    <span>{proposal.forVotes}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${proposal.approvalsPercentage}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Against</span>
                    <span>{proposal.againstVotes}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${100 - proposal.approvalsPercentage}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-gray-600">
                  Total votes: {proposal.totalVotes}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {proposal.status === "voting" && (
                <>
                  <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                    Vote For
                  </button>
                  <button className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                    Vote Against
                  </button>
                </>
              )}
              {(proposal.status === "approved" && !proposal.executed) && (
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                  🚀 Execute
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProposalList;
```

### 4.3 Exportar a JSON

```javascript
// Convertir proposals a JSON exportable
function exportProposalsToJSON(proposals: ProposalData[]) {
  const json = JSON.stringify(proposals, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `dao-proposals-${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// Uso:
const jsonData = JSON.stringify(proposals, null, 2);
console.log(jsonData);
/* Output:
[
  {
    "id": "1",
    "creator": "0x1234...",
    "recipient": "0xabcd...",
    "amount": "5.0",
    "deadline": "2024-12-31T23:59:59.000Z",
    "status": "approved",
    "forVotes": "150",
    "againstVotes": "25",
    ...
  }
]
*/
```

---

## 5. Mejoras Sugeridas

### 5.1 Seguridad: SafeTransfer y Pull Pattern

**❌ PROBLEMA ACTUAL**:
```solidity
// Vulnerable a reentrancy
(bool success,) = payable(p.recipient).call{value: p.amount}("");
require(success, "Transfer failed");
```

**✅ SOLUCIÓN 1: ReentrancyGuard**:
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DAOVoting is ReentrancyGuard {
  function executeProposal(uint256 proposalId) public nonReentrant {
    // ... validaciones ...
    
    Proposal storage p = proposals[proposalId];
    p.executed = true;  // CEI: Effects ANTES de Interactions
    
    (bool success,) = payable(p.recipient).call{value: p.amount}("");
    require(success, "Transfer failed");
  }
}
```

**✅ SOLUCIÓN 2: Pull Pattern (Más seguro)**:
```solidity
mapping(address => uint256) public withdrawals;

function executeProposal(uint256 proposalId) public {
  Proposal storage p = proposals[proposalId];
  require(canExecute(proposalId), "Cannot execute");
  
  p.executed = true;
  
  // En lugar de PUSH (call), usar PULL
  withdrawals[p.recipient] += p.amount;
  
  totalDeposited -= p.amount;
}

// Recipiente retira fondos voluntariamente
function withdraw() public {
  uint256 amount = withdrawals[msg.sender];
  require(amount > 0, "Nothing to withdraw");
  
  withdrawals[msg.sender] = 0;
  (bool success,) = payable(msg.sender).call{value: amount}("");
  require(success, "Withdrawal failed");
}
```

---

### 5.2 Eventos y Logging

**❌ PROBLEMA ACTUAL**:
```solidity
// Eventos insuficientes
event ProposalCreated(uint256 indexed proposalId, ...);
event ProposalExecuted(uint256 indexed proposalId, ...);
```

**✅ AGREGAR EVENTOS**:
```solidity
event ProposalCreated(
  uint256 indexed proposalId,
  address indexed creator,
  address recipient,
  uint256 amount,
  uint256 deadline,
  uint256 snapshotBlock
);

event VoteCast(
  uint256 indexed proposalId,
  address indexed voter,
  uint8 indexed voteType,
  uint256 votingPower
);

event VotingDeadlineReached(
  uint256 indexed proposalId,
  uint256 forVotes,
  uint256 againstVotes,
  uint256 abstainVotes,
  bool passed
);

event ProposalExecuted(
  uint256 indexed proposalId,
  address indexed recipient,
  uint256 amount,
  uint256 executedAt
);

event BalanceUpdated(
  address indexed user,
  uint256 newBalance,
  uint256 timestamp
);
```

---

### 5.3 Validación de Balance Real

**❌ PROBLEMA ACTUAL**:
```solidity
mapping(address => uint256) balances;
uint256 totalDeposited;  // Puede desincronizarse con address(this).balance

// Si totalDeposited != sum(balances), hay inconsistencia
```

**✅ SOLUCIÓN: Validar Balance Real**:
```solidity
function getActualBalance() public view returns (uint256) {
  return address(this).balance;
}

function getTotalDeposited() public view returns (uint256) {
  return totalDeposited;
}

function isBalanceConsistent() public view returns (bool) {
  return address(this).balance == totalDeposited;
}

function executeProposal(uint256 proposalId) public nonReentrant {
  // ...
  
  // Usar balance real, no totalDeposited
  require(address(this).balance >= p.amount, "Insufficient balance");
  
  // ...
}
```

---

### 5.4 Snapshot Block para Votación Segura

**❌ PROBLEMA ACTUAL**:
```solidity
function vote(uint256 proposalId, uint8 voteType) public {
  // Usa balance actual - vulnerable a flash loans
  uint256 votingPower = balances[msg.sender];
}
```

**✅ SOLUCIÓN: Usar Snapshot Block**:
```solidity
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

// Usar balanceOfAt() para votos seguros
function vote(uint256 proposalId, uint8 voteType) public {
  Proposal storage p = proposals[proposalId];
  
  // Obtener poder de voto EN EL SNAPSHOT BLOCK
  uint256 votingPower = governanceToken.balanceOfAt(
    msg.sender,
    p.snapshotBlock
  );
  
  require(votingPower > 0, "No voting power at snapshot");
  require(votes[proposalId][msg.sender] == VoteType.None, "Already voted");
  
  // ...
  votes[proposalId][msg.sender] = voteType;
}
```

---

### 5.5 Límites y Protecciones

**❌ PROBLEMA ACTUAL**:
```solidity
// Sin límites de propuestas
uint256 proposalCount = 0;

function createProposal(...) public {
  proposalCount++;  // Puede crecer sin límite
  proposals[proposalCount] = ...;
}
```

**✅ AGREGAR LÍMITES**:
```solidity
uint256 constant MAX_PROPOSALS = 10000;
uint256 constant MIN_VOTING_PERIOD = 1 days;
uint256 constant MAX_VOTING_PERIOD = 30 days;
uint256 constant MIN_PROPOSAL_THRESHOLD = 1e18; // 1 ETH en tokens

function createProposal(address recipient, uint256 amount, uint256 deadline) public {
  require(proposalCount + 1 <= MAX_PROPOSALS, "Too many proposals");
  require(deadline >= block.timestamp + MIN_VOTING_PERIOD, "Voting period too short");
  require(deadline <= block.timestamp + MAX_VOTING_PERIOD, "Voting period too long");
  require(balances[msg.sender] >= MIN_PROPOSAL_THRESHOLD, "Insufficient power");
  require(recipient != address(0), "Invalid recipient");
  require(amount > 0, "Amount must be > 0");
  require(amount <= address(this).balance, "Insufficient contract balance");
  
  // ...
}
```

---

## 6. Checklist de Seguridad para Producción

- [ ] **Reentrancy**
  - [ ] ✅ Usar `ReentrancyGuard` o CEI pattern en `executeProposal`
  - [ ] ✅ Marcar como `executed` ANTES de transfer
  - [ ] ✅ Validar balance DESPUÉS de transfer

- [ ] **Validación de Inputs**
  - [ ] ✅ `recipient != address(0)`
  - [ ] ✅ `amount > 0 && amount <= balance`
  - [ ] ✅ `deadline > block.timestamp + MIN_PERIOD`
  - [ ] ✅ `voteType` en rango válido [0-3]

- [ ] **Prevención de Double-Voting**
  - [ ] ✅ Check `votes[id][msg.sender] == None` antes de votar
  - [ ] ✅ Atomic update de voto

- [ ] **Flash Loan Protection**
  - [ ] ✅ Usar `balanceOfAt(snapshotBlock)` en lugar de `balanceOf`
  - [ ] ✅ Crear snapshot en `createProposal`

- [ ] **Balance Consistency**
  - [ ] ✅ Validar `address(this).balance` en `executeProposal`, no `totalDeposited`
  - [ ] ✅ Actualizar `totalDeposited` DESPUÉS de transfer exitoso
  - [ ] ✅ Considerar remover `totalDeposited` si no es crítico

- [ ] **Límites y Bounds Checking**
  - [ ] ✅ `proposalCount + 1 <= MAX_PROPOSALS`
  - [ ] ✅ `block.timestamp <= deadline` para votación
  - [ ] ✅ Validar índices en mappings antes de acceso

- [ ] **Eventos**
  - [ ] ✅ Emitir eventos para todas las acciones críticas
  - [ ] ✅ Usar `indexed` en addresses y IDs para fácil filtering
  - [ ] ✅ Incluir datos relevantes en eventos

- [ ] **Testing**
  - [ ] ✅ Test de reentrancy attack en `executeProposal`
  - [ ] ✅ Test de double-voting prevention
  - [ ] ✅ Test de edge cases (deadline justo pasado, 0 votes, etc.)
  - [ ] ✅ Test de balance consistency
  - [ ] ✅ Fuzzing con valores aleatorios

- [ ] **Auditoría**
  - [ ] ✅ Auditoría de código de seguridad
  - [ ] ✅ Auditoría de lógica de negocio
  - [ ] ✅ Gas optimization review

---

## Resumen: Flujo Completo End-to-End

```
1. CREACIÓN DE PROPUESTA
   ┌─────────────────────────┐
   │ User clicks "Create"    │
   └────────────┬────────────┘
                │
   ┌────────────▼────────────┐
   │ Frontend valida inputs  │
   └────────────┬────────────┘
                │
   ┌────────────▼──────────────────────────────┐
   │ Contract: createProposal(recipient,       │
   │           amount, deadline)                │
   │ ✅ Validar recipient != 0x0                │
   │ ✅ Validar votingPower >= MIN              │
   │ ✅ Validar balance >= amount               │
   │ ✅ proposalCount++ y guardar propuesta    │
   │ 📢 Emitir ProposalCreated event           │
   └────────────┬──────────────────────────────┘
                │
   ┌────────────▼────────────┐
   │ Frontend escucha event  │
   │ Recarga lista           │
   └─────────────────────────┘

2. VOTACIÓN
   ┌──────────────────────┐
   │ User clicks "Vote"   │
   └─────────┬────────────┘
             │
   ┌─────────▼──────────────────────────────┐
   │ Contract: vote(proposalId, voteType)   │
   │ ✅ Validar proposalId existe            │
   │ ✅ Validar no ha votado antes           │
   │ ✅ Validar antes de deadline            │
   │ ✅ Obtener votingPower @ snapshotBlock  │
   │ ✅ Actualizar voto en mapping           │
   │ ✅ Sumar a forVotes/againstVotes        │
   │ 📢 Emitir VoteCast event                │
   └─────────┬──────────────────────────────┘
             │
   ┌─────────▼────────────┐
   │ Frontend actualiza   │
   │ resultado de votos   │
   └──────────────────────┘

3. EJECUCIÓN
   ┌──────────────────────┐
   │ Deadline pasó        │
   └─────────┬────────────┘
             │
   ┌─────────▼─────────────────────────────────┐
   │ Contract: canExecute(proposalId)          │
   │ ✅ Validar !executed                      │
   │ ✅ Validar block.timestamp > deadline     │
   │ ✅ Validar forVotes > againstVotes        │
   │ ✅ Validar quorum                         │
   │ ✅ Validar balance >= amount              │
   │ return true                               │
   └─────────┬─────────────────────────────────┘
             │
   ┌─────────▼──────────────────────────────────┐
   │ User clicks "Execute"                      │
   │ Contract: executeProposal(proposalId)      │
   │ ✅ Check canExecute                        │
   │ ✅ p.executed = true (EFFECTS PRIMERO)     │
   │ ✅ call{value: amount} (INTERACTIONS)      │
   │ ✅ totalDeposited -= amount                │
   │ 📢 Emitir ProposalExecuted event           │
   └─────────┬──────────────────────────────────┘
             │
   ┌─────────▼────────────────┐
   │ Frontend muestra         │
   │ propuesta como ejecutada │
   └──────────────────────────┘
```

---

## Conclusión

Este patrón es **robusto pero requiere validaciones estrictas**. Las mejoras sugeridas (ReentrancyGuard, Pull pattern, eventos, snapshot blocks) son **críticas para producción**. La sincronía entre estado interno y balance real es el riesgo mayor.

**Score de Seguridad**:
- **Patrón actual**: 6/10 (vulnerable a reentrancy y flash loans)
- **Con todas las mejoras**: 9/10 (requiere auditoría profesional para 10/10)
