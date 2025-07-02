import { defaultWagmiConfig } from "@web3modal/wagmi/react/config"
import { cookieStorage, createStorage } from "wagmi"
import { mainnet, sepolia, polygon, arbitrum } from "wagmi/chains"

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id"

if (!projectId) throw new Error("Project ID is not defined")

const metadata = {
  name: "Sentrix Banking DApp",
  description: "Next-generation decentralized banking platform",
  url: "https://sentrix.app", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
}

// Create wagmiConfig
const chains = [mainnet, sepolia, polygon, arbitrum] as const
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  enableWalletConnect: true, // Optional - true by default
  enableInjected: true, // Optional - true by default
  enableEIP6963: true, // Optional - true by default
  enableCoinbase: true, // Optional - true by default
})
