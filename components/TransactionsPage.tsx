"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Filter, Search, CalendarIcon, ArrowUpDown, Send, TrendingUp, RefreshCw, Download, Eye, Database } from "lucide-react"
import { format } from "date-fns"
import { WalletService } from "@/lib/wallet-service"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    token: "all",
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    amountRange: [0, 100] as [number, number],
  })
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [transactions, filters, sortBy, sortOrder])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const wallet = await WalletService.getUserWallet()
      
      if (wallet) {
        const txs = await WalletService.fetchTransactions(wallet.wallet_address, wallet.chain_id)
        setTransactions(txs)
      } else {
        setTransactions([])
      }
      
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (tx) =>
          tx.id?.toLowerCase().includes(filters.search.toLowerCase()) ||
          tx.hash?.toLowerCase().includes(filters.search.toLowerCase()) ||
          tx.from?.toLowerCase().includes(filters.search.toLowerCase()) ||
          tx.to?.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((tx) => tx.type === filters.type)
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((tx) => tx.status === filters.status)
    }

    // Token filter
    if (filters.token !== "all") {
      filtered = filtered.filter((tx) => tx.token === filters.token)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter((tx) => {
        const txDate = typeof tx.timestamp === 'string' 
          ? new Date(tx.timestamp) 
          : tx.timestamp
        return txDate >= filters.dateFrom!
      })
    }
    if (filters.dateTo) {
      filtered = filtered.filter((tx) => {
        const txDate = typeof tx.timestamp === 'string' 
          ? new Date(tx.timestamp) 
          : tx.timestamp
        return txDate <= filters.dateTo!
      })
    }

    // Amount range filter
    filtered = filtered.filter((tx) => {
      const amount = Number.parseFloat(tx.amount)
      return amount >= filters.amountRange[0] && amount <= filters.amountRange[1]
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a]
      let bValue = b[sortBy as keyof typeof b]

      if (sortBy === "timestamp") {
        aValue = typeof aValue === 'string' ? new Date(aValue).getTime() : aValue.getTime()
        bValue = typeof bValue === 'string' ? new Date(bValue).getTime() : bValue.getTime()
      } else if (sortBy === "amount") {
        aValue = Number.parseFloat(aValue as string)
        bValue = Number.parseFloat(bValue as string)
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredTransactions(filtered)
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      type: "all",
      status: "all",
      token: "all",
      dateFrom: null,
      dateTo: null,
      amountRange: [0, 100],
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: "Ethereum",
      11155111: "Sepolia",
      137: "Polygon",
      80001: "Mumbai",
      42161: "Arbitrum",
      421613: "Arbitrum Goerli",
      10: "Optimism",
      420: "Optimism Goerli",
    }
    return chains[chainId] || `Chain ${chainId}`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-red-500" />
            <p>Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible" 
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            variants={itemVariants} 
            className="text-3xl font-bold"
          >
            Transactions
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-muted-foreground"
          >
            View and manage your transaction history
          </motion.p>
        </div>
        <motion.div 
          variants={itemVariants}
          className="flex space-x-2"
        >
          <Button variant="outline" onClick={loadTransactions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter transactions by various criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by address or hash..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Token Filter */}
              <div className="space-y-2">
                <Label>Token</Label>
                <Select
                  value={filters.token}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, token: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Tokens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tokens</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => setFilters((prev) => ({ ...prev, dateFrom: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => setFilters((prev) => ({ ...prev, dateTo: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label>
                Amount Range: {filters.amountRange[0]} - {filters.amountRange[1]} ETH
              </Label>
              <Slider
                value={filters.amountRange}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, amountRange: value as [number, number] }))}
                max={100}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={applyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Label>Sort by:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id || tx.hash}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${
                          tx.type === "received"
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                        }`}
                      >
                        {tx.type === "received" ? <TrendingUp size={16} /> : <Send size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {tx.type === "received" ? "+" : "-"}
                            {tx.amount} {tx.token}
                          </p>
                          {getStatusBadge(tx.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tx.type === "received" ? "From" : "To"}:{" "}
                          {formatAddress(tx.type === "received" ? tx.from : tx.to)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {typeof tx.timestamp === 'string' 
                            ? format(new Date(tx.timestamp), "PPp") 
                            : format(tx.timestamp, "PPp")
                          } • Block #{tx.blockNumber?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(tx)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions found matching your filters.</p>
                <Button variant="outline" onClick={resetFilters} className="mt-4">
                  Reset Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>Complete information about this transaction</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Transaction Hash</Label>
                  <p className="text-sm text-muted-foreground font-mono break-all">{selectedTransaction.hash || selectedTransaction.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm">
                    {selectedTransaction.amount} {selectedTransaction.token}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm capitalize">{selectedTransaction.type}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">From</Label>
                <p className="text-sm text-muted-foreground font-mono break-all">{selectedTransaction.from || "Unknown"}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">To</Label>
                <p className="text-sm text-muted-foreground font-mono break-all">{selectedTransaction.to || "Unknown"}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Gas Used</Label>
                  <p className="text-sm">{selectedTransaction.gasUsed || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Gas Price</Label>
                  <p className="text-sm">{selectedTransaction.gasPrice || "N/A"} Gwei</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Block Number</Label>
                  <p className="text-sm">{selectedTransaction.blockNumber?.toLocaleString() || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm">
                    {selectedTransaction.timestamp ? (
                      typeof selectedTransaction.timestamp === 'string'
                        ? format(new Date(selectedTransaction.timestamp), "PPpp")
                        : format(selectedTransaction.timestamp, "PPpp")
                    ) : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Network</Label>
                <p className="text-sm">{getChainName(selectedTransaction.chainId || 1)}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                Close
              </Button>
              <Button onClick={() => {
                // Handle explorer view
                const txHash = selectedTransaction.hash || selectedTransaction.id;
                const chainId = selectedTransaction.chainId || 1;
                let explorerUrl = "";
                
                // Generate explorer URL based on chainId
                switch (chainId) {
                  case 1: // Ethereum Mainnet
                    explorerUrl = `https://etherscan.io/tx/${txHash}`;
                    break;
                  case 11155111: // Sepolia
                    explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
                    break;
                  case 137: // Polygon
                    explorerUrl = `https://polygonscan.com/tx/${txHash}`;
                    break;
                  case 80001: // Mumbai
                    explorerUrl = `https://mumbai.polygonscan.com/tx/${txHash}`;
                    break;
                  default:
                    explorerUrl = `https://etherscan.io/tx/${txHash}`;
                }
                
                window.open(explorerUrl, '_blank');
              }}>
                View on Explorer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  )
}