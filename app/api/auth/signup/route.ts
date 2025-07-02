import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/client"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, username } = await request.json()
    const supabase = createServerSupabaseClient()

    // Generate a random username if none provided
    const randomUsername = username || Array.from(Array(8), () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('');

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: randomUsername,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create user profile if it doesn't exist
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            username: randomUsername,
          })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Continue anyway since the auth account was created
        }
      } catch (profileCreateError) {
        console.error("Error creating user profile:", profileCreateError)
        // Continue anyway, profile will be created on first login
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}