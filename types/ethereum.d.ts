declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
      isConnected?: boolean
      on?: (eventName: string, handler: (...args: any[]) => void) => void
      removeListener?: (eventName: string, handler: (...args: any[]) => void) => void
      selectedAddress?: string | null
      chainId?: string
    }
  }
}

export {}
