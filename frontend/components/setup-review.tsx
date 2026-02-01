"use client"

import { useState } from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { GuardKallLogo } from "@/components/guardkall-logo"
import { ArrowLeft, Phone, Copy, Check, ChevronDown, ChevronUp, Smartphone } from "lucide-react"
import { IPhoneSimulator } from "@/components/iphone-simulator"

const CARRIERS = [
  {
    name: "Verizon",
    code: "*71",
    description: "Dial *71 followed by your GuardKall number",
    shortCode: "Ve",
  },
  {
    name: "AT&T",
    code: "*004*",
    description: "Dial *004* + GuardKall number + # (with country code)",
    shortCode: "AT",
  },
  {
    name: "T-Mobile",
    code: "*004*",
    description: "Dial *004* + GuardKall number + # (with country code)",
    shortCode: "T-",
  },
  {
    name: "Sprint",
    code: "*73",
    description: "Dial *73 followed by your GuardKall number",
    shortCode: "Sp",
  },
]

export function SetupReview() {
  const { user, setCurrentScreen } = useApp()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>("forwarding")
  const [showSimulator, setShowSimulator] = useState(false)
  const [silenceEnabled, setSilenceEnabled] = useState(false)

  const getFullDialCode = (carrier: typeof CARRIERS[0]) => {
    const guardKallNum = user?.guardKallNumber?.replace(/\D/g, "") || "7868525487"
    if (carrier.name === "Verizon" || carrier.name === "Sprint") {
      return `${carrier.code}${guardKallNum}`
    }
    return `${carrier.code}1${guardKallNum}#`
  }

  const copyToClipboard = (carrierName: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(carrierName)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentScreen("dashboard")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <GuardKallLogo size="md" showGlow={false} variant="minimal" />
            <div>
              <h1 className="font-bold text-foreground">Setup Instructions</h1>
              <p className="text-sm text-muted-foreground">Review your protection settings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* GuardKall Number Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Your GuardKall Number</p>
            <p className="text-3xl font-bold font-mono text-primary tracking-wider">
              {user?.guardKallNumber || "+1 (786) 852-5487"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This is your AI-protected line that screens unknown callers
            </p>
          </div>
        </div>

        {/* Call Forwarding Section */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === "forwarding" ? null : "forwarding")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <h3 className="font-semibold text-foreground">Call Forwarding Setup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enable Conditional Call Forwarding to route unanswered calls to GuardKall
              </p>
            </div>
            {expandedSection === "forwarding" ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {expandedSection === "forwarding" && (
            <div className="px-5 pb-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable Conditional Call Forwarding to route unanswered calls to GuardKall. Select your carrier:
              </p>
              
              {CARRIERS.map((carrier) => {
                const fullCode = getFullDialCode(carrier)
                return (
                  <div
                    key={carrier.name}
                    className="bg-secondary/50 border border-border rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{carrier.shortCode}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{carrier.name}</span>
                        <p className="text-sm text-muted-foreground">{carrier.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3">
                        <span className="text-xs text-muted-foreground block mb-1">Dial this code:</span>
                        <span className="font-mono text-lg text-primary font-semibold tracking-wide">
                          {fullCode}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(carrier.name, fullCode)}
                        className="px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all duration-200 flex items-center gap-2"
                      >
                        {copiedCode === carrier.name ? (
                          <>
                            <Check className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Silence Unknown Callers Section */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === "silence" ? null : "silence")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <h3 className="font-semibold text-foreground">Silence Unknown Callers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Let your phone auto-block spam. We'll screen the rest.
              </p>
            </div>
            {expandedSection === "silence" ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {expandedSection === "silence" && (
            <div className="px-5 pb-5">
              <p className="text-sm text-muted-foreground mb-4">
                Go to Settings {">"} Phone {">"} Silence Unknown Callers and enable the toggle.
              </p>
              
              <button
                onClick={() => setShowSimulator(true)}
                className="w-full p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-center gap-3 group"
              >
                <Smartphone className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">View Interactive Guide</span>
              </button>
            </div>
          )}
        </div>

        {/* iPhone Simulator Modal */}
        {showSimulator && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative">
              <button
                onClick={() => setShowSimulator(false)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white text-sm font-medium"
              >
                Close
              </button>
              <IPhoneSimulator 
                onComplete={() => {
                  setTimeout(() => setShowSimulator(false), 2000)
                }} 
                isActive={showSimulator}
              />
            </div>
          </div>
        )}

        {/* Rule of Thumb */}
        <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl">
          <p className="text-center text-foreground">
            <span className="font-semibold">Rule of thumb:</span> If you see an unknown caller, let it ring or hit decline.{" "}
            <span className="text-primary font-medium">We'll handle the rest.</span>
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            onClick={() => setCurrentScreen("dashboard")}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-lg shadow-lg shadow-primary/25"
          >
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  )
}
