"use client"

import { motion } from "framer-motion"
import { Wallet, BarChart3, Lock, Smartphone, CreditCard, TrendingUp } from "lucide-react"
import { useState, useEffect, useRef } from "react"

const features = [
  {
    icon: Wallet,
    title: "Multi-Wallet Support",
    description: "Connect with MetaMask, Coinbase Wallet, WalletConnect, and more popular wallets seamlessly.",
    color: "#3b82f6",
    lightColor: "rgba(59, 130, 246, 0.6)",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track your portfolio performance with detailed charts and comprehensive transaction history.",
    color: "#8b5cf6",
    lightColor: "rgba(139, 92, 246, 0.6)",
  },
  {
    icon: Lock,
    title: "Enhanced Security",
    description: "Multi-layer security with biometric authentication and hardware wallet integration.",
    color: "#10b981",
    lightColor: "rgba(16, 185, 129, 0.6)",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Optimized mobile experience with native app-like performance on all devices.",
    color: "#f59e0b",
    lightColor: "rgba(245, 158, 11, 0.6)",
  },
  {
    icon: CreditCard,
    title: "DeFi Integration",
    description: "Access lending, borrowing, and yield farming protocols directly from your dashboard.",
    color: "#ef4444",
    lightColor: "rgba(239, 68, 68, 0.6)",
  },
  {
    icon: TrendingUp,
    title: "Real-time Insights",
    description: "Get live market data, price alerts, and personalized investment recommendations.",
    color: "#06b6d4",
    lightColor: "rgba(6, 182, 212, 0.6)",
  },
]

export default function FeaturesSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [lightColor, setLightColor] = useState("#ffffff")
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setMousePosition({ x, y })

      // If hovering over a card, use that card's color
      if (hoveredCard !== null) {
        setLightColor(features[hoveredCard].color)
        return
      }

      // Otherwise, calculate light color based on mouse position and card distances
      const closestCards: { index: number; distance: number; color: string }[] = []

      cardRefs.current.forEach((cardRef, index) => {
        if (!cardRef) return

        const cardRect = cardRef.getBoundingClientRect()
        const cardX = cardRect.left + cardRect.width / 2 - rect.left
        const cardY = cardRect.top + cardRect.height / 2 - rect.top

        const distance = Math.sqrt(Math.pow(x - cardX, 2) + Math.pow(y - cardY, 2))
        closestCards.push({ index, distance, color: features[index].color })
      })

      if (closestCards.length > 0) {
        closestCards.sort((a, b) => a.distance - b.distance)
        const closest = closestCards.slice(0, 2)

        if (closest.length === 1) {
          setLightColor(closest[0].color)
        } else {
          // Mix colors based on distance
          const totalDistance = closest[0].distance + closest[1].distance
          const weight1 = 1 - closest[0].distance / totalDistance
          const weight2 = 1 - closest[1].distance / totalDistance

          const color1 = hexToRgb(closest[0].color)
          const color2 = hexToRgb(closest[1].color)

          if (color1 && color2) {
            const mixedColor = {
              r: Math.round(color1.r * weight1 + color2.r * weight2),
              g: Math.round(color1.g * weight1 + color2.g * weight2),
              b: Math.round(color1.b * weight1 + color2.b * weight2),
            }
            setLightColor(`rgb(${mixedColor.r}, ${mixedColor.g}, ${mixedColor.b})`)
          }
        }
      }
    }

    if (sectionRef.current) {
      sectionRef.current.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (sectionRef.current) {
        sectionRef.current.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [hoveredCard])

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  return (
    <section
      ref={sectionRef}
      className="h-screen flex items-center justify-center bg-white dark:bg-black relative overflow-hidden"
    >
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] z-0">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Additional decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Animated circles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`decor-circle-${i}`}
            className="absolute rounded-full border-2 opacity-10"
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`,
              border: `2px solid rgba(${
                [
                  "239, 68, 68", // red
                  "249, 115, 22", // orange
                  "236, 72, 153" // pink
                ][i]
              }, 0.3)`,
              left: `${[20, 70, 40][i]}%`,
              top: `${[60, 30, 80][i]}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 40 + i * 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
              scale: { duration: 10 + i * 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
            }}
          />
        ))}
        
        {/* Animated lines */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute bg-gradient-to-r from-red-500/10 to-transparent opacity-20"
            style={{
              height: '1px',
              width: '200px',
              top: `${(100 / 7) * (i + 1)}%`,
              left: i % 2 === 0 ? '-200px' : '100%',
            }}
            animate={{
              x: i % 2 === 0 ? ['0%', '100vw'] : ['0%', '-100vw'],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
              delay: i * 2,
            }}
          />
        ))}
      </div>

      {/* Mouse Light Effect - Smooth transitions */}
      <motion.div
        className="absolute pointer-events-none z-10"
        animate={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 150,
          mass: 0.5,
        }}
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          className="w-96 h-96 rounded-full blur-3xl"
          animate={{
            background: `radial-gradient(circle, ${lightColor}60 0%, ${lightColor}30 30%, transparent 70%)`,
            scale: hoveredCard !== null ? 1.3 : 1,
          }}
          transition={{
            background: { duration: 0.6, ease: "easeInOut" },
            scale: { duration: 0.4, ease: "easeOut" },
          }}
          style={{
            opacity: 0.25,
          }}
        />
      </motion.div>

      <div className="container mx-auto px-8 relative z-20 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h2
            className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Powerful Features
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Everything you need to manage your digital assets with confidence and ease.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              ref={(el) => {
                if (el) {
                  cardRefs.current[index] = el
                }
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className="group relative interactive"
            >
              <motion.div
                className="relative p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 backdrop-blur-xl transition-all duration-300 h-full hover:border-gray-300 dark:hover:border-gray-700"
                whileHover={{
                  boxShadow: `0 20px 40px ${feature.color}20`,
                }}
              >
                {/* Icon Container */}
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}10 100%)`,
                    border: `1px solid ${feature.color}30`,
                  }}
                  whileHover={["hover", "rotate"]}
                  variants={{
                    hover: {
                      scale: 1.1,
                      boxShadow: `0 0 20px ${feature.color}30`
                    },
                    rotate: {
                      rotate: [0, -10, 10, 0]
                    }
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    animate={{
                      filter: [
                        `drop-shadow(0 0 0px ${feature.color}00)`, 
                        `drop-shadow(0 0 5px ${feature.color}90)`,
                        `drop-shadow(0 0 0px ${feature.color}00)`
                      ]
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                  </motion.div>
                </motion.div>

                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-center">{feature.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}