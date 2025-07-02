"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Wallet, X, CheckCircle, AlertCircle, Plus, Edit2 } from "lucide-react"
import { WalletService, type ConnectedWallet } from "@/lib/wallet-service"
import { Badge } from "@/components/ui/badge"
import { useAccount, useDisconnect, useChainId, useBalance } from "wagmi"
import { useAppKit } from '@reown/appkit/react'
import { motion, AnimatePresence } from "framer-motion"

interface WalletConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWalletUpdated: (wallet: ConnectedWallet | null) => void
  connectedWallet: ConnectedWallet | null
}

export default function WalletConnectionModal({
  open,
  onOpenChange,
  onWalletUpdated,
  connectedWallet,
}: WalletConnectionModalProps) {
  const [editingName, setEditingName] = useState(false)
  const [newWalletName, setNewWalletName] = useState("")
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  const { toast } = useToast()
  const [isAppKitAvailable, setIsAppKitAvailable] = useState(false)

  // Wagmi hooks
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { data: balance } = useBalance({ address })
  
  useEffect(() => {
    // Check if AppKit is available
    try {
      const { useAppKit } = require('@reown/appkit/react');
      const appKit = useAppKit();
      if (appKit && appKit.open) {
        setIsAppKitAvailable(true);
      }
    } catch (error) {
      console.warn('AppKit not available:', error);
      setIsAppKitAvailable(false);
    }
  }, []);
  
  // Safe AppKit open function
  const openAppKit = () => {
    try {
      if (typeof window !== 'undefined') {
        // Try custom event first (our fallback)
        const event = new CustomEvent('open-appkit-modal');
        window.dispatchEvent(event);
        
        // Try direct AppKit method as well
        try {
          const { useAppKit } = require('@reown/appkit/react');
          const appKit = useAppKit();
          if (appKit && appKit.open) {
            appKit.open();
          }
        } catch (error) {
          console.warn('Error using AppKit directly:', error);
        }
      }
    } catch (error) {
      console.warn('Error opening AppKit:', error);
      // Fallback message
      toast({
        title: "Wallet Connection",
        description: "Please connect your wallet using the browser extension.",
      });
    }
  };

  // Auto-save wallet when connection is detected
  useEffect(() => {
    if (isConnected && address && connector && !connectedWallet) {
      console.log(`New wallet detected: ${address}, saving to database`)
      handleSaveWallet(address, connector.name, connector.id)
    }
  }, [isConnected, address, connector, connectedWallet])

  const handleSaveWallet = async (walletAddress: string, walletName: string, walletType: string) => {
    try {
      setDatabaseError(null)
      
      await WalletService.connectWallet({
        address: walletAddress,
        name: walletName,
        type: walletType as any,
        chainId,
      })

      const updatedWallet = await WalletService.getUserWallet()
      onWalletUpdated(updatedWallet)

      toast({
        title: "Wallet Connected!",
        description: `Successfully connected ${walletName}`,
      })
    } catch (error) {
      console.error("Error saving wallet:", error)
      
      if (error instanceof Error) {
        if (error.message.includes('Database not initialized') || 
            error.message.includes('relation "public.user_wallets" does not exist')) {
          setDatabaseError("Database tables not found. Please set up the database first.")
        }
      }
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to save wallet",
        variant: "destructive",
      })
    }
  }

  const handleWalletDisconnect = async () => {
    try {
      await WalletService.disconnectWallet()
      onWalletUpdated(null)

      // Also disconnect from Web3
      if (isConnected) {
        disconnect()
      }

      toast({
        title: "Wallet Disconnected",
        description: "Wallet has been disconnected successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  const handleWalletRename = async (newName: string) => {
    try {
      await WalletService.updateWalletName(newName)
      const updatedWallet = await WalletService.getUserWallet()
      onWalletUpdated(updatedWallet)
      setEditingName(false)
      setNewWalletName("")

      toast({
        title: "Success",
        description: "Wallet name updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wallet name",
        variant: "destructive",
      })
    }
  }

  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: "Ethereum",
      137: "Polygon", 
      42161: "Arbitrum",
      11155111: "Sepolia",
      80001: "Mumbai",
      421613: "Arbitrum Goerli",
      10: "Optimism",
      420: "Optimism Goerli"
    }
    return chains[chainId] || `Chain ${chainId}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogTitle className="flex items-center">
              <motion.div
                whileHover={{ rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Wallet className="mr-2 h-5 w-5" />
              </motion.div>
              Manage Wallet
            </DialogTitle>
            <DialogDescription>Connect your crypto wallet to manage your digital assets securely</DialogDescription>
          </motion.div>
        </DialogHeader>

        {/* Database Error Warning */}
        <AnimatePresence>
          {databaseError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 mb-4"
            >
              <div className="flex items-start space-x-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Database Setup Required</h4>
                  <p className="text-xs text-red-700 dark:text-red-300 mb-2">{databaseError}</p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Please follow the instructions in <code className="bg-red-100 dark:bg-red-900 px-1 rounded">DATABASE_SETUP_README.md</code> to set up the required database tables.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connected Wallet */}
        <AnimatePresence>
          {connectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-3 mb-4"
            >
              <h4 className="text-sm font-medium text-muted-foreground">Your Wallet</h4>
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                      {editingName ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-2"
                        >
                          <Input
                            type="text"
                            value={newWalletName}
                            onChange={(e) => setNewWalletName(e.target.value)}
                            placeholder="Enter wallet name"
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleWalletRename(newWalletName)}
                              disabled={!newWalletName.trim()}
                              className="text-xs px-2 py-1 h-6"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingName(false)
                                setNewWalletName("")
                              }}
                              className="text-xs px-2 py-1 h-6"
                            >
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="display"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="min-w-0"
                        >
                          <div className="font-medium text-sm flex items-center">
                            <span className="truncate">{connectedWallet.wallet_name}</span>
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingName(true)
                                  setNewWalletName(connectedWallet.wallet_name)
                                }}
                                className="ml-2 h-6 w-6 p-0 text-xs flex-shrink-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </motion.div>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {connectedWallet.wallet_address.slice(0, 6)}...{connectedWallet.wallet_address.slice(-4)} • {connectedWallet.balance_eth} ETH
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="text-xs text-muted-foreground">${connectedWallet.balance_usd} USD</div>
                            <motion.div whileHover={{ scale: 1.1 }}>
                              <Badge variant="outline" className="text-xs">
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="w-2 h-2 bg-green-500 rounded-full mr-1"
                                />
                                {getChainName(connectedWallet.chain_id)}
                              </Badge>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWalletDisconnect}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Web3 Connection Status */}
        <AnimatePresence>
          {isConnected && address && !connectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800 mb-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </motion.div>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Wallet Connected</span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                {connector?.name}: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                Balance: {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
              </div>
              <div className="flex space-x-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm" 
                    onClick={() => connector && handleSaveWallet(address, connector.name, connector.id)} 
                    className="text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    Save Wallet
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" variant="outline" onClick={() => disconnect()} className="text-xs">
                    Disconnect
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connect Wallet - Single Button */}
        <AnimatePresence>
          {!connectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Connect Your Wallet</h4>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Button 
                  onClick={openAppKit}
                  className="w-full h-16 flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg">
                  <span className="mr-2">
                    <Plus className="h-6 w-6" />
                  </span>
                  <div className="text-left">
                    <div className="font-medium">Connect Wallet</div>
                    <div className="text-xs opacity-90">MetaMask, WalletConnect, Coinbase & more</div>
                  </div>
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-muted-foreground text-center space-y-1"
              >
                <div>💡 Connect your wallet to access your digital assets</div>
                <div>🔒 Only one wallet per account for security</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replace Wallet */}
        <AnimatePresence>
          {connectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Replace Wallet</h4>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Button
                  onClick={openAppKit}
                  variant="outline"
                  className="w-full h-12 flex items-center justify-center space-x-3 group"
                >
                  <span className="mr-2">
                    <Plus className="h-5 w-5 group-hover:text-primary" />
                  </span>
                  <div className="text-left">
                    <div className="font-medium group-hover:text-primary transition-colors">Connect Different Wallet</div>
                    <div className="text-xs opacity-70">This will replace your current wallet</div>
                  </div>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 rounded-lg border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-start space-x-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            </motion.div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Secure Wallet Connection</p>
              <p>
                Your wallet will be connected securely using industry-standard protocols. We never store your private keys or seed
                phrases. Only your wallet address is saved to your account.
              </p>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}