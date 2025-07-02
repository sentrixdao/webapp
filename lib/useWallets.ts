"use client"

import { useState, useEffect } from "react"
import { WalletService } from "@/lib/wallet-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./useAuth"

export function useWallet() {
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  const fetchWallet = async () => {
    if (!isAuthenticated) {
      setWallet(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const userWallet = await WalletService.getUserWallet()
      setWallet(userWallet)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallet")
      toast({
        title: "Error",
        description: "Failed to fetch wallet",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async (walletData: any) => {
    try {
      await WalletService.connectWallet(walletData)
      await fetchWallet()
      toast({
        title: "Success",
        description: "Wallet connected successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to connect wallet",
        variant: "destructive",
      })
      throw err
    }
  }

  const disconnectWallet = async () => {
    try {
      await WalletService.disconnectWallet()
      await fetchWallet()
      toast({
        title: "Success",
        description: "Wallet disconnected successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
      throw err
    }
  }

  const updateWalletName = async (name: string) => {
    try {
      await WalletService.updateWalletName(name)
      await fetchWallet()
      toast({
        title: "Success",
        description: "Wallet name updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update wallet name",
        variant: "destructive",
      })
      throw err
    }
  }

  const refreshBalance = async () => {
    try {
      await WalletService.refreshWalletBalance()
      await fetchWallet()
      toast({
        title: "Success",
        description: "Balance refreshed successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh balance",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchWallet()
  }, [isAuthenticated])

  return {
    wallet,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    updateWalletName,
    refreshBalance,
    refetch: fetchWallet,
  }
}