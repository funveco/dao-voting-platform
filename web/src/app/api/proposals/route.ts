/**
 * API Route for Proposal Persistence
 * 
 * Reads/writes proposals to public/proposals.json
 * Allows frontend to persist proposals across page reloads
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROPOSALS_FILE = path.join(process.cwd(), "public", "proposals.json");

/**
 * GET /api/proposals
 * Returns all saved proposals
 */
export async function GET() {
  try {
    if (fs.existsSync(PROPOSALS_FILE)) {
      const data = fs.readFileSync(PROPOSALS_FILE, "utf-8");
      const proposals = JSON.parse(data);
      console.log(`📖 API: Read ${proposals.length} proposals from disk`);
      return NextResponse.json({ proposals, success: true });
    } else {
      console.log("📖 API: No proposals file found, returning empty array");
      return NextResponse.json({ proposals: [], success: true });
    }
  } catch (error) {
    console.error("❌ API: Error reading proposals:", error);
    return NextResponse.json(
      { error: "Failed to read proposals", proposals: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proposals
 * Saves proposals to disk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposals } = body;

    if (!Array.isArray(proposals)) {
      return NextResponse.json(
        { error: "Proposals must be an array" },
        { status: 400 }
      );
    }

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(PROPOSALS_FILE, JSON.stringify(proposals, null, 2));
    console.log(`💾 API: Saved ${proposals.length} proposals to disk`);

    return NextResponse.json({ success: true, count: proposals.length });
  } catch (error) {
    console.error("❌ API: Error saving proposals:", error);
    return NextResponse.json(
      { error: "Failed to save proposals" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposals
 * Clears all proposals
 */
export async function DELETE() {
  try {
    if (fs.existsSync(PROPOSALS_FILE)) {
      fs.unlinkSync(PROPOSALS_FILE);
      console.log("🗑️  API: Deleted proposals file");
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ API: Error deleting proposals:", error);
    return NextResponse.json(
      { error: "Failed to delete proposals" },
      { status: 500 }
    );
  }
}
