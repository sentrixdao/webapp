"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Shield, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and multi-layer security protocols",
  },
  {
    icon: TrendingUp,
    title: "Real-time Analytics",
    description: "Live portfolio tracking and market insights",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Instant transactions and real-time updates",
  },
]

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <section className="h-screen flex items-center justify-center bg-white dark:bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, #ef444420 0%, transparent 60%)",
                "radial-gradient(circle at 80% 50%, #f9731620 0%, transparent 60%)",
                "radial-gradient(circle at 40% 80%, #eab30820 0%, transparent 60%)",
                "radial-gradient(circle at 20% 50%, #ec489920 0%, transparent 60%)",
                "radial-gradient(circle at 20% 50%, #ef444420 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          
          {/* Dynamic pulse effects */}
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`pulse-${i}`}
              className="absolute rounded-full"
              style={{
                background: `radial-gradient(circle, ${
                  ["#ef4444", "#f97316", "#eab308"][i]
                }20 0%, transparent 70%)`,
                width: `${300 + i * 100}px`,
                height: `${300 + i * 100}px`,
                left: `${[20, 70, 40][i]}%`,
                top: `${[30, 60, 20][i]}%`,
                transform: "translate(-50%, -50%)",
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Floating particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: `rgba(${
                [
                  "239, 68, 68", // red
                  "249, 115, 22", // orange
                  "236, 72, 153", // pink
                  "234, 179, 8", // yellow
                ][Math.floor(Math.random() * 4)]
              }, ${Math.random() * 0.3 + 0.3})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -(Math.random() * 100 + 50), 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-8 relative z-10 max-w-6xl">
        <div className="text-center">
          {/* Logo Animation */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 mb-6 shadow-2xl">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-red-600 to-orange-600 dark:from-white dark:via-red-400 dark:to-orange-400 bg-clip-text text-transparent leading-tight">
              Sentrix
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              The future of digital banking. Secure, fast, and intelligent crypto management for the modern world.
            </p>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mb-16"
          >
            <Link href="/auth">
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }} 
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl group relative overflow-hidden border border-white/10"
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ backgroundPosition: "0% 50%" }}
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    style={{
                      background: "linear-gradient(90deg, #ef4444, #f97316, #ec4899, #ef4444)",
                      backgroundSize: "400% 400%",
                    }}
                    transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  
                  {/* Sparkles */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={`btn-spark-${i}`}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: i * 0.5,
                        repeatDelay: Math.random() * 2,
                      }}
                    />
                  ))}

                  {/* Button content */}
                  <motion.div className="relative flex items-center space-x-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    <span>Access Sentrix</span>
                    <motion.div 
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="group-hover:translate-x-1 transition-transform duration-200"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Decorative elements */}
          <motion.div 
            className="absolute bottom-10 left-10 w-24 h-24 rounded-full border border-red-200/20 dark:border-red-800/20"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          
          <motion.div 
            className="absolute top-1/4 right-10 w-32 h-32 rounded-lg border border-orange-200/20 dark:border-orange-800/20"
            animate={{
              rotate: -360,
              scale: [1, 0.9, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          
          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 hover:border-red-500/20 transition-all duration-300">
                  {/* Centered Icon */}
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-6 h-6 text-red-500" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}