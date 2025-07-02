"use client"

import { motion } from "framer-motion"

export default function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -150, 0],
          y: [0, 100, 0],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"
      />

      {/* Additional animated gradients */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -70, 0],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="absolute top-1/4 left-3/4 w-[500px] h-[500px] bg-gradient-to-r from-red-400/10 to-amber-400/10 rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -50, 0],
          y: [0, 70, 0],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 35,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="absolute top-2/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-orange-400/10 to-red-400/10 rounded-full blur-3xl"
      />

      {/* Geometric Shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="absolute top-1/3 right-1/3 w-32 h-32 border border-blue-200/30 dark:border-blue-800/30 rounded-lg"
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="absolute bottom-1/3 left-1/3 w-24 h-24 border border-purple-200/30 dark:border-purple-800/30 rounded-full"
      />

      {/* Additional geometric elements */}
      <motion.div
        animate={{
          rotate: 180,
          scale: [1, 1.2, 1],
        }}
        transition={{
          rotate: { duration: 45, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          scale: { duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
        }}
        className="absolute top-1/2 left-2/3 w-40 h-40 border border-red-200/20 dark:border-red-800/20 rounded-full"
        style={{ borderWidth: "2px 0 0 2px" }}
      />

      <motion.div
        animate={{
          rotate: -120,
          scale: [1, 0.8, 1],
        }}
        transition={{
          rotate: { duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
          scale: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
        }}
        className="absolute top-2/3 left-1/4 w-32 h-32 border border-orange-200/20 dark:border-orange-800/20"
        style={{ borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%", borderWidth: "0 1px 1px 0" }}
      />

      {/* Glowing dots */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`glow-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${3 + Math.random() * 2}px`,
            height: `${3 + Math.random() * 2}px`,
            backgroundColor: "#ef4444",
            boxShadow: "0 0 8px 2px rgba(239, 68, 68, 0.5)",
            top: `${10 + Math.random() * 80}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            boxShadow: [
              "0 0 5px 1px rgba(239, 68, 68, 0.3)",
              "0 0 10px 3px rgba(239, 68, 68, 0.6)",
              "0 0 5px 1px rgba(239, 68, 68, 0.3)",
            ],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating Particles */}
      {Array.from({ length: 35 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            backgroundColor: [
              "#ef4444", // red
              "#f97316", // orange
              "#ec4899", // pink
              "#8b5cf6"  // purple
            ][Math.floor(Math.random() * 4)],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-Math.random() * 30 - 10, Math.random() * 10 - 5],
            x: [Math.random() * 10 - 5, Math.random() * 20 - 10],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
