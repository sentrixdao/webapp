import { supabase } from "@/lib/client"

export class RateLimitService {
  static async checkRateLimit(
    userId: string,
    endpoint: string,
    maxRequests = 100,
    windowMinutes = 60,
  ): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const windowStart = new Date()
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes)

      // Get or create rate limit record
      const { data: existing } = await supabase
        .from("api_rate_limits")
        .select("*")
        .eq("user_id", userId)
        .eq("endpoint", endpoint)
        .gte("window_start", windowStart.toISOString())
        .single()

      if (existing) {
        if (existing.request_count >= maxRequests) {
          return { allowed: false, remaining: 0 }
        }

        // Increment counter
        const { error } = await supabase
          .from("api_rate_limits")
          .update({ request_count: existing.request_count + 1 })
          .eq("id", existing.id)

        if (error) throw error

        return {
          allowed: true,
          remaining: maxRequests - (existing.request_count + 1),
        }
      } else {
        // Create new rate limit record
        const { error } = await supabase.from("api_rate_limits").insert({
          user_id: userId,
          endpoint: endpoint,
          request_count: 1,
          window_start: new Date().toISOString(),
        })

        if (error) throw error

        return { allowed: true, remaining: maxRequests - 1 }
      }
    } catch (error) {
      console.error("Error checking rate limit:", error)
      // Allow request on error to avoid blocking users
      return { allowed: true, remaining: maxRequests }
    }
  }

  static async resetRateLimit(userId: string, endpoint: string) {
    try {
      const { error } = await supabase.from("api_rate_limits").delete().eq("user_id", userId).eq("endpoint", endpoint)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error resetting rate limit:", error)
      throw error
    }
  }
}
