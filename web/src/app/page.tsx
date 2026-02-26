"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Wallet, Send, FileText, Vote, Clock, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <Badge variant="outline" className="border-primary text-primary">
            DAO Governance
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">Decentralized Voting</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to the DAO Voting Platform
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          A decentralized governance platform built on Ethereum with support for normal and gasless voting via
          EIP-2771. Connect your wallet and start participating in DAO decisions today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Anvil</div>
            <p className="text-xs text-muted-foreground">Local Chain ID: 31337</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Voting Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 Days</div>
            <p className="text-xs text-muted-foreground">Safety period before execution</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vote Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">For, Against, Abstain</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Steps */}
      <div className="mb-12">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">Getting Started</h2>

        <div className="space-y-4">
          {/* Step 1: Connect Wallet */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Connect Your MetaMask Wallet</CardTitle>
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>Link your wallet to start participating</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="font-medium">Steps:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Look for the <strong>"Connect Wallet"</strong> button in the top-right corner of this page</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Click the button to open MetaMask (must be installed as a browser extension)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Approve the connection request in MetaMask</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Ensure you're on <strong>Anvil (Chain ID: 31337)</strong> network</span>
                  </li>
                </ol>
              </div>
              <Alert className="border-primary/30 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <strong>No MetaMask?</strong> Click the link in the alert to install it.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 2: Fund the DAO */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">2</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Fund the DAO Treasury</CardTitle>
                    <Send className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>Contribute ETH to enable proposal execution</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="font-medium">Steps:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Open your wallet details (click the "Connected" button)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Look for the <strong>"Fund DAO"</strong> action (implementation in progress)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Send ETH from your account to fund the DAO treasury</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>The DAO needs funds to execute approved proposals</span>
                  </li>
                </ol>
              </div>
              <Alert className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>For Testing:</strong> Use Anvil's test accounts which come pre-funded with ETH.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 3: Create a Proposal */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Create a Proposal</CardTitle>
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>Propose how the DAO should allocate funds</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="font-medium">Steps:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Navigate to <strong>"Create"</strong> in the top navigation menu</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Fill in the proposal details:</span>
                  </li>
                  <li className="flex gap-4 pl-6">
                    <span className="text-primary">•</span>
                    <span><strong>Recipient Address:</strong> ETH address to receive funds (0x...)</span>
                  </li>
                  <li className="flex gap-4 pl-6">
                    <span className="text-primary">•</span>
                    <span><strong>Amount:</strong> How much ETH to allocate (in ETH, e.g., 1.5)</span>
                  </li>
                  <li className="flex gap-4 pl-6">
                    <span className="text-primary">•</span>
                    <span><strong>Deadline:</strong> When voting ends (7 days is typical)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Click <strong>"Create Proposal"</strong> and confirm in MetaMask</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Wait for the transaction to be mined</span>
                  </li>
                </ol>
              </div>
              <Alert className="border-blue-500/30 bg-blue-50 dark:bg-blue-950/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Use the same address as the recipient to test the full flow.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 4: Vote on Proposals */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">4</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Vote on Proposals</CardTitle>
                    <Vote className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>Cast your vote on active proposals</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="font-medium text-sm">Option A: Standard Voting (You pay gas)</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Go to <strong>"Proposals"</strong> in the navigation menu</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Find the proposal you want to vote on</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Click one of the voting buttons: <strong>✓ For</strong>, <strong>✗ Against</strong>, or <strong>~ Abstain</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Confirm the transaction in MetaMask and pay gas fees</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Your vote is recorded on the blockchain</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="font-medium text-sm">Option B: Gasless Voting (Relayer pays gas) ⚡</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Same steps as above, but click <strong>"Vote (Gasless)"</strong> button instead</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>You only sign the transaction (no gas cost to you)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>A relayer submits your vote to the blockchain</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Uses EIP-2771 meta-transaction standard for security</span>
                  </li>
                </ol>
              </div>

              <Alert className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Each address votes once:</strong> You cannot vote twice on the same proposal.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 5: Wait for Voting to End */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">5</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Wait for Voting Period to End</CardTitle>
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>The 7-day safety period protects the DAO</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="font-medium">What happens during this time:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>The proposal deadline shown on the proposal card counts down</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>You can still vote until the deadline passes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Vote counts are displayed in real-time (For/Against/Abstain)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>No votes can be changed once cast</span>
                  </li>
                </ul>
              </div>
              <Alert className="border-purple-500/30 bg-purple-50 dark:bg-purple-950/20">
                <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                <AlertDescription className="text-purple-800 dark:text-purple-200">
                  <strong>Why 7 days?</strong> The safety period gives the DAO community time to review the proposal
                  and vote.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 6: Execute the Proposal */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="font-bold">6</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Execute Approved Proposals</CardTitle>
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>Transfer funds once voting has ended and proposal passed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="font-medium">Steps:</p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Wait for the proposal deadline to pass (7 days)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Go back to the proposal in the <strong>"Proposals"</strong> section</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Check if the proposal <strong>passed</strong> (more "For" than "Against")</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Click the <strong>"Execute Proposal"</strong> button</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>Confirm the transaction in MetaMask</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>ETH is transferred from the DAO to the recipient</span>
                  </li>
                </ol>
              </div>
              <Alert className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <strong>Conditions to execute:</strong> Voting must be over, proposal must have passed (For votes &gt;
                  Against votes), and DAO must have enough funds.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Architecture Section */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">How It Works</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Smart Contracts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>DAOVoting Contract:</strong> Manages proposals, votes, and fund distribution on the
                blockchain.
              </p>
              <p className="text-xs">
                Address: <code className="text-xs">0x34A1D3fff3958843C43aD80F30b94c510645C316</code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meta-Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>MinimalForwarder Contract:</strong> Enables gasless voting via EIP-2771 standard.
              </p>
              <p className="text-xs">
                Address: <code className="text-xs">0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496</code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Web Frontend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>React + Next.js 16:</strong> Modern UI with real-time wallet integration via
                MetaMask.
              </p>
              <p className="text-xs">Uses ethers.js v6 for contract interaction.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vote Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>One Vote Per Address:</strong> Prevent double voting with on-chain tracking.
              </p>
              <p className="text-xs">Reentrancy protection and vote validation.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What is the DAO?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              A Decentralized Autonomous Organization (DAO) is a group that makes decisions through voting on the
              blockchain, rather than having a central authority. Everyone connected to the DAO can vote on proposals.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Do I need to pay gas fees?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <strong>Standard Voting:</strong> Yes, you pay gas fees to submit your vote. <br />
              <strong>Gasless Voting:</strong> No! A relayer pays the gas for you (EIP-2771). You only sign the
              transaction.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Can I change my vote?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No, once your vote is cast and recorded on the blockchain, it cannot be changed. This prevents vote
              manipulation.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What happens if a proposal fails?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              If "Against" votes are greater than or equal to "For" votes, the proposal does not execute and no ETH
              is transferred. The DAO remains secure.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How long is the voting period?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The default voting period is 7 days (configurable per proposal). This safety period allows the community
              to review and vote on proposals thoroughly.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Is my wallet secure?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Yes. This platform only connects to MetaMask and never stores your private keys. MetaMask is a trusted
              wallet used by millions. Always verify the connected website before approving transactions.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-6 py-8 text-center">
        <h3 className="mb-2 text-xl font-bold">Ready to participate?</h3>
        <p className="mb-6 text-muted-foreground">
          Connect your wallet in the top-right corner and start voting on proposals today.
        </p>
        <p className="text-sm text-muted-foreground">
          Need help? Follow the step-by-step instructions above or check the Proposals page to see active votes.
        </p>
      </div>
    </main>
  );
}

function Alert({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={`relative rounded-lg border px-4 py-3 text-sm flex items-start gap-3 ${className}`}
      {...props}
    />
  );
}

function AlertDescription({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-sm leading-relaxed ${className}`} {...props} />;
}
