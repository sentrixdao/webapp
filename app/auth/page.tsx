"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/useAuth"
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [forgotPasswordClicked, setForgotPasswordClicked] = useState(false)
  const [laughEmojis, setLaughEmojis] = useState<{id: number, x: number, y: number, rotate: number, scale: number}[]>([])
  const [forceSignOut, setForceSignOut] = useState(false)
  const [animationsMounted, setAnimationsMounted] = useState(false)
  const { isAuthenticated, loading, signIn, signUp } = useAuth()
  const [formAnimations, setFormAnimations] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && !loading && !forceSignOut) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, loading, router, forceSignOut])

  useEffect(() => {
    // Enable animations after initial render to prevent hydration issues
    const timer = setTimeout(() => {
      setAnimationsMounted(true);
      setFormAnimations(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleForceSignOut = async () => {
    try {
      // Clear Supabase session
      const { supabase } = await import("@/lib/client")
      await supabase.auth.signOut()
      
      // Clear browser storage
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      setForceSignOut(true)
      
      // Reset form
      setEmail("")
      setPassword("")
      setFullName("")
      setShowPassword(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isSignUp) {
        // Generate a random 8-character username
        const randomUsername = Array.from(Array(8), () => 
          Math.floor(Math.random() * 36).toString(36)
        ).join('');
        
        await signUp(email, password, fullName, randomUsername)
        // Show email verification prompt
        setShowEmailPrompt(true)
      } else {
        await signIn(email, password)
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in to your account.",
        })
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const toggleMode = () => {
    // Create smooth transition between modes
    const timeline = async () => {
      // First fade out the form
      setAnimationsMounted(false)
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Switch mode and reset fields
      setIsSignUp(!isSignUp)
      setEmail("")
      setPassword("")
      setFullName("")
      setShowPassword(false)
      setForgotPasswordClicked(false)
      
      // Wait a bit to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Fade in with the new mode
      setAnimationsMounted(true)
    }
    
    timeline()
  }
  
  const handleForgotPassword = () => {
    setForgotPasswordClicked(true)

    // Create flying laugh emojis that start from bottom of the box
    const newEmojis = Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      // Random starting position along the bottom of the container
      x: Math.random() * 300 - 150, // Random x position between -150 and 150
      y: Math.random() * 20 + 100, // Start slightly below the bottom
      rotate: Math.random() * 360, // Random rotation
      scale: 0.5 + Math.random() * 1.5 // Random size
    }))
    
    setLaughEmojis(newEmojis)
    
    // Reset after animation completes
    setTimeout(() => {
      setForgotPasswordClicked(false)
      setLaughEmojis([])
    }, 3000)
  }

  // Dynamic background colors based on form state
  const getBgGradient = () => {
    if (loading) return "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30";
    return isSignUp 
      ? "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30"
      : "from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-black">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.p
            className="text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            Loading your experience...
          </motion.p>
          {isAuthenticated && (
            <Button
              onClick={handleForceSignOut}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Clear Session & Start Fresh
            </Button>
          )}
        </motion.div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const renderMain = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`min-h-screen bg-gradient-to-br ${getBgGradient()} dark:from-gray-900 dark:to-black relative overflow-hidden`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Dynamic accent gradient */}
        <motion.div
          className="absolute inset-0 z-0"
          animate={{
            background: isSignUp
              ? [
                  "radial-gradient(circle at 30% 40%, rgba(249, 115, 22, 0.15) 0%, transparent 60%)",
                  "radial-gradient(circle at 60% 30%, rgba(249, 115, 22, 0.15) 0%, transparent 60%)",
                  "radial-gradient(circle at 30% 40%, rgba(249, 115, 22, 0.15) 0%, transparent 60%)",
                ]
              : [
                  "radial-gradient(circle at 30% 40%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)",
                  "radial-gradient(circle at 60% 30%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)",
                  "radial-gradient(circle at 30% 40%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)",
                ]
          }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10 blur-3xl"
            style={{
              background: `linear-gradient(45deg, ${
                ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"][i]
              }, transparent)`,
              width: `${150 + i * 30}px`,
              height: `${150 + i * 30}px`,
            }}
            animate={{
              x: [0, 100, -50, -20, 0],
              y: [0, -100, 50, 20, 0],
              scale: [1, 1.2, 0.8, 0.9, 1],
              opacity: [0.1, 0.15, 0.1, 0.12, 0.1],
            }}
            transition={{
              duration: 20 + i * 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            initial={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      {/* Additional visual elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Animated circle borders */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`circle-border-${i}`}
            className="absolute rounded-full border-2 border-red-500/10 dark:border-red-500/5"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              top: `${[30, 60, 20][i]}%`,
              left: `${[70, 20, 50][i]}%`,
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              rotate: { duration: 30 + i * 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
              scale: { duration: 8 + i * 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
              opacity: { duration: 5 + i * 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
            }}
          />
        ))}
        
        {/* Floating dots */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`floating-dot-${i}`}
            className="absolute bg-red-500/20 dark:bg-red-500/30 rounded-full"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -Math.random() * 30 - 10],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header variants={itemVariants} className="p-6">
          <Link href="/">
            <motion.div
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition-colors duration-200"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </motion.div>
          </Link>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div variants={itemVariants} className="w-full max-w-md">
            {/* Header */}
            <motion.div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4 shadow-lg"
                whileHover={{ scale: 1.1, rotate: isSignUp ? -5 : 5, borderRadius: "25%" }}
                whileTap={{ scale: 0.9 }}
                animate={{ 
                  boxShadow: [
                    "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
                    "0 20px 35px -5px rgba(239, 68, 68, 0.5)",
                    "0 10px 25px -5px rgba(239, 68, 68, 0.4)"
                  ]
                }}
                transition={{ 
                  boxShadow: { repeat: Number.POSITIVE_INFINITY, duration: 3 },
                  borderRadius: { duration: 0.3 }
                }}
              >
                <motion.span 
                  className="text-white font-bold text-xl relative"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3, ease: "easeInOut" }}
                >
                  S
                  <motion.span
                    className="absolute inset-0 text-white opacity-0"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                  >
                    S
                  </motion.span>
                </motion.span>
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signup" : "signin"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    {isSignUp ? "Join Sentrix" : "Welcome Back"}
                  </h1> 
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: animationsMounted ? 1 : 0, y: animationsMounted ? 0 : 10 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-muted-foreground mt-2"
                  >
                    {isSignUp
                      ? "Create your account to start your digital banking journey"
                      : "Sign in to access your digital banking dashboard"}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Form */}
            <motion.div 
              variants={itemVariants}
              className="backdrop-blur-xl bg-white/70 dark:bg-black/70 rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden"
              whileHover={{ y: -3, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated gradient border */}
              <motion.div
                className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none"
                style={{ 
                  backgroundImage: `linear-gradient(90deg, transparent, ${isSignUp ? '#f97316' : '#ef4444'}40, transparent)`,
                  backgroundSize: "200% 200%",
                  boxShadow: "0 0 30px rgba(239, 68, 68, 0.1)",
                }}
                animate={{
                  backgroundPosition: formAnimations ? ["0% 50%", "100% 50%", "0% 50%"] : "0% 50%",
                  boxShadow: formAnimations ? [
                    "0 0 30px rgba(239, 68, 68, 0.1)",
                    "0 0 50px rgba(239, 68, 68, 0.2)",
                    "0 0 30px rgba(239, 68, 68, 0.1)"
                  ] : "0 0 30px rgba(239, 68, 68, 0.1)"
                }}
                transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {isSignUp && (
                    <motion.div 
                      key="fullName"
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ 
                        opacity: animationsMounted ? 1 : 0, 
                        height: "auto", 
                        scale: animationsMounted ? 1 : 0.95 
                      }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <motion.div
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <User
                          className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${
                            focusedField === "fullName" ? "text-red-500" : "text-muted-foreground"
                          }`}
                        />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onFocus={() => setFocusedField("fullName")}
                          onBlur={() => setFocusedField(null)}
                          className="pl-12 h-12 bg-white/80 dark:bg-black/70 border-white/20 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-300 text-base shadow-inner backdrop-blur-sm"
                          required={isSignUp}
                          autoFocus={true}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-red-500/20 pointer-events-none"
                          initial={{ opacity: 0, scale: 1 }}
                          animate={{
                            opacity: focusedField === "fullName" ? 1 : 0,
                            scale: focusedField === "fullName" ? 1.02 : 1,
                          }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: animationsMounted ? 1 : 0, y: animationsMounted ? 0 : 10 }}
                  transition={{ duration: 0.3, delay: isSignUp ? 0.2 : 0 }}
                >
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <motion.div
                    className="relative"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Mail
                      className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${
                        focusedField === "email" ? "text-red-500" : "text-muted-foreground"
                      }`}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className="pl-12 h-12 bg-white/80 dark:bg-black/70 border-white/20 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-300 text-base shadow-inner backdrop-blur-sm"
                      required
                    />
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-red-500/20 pointer-events-none"
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{
                        opacity: focusedField === "email" ? 1 : 0,
                        scale: focusedField === "email" ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                    />
                  </motion.div>
                </motion.div>

                {/* Password Field */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: animationsMounted ? 1 : 0, y: animationsMounted ? 0 : 10 }}
                  transition={{ duration: 0.3, delay: isSignUp ? 0.3 : 0.1 }}
                >
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <motion.div
                    className="relative"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Lock
                      className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${
                        focusedField === "password" ? "text-red-500" : "text-muted-foreground"
                      }`}
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isSignUp ? "Create a password" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="pl-12 pr-12 h-12 bg-white/80 dark:bg-black/70 border-white/20 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-300 text-base shadow-inner backdrop-blur-sm"
                      required
                      minLength={isSignUp ? 6 : undefined}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-red-500 transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </motion.button>
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-red-500/20 pointer-events-none"
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{
                        opacity: focusedField === "password" ? 1 : 0,
                        scale: focusedField === "password" ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                    />
                  </motion.div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: animationsMounted ? 1 : 0, y: animationsMounted ? 0 : 15 }}
                  transition={{ duration: 0.3, delay: isSignUp ? 0.4 : 0.2 }}
                >
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading || !email || !password || (isSignUp && !fullName)}
                      className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    >
                      {formAnimations && (
                        <motion.span 
                          className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/20 to-red-600/0"
                          initial={{ x: "-100%" }}
                          animate={{ x: "200%" }}
                          transition={{ 
                            repeat: Infinity, 
                            repeatType: "loop", 
                            duration: 2.5, 
                            ease: "easeInOut",
                            repeatDelay: 1
                          }}
                        />
                      )}
                      {loading ? (
                        <motion.div
                          className="flex items-center space-x-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                        </motion.div>
                      ) : (
                        <motion.div className="flex items-center justify-center space-x-2" whileHover={{ x: 2 }}>
                          <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                          <motion.div
                            animate={formAnimations ? { x: [0, 5, 0] } : {}}
                            transition={{ 
                              repeat: Infinity, 
                              repeatType: "mirror", 
                              duration: 1, 
                              repeatDelay: 1.5 
                            }}
                          >
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                          </motion.div>
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Forgot Password (Sign In only) */}
                {!isSignUp && (
                  <motion.div className="text-center">
                    <AnimatePresence mode="wait">
                      {forgotPasswordClicked ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative text-center py-4"
                        >
                          <motion.p
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-lg font-bold text-red-500"
                          >
                            Your Loss! 🤷‍♂️
                          </motion.p>
                          
                          {/* Flying emojis */}
                          {laughEmojis.map(emoji => (
                            <motion.div
                              key={emoji.id}
                              className="absolute"
                              initial={{
                                x: 0, 
                                y: emoji.y, 
                                opacity: 0,
                                rotate: emoji.rotate / 2,
                                scale: 0.5
                              }}
                              animate={{ 
                                x: emoji.x,
                                y: -Math.random() * 300 - 50, // Fly upward
                                opacity: [0, 1, 0],
                                rotate: emoji.rotate * 2,
                                scale: emoji.scale 
                              }}
                              transition={{ 
                                duration: 2.5,
                                ease: "easeOut",
                                delay: Math.random() * 0.5
                              }}
                              style={{ fontSize: '24px' }}
                            >
                              🤣
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-red-500 transition-colors duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.9 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: animationsMounted ? 1 : 0, y: animationsMounted ? 0 : 10 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          onClick={handleForgotPassword}
                        >
                          Forgot your password?
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Terms (Sign Up only) */}
                {isSignUp && (
                  <motion.div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      By creating an account, you agree to our{" "}
                      <motion.button
                        type="button"
                        className="text-red-500 hover:text-red-600 transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Terms of Service
                      </motion.button>{" "}
                      and{" "}
                      <motion.button
                        type="button"
                        className="text-red-500 hover:text-red-600 transition-colors duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Privacy Policy
                      </motion.button>
                    </p>
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Toggle Button */}
            <motion.div
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-sm text-muted-foreground mb-4">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleMode}
                  className="bg-white/50 dark:bg-black/50 border-white/20 hover:bg-white/70 dark:hover:bg-black/70 backdrop-blur-sm transition-all duration-300 group relative overflow-hidden"
                >
                  {formAnimations && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "loop", 
                        duration: 3, 
                        ease: "easeInOut",
                        repeatDelay: 1.5
                      }}
                    />
                  )}
                  <motion.div 
                    className="flex items-center space-x-2" 
                    whileHover={{ x: 2 }}
                  >
                    <Sparkles className="h-4 w-4 group-hover:text-red-500 transition-colors duration-200" />
                    <span>{isSignUp ? "Sign In Instead" : "Create Account"}</span>
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer variants={itemVariants} className="p-6 text-center">
          <p className="text-xs text-muted-foreground">© 2024 Sentrix. Secure digital banking for the modern world.</p>
        </motion.footer>
      </div>
    </motion.div>
  )

  // Email verification prompt modal
  function EmailVerificationPrompt() {
    if (!showEmailPrompt) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 relative overflow-hidden"
        >
          {/* Background animation */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-orange-500"
            initial={{ scaleX: 0, transformOrigin: "left" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <Mail className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox and spam folder to verify your email before signing in.
            </p>
            
            <div className="space-y-3 w-full">
              <Button 
                className="w-full bg-gradient-to-r from-red-500 to-orange-500"
                onClick={() => {
                  setShowEmailPrompt(false)
                  setIsSignUp(false) // Switch to sign in mode
                }}
              >
                Got it, I'll check my email
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowEmailPrompt(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
  
  return (
    <>
      {renderMain()}
      <AnimatePresence>
        {showEmailPrompt && <EmailVerificationPrompt />}
      </AnimatePresence>
    </>
  )
}