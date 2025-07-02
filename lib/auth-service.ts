import { supabase } from "@/lib/client"
import type { User } from "@supabase/supabase-js"

export class AuthService {
  static async signUp(email: string, password: string, fullName?: string, username?: string) {
    // If no username is provided, generate a random 8-character string
    const randomUsername = username || Array.from(Array(8), () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    
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

    if (error) throw error
    return data
  }

  static async signIn(usernameOrEmail: string, password: string) {
    try {
      // Always treat input as email now (username login was removed)
      const email = usernameOrEmail;
      
      // Login directly with email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }
    
  static async requestPasswordReset(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
    
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Password reset request error:", error);
      throw error;
    }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  static async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  static async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  static async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error("No user found")

    const { error } = await supabase.from("user_profiles").upsert({
      id: user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
  }
}
