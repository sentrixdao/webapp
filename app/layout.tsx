import type React from "react"
import type { Metadata } from "next"
// import { Inter } from "next/font/google"
import "./globals.css"
import Script from "next/script"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/lib/providers"
import { Toaster } from "@/components/ui/toaster"

// const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sentrix - Digital Banking Platform",
  description: "Secure, fast, and intelligent crypto management for the modern world",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode 
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Web3Provider>
            {children}
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
        
        {/* Event listener for AppKit initialization */}
        <Script id="appkit-initializer" strategy="afterInteractive">
          {`
          window.addEventListener('load', () => {
            window.addEventListener('open-appkit-modal', () => {
              console.log('AppKit modal open requested via event');
            });
          });
          `}
        </Script>
      </body>
    </html>
  )
}
