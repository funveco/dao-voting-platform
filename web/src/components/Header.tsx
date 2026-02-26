"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/ConnectWallet";

/**
 * Header Component
 *
 * Sticky navigation header with:
 * - Logo/branding linking to home
 * - Navigation to proposals
 * - Wallet connection button
 *
 * Per Constitution Principle II: Blockchain-First Architecture
 * Per Constitution Principle VI: Accessibility & Performance
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo/Home Link */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">DAO</span>
          </div>
          <span className="hidden font-bold text-foreground sm:inline">
            Voting Platform
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/proposals">
            <Button variant="ghost" size="sm">
              Proposals
            </Button>
          </Link>
          <Link href="/proposals/create">
            <Button variant="ghost" size="sm">
              Create
            </Button>
          </Link>
        </nav>

        {/* Wallet Connection */}
        <ConnectWallet />
      </div>
    </header>
  );
}
