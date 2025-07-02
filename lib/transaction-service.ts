import { supabase } from "@/lib/client"
import { AuthService } from "@/lib/auth-service"

export interface TransactionData {
  hash: string
  blockNumber: number
  from: string
  to: string
  value: string
  gasUsed: number
  gasPrice: string
  timestamp: number
  tokenSymbol?: string
  tokenAddress?: string
}

export class TransactionService {
  static async syncWalletTransactions(walletId: string, walletAddress: string) {
    try {
      const transactions = await this.fetchTransactionsFromEtherscan(walletAddress)

      for (const tx of transactions) {
        await this.saveTransaction(walletId, tx, walletAddress)
      }

      return transactions.length
    } catch (error) {
      console.error("Error syncing transactions:", error)
      throw error
    }
  }

  static async saveTransaction(walletId: string, txData: TransactionData, walletAddress: string) {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      // Check if transaction already exists
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("transaction_hash", txData.hash)
        .single()

      if (existing) return existing

      const transactionType = this.determineTransactionType(txData, walletAddress)
      const category = this.categorizeTransaction(txData)

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          transaction_hash: txData.hash,
          block_number: txData.blockNumber,
          from_address: txData.from,
          to_address: txData.to,
          value: txData.value,
          gas_used: txData.gasUsed,
          gas_price: txData.gasPrice,
          transaction_fee: (BigInt(txData.gasUsed) * BigInt(txData.gasPrice)).toString(),
          token_symbol: txData.tokenSymbol || "ETH",
          token_address: txData.tokenAddress,
          transaction_type: transactionType,
          status: "confirmed",
          timestamp: new Date(txData.timestamp * 1000).toISOString(),
          category: category,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error saving transaction:", error)
      throw error
    }
  }

  static async getUserTransactions(limit = 50, offset = 0) {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          user_wallets!inner (
            wallet_address,
            wallet_name,
            wallet_type
          )
        `)
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching transactions:", error)
      throw error
    }
  }

  static async getWalletTransactions(walletId: string, limit = 50, offset = 0) {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("wallet_id", walletId)
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching wallet transactions:", error)
      throw error
    }
  }

  private static async fetchTransactionsFromEtherscan(address: string): Promise<TransactionData[]> {
    try {
      const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
      if (!etherscanApiKey) {
        console.warn("Etherscan API key not provided, using mock data")
        return []
      }

      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`,
      )
      const data = await response.json()

      if (data.status === "1" && data.result) {
        return data.result.map((tx: any) => ({
          hash: tx.hash,
          blockNumber: Number.parseInt(tx.blockNumber),
          from: tx.from,
          to: tx.to,
          value: (Number.parseInt(tx.value) / 1e18).toString(),
          gasUsed: Number.parseInt(tx.gasUsed),
          gasPrice: tx.gasPrice,
          timestamp: Number.parseInt(tx.timeStamp),
          tokenSymbol: "ETH",
        }))
      }

      return []
    } catch (error) {
      console.error("Error fetching transactions from Etherscan:", error)
      return []
    }
  }

  private static determineTransactionType(tx: TransactionData, walletAddress: string): string {
    if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
      return "sent"
    } else if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
      return "received"
    }
    return "other"
  }

  private static categorizeTransaction(tx: TransactionData): string {
    // Simple categorization logic - can be enhanced
    if (tx.value === "0" && tx.to) {
      return "contract_interaction"
    } else if (Number.parseFloat(tx.value) > 0) {
      return "transfer"
    }
    return "other"
  }
}
