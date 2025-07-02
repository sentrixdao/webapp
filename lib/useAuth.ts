"use client"

import { useState, useEffect } from "react"
import { AuthService } from "@/lib/auth-service"
import type { User, Session } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    AuthService.getSession().then((session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = AuthService.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (emailOrUsername: string, password: string) => {
    setLoading(true)
    try {
      const result = await AuthService.signIn(emailOrUsername, password)
      toast({
        title: "Welcome back!",
        description: `Signed in successfully as ${result.user.user_metadata?.full_name || result.user.email}`,
      })
      return result
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: error instanceof Error 
          ? error.message.includes("Invalid login") 
            ? "Invalid username, email or password. Please try again."
            : error.message 
          : "Please check your credentials and try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, username?: string) => {
    setLoading(true)
    try {
      const result = await AuthService.signUp(email, password, fullName)
      toast({
        title: "Welcome to Sentrix!",
        description: "Your account has been created successfully.",
      })
      return result
    } catch (error) {
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error 
          ? error.message.includes("User already registered")
            ? "An account with this email already exists. Please sign in instead."
            : error.message
          : "Please try again with different information.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }
}