import { supabase } from "@/lib/client"
import { ethers } from "ethers"

export interface PublicWalletConnection {
  address: string
  signature: string
  message: string
  chainId: number
  walletType: "metamask" | "coinbase" | "walletconnect" | "trust" | "phantom"
}

export class PublicWalletService {
  /**
   * Connect wallet and create/login user
   */
  static async connectWallet(connectionData: PublicWalletConnection) {
    try {
      // Verify wallet signature
      const isValid = await this.verifyWalletSignature(
        connectionData.address,
        connectionData.message,
        connectionData.signature,
      )
      if (!isValid) throw new Error("Invalid wallet signature")

      // Set current wallet context for RLS
      await supabase.rpc("set_config", {
        parameter: "app.current_wallet",
        value: connectionData.address,
      })

      // Check if user exists, create if not
      let { data: user } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("wallet_address", connectionData.address)
        .single()

      if (!user) {
        // Create new user
        const { data: newUser, error } = await supabase
          .from("user_profiles")
          .insert({
            wallet_address: connectionData.address,
            display_name: `User ${connectionData.address.slice(0, 6)}...${connectionData.address.slice(-4)}`,
          })
          .select()
          .single()

        if (error) throw error
        user = newUser
      }

      // Create wallet session
      const sessionToken = this.generateSessionToken()
      const { data: session, error: sessionError } = await supabase
        .from("wallet_sessions")
        .insert({
          user_id: user.id,
          wallet_address: connectionData.address,
          session_token: sessionToken,
          signature: connectionData.signature,
          message: connectionData.message,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Add wallet to connected wallets if not exists
      await this.addConnectedWallet(user.id, connectionData)

      return {
        user,
        session,
        sessionToken,
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  /**
   * Add a new wallet to user's connected wallets
   */
  static async addConnectedWallet(userId: string, connectionData: PublicWalletConnection) {
    try {
      // Check if wallet already connected
      const { data: existing } = await supabase
        .from("connected_wallets")
        .select("id")
        .eq("user_id", userId)
        .eq("wallet_address", connectionData.address)
        .eq("chain_id", connectionData.chainId)
        .single()

      if (existing) {
        // Update last activity
        await supabase
          .from("connected_wallets")
          .update({ last_activity: new Date().toISOString() })
          .eq("id", existing.id)
        return existing
      }

      // Check if this is the first wallet (make it primary)
      const { data: userWallets } = await supabase.from("connected_wallets").select("id").eq("user_id", userId)

      const isPrimary = !userWallets || userWallets.length === 0

      // Insert new wallet
      const { data, error } = await supabase
        .from("connected_wallets")
        .insert({
          user_id: userId,
          wallet_address: connectionData.address,
          wallet_name: `${connectionData.walletType} Wallet`,
          wallet_type: connectionData.walletType,
          chain_id: connectionData.chainId,
          is_primary: isPrimary,
          is_verified: true,
          verification_signature: connectionData.signature,
        })
        .select()
        .single()

      if (error) throw error

      // Fetch initial balance
      await this.updateWalletBalance(data.id, connectionData.address, connectionData.chainId)

      return data
    } catch (error) {
      console.error("Error adding connected wallet:", error)
      throw error
    }
  }

  /**
   * Get user's connected wallets
   */
  static async getConnectedWallets(walletAddress: string) {
    try {
      // Set wallet context
      await supabase.rpc("set_config", {
        parameter: "app.current_wallet",
        value: walletAddress,
      })

      const { data, error } = await supabase
        .from("connected_wallets")
        .select(`
          *,
          token_balances (*)
        `)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching connected wallets:", error)
      throw error
    }
  }

  /**
   * Update wallet balance from blockchain
   */
  static async updateWalletBalance(walletId: string, walletAddress: string, chainId: number) {
    try {
      const balance = await this.fetchWalletBalance(walletAddress, chainId)
      const usdValue = await this.getETHPriceUSD()

      // Update wallet balance
      await supabase
        .from("connected_wallets")
        .update({
          balance_eth: balance,
          balance_usd: (Number.parseFloat(balance) * usdValue).toFixed(2),
        })
        .eq("id", walletId)

      // Update token balances table
      await supabase.from("token_balances").upsert({
        wallet_id: walletId,
        chain_id: chainId,
        token_symbol: "ETH",
        token_address: "0x0000000000000000000000000000000000000000",
        token_name: "Ethereum",
        balance: balance,
        balance_formatted: `${Number.parseFloat(balance).toFixed(4)} ETH`,
        usd_value: (Number.parseFloat(balance) * usdValue).toFixed(2),
        price_per_token: usdValue.toFixed(2),
      })

      return balance
    } catch (error) {
      console.error("Error updating wallet balance:", error)
      throw error
    }
  }

  /**
   * Verify wallet session
   */
  static async verifySession(sessionToken: string) {
    try {
      const { data: session, error } = await supabase
        .from("wallet_sessions")
        .select(`
          *,
          user_profiles (*)
        `)
        .eq("session_token", sessionToken)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (error || !session) return null

      // Set wallet context for RLS
      await supabase.rpc("set_config", {
        parameter: "app.current_wallet",
        value: session.wallet_address,
      })

      return session
    } catch (error) {
      console.error("Error verifying session:", error)
      return null
    }
  }

  /**
   * Get public user profile
   */
  static async getPublicProfile(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          id,
          wallet_address,
          display_name,
          avatar_url,
          created_at,
          total_portfolio_value,
          connected_wallets!inner (
            wallet_address,
            wallet_type,
            balance_usd,
            chain_id
          ),
          portfolio_analytics (
            total_value_usd,
            total_tokens_count,
            total_nfts_count,
            profit_loss_24h,
            profit_loss_7d
          )
        `)
        .eq("wallet_address", walletAddress)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching public profile:", error)
      throw error
    }
  }

  /**
   * Get public activity feed
   */
  static async getPublicActivityFeed(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from("activity_feed")
        .select(`
          *,
          user_profiles!inner (
            wallet_address,
            display_name,
            avatar_url
          )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching activity feed:", error)
      throw error
    }
  }

  /**
   * Sync wallet transactions from blockchain
   */
  static async syncWalletTransactions(walletAddress: string, chainId: number) {
    try {
      const transactions = await this.fetchTransactionsFromBlockchain(walletAddress, chainId)

      // Get user and wallet info
      const { data: user } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("wallet_address", walletAddress)
        .single()

      if (!user) throw new Error("User not found")

      const { data: wallet } = await supabase
        .from("connected_wallets")
        .select("id")
        .eq("user_id", user.id)
        .eq("wallet_address", walletAddress)
        .eq("chain_id", chainId)
        .single()

      if (!wallet) throw new Error("Wallet not found")

      // Save transactions
      for (const tx of transactions) {
        await this.saveTransaction(user.id, wallet.id, tx, walletAddress, chainId)
      }

      return transactions.length
    } catch (error) {
      console.error("Error syncing transactions:", error)
      throw error
    }
  }

  // Private helper methods
  private static async verifyWalletSignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature)
      return recoveredAddress.toLowerCase() === address.toLowerCase()
    } catch (error) {
      console.error("Error verifying signature:", error)
      return false
    }
  }

  private static generateSessionToken(): string {
    return ethers.hexlify(ethers.randomBytes(32))
  }

  private static async fetchWalletBalance(address: string, chainId: number): Promise<string> {
    try {
      let apiUrl = ""
      if (chainId === 1) {
        // Ethereum mainnet
        apiUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY}`
      } else if (chainId === 137) {
        // Polygon
        apiUrl = `https://api.polygonscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_API_KEY}`
      }

      const response = await fetch(apiUrl)
      const data = await response.json()

      if (data.status === "1") {
        return ethers.formatEther(data.result)
      }
      return "0"
    } catch (error) {
      console.error("Error fetching balance:", error)
      return "0"
    }
  }

  private static async getETHPriceUSD(): Promise<number> {
    try {
      // Using CoinGecko API with optional API key for higher rate limits
      const coingeckoApiKey = process.env.COINGECKO_API_KEY
      const baseUrl = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      const apiUrl = coingeckoApiKey ? `${baseUrl}&x_cg_demo_api_key=${coingeckoApiKey}` : baseUrl
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      return data.ethereum?.usd || 0
    } catch (error) {
      console.error("Error fetching ETH price:", error)
      return 0
    }
  }

  private static async fetchTransactionsFromBlockchain(address: string, chainId: number) {
    try {
      let apiUrl = ""
      if (chainId === 1) {
        apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`
      } else if (chainId === 137) {
        apiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`
      }

      const response = await fetch(apiUrl)
      const data = await response.json()

      if (data.status === "1" && data.result) {
        return data.result.map((tx: any) => ({
          hash: tx.hash,
          blockNumber: Number.parseInt(tx.blockNumber),
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          gasUsed: Number.parseInt(tx.gasUsed),
          gasPrice: tx.gasPrice,
          timestamp: Number.parseInt(tx.timeStamp),
          status: tx.txreceipt_status === "1" ? "confirmed" : "failed",
        }))
      }

      return []
    } catch (error) {
      console.error("Error fetching transactions:", error)
      return []
    }
  }

  private static async saveTransaction(
    userId: string,
    walletId: string,
    txData: any,
    walletAddress: string,
    chainId: number,
  ) {
    try {
      // Check if transaction already exists
      const { data: existing } = await supabase
        .from("blockchain_transactions")
        .select("id")
        .eq("transaction_hash", txData.hash)
        .eq("chain_id", chainId)
        .single()

      if (existing) return existing

      const transactionType = this.determineTransactionType(txData, walletAddress)
      const category = this.categorizeTransaction(txData)

      const { data, error } = await supabase
        .from("blockchain_transactions")
        .insert({
          user_id: userId,
          wallet_id: walletId,
          transaction_hash: txData.hash,
          chain_id: chainId,
          block_number: txData.blockNumber,
          from_address: txData.from,
          to_address: txData.to,
          value: txData.value,
          gas_used: txData.gasUsed,
          gas_price: txData.gasPrice,
          transaction_fee: (BigInt(txData.gasUsed) * BigInt(txData.gasPrice)).toString(),
          token_symbol: "ETH",
          transaction_type: transactionType,
          status: txData.status,
          timestamp: new Date(txData.timestamp * 1000).toISOString(),
          category: category,
        })
        .select()
        .single()

      if (error) throw error

      // Create activity feed entry
      await this.createActivityFeedEntry(userId, txData, transactionType)

      return data
    } catch (error) {
      console.error("Error saving transaction:", error)
      throw error
    }
  }

  private static determineTransactionType(tx: any, walletAddress: string): string {
    if (tx.from.toLowerCase() === walletAddress.toLowerCase()) {
      return "sent"
    } else if (tx.to.toLowerCase() === walletAddress.toLowerCase()) {
      return "received"
    }
    return "other"
  }

  private static categorizeTransaction(tx: any): string {
    if (tx.value === "0" && tx.to) {
      return "contract_interaction"
    } else if (Number.parseFloat(tx.value) > 0) {
      return "transfer"
    }
    return "other"
  }

  private static async createActivityFeedEntry(userId: string, txData: any, transactionType: string) {
    try {
      const amount = Number.parseFloat(txData.value)
      const ethPrice = await this.getETHPriceUSD()

      await supabase.from("activity_feed").insert({
        user_id: userId,
        activity_type: "transaction",
        title: `${transactionType === "sent" ? "Sent" : "Received"} ${amount.toFixed(4)} ETH`,
        description: `Transaction ${txData.hash.slice(0, 10)}...`,
        amount_usd: (amount * ethPrice).toFixed(2),
        token_symbol: "ETH",
        transaction_hash: txData.hash,
        chain_id: 1,
        is_public: true,
      })
    } catch (error) {
      console.error("Error creating activity feed entry:", error)
    }
  }
}
