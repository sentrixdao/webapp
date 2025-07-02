import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/client"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get current user auth status
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      }, { status: 400 })
    }

    if (data.user) {
      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.warn("Error fetching user profile:", profileError)
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          ...data.user,
          profile
        }
      })
    }

    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error("Auth status error:", error)
    return NextResponse.json(
      { error: "Internal server error", authenticated: false }, 
      { status: 500 }
    )
  }
}