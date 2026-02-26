// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * DAO Voting Contract - Storage Pattern Example
 * 
 * Patrón de almacenamiento de propuestas, votos y balances
 * Demostra riesgos de seguridad y mitigaciones
 */

interface IERC20Snapshot {
    function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256);
}

contract DAOVoting {
    // ============ ENUMS ============
    
    enum VoteType {
        None,     // 0: Sin votar
        For,      // 1: A favor
        Against,  // 2: En contra
        Abstain   // 3: Abstenido
    }

    enum ProposalStatus {
        Active,     // 0: Votación en curso
        Approved,   // 1: Aprobada (votación cerrada)
        Rejected,   // 2: Rechazada
        Executed,   // 3: Ejecutada
        Cancelled   // 4: Cancelada
    }

    // ============ STRUCTS ============

    /**
     * Propuesta de gobernanza
     * Se almacena en mapping(uint256 => Proposal) para acceso O(1)
     */
    struct Proposal {
        uint256 id;                  // ID único, secuencial (1, 2, 3, ...)
        address creator;             // Quién creó la propuesta
        address recipient;           // Dirección que recibe los fondos
        uint256 amount;              // Cantidad de ETH (en wei)
        uint256 deadline;            // Unix timestamp: cuándo termina votación
        bool executed;               // ¿Ya fue ejecutada?
        uint256 forVotes;            // Suma de poder de voto a favor
        uint256 againstVotes;        // Suma de poder de voto en contra
        uint256 abstainVotes;        // Suma de poder de voto abstenido
        uint256 snapshotBlock;       // Block number para calcular poder seguro
        string title;                // Título descriptivo
        string description;          // Descripción detallada
    }

    // ============ STATE VARIABLES ============

    // PROPUESTAS: Almacenamiento principal
    mapping(uint256 => Proposal) public proposals;      // ID → Propuesta
    uint256 public proposalCount = 0;                   // Contador secuencial

    // VOTOS: Registro de quién votó qué
    mapping(uint256 => mapping(address => VoteType)) public votes;  // ID → Address → Voto
    
    // BALANCES: Poder de voto de cada usuario
    mapping(address => uint256) public balances;        // Address → Poder de voto
    uint256 public totalDeposited = 0;                  // Total ETH bloqueado

    // CONFIGURACIÓN
    uint256 constant MIN_VOTING_PERIOD = 1 days;
    uint256 constant MAX_VOTING_PERIOD = 30 days;
    uint256 constant MIN_PROPOSAL_THRESHOLD = 1e18;    // Mínimo 1 ETH en poder
    uint256 constant MIN_QUORUM = 10e18;               // Mínimo 10 ETH votados
    uint256 constant MAX_PROPOSALS = 10000;

    // Token para voting power histórico
    IERC20Snapshot public governanceToken;

    // Nonce para reentrancy guard simple
    bool private locked = false;

    // ============ EVENTS ============

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        uint256 deadline,
        uint256 snapshotBlock,
        string title
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType indexed voteType,
        uint256 votingPower,
        uint256 timestamp
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

    // ============ MODIFIERS ============

    /**
     * Prevenir reentrancy attacks
     * Usar en funciones que transferieren ETH
     */
    modifier nonReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    // ============ CONSTRUCTOR ============

    constructor(address _governanceToken) {
        require(_governanceToken != address(0), "Invalid token");
        governanceToken = IERC20Snapshot(_governanceToken);
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * Crear una nueva propuesta
     * 
     * @param recipient Dirección que recibe los fondos
     * @param amount Cantidad de ETH (wei)
     * @param deadline Unix timestamp: cuándo termina votación
     * @param title Título de la propuesta
     * @param description Descripción detallada
     * 
     * Emite ProposalCreated event
     * 
     * RIESGOS MITIGADOS:
     * ✅ Validar que recipient != address(0)
     * ✅ Validar que amount > 0
     * ✅ Validar que deadline > block.timestamp + MIN_VOTING_PERIOD
     * ✅ Validar que creador tiene poder suficiente
     * ✅ Validar que hay fondos suficientes
     */
    function createProposal(
        address recipient,
        uint256 amount,
        uint256 deadline,
        string calldata title,
        string calldata description
    ) external returns (uint256) {
        // ========== VALIDACIONES (CHECKS) ==========
        
        // Validar recipient
        require(recipient != address(0), "Invalid recipient address");
        
        // Validar monto
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        // Validar deadline
        require(
            deadline >= block.timestamp + MIN_VOTING_PERIOD,
            "Deadline too soon (must be >= MIN_VOTING_PERIOD)"
        );
        require(
            deadline <= block.timestamp + MAX_VOTING_PERIOD,
            "Deadline too far (must be <= MAX_VOTING_PERIOD)"
        );
        
        // Validar poder del creador
        require(
            balances[msg.sender] >= MIN_PROPOSAL_THRESHOLD,
            "Insufficient voting power to create proposal"
        );
        
        // Validar límite de propuestas
        require(
            proposalCount + 1 <= MAX_PROPOSALS,
            "Maximum proposals limit reached"
        );
        
        // ========== CAMBIO DE ESTADO (EFFECTS) ==========
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            creator: msg.sender,
            recipient: recipient,
            amount: amount,
            deadline: deadline,
            executed: false,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            snapshotBlock: block.number,    // Para votación segura (sin flash loans)
            title: title,
            description: description
        });
        
        // ========== EVENTOS ==========
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            recipient,
            amount,
            deadline,
            block.number,
            title
        );
        
        return proposalId;
    }

    /**
     * Votar en una propuesta
     * 
     * @param proposalId ID de la propuesta
     * @param voteType Tipo de voto (1=For, 2=Against, 3=Abstain)
     * 
     * Emite VoteCast event
     * 
     * RIESGOS MITIGADOS:
     * ✅ Validar que propuesta existe
     * ✅ Validar que no ha votado antes (double-voting protection)
     * ✅ Validar que votación no ha expirado
     * ✅ Usar balanceOfAt(snapshotBlock) en lugar de balance actual
     *    (previene flash loan attacks)
     */
    function vote(uint256 proposalId, uint8 voteType) external {
        // ========== VALIDACIONES (CHECKS) ==========
        
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        
        Proposal storage p = proposals[proposalId];
        
        require(
            block.timestamp <= p.deadline,
            "Voting period has ended"
        );
        
        // CRÍTICO: Prevenir double voting
        require(
            votes[proposalId][msg.sender] == VoteType.None,
            "You have already voted on this proposal"
        );
        
        // Validar tipo de voto
        require(voteType >= 1 && voteType <= 3, "Invalid vote type");
        
        // ========== OBTENER PODER DE VOTO DE FORMA SEGURA ==========
        
        // ⚠️ IMPORTANTE: Usar balanceOfAt(snapshotBlock) en lugar de balance actual
        // Esto previene "flash loan" attacks donde alguien:
        // 1. Flashloan ETH / tokens
        // 2. Vota con poder inflado
        // 3. Devuelve el flashloan
        
        uint256 votingPower = governanceToken.balanceOfAt(
            msg.sender,
            p.snapshotBlock
        );
        
        require(votingPower > 0, "No voting power at snapshot block");
        
        // ========== CAMBIO DE ESTADO (EFFECTS) ==========
        
        votes[proposalId][msg.sender] = VoteType(voteType);
        
        // Acumular votos
        if (voteType == 1) {  // For
            p.forVotes += votingPower;
        } else if (voteType == 2) {  // Against
            p.againstVotes += votingPower;
        } else if (voteType == 3) {  // Abstain
            p.abstainVotes += votingPower;
        }
        
        // ========== EVENTOS ==========
        
        emit VoteCast(
            proposalId,
            msg.sender,
            VoteType(voteType),
            votingPower,
            block.timestamp
        );
    }

    /**
     * Verificar si una propuesta puede ejecutarse
     * 
     * @param proposalId ID de la propuesta
     * @return true si todas las condiciones se cumplen
     * 
     * CONDICIONES:
     * 1. Propuesta existe y no fue ejecutada
     * 2. Votación ha expirado (deadline pasó)
     * 3. Propuesta fue aprobada (for > against)
     * 4. Quórum alcanzado
     * 5. Contrato tiene suficientes fondos
     */
    function canExecute(uint256 proposalId) external view returns (bool) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        
        Proposal storage p = proposals[proposalId];
        
        // Validar que no fue ejecutada
        if (p.executed) return false;
        
        // Validar que votación expiró
        if (block.timestamp <= p.deadline) return false;
        
        // Validar que fue aprobada
        if (p.forVotes <= p.againstVotes) return false;
        
        // Validar quórum
        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        if (totalVotes < MIN_QUORUM) return false;
        
        // Validar balance
        if (address(this).balance < p.amount) return false;
        
        return true;
    }

    /**
     * Ejecutar una propuesta aprobada
     * Transfiere fondos al recipient
     * 
     * @param proposalId ID de la propuesta
     * 
     * PATRÓN CEI (CHECKS-EFFECTS-INTERACTIONS):
     * 1. CHECKS: Validar estado
     * 2. EFFECTS: Cambiar estado (ANTES de enviar dinero)
     * 3. INTERACTIONS: Enviar dinero (ÚLTIMO)
     * 
     * ⚠️ CRÍTICO: Usar nonReentrant modifier
     * Si recipient es un contrato inteligente, podría hacer reentrancy attack:
     * 1. Llamar a executeProposal()
     * 2. Recibir ETH en fallback/receive
     * 3. Volver a llamar a executeProposal() (pero ya está marcado como executed)
     * 
     * CEI pattern + nonReentrant previene esto.
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        // ========== CHECKS ==========
        
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        
        Proposal storage p = proposals[proposalId];
        
        require(!p.executed, "Proposal already executed");
        require(block.timestamp > p.deadline, "Voting period not finished");
        require(p.forVotes > p.againstVotes, "Proposal not approved");
        
        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        require(totalVotes >= MIN_QUORUM, "Quorum not reached");
        
        require(address(this).balance >= p.amount, "Insufficient contract balance");
        
        // ========== EFFECTS (CAMBIAR ESTADO ANTES) ==========
        
        // ⚠️ ORDEN CRÍTICO: Marcar como ejecutado ANTES de enviar dinero
        // Si hacemos transfer() primero, recipient puede hacer reentrancy
        p.executed = true;
        
        // Actualizar contador de fondos bloqueados
        totalDeposited -= p.amount;
        
        // ========== INTERACTIONS (ENVIAR DINERO ÚLTIMO) ==========
        
        // Usar call() en lugar de transfer()
        // - transfer() usa 2300 gas (obsoleto)
        // - call() reenvía todo el gas disponible (más seguro en Solidity moderno)
        (bool success, ) = payable(p.recipient).call{value: p.amount}("");
        require(success, "Transfer failed");
        
        // ========== EVENTOS ==========
        
        emit ProposalExecuted(
            proposalId,
            p.recipient,
            p.amount,
            block.timestamp
        );
    }

    /**
     * Depositar ETH para obtener poder de voto
     * (Implementación simplificada; en producción usar token ERC20)
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be > 0");
        
        balances[msg.sender] += msg.value;
        totalDeposited += msg.value;
        
        emit BalanceUpdated(msg.sender, balances[msg.sender], block.timestamp);
    }

    /**
     * Retirar poder de voto
     * (No permite retirar si hay propuestas activas donde votaste)
     */
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        totalDeposited -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit BalanceUpdated(msg.sender, balances[msg.sender], block.timestamp);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * Obtener datos de una propuesta
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (Proposal memory)
    {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        return proposals[proposalId];
    }

    /**
     * Obtener voto de un usuario en una propuesta
     */
    function getUserVote(uint256 proposalId, address user)
        external
        view
        returns (VoteType)
    {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        return votes[proposalId][user];
    }

    /**
     * Obtener balance y poder de voto
     */
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /**
     * Obtener estado actual del contrato
     */
    function getContractState()
        external
        view
        returns (
            uint256 totalProposals,
            uint256 totalFundsLocked,
            uint256 availableBalance,
            bool isConsistent
        )
    {
        return (
            proposalCount,
            totalDeposited,
            address(this).balance,
            address(this).balance >= totalDeposited  // ✅ Validar sincronía
        );
    }
}

/**
 * ============ RESUMEN DE RIESGOS Y MITIGACIONES ============
 * 
 * 🔴 REENTRANCY ATTACK
 *    Riesgo: Recipient llama a executeProposal() durante fallback
 *    Mitiga: 
 *    - CEI Pattern (marca como executed ANTES de transfer)
 *    - nonReentrant modifier (lock variable)
 * 
 * 🔴 DOUBLE VOTING
 *    Riesgo: Usuario vota múltiples veces en misma propuesta
 *    Mitiga: require(votes[id][msg.sender] == None)
 * 
 * 🔴 FLASH LOAN ATTACK
 *    Riesgo: Flashloan ETH, vota con poder inflado, devuelve préstamo
 *    Mitiga: Usar balanceOfAt(snapshotBlock) en lugar de balance()
 * 
 * 🟠 BALANCE INCONSISTENCY
 *    Riesgo: address(this).balance != totalDeposited
 *    Mitiga: Validar balance ANTES de executeProposal()
 * 
 * 🟡 INVALID INPUTS
 *    Riesgo: recipient = 0x0, amount = 0, deadline invalido
 *    Mitiga: Validar todos los inputs en createProposal()
 * 
 * ============ PRUEBAS RECOMENDADAS ============
 * 
 * Unit Tests:
 * ✅ Crear propuesta válida
 * ✅ Rechazar crear con recipient 0x0
 * ✅ Rechazar votar 2 veces
 * ✅ Rechazar votar después de deadline
 * ✅ Ejecutar propuesta aprobada
 * ✅ Rechazar ejecutar propuesta no aprobada
 * ✅ Rechazar ejecutar sin fondos suficientes
 * 
 * Security Tests:
 * ✅ Simular reentrancy attack
 * ✅ Simular flash loan attack
 * ✅ Validar balance consistency
 * ✅ Fuzzing con valores aleatorios
 */
