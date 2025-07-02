'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Home, Search, Mail, Star, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
  opacity: number
}

interface FloatingElement {
  id: number
  x: number
  y: number
  baseY: number
  phase: number
  speed: number
  amplitude: number
  rotation: number
  rotationSpeed: number
  icon: React.ReactNode
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [backgroundPhase, setBackgroundPhase] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const lastTime = useRef<number>(0)
  
  // Check for reduced motion preference
  useEffect(() => {
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

  // Initialize component
  useEffect(() => {
    setMounted(true)
    
    if (!prefersReducedMotion && typeof window !== 'undefined') {
      // Initialize floating elements
      const elements: FloatingElement[] = []
      const icons = [
        <Star key="star" className="w-6 h-6" />,
        <Sparkles key="sparkles" className="w-5 h-5" />,
        <div key="circle" className="w-3 h-3 rounded-full bg-current" />,
        <div key="square" className="w-4 h-4 rotate-45 bg-current" />,
      ]
      
      for (let i = 0; i < 12; i++) {
        elements.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          baseY: Math.random() * window.innerHeight,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.4,
          amplitude: 2 + Math.random() * 3,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 0.8,
          icon: icons[Math.floor(Math.random() * icons.length)]
        })
      }
      setFloatingElements(elements)
    }
  }, [prefersReducedMotion])

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') return

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime.current
      lastTime.current = currentTime

      // Update background phase for gradient animation
      setBackgroundPhase(prev => (prev + 0.002) % (Math.PI * 2))

      // Update particles
      setParticles(prev => {
        return prev
          .map(particle => {
            const ageRatio = (particle.maxLife - particle.life) / particle.maxLife
            return {
              ...particle,
              x: particle.x + particle.vx,
              y: particle.y + particle.vy,
              life: particle.life - deltaTime,
              vy: particle.vy + 0.01, // Subtle gravity
              opacity: Math.max(0, 1 - ageRatio)
            }
          })
          .filter(particle => particle.life > 0 && particle.y < window.innerHeight + 100)
      })

      // Update floating elements
      setFloatingElements(prev => 
        prev.map(element => ({
          ...element,
          phase: element.phase + element.speed * 0.008,
          y: element.baseY + Math.sin(element.phase) * element.amplitude,
          rotation: element.rotation + element.rotationSpeed
        }))
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [prefersReducedMotion])

  // Mouse tracking and particle creation
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (prefersReducedMotion || typeof window === 'undefined') return
    
    setMousePos({ x: e.clientX, y: e.clientY })
    
    // Create particles on mouse move with throttling
    if (Math.random() < 0.1) {
      const colors = ['#ef4444', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4']
      
      const newParticle: Particle = {
        id: Date.now() + Math.random(),
        x: e.clientX + (Math.random() - 0.5) * 20,
        y: e.clientY + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2 - 0.5,
        size: 1 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1500 + Math.random() * 1000,
        maxLife: 2500,
        opacity: 1
      }
      
      setParticles(prev => [...prev.slice(-29), newParticle]) // Limit to 30 particles
    }
  }, [prefersReducedMotion])

  // Add mouse event listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  // Dynamic background gradient based on phase
  const backgroundGradient = `
    radial-gradient(circle at ${20 + Math.sin(backgroundPhase) * 10}% ${30 + Math.cos(backgroundPhase) * 10}%, 
    rgba(239, 68, 68, 0.1) 0%, transparent 50%),
    radial-gradient(circle at ${70 + Math.cos(backgroundPhase * 0.8) * 15}% ${60 + Math.sin(backgroundPhase * 0.8) * 15}%, 
    rgba(249, 115, 22, 0.08) 0%, transparent 50%),
    radial-gradient(circle at ${40 + Math.sin(backgroundPhase * 1.2) * 12}% ${80 + Math.cos(backgroundPhase * 1.2) * 12}%, 
    rgba(236, 72, 153, 0.06) 0%, transparent 50%)
  `

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-red-50 dark:from-gray-900 dark:via-black dark:to-red-950"
      style={{ 
        backgroundImage: prefersReducedMotion ? undefined : backgroundGradient,
        backgroundSize: '200% 200%'
      }}
    >
      {/* Particles */}
      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: particle.opacity,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}40`
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Elements */}
      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {floatingElements.map(element => (
            <div
              key={element.id}
              className="absolute text-red-200 dark:text-red-800 opacity-20"
              style={{
                left: element.x,
                top: element.y,
                transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
              }}
            >
              {element.icon}
            </div>
          ))}
        </div>
      )}

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* 404 Number with Creative Typography */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.25, 0.1, 0.25, 1],
              type: "spring",
              stiffness: 100
            }}
            className="mb-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.h1 
              className="text-[12rem] md:text-[16rem] lg:text-[20rem] font-black leading-none bg-gradient-to-br from-red-500 via-orange-500 to-pink-500 bg-clip-text text-transparent relative"
              animate={!prefersReducedMotion ? {
                textShadow: isHovered ? [
                  "0 0 20px rgba(239, 68, 68, 0.3)",
                  "0 0 40px rgba(239, 68, 68, 0.5)",
                  "0 0 20px rgba(239, 68, 68, 0.3)"
                ] : "0 0 0px rgba(239, 68, 68, 0)"
              } : {}}
              transition={{ duration: 0.3 }}
            >
              404
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{ backgroundSize: "400% 400%" }}
                >
                  404
                </motion.div>
              )}
            </motion.h1>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Looks like this page took an unexpected detour. Don't worry, even the best navigation systems sometimes lose their way. Let's get you back on track!
            </p>
          </motion.div>

          {/* Navigation Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  Return Home
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild variant="outline" className="border-2 border-gray-300 dark:border-gray-700 px-8 py-3 rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                <Link href="/auth" className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  Access Sentrix
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild variant="outline" className="border-2 border-gray-300 dark:border-gray-700 px-8 py-3 rounded-2xl bg-white/70 dark:bg-black/70 backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                <Link href="mailto:support@sentrix.com" className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Support
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Brand Logo */}

          {/* Mouse Follower Hint */}
          {!prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.p
                className="text-sm text-gray-400 dark:text-gray-600"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✨ Move your mouse around to create particles
              </motion.p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Cursor Follower */}
      {!prefersReducedMotion && (
        <motion.div
          className="fixed pointer-events-none z-30 mix-blend-screen"
          animate={{
            x: mousePos.x - 25,
            y: mousePos.y - 25,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.2
          }}
        >
          <div
            className="w-12 h-12 rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)",
              filter: "blur(4px)"
            }}
          />
        </motion.div>
      )}
    </div>
  )
}