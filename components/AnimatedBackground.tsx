"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }) 
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

  useEffect(() => {
    if (prefersReducedMotion) return
    
    const handleMouseMove = (e: MouseEvent) => { 
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [prefersReducedMotion])
  
  if (!mounted || prefersReducedMotion) {
    return null
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-pink-950/20" />

      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: "linear-gradient(45deg, #ef4444, #f97316, #ec4899)",
        }}
        animate={{
          x: mousePosition.x * 0.02,
          y: mousePosition.y * 0.02,
          scale: [1, 1.1, 1],
        }}
        transition={{
          scale: {
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
        initial={{ x: -200, y: -200 }}
      />

      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
          right: 0,
          bottom: 0,
        }}
        animate={{
          x: -mousePosition.x * 0.015,
          y: -mousePosition.y * 0.015,
          scale: [1, 1.2, 1],
        }}
        transition={{
          scale: {
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
        initial={{ x: 200, y: 200 }}
      />

      {/* Floating Particles */}
      {Array.from({ length: 35 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-red-400/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, Math.random() * 0.5 + 1, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Animated circles */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute rounded-full opacity-10 blur-2xl"
          style={{
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
            background: `radial-gradient(circle, ${
              ["#ef4444", "#f97316", "#ec4899"][i]
            } 0%, transparent 70%)`,
            left: `${10 + i * 30}%`,
            top: `${20 + i * 20}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px),
              radial-gradient(rgba(239, 68, 68, 0.05) 2px, transparent 2px)
            `,
            backgroundSize: "50px 50px, 50px 50px, 25px 25px",
          }}
        />
      </div>
      
      {/* Shooting stars */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-px h-[1px] bg-white"
          style={{
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 100}%`,
            background: `linear-gradient(to right, transparent, rgba(255,255,255,0.8) 50%, transparent)`,
            width: `${Math.random() * 100 + 50}px`,
          }}
          animate={{
            x: [0, -(Math.random() * 200 + 100)],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1 + Math.random(),
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 5 + Math.random() * 10,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}
