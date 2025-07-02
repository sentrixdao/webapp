import { createClient } from "@supabase/supabase-js"

// Force cloud Supabase URLs - never use localhost
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Validate that we have cloud URLs, not local ones
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
  console.warn("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment")
}

// Only restrict localhost URLs in production environments
if ((supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1")) && process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCALHOST_SUPABASE) {
  console.error("Local Supabase URL detected in production. Please use your cloud Supabase URL.")
  throw new Error("Please use your cloud Supabase URL, not localhost in production")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Server-side client for API routes
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    if (process.env.NODE_ENV !== 'production') {
      // Use anon key in development if service key is not available
      console.warn('SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key for server operations')
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Health check function for API
export async function checkSupabaseHealth() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    return {
      healthy: !error,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}
