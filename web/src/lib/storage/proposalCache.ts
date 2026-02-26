/**
 * Proposal Cache with JSON Persistence
 * 
 * Saves proposals to public/proposals.json via API
 * Persists across page reloads and browser sessions
 */

import { Proposal, ProposalStatus } from "@/lib/contracts/types";

export interface LocalProposal extends Proposal {
  createdLocally?: boolean;
  recipient?: string;
  amount?: bigint;
}

class ProposalCache {
  private proposals: Map<bigint, LocalProposal> = new Map();
  private nextId: bigint = BigInt(1);
  private isInitialized: boolean = false;

  /**
   * Initialize cache by loading from server
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("📦 Cache: Initializing from API...");
      const response = await fetch("/api/proposals");
      const data = await response.json();

      if (data.proposals && Array.isArray(data.proposals)) {
        console.log(`📖 Cache: Loaded ${data.proposals.length} proposals from disk`);

        // Rebuild map and track highest ID
        let maxId = BigInt(0);
        for (const proposal of data.proposals) {
          const id = BigInt(proposal.id);
          this.proposals.set(id, proposal as LocalProposal);
          if (id > maxId) {
            maxId = id;
          }
        }

        // Set next ID to be one higher than the max
        this.nextId = maxId + BigInt(1);
        console.log(`📊 Cache: Next proposal ID will be ${this.nextId.toString()}`);
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn("⚠️  Cache: Failed to initialize from API:", error);
      this.isInitialized = true;
      // Continue with empty cache
    }
  }

  /**
   * Get all cached proposals
   */
  getAll(): LocalProposal[] {
    const proposals = Array.from(this.proposals.values());
    console.log(`📦 Cache: Returning ${proposals.length} proposals`);
    return proposals;
  }

  /**
   * Get a single proposal by ID
   */
  get(id: number): LocalProposal | undefined {
    return this.proposals.get(BigInt(id));
  }

  /**
   * Save a new proposal to cache and disk
   */
  async save(
    proposalId: bigint,
    title: string,
    description: string,
    recipient: string,
    amount: bigint,
    deadline: number,
    creator?: string,
    snapshotBlock?: bigint
  ): Promise<LocalProposal> {
    const proposal: LocalProposal = {
      id: proposalId,
      creator: creator || "0x0000000000000000000000000000000000000000",
      title,
      description,
      recipient,
      amount,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      votingDeadline: BigInt(deadline),
      snapshotBlock: snapshotBlock || BigInt(0),
      targetAction: `recipient:${recipient}|amount:${amount.toString()}`,
      forVotes: BigInt(0),
      againstVotes: BigInt(0),
      abstainVotes: BigInt(0),
      status: ProposalStatus.Active,
      createdLocally: true,
    };

    this.proposals.set(proposalId, proposal);
    console.log(`✅ Cache: Saved proposal ${proposalId.toString()} - "${title}"`);

    // Save to disk via API
    await this.saveToApi();

    return proposal;
  }

  /**
   * Save all proposals to disk via API
   */
  private async saveToApi(): Promise<void> {
    try {
      const proposals = Array.from(this.proposals.values());
      console.log("💾 Cache.saveToApi: Saving", proposals.length, "proposals");

      // Convert bigints to strings for JSON serialization
      const serializable = proposals.map((p) => ({
        ...p,
        id: p.id.toString(),
        amount: p.amount?.toString(),
        createdAt: p.createdAt.toString(),
        votingDeadline: p.votingDeadline.toString(),
        snapshotBlock: p.snapshotBlock.toString(),
        forVotes: p.forVotes.toString(),
        againstVotes: p.againstVotes.toString(),
        abstainVotes: p.abstainVotes.toString(),
      }));

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposals: serializable }),
      });

      if (response.ok) {
        console.log(`✅ Cache.saveToApi: Saved ${proposals.length} proposals to disk`);
      } else {
        const errorText = await response.text();
        console.error(`⚠️  Cache.saveToApi: Failed to save to disk:`, errorText);
      }
    } catch (error) {
      console.error("⚠️  Cache.saveToApi: Error saving to API:", error);
    }
  }

  /**
   * Get next available proposal ID
   */
  getNextId(): bigint {
    // Recalculate next ID based on current proposals to avoid race conditions
    let maxId = BigInt(0);
    for (const [id] of this.proposals) {
      if (id > maxId) {
        maxId = id;
      }
    }
    const id = maxId + BigInt(1);
    console.log("🔢 Cache.getNextId: Calculated next ID:", id.toString(), "from max:", maxId.toString());
    this.nextId = id + BigInt(1);
    return id;
  }

  /**
   * Clear all cached proposals
   */
  async clear(): Promise<void> {
    console.log(`🗑️  Cache: Clearing ${this.proposals.size} proposals`);
    this.proposals.clear();
    this.nextId = BigInt(1);

    // Also delete from disk
    try {
      await fetch("/api/proposals", { method: "DELETE" });
      console.log("🗑️  Cache: Deleted proposals from disk");
    } catch (error) {
      console.warn("⚠️  Cache: Error deleting from disk:", error);
    }
  }

  /**
   * Get proposal by ID
   */
  getById(id: bigint): LocalProposal | undefined {
    return this.proposals.get(id);
  }
}

// Singleton cache instance
const cache = new ProposalCache();

/**
 * Initialize cache on first use
 */
let initPromise: Promise<void> | null = null;
async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = cache.initialize();
  }
  return initPromise;
}

export async function getCachedProposals(): Promise<LocalProposal[]> {
  await ensureInitialized();
  return cache.getAll();
}

export async function getCachedProposal(id: number): Promise<LocalProposal | undefined> {
  await ensureInitialized();
  return cache.get(id);
}

export async function saveProposalToCache(
  proposalId: bigint,
  title: string,
  description: string,
  recipient: string,
  amount: bigint,
  deadline: number,
  creator?: string,
  snapshotBlock?: bigint
): Promise<LocalProposal> {
  await ensureInitialized();
  return cache.save(proposalId, title, description, recipient, amount, deadline, creator, snapshotBlock);
}

export async function getNextProposalId(): Promise<bigint> {
  await ensureInitialized();
  return cache.getNextId();
}

export async function clearProposalCache(): Promise<void> {
  await cache.clear();
}

export default cache;
