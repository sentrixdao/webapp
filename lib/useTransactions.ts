"use client"

import { useState, useEffect } from "react"
import { TransactionService } from "@/lib/transaction-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "./useAuth"

export function useTransactions(walletId?: string) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  const fetchTransactions = async () => {
    if (!isAuthenticated) {
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = walletId
        ? await TransactionService.getWalletTransactions(walletId)
        : await TransactionService.getUserTransactions()
      setTransactions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions")
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const syncTransactions = async (walletId: string, walletAddress: string) => {
    try {
      const response = await fetch("/api/transactions/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, walletAddress }),
      })

      if (!response.ok) {
        throw new Error("Failed to sync transactions")
      }

      await fetchTransactions()
      toast({
        title: "Success",
        description: "Transactions synced successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to sync transactions",
        variant: "destructive",
      })
      throw err
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [walletId, isAuthenticated])

  return {
    transactions,
    loading,
    error,
    syncTransactions,
    refetch: fetchTransactions,
  }
}
