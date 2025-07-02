"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { WagmiProvider } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

// 1. Configuration constants
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required for wallet functionality')
}

const networks = [mainnet, sepolia, polygon, arbitrum] as [AppKitNetwork, ...AppKitNetwork[]]

// 2. Create wagmi adapter without AppKit to avoid network issues
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

// 3. Initialize AppKit when provider mounts
let appKitInitialized = false

function initializeAppKit() {
  if (typeof window === 'undefined' || appKitInitialized) return
  
  try {
    // Import and create AppKit immediately when provider mounts
    import('@reown/appkit/react').then(({ createAppKit }) => {
      const metadata = {
        name: 'Sentrix Banking',
        description: 'Digital Banking Platform with Crypto Management',
        url: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
        icons: ['https://avatars.githubusercontent.com/u/37784886']
      }

      createAppKit({
        adapters: [wagmiAdapter],
        networks,
        projectId,
        metadata,
        features: {
          analytics: false,
          email: false,
          socials: false,
          emailShowWallets: false
        },
        enableNetworkView: true,
        enableAccountView: true
      })
      
      appKitInitialized = true
      console.log('AppKit initialized successfully')
    }).catch(error => {
      console.warn('AppKit initialization failed:', error)
    })
  } catch (error) {
    console.warn('Failed to load AppKit:', error)
  }
}

// Create a client for React Query
const queryClient = new QueryClient()

// Simple Web3 context for additional functionality
interface Web3ContextType {
  isConnected: boolean
  address: string | null
  connect: () => Promise<void>
  disconnect: () => void
  openAppKit: () => void
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

function Web3ContextProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Safe AppKit opener
  const openAppKit = useCallback(() => {
    // Try to open the modal using our custom event
    try {
      if (typeof window !== 'undefined') {
        // First try to use the actual AppKit method if available
        import('@reown/appkit/react').then(({ useAppKit }) => {
          try {
            const appKit = useAppKit();
            if (appKit && appKit.open) {
              appKit.open();
            } else {
              throw new Error("AppKit not initialized");
            }
          } catch (error) {
            // Fallback to custom event
            const event = new CustomEvent('open-appkit-modal');
            window.dispatchEvent(event);
          }
        }).catch(error => {
          console.warn("Failed to load AppKit:", error);
          toast({
            title: "Wallet Connection",
            description: "Please connect your wallet using your wallet provider.",
          });
        });
      }
    } catch (error) {
      console.warn('Failed to open AppKit modal:', error)
      toast({
        title: "Wallet Connection",
        description: "Please connect using your wallet provider directly.",
      });
    }
  }, [])

  // Initialize AppKit when component mounts
  useEffect(() => {
    initializeAppKit()
  }, [])

  const connect = async () => {
    setIsConnected(true)
    openAppKit()
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
  }
  
  return (
    <Web3Context.Provider value={{ 
      isConnected, 
      address, 
      connect, 
      disconnect, 
      openAppKit 
    }}>
      {children}
    </Web3Context.Provider>
  )
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3ContextProvider>
          {children}
        </Web3ContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}