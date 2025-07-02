import { supabase } from "@/lib/client"

export interface LocationData {
  ip: string
  city?: string
  country?: string
  region?: string
  isp?: string
  latitude?: number
  longitude?: number
}

export class SecurityService {
  static async trackLogin(sessionData: {
    ip: string
    userAgent: string
    deviceFingerprint?: string
  }) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Get location data
      const locationData = await this.getLocationData(sessionData.ip)

      // Check for suspicious activity
      const isSuspicious = await this.detectSuspiciousActivity(user.id, locationData)

      // Save login session
      const { data, error } = await supabase
        .from("login_sessions")
        .insert({
          user_id: user.id,
          ip_address: sessionData.ip,
          user_agent: sessionData.userAgent,
          device_fingerprint: sessionData.deviceFingerprint,
          location_data: locationData,
          suspicious_activity: isSuspicious,
        })
        .select()
        .single()

      if (error) throw error

      // Create security alert if suspicious
      if (isSuspicious) {
        await this.createSecurityAlert(user.id, {
          type: "suspicious_login",
          title: "Suspicious Login Detected",
          description: `Login from new location: ${locationData.city}, ${locationData.country}`,
          metadata: { locationData, sessionId: data.id },
        })
      }

      return data
    } catch (error) {
      console.error("Error tracking login:", error)
      throw error
    }
  }

  static async createSecurityAlert(
    userId: string,
    alertData: {
      type: string
      title: string
      description: string
      severity?: "low" | "medium" | "high" | "critical"
      metadata?: any
    },
  ) {
    try {
      const { data, error } = await supabase
        .from("security_alerts")
        .insert({
          user_id: userId,
          alert_type: alertData.type,
          title: alertData.title,
          description: alertData.description,
          severity: alertData.severity || "medium",
          metadata: alertData.metadata || {},
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating security alert:", error)
      throw error
    }
  }

  static async getSecurityAlerts(limit = 20, offset = 0) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("security_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching security alerts:", error)
      throw error
    }
  }

  static async markAlertAsRead(alertId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("security_alerts")
        .update({ is_read: true })
        .eq("id", alertId)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error marking alert as read:", error)
      throw error
    }
  }

  private static async getLocationData(ip: string): Promise<LocationData> {
    try {
      // Using ipapi.co for free tier (1000 requests/day)
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await response.json()

      return {
        ip,
        city: data.city,
        country: data.country_name,
        region: data.region,
        isp: data.org,
        latitude: data.latitude,
        longitude: data.longitude,
      }
    } catch (error) {
      console.error("Error fetching location data:", error)
      return { ip }
    }
  }

  private static async detectSuspiciousActivity(userId: string, locationData: LocationData): Promise<boolean> {
    try {
      // Get recent login sessions
      const { data: recentSessions } = await supabase
        .from("login_sessions")
        .select("location_data")
        .eq("user_id", userId)
        .gte("login_timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order("login_timestamp", { ascending: false })
        .limit(10)

      if (!recentSessions || recentSessions.length === 0) {
        return false // First login, not suspicious
      }

      // Check if location is significantly different
      const hasNewCountry = !recentSessions.some((session) => session.location_data?.country === locationData.country)

      return hasNewCountry
    } catch (error) {
      console.error("Error detecting suspicious activity:", error)
      return false
    }
  }
}
