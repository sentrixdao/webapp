import { supabase } from "@/lib/client"
import { AuthService } from "@/lib/auth-service"

export interface WalletConnection {
  address: string
  name?: string
  type: "metamask" | "coinbase" | "walletconnect" | "trust" | "injected"
  chainId?: number
}

export interface ConnectedWallet {
  id: string
  user_id: string
  wallet_address: string
  wallet_name: string
  wallet_type: string
  balance_eth: string
  balance_usd: string
  chain_id: number
  created_at: string
}

export class WalletService {
  static async connectWallet(walletData: WalletConnection): Promise<ConnectedWallet> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      // First ensure user profile exists
      await this.ensureUserProfile(user)

      // Check if user already has a wallet (single wallet per account)
      const { data: existingWallet } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (existingWallet) {
        // Update existing wallet instead of creating new one
        const balance = await this.fetchWalletBalance(walletData.address, walletData.chainId || 1)
        
        const { data: updatedWallet, error } = await supabase
          .from("user_wallets")
          .update({
            wallet_address: walletData.address.toLowerCase(),
            wallet_name: walletData.name || `${this.getWalletDisplayName(walletData.type)} Wallet`,
            wallet_type: walletData.type,
            balance_eth: balance.eth,
            balance_usd: balance.usd,
            chain_id: walletData.chainId || 1,
          })
          .eq("id", existingWallet.id)
          .select()
          .single()

        if (error) throw new Error(`Failed to update wallet: ${error.message}`)
        return updatedWallet
      }

      // Fetch balance from blockchain
      const balance = await this.fetchWalletBalance(walletData.address, walletData.chainId || 1)

      // Insert new wallet (user's only wallet)
      const { data, error } = await supabase
        .from("user_wallets")
        .insert({
          user_id: user.id,
          wallet_address: walletData.address.toLowerCase(),
          wallet_name: walletData.name || `${this.getWalletDisplayName(walletData.type)} Wallet`,
          wallet_type: walletData.type,
          is_primary: true, // Always primary since it's the only wallet
          balance_eth: balance.eth,
          balance_usd: balance.usd,
          chain_id: walletData.chainId || 1,
        })
        .select()
        .single()

      if (error) {
        console.error("Database error connecting wallet:", error)
        if (error.message && error.message.includes('relation "public.user_wallets" does not exist')) {
          throw new Error('Database not initialized. Please contact support.')
        }
        throw new Error(`Failed to connect wallet: ${error.message || 'Unknown database error'}`)
      }
      
      return data
    } catch (error) {
      console.error("Error connecting wallet:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to connect wallet: Unknown error")
    }
  }

  // Helper method to ensure user profile exists
  static async ensureUserProfile(user: any) {
    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (!profile) {
        // Create user profile if it doesn't exist
        const username = user.user_metadata?.username || 
                        user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') || 
                        `user_${user.id.slice(0, 8)}`
        
        const { error } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            username: username,
          })

        if (error && !error.message?.includes('duplicate key')) {
          console.error("Error creating user profile:", error)
          throw error
        }
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error)
      throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async disconnectWallet() {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("user_wallets").delete().eq("user_id", user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      throw error
    }
  }

  static async updateWalletName(name: string) {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("user_wallets")
        .update({ wallet_name: name })
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating wallet name:", error)
      throw error
    }
  }

  static async getUserWallet(): Promise<ConnectedWallet | null> {
    try {
      const user = await AuthService.getCurrentUser()
      if (!user) {
        console.warn("User not authenticated")
        return null
      }

      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No wallet found - this is normal for new users
          return null
        }
        console.error("Database error fetching wallet:", error)
        if (error.message && (error.message.includes('relation "public.user_wallets" does not exist') || 
                              error.message.includes("42P01"))) {
          console.warn("Database tables not initialized. Please run DATABASE_SETUP.sql in your Supabase project.")
          return null
        }
        throw new Error(`Database error fetching wallet:\n\n${error.message || 'Unknown database error'}`)
      }
      
      return data
    } catch (error) {
      console.error("Error fetching user wallet:", error)
      if (error instanceof Error && error.message.includes("Database error fetching wallet")) {
        throw error
      }
      // For other errors, return null to prevent breaking the UI
      console.warn("Returning null wallet due to error:", error)
      return null
    }
  }

  static async refreshWalletBalance() {
    try {
      const wallet = await this.getUserWallet()
      if (!wallet) return false

      const balance = await this.fetchWalletBalance(wallet.wallet_address, wallet.chain_id)

      await supabase
        .from("user_wallets")
        .update({
          balance_eth: balance.eth,
          balance_usd: balance.usd,
        })
        .eq("id", wallet.id)

      return true
    } catch (error) {
      console.error("Error refreshing balance:", error)
      throw error
    }
  }

  static async fetchWalletBalance(address: string, chainId: number = 1): Promise<{ eth: string; usd: string }> {
    try {
      const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
      if (etherscanApiKey && etherscanApiKey !== 'YourEtherscanAPIKey' && etherscanApiKey !== 'etherscan_api_key') {
        let apiUrl = ""
        
        // Support mainnet and testnets
        switch (chainId) {
          case 1: // Ethereum Mainnet
            apiUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`
            break
          case 11155111: // Sepolia Testnet
            apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`
            break
          case 137: // Polygon Mainnet
            apiUrl = `https://api.polygonscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`
            break
          case 80001: // Polygon Mumbai Testnet
            apiUrl = `https://api-testnet.polygonscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`
            break
          default:
            console.warn(`Chain ${chainId} not supported for balance fetch, using mainnet`)
            apiUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey}`
        }

        const response = await fetch(apiUrl)
        const data = await response.json()

        if (data.status === "1") {
          const ethBalance = (Number.parseInt(data.result) / 1e18).toFixed(6)

          // Fetch ETH price from CoinGecko (testnets use same ETH price)
          const ethPrice = await this.fetchEthPrice()
          const usdBalance = (Number.parseFloat(ethBalance) * ethPrice).toFixed(2)

          return { eth: ethBalance, usd: usdBalance }
        }
      }

      // Return zero balance if API fails or not configured
      return { eth: "0.000000", usd: "0.00" }
    } catch (error) {
      console.error("Error fetching balance:", error)
      // Return zero balance on error
      return { eth: "0.000000", usd: "0.00" }
    }
  }

  static async fetchEthPrice(): Promise<number> {
    try {
      const coingeckoApiKey = process.env.COINGECKO_API_KEY
      const baseUrl = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      const apiUrl = coingeckoApiKey ? `${baseUrl}&x_cg_demo_api_key=${coingeckoApiKey}` : baseUrl
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      return data.ethereum?.usd || 2400 // Fallback price
    } catch (error) {
      console.error("Error fetching ETH price:", error)
      return 2400 // Fallback price
    }
  }

  static async fetchTransactions(address: string, chainId: number = 1) {
    try {
      // Validate parameters before making the API call
      if (!address || !address.startsWith('0x')) {
        console.warn('Invalid wallet address:', address);
        return []; // Return empty array for invalid address
      }
      
      const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
      // Provide mock data if no API key available or using placeholder values
      if (!etherscanApiKey || etherscanApiKey === 'YourEtherscanAPIKey') {
        console.info('Using mock transaction data (no valid Etherscan API key)');
        // Generate mock transactions
        return [
          {
            id: '0xb55a488e9db73fafb7c278b4c735bb88e5465e63661a1d1371428c954dfa2fe3',
            type: 'received',
            amount: '0.125000',
            token: 'ETH',
            from: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
            to: address,
            timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
            status: 'completed',
            gasUsed: '21000',
            gasPrice: '30',
            blockNumber: 19400000,
            hash: '0xb55a488e9db73fafb7c278b4c735bb88e5465e63661a1d1371428c954dfa2fe3',
            chainId: chainId,
          },
          {
            id: '0xd99c5d4d7a868ec62f78ba5c55e3ecb8deb95e5dd7a9c5fd14c3f036cb0a25a9',
            type: 'sent',
            amount: '0.050000',
            token: 'ETH',
            from: address,
            to: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8e1',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            status: 'completed',
            gasUsed: '21000',
            gasPrice: '25',
            blockNumber: 19400100,
            hash: '0xd99c5d4d7a868ec62f78ba5c55e3ecb8deb95e5dd7a9c5fd14c3f036cb0a25a9',
            chainId: chainId,
          },
          {
            id: '0x5557a59f7f283df8dc77927f1fa7f85aff3c904daea06d4b5237dd30ebeab650',
            type: 'sent',
            amount: '0.001500',
            token: 'ETH',
            from: address,
            to: '0x1234567890123456789012345678901234567890',
            timestamp: new Date(Date.now() - 43200000), // 12 hours ago
            status: 'completed',
            gasUsed: '21000',
            gasPrice: '20',
            blockNumber: 19400200,
            hash: '0x5557a59f7f283df8dc77927f1fa7f85aff3c904daea06d4b5237dd30ebeab650',
            chainId: chainId,
          }
        ];
      }
        let apiUrl = ""
        
        // Support mainnet and testnets
        switch (chainId) {
          case 1: // Ethereum Mainnet
            apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`
            break
          case 11155111: // Sepolia Testnet
            apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`
            break
          case 137: // Polygon Mainnet
            apiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`
            break
          case 80001: // Polygon Mumbai Testnet
            apiUrl = `https://api-testnet.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`
            break
          default:
            console.warn(`Chain ${chainId} not supported for transactions, using mainnet`)
            apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`
        }

        const response = await fetch(apiUrl)
      // Make the API call with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(apiUrl, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          } 
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`Etherscan API returned ${response.status}: ${response.statusText}`);
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === "1" && data.result) {
          return data.result.map((tx: any) => ({
            id: tx.hash,
            type: tx.from.toLowerCase() === address.toLowerCase() ? "sent" : "received",
            amount: (Number.parseInt(tx.value) / 1e18).toFixed(6),
            token: "ETH",
            from: tx.from,
            to: tx.to,
            timestamp: new Date(Number.parseInt(tx.timeStamp) * 1000),
            status: "completed",
            gasUsed: tx.gasUsed,
            gasPrice: (Number.parseInt(tx.gasPrice) / 1e9).toFixed(0),
            blockNumber: Number.parseInt(tx.blockNumber),
            hash: tx.hash,
            chainId: chainId,
          }));
        }
      } catch (error) {
        console.error('Error fetching from Etherscan API:', error);
        // Return fallback mock data on API error
        return [
          {
            id: '0xfallback1',
            type: 'received',
            amount: '0.055000',
            token: 'ETH',
            from: '0x3333333333333333333333333333333333333333',
            to: address,
            timestamp: new Date(Date.now() - 86400000 * 3),
            status: 'completed',
            gasUsed: '21000',
            gasPrice: '22',
            blockNumber: 19399000,
            hash: '0xfallback1',
            chainId: chainId,
          },
          {
            id: '0xfallback2',
            type: 'sent',
            amount: '0.025000',
            token: 'ETH',
            from: address,
            to: '0x4444444444444444444444444444444444444444',
            timestamp: new Date(Date.now() - 86400000 * 2.5),
            status: 'completed',
            gasUsed: '21000',
            gasPrice: '20',
            blockNumber: 19398500,
            hash: '0xfallback2',
            chainId: chainId,
          }
        ];
      }

      // Return empty array if no API key or API fails
      return []
    } catch (error) {
      console.error("Error fetching transactions:", error)
      // Return fallback data on any error
      return [
        {
          id: '0xerror1',
          type: 'received',
          amount: '0.011500',
          token: 'ETH',
          from: '0x9999999999999999999999999999999999999999',
          to: address,
          timestamp: new Date(Date.now() - 86400000 * 4),
          status: 'completed',
          gasUsed: '21000',
          gasPrice: '18',
          blockNumber: 19398000,
          hash: '0xerror1',
          chainId: chainId,
        },
        {
          id: '0xerror2',
          type: 'sent',
          amount: '0.003500',
          token: 'ETH',
          from: address,
          to: '0x8888888888888888888888888888888888888888',
          timestamp: new Date(Date.now() - 86400000 * 3.5),
          status: 'completed',
          gasUsed: '21000',
          gasPrice: '15',
          blockNumber: 19397500,
          hash: '0xerror2',
          chainId: chainId,
        }
      ]
    }
  }

  static getExplorerUrl(hash: string, chainId: number = 1): string {
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return `https://etherscan.io/tx/${hash}`;
      case 11155111: // Sepolia Testnet
        return `https://sepolia.etherscan.io/tx/${hash}`;
      case 137: // Polygon Mainnet
        return `https://polygonscan.com/tx/${hash}`;
      case 80001: // Polygon Mumbai Testnet
        return `https://mumbai.polygonscan.com/tx/${hash}`;
      case 42161: // Arbitrum Mainnet
        return `https://arbiscan.io/tx/${hash}`;
      case 421613: // Arbitrum Goerli Testnet
        return `https://goerli.arbiscan.io/tx/${hash}`;
      case 10: // Optimism Mainnet
        return `https://optimistic.etherscan.io/tx/${hash}`;
      case 420: // Optimism Goerli Testnet
        return `https://goerli-optimism.etherscan.io/tx/${hash}`;
      case 11155111: // Sepolia Testnet
        return `https://sepolia.etherscan.io/tx/${hash}`
      case 137: // Polygon Mainnet
        return `https://polygonscan.com/tx/${hash}`
      case 80001: // Polygon Mumbai Testnet
        return `https://mumbai.polygonscan.com/tx/${hash}`
      case 42161: // Arbitrum Mainnet
        return `https://arbiscan.io/tx/${hash}`
      case 421613: // Arbitrum Goerli Testnet
        return `https://goerli.arbiscan.io/tx/${hash}`
      case 10: // Optimism Mainnet
        return `https://optimistic.etherscan.io/tx/${hash}`
      case 420: // Optimism Goerli Testnet
        return `https://goerli-optimism.etherscan.io/tx/${hash}`
      default:
        return `https://etherscan.io/tx/${hash}`;
    }
  }

  private static getWalletDisplayName(type: string): string {
    const names: Record<string, string> = {
      metamask: "MetaMask",
      coinbase: "Coinbase Wallet",
      walletconnect: "WalletConnect",
      trust: "Trust Wallet",
      injected: "Browser Wallet",
    }
    return names[type] || "Unknown Wallet"
  }
}