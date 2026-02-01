"use client"

import { useState, useEffect, useRef } from "react"
import { useApp } from "@/lib/app-context"
import { GuardKallLogo } from "@/components/guardkall-logo"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { SignInModal } from "@/components/sign-in-modal"

const AI_PERSONAS = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Eve",
  "Frank",
  "Grace",
  "Hannah",
  "Ivy",
  "Jack",
]

const PROTECTION_MESSAGES = [
  "Your Loved Ones from IRS Scams",
  "Grandma from Fake Tech Support",
  "Your Family from Robocalls",
  "Dad from Lottery Scams",
  "Mom from Bank Impersonators",
  "Your Parents from Medicare Fraud",
  "Grandpa from Gift Card Scams",
  "Your Family from Phishing Calls",
  "Seniors from Social Security Scams",
  "Your Home from Utility Fraud",
]

export function LandingPage() {
  const { setCurrentScreen } = useApp()
  const [showSignIn, setShowSignIn] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [currentPersona, setCurrentPersona] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  // Typing effect for protection messages
  useEffect(() => {
    const message = PROTECTION_MESSAGES[currentMessage]
    let charIndex = 0
    setDisplayedText("")
    setIsTyping(true)

    const typeInterval = setInterval(() => {
      if (charIndex < message.length) {
        setDisplayedText(message.slice(0, charIndex + 1))
        charIndex++
      } else {
        setIsTyping(false)
        clearInterval(typeInterval)
        // Wait and switch to next message
        setTimeout(() => {
          setCurrentMessage((prev) => (prev + 1) % PROTECTION_MESSAGES.length)
        }, 2000)
      }
    }, 80)

    return () => clearInterval(typeInterval)
  }, [currentMessage])

  // Animated waveform using canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener("resize", resize)

    const barCount = 60
    const barWidth = 8
    const barGap = 6
    const maxHeight = 180
    const minHeight = 20

    // Green shades for the waveform
    const greenShades = [
      "#22c55e", // green-500
      "#16a34a", // green-600
      "#4ade80", // green-400
      "#15803d", // green-700
      "#86efac", // green-300
      "#10b981", // emerald-500
      "#34d399", // emerald-400
      "#059669", // emerald-600
    ]

    // Secondary color (lighter green/teal for contrast)
    const secondaryShades = [
      "#5eead4", // teal-300
      "#2dd4bf", // teal-400
      "#14b8a6", // teal-500
      "#0d9488", // teal-600
    ]

    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      const centerX = canvas.offsetWidth / 2
      const centerY = canvas.offsetHeight / 2
      const totalWidth = barCount * (barWidth + barGap) - barGap

      for (let i = 0; i < barCount; i++) {
        // Create wave pattern with multiple frequencies
        const wave1 = Math.sin((i / barCount) * Math.PI * 4 + time * 2) * 0.4
        const wave2 = Math.sin((i / barCount) * Math.PI * 2 + time * 1.5) * 0.3
        const wave3 = Math.sin((i / barCount) * Math.PI * 6 + time * 3) * 0.2
        const wave4 = Math.cos((i / barCount) * Math.PI * 3 + time * 2.5) * 0.1

        // Combine waves with center emphasis
        const centerFactor = 1 - Math.abs(i - barCount / 2) / (barCount / 2)
        const combinedWave = (wave1 + wave2 + wave3 + wave4 + 0.5) * centerFactor

        const height = minHeight + combinedWave * (maxHeight - minHeight)
        const x = centerX - totalWidth / 2 + i * (barWidth + barGap)
        const y = centerY - height / 2

        // Alternate between green shades and secondary color based on pattern
        const useSecondary = Math.sin(i * 0.5 + time) > 0.3
        const colorArray = useSecondary ? secondaryShades : greenShades
        const colorIndex = Math.floor((Math.sin(i * 0.3 + time * 0.5) + 1) * (colorArray.length / 2))
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, y + height)
        gradient.addColorStop(0, colorArray[colorIndex % colorArray.length])
        gradient.addColorStop(0.5, colorArray[(colorIndex + 1) % colorArray.length])
        gradient.addColorStop(1, colorArray[(colorIndex + 2) % colorArray.length])

        // Draw rounded bar
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, height, barWidth / 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Add glow effect
        ctx.shadowColor = colorArray[colorIndex % colorArray.length]
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
      }

      time += 0.02
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Animated stats
  const [stats, setStats] = useState({ timeWasted: 0, intercepted: 0, protected: 0 })

  useEffect(() => {
    const targetStats = { timeWasted: 1159, intercepted: 38, protected: 848 }
    const duration = 2000
    const startTime = Date.now()

    const animateStats = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setStats({
        timeWasted: Math.floor(targetStats.timeWasted * easeOut),
        intercepted: Math.floor(targetStats.intercepted * easeOut),
        protected: Math.floor(targetStats.protected * easeOut),
      })

      if (progress < 1) {
        requestAnimationFrame(animateStats)
      }
    }

    animateStats()
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <GuardKallLogo size="sm" showGlow={false} variant="minimal" />
          <span className="font-semibold text-foreground text-lg">GuardKall</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSignIn(true)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </button>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-sm text-muted-foreground font-medium">LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Animated Waveform */}
        <div className="w-full max-w-4xl h-64 mb-8">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* Protecting Text */}
        <div className="text-center mb-10">
          <p className="text-xl text-muted-foreground">
            Protecting{" "}
            <span className="text-foreground font-medium">
              {displayedText}
              <span className={`${isTyping ? "opacity-100" : "opacity-0"} transition-opacity`}>|</span>
            </span>
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => setCurrentScreen("onboarding")}
          size="lg"
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-lg font-semibold shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
        >
          <Shield className="w-5 h-5 mr-2" />
          Get Protected
        </Button>
      </main>

      {/* Bottom Stats */}
      <footer className="relative z-10 border-t border-border/50 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-foreground font-mono">
              {formatTime(stats.timeWasted)}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">
              Time Wasted
            </p>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-foreground font-mono">
              {stats.intercepted}+
            </p>
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">
              Intercepted
            </p>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-foreground font-mono">
              {stats.protected}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mt-1">
              Protected
            </p>
          </div>
        </div>
      </footer>

      {/* Sign In Modal */}
      <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
    </div>
  )
}
