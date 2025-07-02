import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/client"
import { TransactionService } from "@/lib/transaction-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { walletId, walletAddress } = await request.json()

    const syncedCount = await TransactionService.syncWalletTransactions(walletId, walletAddress)

    return NextResponse.json({
      success: true,
      syncedTransactions: syncedCount,
    })
  } catch (error) {
    console.error("Transaction sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
