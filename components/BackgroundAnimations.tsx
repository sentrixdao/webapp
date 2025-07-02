"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function BackgroundAnimations() {
  const [mounted, setMounted] = useState(false) 
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  if (!mounted || prefersReducedMotion) {
    return null
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            background: `linear-gradient(45deg, ${
              ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"][i]
            }, transparent)`,
            width: `${200 + i * 50}px`,
            height: `${200 + i * 50}px`,
          }}
          animate={{
            x: [0, 100, -50, -80, 0],
            y: [0, -100, 50, 30, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.2, 0.3, 0.2, 0.25, 0.2],
          }}
          transition={{
            duration: 30 + i * 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          initial={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`float-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 3 + 1}px`, 
            height: `${Math.random() * 3 + 1}px`,
            background: `rgba(${
              [
                "239, 68, 68",  // red
                "249, 115, 22", // orange
                "236, 72, 153", // pink
              ][Math.floor(Math.random() * 3)]
            }, ${0.3 + Math.random() * 0.4})`,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
            x: [0, Math.random() * 40 - 20],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: "100%",
          }}
        />
      ))}
      
      {/* Pulsing circles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute rounded-full opacity-5"
          style={{
            width: `${150 + i * 100}px`,
            height: `${150 + i * 100}px`,
            border: `1px solid rgba(239, 68, 68, ${0.1 + i * 0.05})`,
            left: `${[30, 60, 20][i]}%`,
            top: `${[40, 20, 70][i]}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.05, 0.1, 0.05],
            rotate: i % 2 === 0 ? [0, 180] : [180, 0],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`glow-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(239, 68, 68, 0.8)`,
            background: `rgba(239, 68, 68, 0.8)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
