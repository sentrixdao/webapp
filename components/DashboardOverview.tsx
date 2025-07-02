"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, TrendingUp, DollarSign, Plus, Send, ArrowUpRight, RefreshCw, Eye, Activity, ArrowRight } from "lucide-react"
import WalletConnectionModal from "./WalletConnectionModal"
import { WalletService, type ConnectedWallet } from "@/lib/wallet-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/useAuth"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function DashboardOverview() {
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const { toast } = useToast()
  const { isAuthenticated, loading: authLoading, user } = useAuth()

  useEffect(() => {
    // Only load wallet if user is authenticated and not loading
    if (isAuthenticated && !authLoading && user) {
      loadWallet()
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [isAuthenticated, authLoading, user])

  const loadWallet = async () => {
    try {
      setLoading(true)
      const wallet = await WalletService.getUserWallet()
      setConnectedWallet(wallet)

      // Only load transactions if user has wallet
      if (wallet) {
        try {
          const transactions = await WalletService.fetchTransactions(wallet.wallet_address, wallet.chain_id)
          setRecentTransactions(transactions.slice(0, 5)) // Show max 5 transactions
        } catch (error) {
          console.warn(`Failed to load transactions for wallet:`, error)
        }
      }
    } catch (error) {
      console.error("Error loading wallet:", error)
      if (error instanceof Error) {
        if (error.message.includes("Database not initialized") || 
            error.message.includes('relation "public.user_wallets" does not exist')) {
          toast({
            title: "Database Setup Required",
            description: "Please follow the setup instructions to create the required database tables.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to load wallet. Please try again.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshBalances = async () => {
    try {
      setRefreshing(true)
      await WalletService.refreshWalletBalance()
      await loadWallet()
      toast({
        title: "Success",
        description: "Wallet balance refreshed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh balance",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: "Ethereum",
      11155111: "Sepolia",
      137: "Polygon",
      80001: "Mumbai",
      42161: "Arbitrum",
      421613: "Arbitrum Goerli",
    }
    return chains[chainId] || `Chain ${chainId}`
  }

  const totals = {
    usd: connectedWallet ? connectedWallet.balance_usd : "0.00",
    eth: connectedWallet ? connectedWallet.balance_eth : "0.0000"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-red-500" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to your Sentrix account</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRefreshBalances} disabled={refreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowWalletModal(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            {connectedWallet ? "Manage Wallet" : "Connect Wallet"}
          </Button>
        </div>
      </div>

      {/* Connected Wallets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Connected Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedWallet ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div>
                  <p className="font-medium">{connectedWallet.wallet_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {connectedWallet.wallet_address.slice(0, 6)}...{connectedWallet.wallet_address.slice(-4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{connectedWallet.balance_eth} ETH</p>
                  <p className="text-sm text-muted-foreground">${connectedWallet.balance_usd}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 mt-1">
                    Primary
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Wallet Connected</h3>
              <p className="text-muted-foreground mb-4">Connect your wallet to start managing your digital assets</p>
              <Button onClick={() => setShowWalletModal(true)}>Connect Wallet</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.usd}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {totals.eth} ETH total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ETH Balance</CardTitle>
            <div className="h-4 w-4 rounded-full bg-gray-800 dark:bg-gray-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.eth} ETH</div>
            <p className="text-xs text-muted-foreground">
              From {connectedWallet ? 1 : 0} wallet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedWallet ? 1 : 0}</div>
            <p className="text-xs text-muted-foreground">
              {connectedWallet ? 1 : 0} primary
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentTransactions.length}</div>
            <p className="text-xs text-muted-foreground">transactions loaded</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your assets with one click</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Button 
              variant="outline" 
              className="h-24 flex-col rounded-xl bg-gradient-to-b from-transparent to-red-50/30 dark:to-red-950/20 hover:bg-red-50/50 dark:hover:bg-red-950/30 border-red-100 dark:border-red-900/50 group transition-all duration-200"
              onClick={() => setShowWalletModal(true)}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <Send className="h-6 w-6" />
              </div>
              Send
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col rounded-xl bg-gradient-to-b from-transparent to-green-50/30 dark:to-green-950/20 hover:bg-green-50/50 dark:hover:bg-green-950/30 border-green-100 dark:border-green-900/50 group transition-all duration-200"
              onClick={() => {
                if (connectedWallet) {
                  // Copy address to clipboard
                  navigator.clipboard.writeText(connectedWallet.wallet_address);
                  toast({
                    title: "Wallet Address Copied",
                    description: "Your wallet address has been copied to clipboard",
                  });
                } else {
                  setShowWalletModal(true);
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              Receive
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col rounded-xl bg-gradient-to-b from-transparent to-blue-50/30 dark:to-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 group transition-all duration-200"
              onClick={() => {
                if (connectedWallet) {
                  window.open('https://app.uniswap.org/#/swap', '_blank');
                } else {
                  setShowWalletModal(true);
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="h-6 w-6" />
              </div>
              Swap
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col rounded-xl bg-gradient-to-b from-transparent to-purple-50/30 dark:to-purple-950/20 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 border-purple-100 dark:border-purple-900/50 group transition-all duration-200"
              onClick={() => {
                if (connectedWallet) {
                  window.open('https://app.uniswap.org/#/swap?exactField=input&exactAmount=100&inputCurrency=ETH', '_blank');
                } else {
                  setShowWalletModal(true);
                }
              }}
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                <Plus className="h-6 w-6" />
              </div>
              Buy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div key={tx.id || tx.hash} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        tx.type === "received" ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "received" ? <TrendingUp size={16} /> : <Send size={16} />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.type === "received" ? "Received" : "Sent"} {tx.amount} {tx.token}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.type === "received"
                          ? `From ${formatAddress(tx.from)}`
                          : `To ${formatAddress(tx.to)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{
                      typeof tx.timestamp === 'string' 
                        ? new Date(tx.timestamp).toLocaleDateString() 
                        : tx.timestamp.toLocaleDateString()
                    }</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      {tx.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2" 
                      onClick={() => {
                        const txHash = tx.hash || tx.id;
                        const chainId = tx.chainId || 1;
                        let explorerUrl = "";
                        
                        // Generate explorer URL based on chainId
                        switch (chainId) {
                          case 1:
                            explorerUrl = `https://etherscan.io/tx/${txHash}`;
                            break;
                          case 11155111:
                            explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
                            break;
                          case 137:
                            explorerUrl = `https://polygonscan.com/tx/${txHash}`;
                            break;
                          case 80001:
                            explorerUrl = `https://mumbai.polygonscan.com/tx/${txHash}`;
                            break;
                          default:
                            explorerUrl = `https://etherscan.io/tx/${txHash}`;
                        }
                        
                        window.open(explorerUrl, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard/transactions" className="inline-flex items-center">
                  View All Transactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <WalletConnectionModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onWalletUpdated={setConnectedWallet}
        connectedWallet={connectedWallet}
      />
    </div>
  )
}

function formatAddress(address: string) {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}