"use client"

import React from "react"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GuardKallLogo } from "@/components/guardkall-logo"
import { Phone, Lock, Eye, EyeOff, X, AlertCircle } from "lucide-react"

// Mock registered users database (in production, this would be server-side)
const REGISTERED_USERS = [
  {
    id: "user1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phoneNumber: "(555) 123-4567",
    password: "password123",
    guardKallNumber: "+1 (786) 852-5487",
  },
  {
    id: "user2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    phoneNumber: "(555) 987-6543",
    password: "securepass456",
    guardKallNumber: "+1 (786) 555-1234",
  },
]

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { setCurrentScreen, setUser } = useApp()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isLocked) {
      setError(`Too many attempts. Please wait ${lockTimer} seconds.`)
      return
    }

    // Validate phone number
    if (phoneNumber.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    // Validate password
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    // Simulate network delay for security
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Check against registered users
    const cleanPhone = phoneNumber.replace(/\D/g, "")
    const user = REGISTERED_USERS.find((u) => {
      const userCleanPhone = u.phoneNumber.replace(/\D/g, "")
      return userCleanPhone === cleanPhone && u.password === password
    })

    if (user) {
      // Successful login
      setUser({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: `+1 ${user.phoneNumber}`,
        guardKallNumber: user.guardKallNumber,
        isNewUser: false,
        setupComplete: true,
      })
      setIsLoading(false)
      onClose()
      setCurrentScreen("dashboard")
    } else {
      // Failed login
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= 3) {
        setIsLocked(true)
        let timeLeft = 30
        setLockTimer(timeLeft)

        const timer = setInterval(() => {
          timeLeft -= 1
          setLockTimer(timeLeft)
          if (timeLeft <= 0) {
            clearInterval(timer)
            setIsLocked(false)
            setAttempts(0)
          }
        }, 1000)

        setError("Too many failed attempts. Please wait 30 seconds.")
      } else {
        setError(`Invalid phone number or password. ${3 - newAttempts} attempts remaining.`)
      }
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <GuardKallLogo size="lg" showGlow={true} />
            <h2 className="text-2xl font-bold text-foreground mt-4">Welcome Back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="signin-phone" className="text-foreground font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="signin-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isLocked}
                  className="pl-12 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  disabled={isLocked}
                  className="pl-12 pr-12 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : isLocked ? (
                `Locked (${lockTimer}s)`
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {"Don't have an account? "}
              <button
                onClick={() => {
                  onClose()
                  setCurrentScreen("onboarding")
                }}
                className="text-primary hover:underline font-medium"
              >
                Create Account
              </button>
            </p>
          </div>

          {/* Demo Hint */}
          <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
            <p className="text-xs text-muted-foreground text-center">
              Demo: Use (555) 123-4567 / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
