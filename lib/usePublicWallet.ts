"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  wallet_address: string
  display_name: string
  avatar_url?: string
  total_portfolio_value: number
}

export function usePublicWallet() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const { toast } = useToast()

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch("/api/public/verify-session")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Error checking session:", error)
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async (walletType: string) => {
    setConnecting(true)
    try {
      if (!window.ethereum) {
        throw new Error("No wallet detected")
      }

      const accounts = await (window.ethereum as any)?.request({
        method: "eth_requestAccounts",
      })

      const address = accounts[0]
      const chainId = await (window.ethereum as any)?.request({ method: "eth_chainId" })

      const message = `Welcome to Sentrix!\n\nSign this message to authenticate.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`

      const signature = await (window.ethereum as any)?.request({
        method: "personal_sign",
        params: [message, address],
      })

      const response = await fetch("/api/public/connect-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          message,
          chainId: Number.parseInt(chainId, 16),
          walletType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const result = await response.json()
      setUser(result.user)

      toast({
        title: "Connected!",
        description: "Your wallet has been connected successfully.",
      })

      return result
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      await fetch("/api/public/disconnect", { method: "POST" })
      setUser(null)
      toast({
        title: "Disconnected",
        description: "Your wallet has been disconnected.",
      })
    } catch (error) {
      console.error("Error disconnecting:", error)
    }
  }

  return {
    user,
    loading,
    connecting,
    connectWallet,
    disconnect,
    isConnected: !!user,
  }
}
