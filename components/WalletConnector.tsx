"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Wallet, Loader2 } from "lucide-react"

const supportedWallets = [
  {
    name: "MetaMask",
    icon: "🦊",
    id: "metamask",
    description: "Connect using MetaMask browser extension",
  },
  {
    name: "Coinbase Wallet",
    icon: "🔵",
    id: "coinbase",
    description: "Connect using Coinbase Wallet",
  },
  {
    name: "WalletConnect",
    icon: "🔗",
    id: "walletconnect",
    description: "Connect using WalletConnect protocol",
  },
  {
    name: "Trust Wallet",
    icon: "🛡️",
    id: "trust",
    description: "Connect using Trust Wallet mobile app",
  },
]

interface WalletConnectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: (user: any) => void
}

export default function WalletConnector({ open, onOpenChange, onConnected }: WalletConnectorProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const { toast } = useToast()

  const connectWallet = async (walletId: string) => {
    setConnecting(walletId)

    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected. Please install a Web3 wallet.")
      }

      // Request account access
      const accounts = await (window.ethereum as any)?.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }

      const address = accounts[0]
      const chainId = await (window.ethereum as any)?.request({ method: "eth_chainId" })

      // Create message to sign
      const message = `Welcome to Sentrix!\n\nSign this message to authenticate your wallet.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`

      // Request signature
      const signature = await (window.ethereum as any)?.request({
        method: "personal_sign",
        params: [message, address],
      })

      // Connect to backend
      const response = await fetch("/api/public/connect-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          message,
          chainId: Number.parseInt(chainId, 16),
          walletType: walletId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to connect wallet")
      }

      const result = await response.json()

      toast({
        title: "Wallet Connected!",
        description: `Successfully connected ${walletId}`,
      })

      onConnected(result.user)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Wallet connection error:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setConnecting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Sentrix and start managing your DeFi portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {supportedWallets.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              className="w-full justify-start h-16 bg-transparent"
              onClick={() => connectWallet(wallet.id)}
              disabled={connecting !== null}
            >
              {connecting === wallet.id ? (
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              ) : (
                <span className="mr-3 text-2xl">{wallet.icon}</span>
              )}
              <div className="text-left flex-1">
                <div className="font-medium">{wallet.name}</div>
                <div className="text-sm text-muted-foreground">{wallet.description}</div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>New to Web3?</strong> You'll need a crypto wallet to use Sentrix. We recommend starting with
            MetaMask - it's free and easy to set up.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
