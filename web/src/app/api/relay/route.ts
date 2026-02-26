import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || "";
const FORWARDER_ADDRESS =
  process.env.NEXT_PUBLIC_MINIMAL_FORWARDER_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

const FORWARDER_ABI = [
  "function execute((address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data) req, bytes signature) payable returns (bool, bytes)",
  "function getNonce(address from) view returns (uint256)",
];

const userLocks = new Set<string>();

export async function POST(request: NextRequest) {
  let userAddress: string | null = null;

  try {
    const body = await request.json();
    const { request: forwardRequest, signature } = body;

    if (!forwardRequest || !signature || !forwardRequest.from) {
      return NextResponse.json(
        { error: "Missing request or signature" },
        { status: 400 }
      );
    }

    userAddress = (forwardRequest.from as string).toLowerCase();

    if (userLocks.has(userAddress)) {
      return NextResponse.json(
        { error: "User already has a transaction in progress" },
        { status: 429 }
      );
    }
    userLocks.add(userAddress);

    if (!RELAYER_PRIVATE_KEY) {
      console.error("RELAYER_PRIVATE_KEY not configured");
      return NextResponse.json(
        { error: "Relayer not configured" },
        { status: 500 }
      );
    }

    if (!FORWARDER_ADDRESS) {
      console.error("NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS not configured");
      return NextResponse.json(
        { error: "Forwarder contract not configured" },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const forwarder = new ethers.Contract(
      FORWARDER_ADDRESS,
      FORWARDER_ABI,
      relayer
    );

    const currentNonce = await forwarder.getNonce(forwardRequest.from);
    const requestedNonce = BigInt(forwardRequest.nonce);

    if (requestedNonce !== currentNonce) {
      console.error(
        "Nonce mismatch! Expected:",
        currentNonce.toString(),
        "Got:",
        forwardRequest.nonce
      );
      return NextResponse.json(
        {
          error: "Nonce mismatch",
          expected: currentNonce.toString(),
          received: forwardRequest.nonce,
        },
        { status: 400 }
      );
    }

    const tx = await forwarder.execute(forwardRequest, signature, {
      gasLimit: 3000000,
    });

    const receipt = await tx.wait();

    if (userAddress) {
      userLocks.delete(userAddress);
    }

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error: unknown) {
    console.error("Error relaying transaction:", error);

    if (userAddress) {
      userLocks.delete(userAddress);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to relay transaction",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
