// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MinimalForwarder
 * @notice EIP-2771 compliant meta-transaction forwarder for gasless voting
 * @dev Validates user signatures off-chain, enables relayers to execute transactions
 */
contract MinimalForwarder is EIP712 {
  using ECDSA for bytes32;

  // ============================================================================
  // Types
  // ============================================================================

  /// @notice Forward request structure for meta-transactions
  struct ForwardRequest {
    address from;
    address to;
    uint256 value;
    uint256 gas;
    uint256 nonce;
    uint256 deadline;
    bytes data;
  }

  // ============================================================================
  // Storage
  // ============================================================================

  /// @notice Nonce tracking per user for replay protection
  mapping(address user => uint256) public nonces;

  /// @notice EIP-712 typehash for ForwardRequest
  bytes32 public constant FORWARD_REQUEST_TYPEHASH =
    keccak256(
      "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint256 deadline,bytes data)"
    );

  // ============================================================================
  // Events
  // ============================================================================

  event MetaTransactionExecuted(
    address indexed from,
    address indexed to,
    uint256 nonce,
    bool success
  );

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() EIP712("MinimalForwarder", "1") {}

  // ============================================================================
  // Public Functions
  // ============================================================================

  /**
   * @notice Verify that a forward request is signed by the correct user
   * @param req Forward request structure
   * @param signature User's signature
   * @return True if signature is valid and nonce matches
   */
  function verify(ForwardRequest calldata req, bytes calldata signature)
    public
    view
    returns (bool)
  {
    // Check conditions first (cheap) before ECDSA recovery (expensive)
    if (nonces[req.from] != req.nonce) return false;
    if (req.deadline <= block.timestamp) return false;

    // Now verify signature
    try this._recoverSignerStatic(req, signature) returns (address signer) {
      return signer == req.from;
    } catch {
      return false;
    }
  }

  /**
   * @notice Static wrapper for recovering signer (allows try/catch in verify)
   */
  function _recoverSignerStatic(ForwardRequest calldata req, bytes calldata signature)
    external
    view
    returns (address)
  {
    return _recoverSigner(req, signature);
  }

  /**
   * @notice Execute a meta-transaction on behalf of the signer
   * @param req Forward request structure
   * @param signature User's signature
   * @return success True if transaction executed successfully
   * @return result Transaction result bytes
   */
  function execute(ForwardRequest calldata req, bytes calldata signature)
    public
    payable
    returns (bool success, bytes memory result)
  {
    require(verify(req, signature), "MinimalForwarder: signature verification failed");
    require(msg.value == req.value, "MinimalForwarder: value mismatch");

    // Increment nonce to prevent replay attacks
    nonces[req.from]++;

    // Execute the transaction
    (success, result) = req.to.call{value: req.value, gas: req.gas}(
      abi.encodePacked(req.data, req.from)
    );

    // Emit event
    emit MetaTransactionExecuted(req.from, req.to, nonces[req.from] - 1, success);
  }

  /**
   * @notice Get current nonce for a user
   * @param user User address
   * @return Current nonce value
   */
  function getNonce(address user) public view returns (uint256) {
    return nonces[user];
  }

  // ============================================================================
  // Internal Functions
  // ============================================================================

  /**
   * @notice Recover signer from forward request and signature
   * @param req Forward request structure
   * @param signature User's signature
   * @return Recovered signer address
   */
  function _recoverSigner(ForwardRequest calldata req, bytes calldata signature)
    internal
    view
    returns (address)
  {
    bytes32 digest = _hashTypedDataV4(_hashRequest(req));
    return digest.recover(signature);
  }

  /**
   * @notice Hash the forward request struct
   * @param req Forward request structure
   * @return EIP-712 hash of the request
   */
  function _hashRequest(ForwardRequest calldata req) internal pure returns (bytes32) {
    return keccak256(
      abi.encode(FORWARD_REQUEST_TYPEHASH, req.from, req.to, req.value, req.gas, req.nonce, req.deadline, keccak256(req.data))
    );
  }
}
