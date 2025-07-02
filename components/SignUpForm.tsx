"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/useAuth"
import { Eye, EyeOff, Mail, Lock, User, UserCheck, ArrowRight, Loader2 } from "lucide-react"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { signUp, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signUp(email, password, fullName, username)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-4 shadow-lg"
          whileHover={{ scale: 1.05, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-white font-bold text-xl">S</span>
        </motion.div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Join Sentrix
        </h1>
        <p className="text-muted-foreground mt-2">Create your account to start your digital banking journey</p>
      </motion.div>

      {/* Form */}
      <motion.div
        variants={itemVariants}
        className="backdrop-blur-xl bg-white/70 dark:bg-black/70 rounded-3xl p-8 border border-white/20 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name Field */}
          <motion.div variants={itemVariants} className="space-y-2">
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
                className="pl-12 h-12 bg-white/50 dark:bg-black/50 border-white/20 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                required
              />
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-red-500/20 pointer-events-none"
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: focusedField === "fullName" ? 1 : 0,
                  scale: focusedField === "fullName" ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          </motion.div>

          {/* Username Field */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username
            </Label>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <UserCheck
                className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${
                  focusedField === "username" ? "text-red-500" : "text-muted-foreground"
                }`}
              />
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                className="pl-12 h-12 bg-white/50 dark:bg-black/50 border-white/20 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                required
              />
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-red-500/20 pointer-events-none"
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: focusedField === "username" ? 1 : 0,
                  scale: focusedField === "username" ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          </motion.div>

          {/* Email Field */}
          <motion.div variants={itemVariants} className="space-y-2">
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
                className="pl-12 h-12 bg-white/50 dark:bg-black/50 border-white/20 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                required
              />
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-red-500/20 pointer-events-none"
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: focusedField === "email" ? 1 : 0,
                  scale: focusedField === "email" ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          </motion.div>

          {/* Password Field */}
          <motion.div variants={itemVariants} className="space-y-2">
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="pl-12 pr-12 h-12 bg-white/50 dark:bg-black/50 border-white/20 focus:border-red-500/50 focus:ring-red-500/20 rounded-xl transition-all duration-200"
                required
                minLength={6}
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
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                {loading ? (
                  <motion.div className="flex items-center space-x-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </motion.div>
                ) : (
                  <motion.div className="flex items-center justify-center space-x-2" whileHover={{ x: 2 }}>
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          </motion.div>

          {/* Terms */}
          <motion.div variants={itemVariants} className="text-center">
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
        </form>
      </motion.div>
    </motion.div>
  )
}
