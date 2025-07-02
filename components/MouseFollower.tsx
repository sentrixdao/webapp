"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function MouseFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as Element
      if (target && typeof target.closest === "function") {
        if (target.closest("button, a, .interactive")) {
          setIsHovering(true)
        }
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as Element
      if (target && typeof target.closest === "function") {
        if (target.closest("button, a, .interactive")) {
          setIsHovering(false)
        }
      }
    }

    window.addEventListener("mousemove", updateMousePosition)
    document.addEventListener("mouseenter", handleMouseEnter, true)
    document.addEventListener("mouseleave", handleMouseLeave, true)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
      document.removeEventListener("mouseenter", handleMouseEnter, true)
      document.removeEventListener("mouseleave", handleMouseLeave, true)
    }
  }, [])

  return (
    <>
      {/* Main Cursor Follower - Simplified */}
      <motion.div
        className="fixed pointer-events-none z-50 mix-blend-normal"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.3,
        }}
      >
        <div
          className="w-6 h-6 rounded-full border-2 border-slate-800/80 dark:border-slate-200/80 relative"
          style={{
            background: `rgba(239, 68, 68, 0.1)`,
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          {/* Inner pulse effect */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-500/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          
          {/* Center dot */}
          <motion.div
            className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-red-500"
            style={{ transform: "translate(-50%, -50%)" }}
            animate={{ 
              scale: [1, 0.8, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
      
      {/* Additional trail effect */}
      <motion.div
        className="fixed pointer-events-none z-40"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          opacity: isHovering ? 0 : 0.5,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          mass: 0.5,
          opacity: { duration: 0.2 }
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`trail-${i}`}
            className="absolute rounded-full bg-red-500/20 dark:bg-red-500/30"
            style={{
              width: `${4 - i * 0.5}px`,
              height: `${4 - i * 0.5}px`,
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              x: `${-i * 3}px`,
              y: `${-i * 3}px`,
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              opacity: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: i * 0.1 }
            }}
          />
        ))}
      </motion.div>
    </>
  )
}
