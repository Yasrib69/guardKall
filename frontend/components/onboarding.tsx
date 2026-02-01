"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApp } from "@/lib/app-context"
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  Shield,
  Sparkles,
  Check,
  Copy,
  Smartphone,
  ArrowRight,
} from "lucide-react"
import { GuardKallLogo } from "@/components/guardkall-logo"
import { SignInModal } from "@/components/sign-in-modal"
import { IPhoneSimulator } from "@/components/iphone-simulator"

type OnboardingStage =
  | "welcome"
  | "name"
  | "phone"
  | "password"
  | "email"
  | "guardkall-number"
  | "call-forwarding"
  | "silence-callers"
  | "complete"

const TOTAL_STAGES = 9

const carrierInstructions = [
  { carrier: "Verizon", code: "*71", description: "Dial code + GuardKall number" },
  { carrier: "AT&T", code: "*004*", description: "Dial code + 1 + GuardKall number + #" },
  { carrier: "T-Mobile", code: "*004*", description: "Dial code + 1 + GuardKall number + #" },
  { carrier: "Sprint", code: "*73", description: "Dial code + GuardKall number" },
]

export function Onboarding() {
  const { setCurrentScreen, setUser } = useApp()
  const [stage, setStage] = useState<OnboardingStage>("welcome")
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [isAnimating, setIsAnimating] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [guardKallNumber, setGuardKallNumber] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [silenceEnabled, setSilenceEnabled] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [simulatorComplete, setSimulatorComplete] = useState(false)

  // Real GuardKall/Teli phone number
  useEffect(() => {
    setGuardKallNumber("+1 (415) 360-8472")
  }, [])

  const stageOrder: OnboardingStage[] = [
    "welcome",
    "name",
    "phone",
    "password",
    "email",
    "guardkall-number",
    "call-forwarding",
    "silence-callers",
    "complete",
  ]

  const currentStageIndex = stageOrder.indexOf(stage)

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const getFullDialCode = (carrier: (typeof carrierInstructions)[0]) => {
    const guardKallNum = guardKallNumber.replace(/\D/g, "")
    if (carrier.carrier === "Verizon" || carrier.carrier === "Sprint") {
      return `${carrier.code}${guardKallNum}`
    }
    return `${carrier.code}1${guardKallNum}#`
  }

  const copyToClipboard = (text: string, type: "number" | "code") => {
    navigator.clipboard.writeText(text)
    if (type === "number") {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const goToStage = (newStage: OnboardingStage) => {
    if (isAnimating) return
    const newIndex = stageOrder.indexOf(newStage)
    setDirection(newIndex > currentStageIndex ? "forward" : "backward")
    setIsAnimating(true)
    setTimeout(() => {
      setStage(newStage)
      setIsAnimating(false)
      setError("")
    }, 300)
  }

  const nextStage = () => {
    // Validation
    if (stage === "name") {
      if (!firstName.trim()) {
        setError("Please enter your first name")
        return
      }
      if (!lastName.trim()) {
        setError("Please enter your last name")
        return
      }
    }
    if (stage === "phone") {
      if (phoneNumber.replace(/\D/g, "").length !== 10) {
        setError("Please enter a valid 10-digit phone number")
        return
      }
    }
    if (stage === "password") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }
    }

    const nextIndex = currentStageIndex + 1
    if (nextIndex < stageOrder.length) {
      goToStage(stageOrder[nextIndex])
    }
  }

  const prevStage = () => {
    const prevIndex = currentStageIndex - 1
    if (prevIndex >= 0) {
      goToStage(stageOrder[prevIndex])
    }
  }

  const DATA_SERVICE_URL = process.env.NEXT_PUBLIC_DATA_SERVICE_URL || "http://159.65.169.230:4003"

  const completeOnboarding = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const formattedPhone = `+1 ${phoneNumber}`

    try {
      // Register user in Snowflake
      // Teli service uses "last signup wins" - automatically routes to newest user
      await fetch(`${DATA_SERVICE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: email.trim() || "",
          phone: formattedPhone,
          password: password,
          risk: "",
          channel: ""
        })
      })
    } catch (err) {
      console.error("Failed to register user:", err)
      // Continue anyway - don't block the user
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phoneNumber: formattedPhone,
      guardKallNumber,
      isNewUser: false,
      setupComplete: true,
    }
    setUser(newUser)
    setCurrentScreen("dashboard")
  }

  // Animation classes - Apple-like smooth transitions
  const getAnimationClass = () => {
    if (isAnimating) {
      return direction === "forward"
        ? "opacity-0 translate-x-12 scale-95"
        : "opacity-0 -translate-x-12 scale-95"
    }
    return "opacity-100 translate-x-0 scale-100"
  }

  // Floating particles component with more variety
  const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${i % 3 === 0
            ? "w-2 h-2 bg-green-400/20"
            : i % 3 === 1
              ? "w-1 h-1 bg-emerald-500/30"
              : "w-1.5 h-1.5 bg-teal-400/25"
            }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[120px]" />
      </div>
      <FloatingParticles />

      {/* Progress Bar */}
      {stage !== "welcome" && stage !== "complete" && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-secondary">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentStageIndex) / (TOTAL_STAGES - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div
          className={`w-full max-w-lg transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${getAnimationClass()}`}
        >
          {/* Welcome Stage */}
          {stage === "welcome" && (
            <div className="text-center">
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-8 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                  <GuardKallLogo size="xl" showGlow={true} />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
                Welcome to GuardKall
              </h1>
              <p className="text-lg text-muted-foreground mb-12 leading-relaxed max-w-md mx-auto">
                AI-powered protection that keeps scammers away from you and your loved ones.
              </p>
              <Button
                onClick={nextStage}
                className="h-14 px-10 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 group"
              >
                Get Started
              </Button>
              <p className="mt-8 text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setShowSignIn(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>

              {/* Sign In Modal */}
              <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
            </div>
          )}

          {/* Name Stage */}
          {stage === "name" && (
            <div>
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-primary/20">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">What's your name?</h2>
                <p className="text-muted-foreground">Let's personalize your experience</p>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-14 px-5 bg-card border-border text-foreground text-lg placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all"
                    autoFocus
                  />
                </div>
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-14 px-5 bg-card border-border text-foreground text-lg placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all"
                  />
                </div>
              </div>
              {error && (
                <div className="mt-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 text-center">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Phone Stage */}
          {stage === "phone" && (
            <div>
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-primary/20">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Your phone number</h2>
                <p className="text-muted-foreground">We'll protect calls to this number</p>
              </div>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  +1
                </span>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="h-14 pl-12 pr-5 bg-card border-border text-foreground text-lg placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all"
                  autoFocus
                />
              </div>
              {error && (
                <div className="mt-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 text-center">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Password Stage */}
          {stage === "password" && (
            <div>
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-primary/20">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Secure your account</h2>
                <p className="text-muted-foreground">Create a strong password</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 px-5 pr-12 bg-card border-border text-foreground text-lg placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 px-5 bg-card border-border text-foreground text-lg placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all"
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground text-center">
                At least 6 characters
              </p>
              {error && (
                <div className="mt-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 text-center">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Email Stage */}
          {stage === "email" && (
            <div>
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-primary/20">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Add your email</h2>
                <p className="text-muted-foreground">Optional - for account recovery</p>
              </div>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 px-5 bg-card border-border text-foreground text-lg placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all"
                autoFocus
              />
              <p className="mt-3 text-sm text-muted-foreground text-center">
                You can skip this step
              </p>
            </div>
          )}

          {/* GuardKall Number Stage */}
          {stage === "guardkall-number" && (
            <div>
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-primary/20 relative">
                  <Shield className="w-8 h-8 text-primary" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Your GuardKall Number</h2>
                <p className="text-muted-foreground">Your personal AI-protected line</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                <div className="relative">
                  <p className="text-sm text-muted-foreground mb-2">Your unique number</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-foreground font-mono tracking-wider flex-1">
                      {guardKallNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(guardKallNumber, "number")}
                      className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-all duration-200"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Forward your calls to this number for AI protection
              </p>
            </div>
          )}

          {/* Call Forwarding Stage */}
          {stage === "call-forwarding" && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-primary/20">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Enable Call Forwarding</h2>
                <p className="text-muted-foreground">Select your carrier</p>
              </div>
              <div className="space-y-3">
                {carrierInstructions.map((carrier) => {
                  const fullCode = getFullDialCode(carrier)
                  const isSelected = selectedCarrier === carrier.carrier
                  return (
                    <div
                      key={carrier.carrier}
                      onClick={() => setSelectedCarrier(carrier.carrier)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedCarrier(carrier.carrier)}
                      className={`w-full p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{carrier.carrier}</span>
                        {isSelected && <Check className="w-5 h-5 text-primary" />}
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">Dial this code:</p>
                          <div className="flex items-center gap-3">
                            <code className="flex-1 bg-background px-4 py-3 rounded-xl font-mono text-primary text-lg">
                              {fullCode}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(fullCode, "code")
                              }}
                              className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-all"
                            >
                              {copiedCode ? (
                                <Check className="w-5 h-5 text-primary" />
                              ) : (
                                <Copy className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Silence Callers Stage - Interactive iPhone Simulator */}
          {stage === "silence-callers" && (
            <div className="flex flex-col items-center w-full">
              <div className="text-center mb-8 w-full">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-primary/20">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Enable Silence Unknown Callers</h2>
                <p className="text-muted-foreground text-base max-w-md mx-auto">
                  Follow the interactive guide below and replicate the exact steps on your real iPhone
                </p>
              </div>

              <div className="w-full flex justify-center">
                <IPhoneSimulator
                  onComplete={() => setSimulatorComplete(true)}
                  isActive={stage === "silence-callers"}
                />
              </div>
            </div>
          )}

          {/* Complete Stage */}
          {stage === "complete" && (
            <div className="text-center">
              <div className="mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                </div>
                <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Check className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">You're all set!</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-sm mx-auto">
                GuardKall is now protecting you from scam calls. Stay safe, {firstName}!
              </p>
              <Button
                onClick={completeOnboarding}
                className="h-14 px-10 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 group"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      {stage !== "welcome" && stage !== "complete" && (
        <div className="relative z-10 p-6 border-t border-border bg-card/50 backdrop-blur-xl">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <Button
              onClick={prevStage}
              variant="ghost"
              className="h-12 px-6 text-muted-foreground hover:text-foreground rounded-xl"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-1.5">
              {stageOrder.slice(1, -1).map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i < currentStageIndex - 1
                    ? "w-6 bg-primary"
                    : i === currentStageIndex - 1
                      ? "w-8 bg-gradient-to-r from-green-500 to-emerald-500"
                      : "w-1.5 bg-secondary"
                    }`}
                />
              ))}
            </div>
            <Button
              onClick={nextStage}
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl group"
            >
              {stage === "silence-callers" ? "Complete Setup" : "Continue"}
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Animation Keyframes */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-15px) translateX(5px) scale(1.1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-25px) translateX(-5px) scale(1.15);
            opacity: 0.7;
          }
          75% {
            transform: translateY(-10px) translateX(3px) scale(1.05);
            opacity: 0.4;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.5);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  )
}
