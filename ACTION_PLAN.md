# 🎯 Action Plan: De 85% a Producción

## ✅ HECHO (No tocar)
- ✅ Smart contracts compilando
- ✅ 26/26 tests pasando
- ✅ 88% cobertura
- ✅ Documentación completa

## 🔴 CRÍTICO - Hacer PRIMERO

### 1️⃣ Integración Frontend (2-3 HORAS)
```bash
# TODO: Conectar frontend a contrato REAL (no cache)
# Archivo: web/src/lib/contracts/ProposalService.ts

# Cambiar de:
const proposals = getCachedProposals();  // ❌ Fake

# A:
const contract = new ethers.Contract(address, ABI, signer);
const count = await contract.proposalCount();  // ✅ Real
```

**Archivos a editar**:
- [ ] `web/src/lib/contracts/ProposalService.ts` - Usar contrato real
- [ ] `web/src/lib/contracts/config.ts` - Leer dirección de .env
- [ ] `.env.local` - Agregar NEXT_PUBLIC_DAO_ADDRESS

**Testing**:
```bash
# Verifica que funciona:
cd web && npm run dev
# Abre http://localhost:3000/proposals/create
# Intenta crear propuesta → debe interactuar con contrato
```

---

### 2️⃣ Deploy en Sepolia (1 DÍA)
```bash
# 1. Obtener Sepolia ETH
# → Faucet: https://sepoliafaucet.com

# 2. Configurar .env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...

# 3. Deploy
cd sc
forge create src/DAOVoting.sol:DAOVoting \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $ETHERSCAN_KEY \
  --verify

# 4. Guardar dirección
export DAO_ADDRESS=0x...
echo "DAO_ADDRESS=$DAO_ADDRESS" >> ../.env.local

# 5. Conectar frontend
NEXT_PUBLIC_DAO_ADDRESS=$DAO_ADDRESS npm run dev
```

**Testing**:
- [ ] Deploy exitoso
- [ ] Verificado en Etherscan
- [ ] Frontend conecta
- [ ] Crear propuesta funciona
- [ ] Votar funciona
- [ ] Ejecutar funciona

---

### 3️⃣ Auditoría Externa (INICIAR INMEDIATAMENTE)
```bash
# Opciones (contactar):
# 1. OpenZeppelin - https://www.openzeppelin.com/security-audits
# 2. Trail of Bits - https://www.trailofbits.com
# 3. Halborn - https://halborn.com
# 4. Veridise - https://veridise.com

# Presupuesto: $5,000-15,000
# Tiempo: 2-4 semanas

# Mientras auditan:
# → Continúa con testing en testnet
# → Aumenta cobertura a 95%+
# → Implementa monitoring
```

---

## 🟠 IMPORTANTE - Hacer EN PARALELO

### Aumentar Coverage a 95%
```bash
cd sc
forge coverage

# Si coverage < 95%:
# 1. Agregar más tests
# 2. Focus en branches no cubiertas
# 3. Re-run coverage
```

### Configurar Monitoring
```javascript
// Usar Tenderly o Forta para:
// - Alertas de transacciones
// - Eventos no esperados
// - Cambios de estado críticos
```

### Escribir Runbook
```markdown
# RUNBOOK: Emergency Procedures

## Si hay bug crítico en production:
1. Pause DAO (si implementado)
2. Notificar a holders
3. Investigar causa
4. Fix en testnet
5. Auditar fix
6. Deploy en mainnet

## Si hay hack/exploit:
1. Activar fund recovery
2. Notificar autoridades
3. Comunicación pública
4. Plan de mitigation
```

---

## 📋 Checklist: Antes de Mainnet

```
SMART CONTRACT:
  ☐ 95%+ coverage (actualmente 88%)
  ☐ Auditoría externa APROBADA
  ☐ Cero hallazgos críticos sin resolver
  ☐ Gas optimizado
  ☐ Etherscan verified

FRONTEND:
  ☐ Integrado con contrato REAL
  ☐ Testing manual end-to-end OK
  ☐ Error handling robusto
  ☐ Walletconnect/MetaMask funciona

TESTNET:
  ☐ 1+ semana sin issues
  ☐ Create proposal: OK
  ☐ Vote: OK
  ☐ Execute: OK
  ☐ Eventos correctos
  ☐ Balances sincronizados

INFRAESTRUCTURA:
  ☐ RPC endpoints configurados
  ☐ Monitoring activo
  ☐ Alertas funcionales
  ☐ Backup documentado

DOCUMENTACIÓN:
  ☐ README de producción
  ☐ Deployment guide
  ☐ Incident response plan
```

---

## 📅 Timeline Mínimo

```
HOY-MAÑANA (24h):      Integración frontend + deploy Sepolia
Semana 1 (7 días):     Testing testnet + auditoría iniciada
Semana 2-4 (21 días):  Auditoría + fixes + testnet validation
Semana 5 (7 días):     Deploy mainnet + monitoreo

TOTAL: ~5-6 semanas hasta GO LIVE
```

---

## 🚀 Go/No-Go Criteria para Mainnet

### GO si:
- ✅ Auditoría aprobada (sin críticos sin resolver)
- ✅ 95%+ cobertura en tests
- ✅ 1+ semana en testnet sin issues
- ✅ Monitoring y alertas activas
- ✅ Runbook documentado
- ✅ Team listo 24/7 primeras 48h

### NO-GO si:
- ❌ Auditoría tiene hallazgos críticos
- ❌ <95% coverage
- ❌ Issues sin resolver en testnet
- ❌ Monitoreo no está listo
- ❌ Team no disponible

---

## 💡 Tips Finales

1. **NO saltes la auditoría** - Es crítico para producción
2. **Testnet 1+ semana** - Dale tiempo a fallar
3. **Monitoring desde día 1** - Detecta issues temprano
4. **Comunicación clara** - Especialmente en day-1
5. **Runbook escrito** - Antes de que lo necesites

---

## Resumen Ejecutivo

| Item | Status | Tiempo | Próximo Paso |
|------|--------|--------|--------------|
| Smart Contract | ✅ | 0 | Mantener como está |
| Tests | ✅ | 0 | Aumentar a 95% |
| Frontend | ⚠️ | 2-3h | Conectar a real |
| Testnet | ❌ | 1d+2w | Deploy + validar |
| Auditoría | ❌ | 2-4w | Contratar YA |
| Mainnet | ❌ | 5-6w | Después auditoría |

**Acción inmediata**:
1. Leer PRODUCTION_READINESS.md (15 min)
2. Integración frontend (3 horas)
3. Contratar auditor (hoy)
4. Deploy Sepolia (mañana)

---

**Creado**: Feb 25, 2025
**Actualizar**: Cuando cambie algo
**Owner**: Tu equipo dev
