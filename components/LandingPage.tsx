"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import HeroSection from "./HeroSection"
import FeaturesSection from "./FeaturesSection"
import SecuritySection from "./SecuritySection"
import CTASection from "./CTASection"
import Navigation from "./Navigation"
import MouseFollower from "./MouseFollower"
import Footer from "./Footer"
import ScrollToTop from "./ScrollToTop"
import BackgroundAnimations from "./BackgroundAnimations"

const sections = [
  { id: "hero", component: HeroSection, label: "Home" },
  { id: "features", component: FeaturesSection, label: "Features" },
  { id: "security", component: SecuritySection, label: "Security" },
  { id: "cta", component: CTASection, label: "Get Started" },
]

export default function LandingPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [showFooter, setShowFooter] = useState(false)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return

      e.preventDefault()
      setIsScrolling(true)

      if (e.deltaY > 0) {
        if (currentSection < sections.length - 1) {
          setCurrentSection((prev) => prev + 1)
        } else if (currentSection === sections.length - 1 && !showFooter) {
          setShowFooter(true)
        }
      } else if (e.deltaY < 0) {
        if (showFooter) {
          setShowFooter(false)
        } else if (currentSection > 0) {
          setCurrentSection((prev) => prev - 1)
        }
      }

      setTimeout(() => setIsScrolling(false), 600)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return

      if (e.key === "ArrowDown") {
        setIsScrolling(true)
        if (currentSection < sections.length - 1) {
          setCurrentSection((prev) => prev + 1)
        } else if (currentSection === sections.length - 1 && !showFooter) {
          setShowFooter(true)
        }
        setTimeout(() => setIsScrolling(false), 600)
      } else if (e.key === "ArrowUp") {
        setIsScrolling(true)
        if (showFooter) {
          setShowFooter(false)
        } else if (currentSection > 0) {
          setCurrentSection((prev) => prev - 1)
        }
        setTimeout(() => setIsScrolling(false), 600)
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentSection, isScrolling, showFooter])

  return (
    <div className="relative">
      <Navigation
        sections={sections}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        showFooter={showFooter}
        setShowFooter={setShowFooter}
      />
      <MouseFollower />
      <BackgroundAnimations />
      <ScrollToTop />

      {/* Main Content */}
      <div className="h-screen overflow-hidden">
        {showFooter ? (
          // Footer view - show CTA section partially at top, footer below
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: "-50vh" }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
            style={{ height: "200vh" }}
          >
            {/* CTA Section */}
            <div className="h-screen">
              <CTASection />
            </div>
            {/* Footer Section */}
            <div className="h-screen">
              <Footer />
            </div>
          </motion.div>
        ) : (
          // Normal sections
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="h-full"
            >
              {(() => {
                const section = sections[currentSection]
                if (!section || !section.component) {
                  return <HeroSection />
                }
                const CurrentComponent = section.component
                return <CurrentComponent />
              })()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}