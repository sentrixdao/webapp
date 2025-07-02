import type { NextApiRequest, NextApiResponse } from "next"
import { checkSupabaseHealth } from "@/lib/client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check database connection
    const dbHealth = await checkSupabaseHealth()

    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseUrl: !!process.env.DATABASE_URL,
      jwtSecret: !!process.env.JWT_SECRET,
    }

    // Check external services
    const services = {
      database: dbHealth.healthy,
      environment: Object.values(envCheck).every(Boolean),
    }

    const allHealthy = Object.values(services).every(Boolean)

    res.status(allHealthy ? 200 : 500).json({
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services,
      environment: envCheck,
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
    })
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
