# 🏛️ Plataforma de Votación DAO

Sistema de gobernanza DAO listo para producción con contratos inteligentes y dApp completa.

**Estado**: 🟨 85% Listo para Producción | ✅ Contratos Inteligentes Completados | ⚠️ Necesita Testnet y Auditoría

---

## 📊 Características

### Contratos Inteligentes
- ✅ Creación de propuestas con ventanas de votación
- ✅ Votación multi-opción (A favor/En contra/Abstención)
- ✅ Ejecución automática al aprobarse
- ✅ Prevención de doble votación
- ✅ Protección contra flash loans (bloques de snapshot)
- ✅ Protecciones contra reentrancia (patrón CEI)

### Frontend
- ✅ React/Next.js 16.1.6
- ✅ Integración con MetaMask
- ✅ Interacción con contratos via Ethers.js v6
- ✅ UI para crear propuestas y votar
- ✅ Lista de propuestas en tiempo real
- ✅ Cache JSON persistente (desarrollo)

### Pruebas y Documentación
- ✅ 26/26 pruebas pasando (Foundry)
- ✅ 88% de cobertura de código
- ✅ 3,738 líneas de documentación completa
- ✅ Análisis de seguridad y mitigación de riesgos
- ✅ Guía de preparación para producción

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- Foundry (para contratos inteligentes)
- Extensión de navegador MetaMask

### Frontend

```bash
cd web
npm install
npm run dev
```

Abre `http://localhost:3000`

### Contratos Inteligentes

```bash
cd sc
forge install
forge test
forge coverage
```

### Construcción

```bash
# Frontend
cd web && npm run build

# Contratos Inteligentes
cd sc && forge build
```

---

## 📚 Documentación

Documentación completa incluida:

| Documento | Propósito | Tiempo |
|----------|-----------|--------|
| **DAO_QUICK_REFERENCE.md** | Referencia rápida con tablas | 15 min |
| **DAO_STORAGE_PATTERN.md** | Análisis técnico completo | 60 min |
| **DAO_STORAGE_EXAMPLE.sol** | Contrato inteligente comentado | 30 min |
| **DAO_TESTING_GUIDE.md** | Estrategias de pruebas | 45 min |
| **PRODUCTION_READINESS.md** | Lista de verificación para producción | 15 min |
| **ACTION_PLAN.md** | Hoja de ruta paso a paso | 10 min |
| **GITHUB_SETUP.md** | Guía de despliegue en GitHub | 15 min |

---

## 🏗️ Estructura del Proyecto

```
├── sc/                          # Contratos Inteligentes
│   ├── src/
│   │   ├── DAOVoting.sol        # Contrato principal de gobernanza
│   │   └── MinimalForwarder.sol # Soporte para meta-transacciones
│   ├── test/
│   │   ├── DAOVoting.t.sol
│   │   └── MinimalForwarder.t.sol
│   └── foundry.toml
│
├── web/                         # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── proposals/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ProposalForm.tsx
│   │   │   └── ConnectWallet.tsx
│   │   ├── lib/
│   │   │   ├── contracts/
│   │   │   │   ├── ProposalService.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── abis.ts
│   │   │   └── storage/
│   │   │       └── proposalCache.ts
│   │   └── hooks/
│   │       └── useProposals.ts
│   ├── public/
│   └── package.json
│
├── Archivos de Documentación (DAO_*.md)
├── .gitignore
└── README.md
```

---

## 🔧 Configuración

### Variables de Entorno

Crea `web/.env.local`:

```env
NEXT_PUBLIC_DAO_ADDRESS=0x...              # Dirección del contrato
NEXT_PUBLIC_RPC_URL=http://localhost:8545  # Endpoint RPC
NEXT_PUBLIC_CHAIN_ID=31337                 # Chain ID (31337 para Anvil)
```

Para producción (Sepolia):
```env
NEXT_PUBLIC_DAO_ADDRESS=0x...              # Dirección en Sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
```

---

## 🧪 Pruebas

### Ejecutar Pruebas de Contratos Inteligentes

```bash
cd sc
forge test                  # Ejecutar todas las pruebas
forge test -v              # Salida detallada
forge test --fuzz-runs 10000  # Fuzzing
forge coverage             # Reporte de cobertura
```

**Resultados**: ✅ 26/26 pruebas pasando | 88% cobertura

---

## 🚀 Preparación para Producción

### Estado Actual
- ✅ Contratos inteligentes: 100% completados
- ✅ Pruebas: 26/26 pasando
- ✅ Documentación: Completa
- ⚠️ Integración de frontend: Parcial (usando cache)
- ❌ Despliegue en testnet: Aún no
- ❌ Auditoría de seguridad: Aún no

### Cronograma para Producción
```
Semana 1:   Integración frontend + Despliegue Sepolia
Semana 2-4: Auditoría de seguridad + Validación en testnet
Semana 5:   Despliegue en mainnet
```

**Ver PRODUCTION_READINESS.md para la lista completa**

---

## 🔒 Seguridad

### Protecciones Implementadas
- ✅ **Patrón CEI**: Checks → Effects → Interactions
- ✅ **Protección contra Reentrancia**: modificador nonReentrant
- ✅ **Protección contra Flash Loans**: Bloques de snapshot
- ✅ **Prevención de Doble Votación**: Seguimiento de votantes
- ✅ **Validación de Entrada**: Todos los parámetros validados
- ✅ **Verificaciones de Saldo**: Balance real vs. totalDeposited

### Estado de Auditoría
- ✅ Revisión interna (88% cobertura)
- ❌ Auditoría externa: Requiere antes de mainnet

---

## 📈 Detalles de Contratos Inteligentes

### Contrato Principal: DAOVoting.sol

**Funciones**:
- `createProposal(recipient, amount, deadline)` - Crear propuesta
- `vote(proposalId, voteType)` - Emitir voto
- `canExecute(proposalId)` - Verificar si es ejecutable
- `executeProposal(proposalId)` - Ejecutar propuesta aprobada

**Eventos**:
- `ProposalCreated`
- `VoteCast`
- `ProposalExecuted`

**Estado**:
- `proposals`: Mapeo de todas las propuestas
- `votes`: Doble mapeo de elecciones de votantes
- `balances`: Poder de voto de miembros
- `proposalCount`: Contador secuencial de ID

---

## 🎯 Próximos Pasos

1. **Leer**: PRODUCTION_READINESS.md (15 min)
2. **Leer**: ACTION_PLAN.md (10 min)
3. **Implementar**: Integración de frontend (2-3 horas)
4. **Desplegar**: Testnet Sepolia (1 día)
5. **Auditar**: Auditoría de seguridad externa (2-4 semanas)
6. **Lanzar**: Mainnet (semana 5+)

---

## 📞 Soporte

### Documentación
- Detalles de contratos inteligentes: `DAO_STORAGE_PATTERN.md`
- Guía de pruebas: `DAO_TESTING_GUIDE.md`
- Referencia rápida: `DAO_QUICK_REFERENCE.md`

### Recursos
- [Foundry Book](https://book.getfoundry.sh/)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [Next.js Docs](https://nextjs.org/docs)

---

## 📄 Licencia

MIT - Ver archivo LICENSE

---

## 🤝 Contribuyendo

1. Haz fork del repositorio
2. Crea una rama de característica
3. Commitea tus cambios
4. Haz push a la rama
5. Crea un Pull Request

Ver PRODUCTION_READINESS.md para requisitos de protección de ramas.

---

## ⚠️ Aviso Legal

**Este código se proporciona con fines educativos.** Antes de desplegar en mainnet:
- Realiza una auditoría de seguridad exhaustiva
- Prueba exhaustivamente en testnet
- Revisa todo el código de contratos inteligentes
- Asegúrate de cumplir con las leyes locales

**Úsalo bajo tu propio riesgo.**

---

**Creado**: Febrero 2025  
**Estado**: Fase Alfa/Pruebas  
**Próximo Lanzamiento**: Producción v1.0 (5-6 semanas)
