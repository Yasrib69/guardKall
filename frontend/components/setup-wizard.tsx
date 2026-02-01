"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useApp } from "@/lib/app-context"
import {
  Phone,
  Settings,
  Bell,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Smartphone,
  Info,
  ArrowLeft,
  Shield,
} from "lucide-react"
import { GuardKallLogo } from "@/components/guardkall-logo"

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
}

const carrierInstructions = [
  { carrier: "Verizon", code: "*71", description: "Dial *71 followed by your GuardKall number" },
  { carrier: "AT&T", code: "*004*", description: "Dial *004* + GuardKall number + # (with country code)" },
  { carrier: "T-Mobile", code: "*004*", description: "Dial *004* + GuardKall number + # (with country code)" },
  { carrier: "Sprint", code: "*73", description: "Dial *73 followed by your GuardKall number" },
]

export function SetupWizard() {
  const { user, setUser, setCurrentScreen } = useApp()
  const [copied, setCopied] = useState(false)
  const [copiedCarrier, setCopiedCarrier] = useState<string | null>(null)
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "forward",
      title: "Enable Call Forwarding",
      description: "Set up conditional call forwarding on your phone",
      completed: false,
    },
    {
      id: "silence",
      title: "Silence Unknown Callers",
      description: "Enable 'Silence Unknown Callers' in your phone settings",
      completed: false,
    },
    {
      id: "understand",
      title: "Understand the Rule",
      description: "Review how GuardKall protects your calls",
      completed: false,
    },
  ])
  const [expandedSection, setExpandedSection] = useState<string | null>("forward")

  const copyToClipboard = () => {
    if (user?.guardKallNumber) {
      navigator.clipboard.writeText(user.guardKallNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getFullDialCode = (carrier: { carrier: string; code: string }) => {
    const guardKallNum = user?.guardKallNumber?.replace(/\D/g, "") || ""
    if (carrier.carrier === "Verizon" || carrier.carrier === "Sprint") {
      return `${carrier.code}${guardKallNum}`
    }
    // AT&T and T-Mobile format
    return `${carrier.code}1${guardKallNum}#`
  }

  const copyCarrierCode = (carrierName: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCarrier(carrierName)
    setTimeout(() => setCopiedCarrier(null), 2000)
  }

  const stepOrder = ["forward", "silence", "understand"]

  const toggleStep = (stepId: string) => {
    setSteps((prev) => {
      const newSteps = prev.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      )
      // Auto-expand next section when marking current as done
      const currentIndex = stepOrder.indexOf(stepId)
      const currentStep = newSteps.find((s) => s.id === stepId)
      if (currentStep?.completed && currentIndex < stepOrder.length - 1) {
        const nextStepId = stepOrder[currentIndex + 1]
        setTimeout(() => setExpandedSection(nextStepId), 200)
      }
      return newSteps
    })
  }

  const allStepsCompleted = steps.every((step) => step.completed)

  const handleComplete = () => {
    if (user) {
      setUser({ ...user, setupComplete: true, isNewUser: false })
    }
    setCurrentScreen("dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen("auth")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <GuardKallLogo size="md" showGlow={false} variant="minimal" />
          <div>
            <h1 className="font-bold text-foreground">GuardKall Setup</h1>
            <p className="text-sm text-muted-foreground">Complete these steps to activate protection</p>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 max-w-3xl mx-auto w-full px-4 py-8">
        {/* GuardKall Number Display */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Your GuardKall Number</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-foreground font-mono tracking-wider">
                {user?.guardKallNumber}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all duration-200"
                aria-label="Copy number"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              This is your personal AI-protected number. Forward your calls here.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Setup Progress</span>
            <span className="text-sm text-muted-foreground">
              {steps.filter((s) => s.completed).length} of {steps.length} completed
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${(steps.filter((s) => s.completed).length / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-4">
          {/* Step 1: Call Forwarding */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "forward" ? null : "forward")}
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  steps[0].completed
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {steps[0].completed ? <CheckCircle2 className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{steps[0].title}</h3>
                <p className="text-sm text-muted-foreground">{steps[0].description}</p>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStep("forward")
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  steps[0].completed
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                }`}
              >
                <Checkbox
                  checked={steps[0].completed}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-xs font-medium whitespace-nowrap">
                  {steps[0].completed ? "Done" : "Mark done"}
                </span>
              </div>
            </button>
            {expandedSection === "forward" && (
              <div className="px-5 pb-5 border-t border-border">
                <div className="pt-5 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enable Conditional Call Forwarding to route unanswered calls to GuardKall. Select your carrier:
                  </p>
                  <div className="grid gap-3">
                    {carrierInstructions.map((carrier) => {
                      const fullCode = getFullDialCode(carrier)
                      return (
                        <div
                          key={carrier.carrier}
                          className="bg-secondary/50 border border-border rounded-xl p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {carrier.carrier.slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-foreground">{carrier.carrier}</span>
                              <p className="text-sm text-muted-foreground mt-1">{carrier.description}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3">
                              <span className="text-xs text-muted-foreground block mb-1">Dial this code:</span>
                              <span className="font-mono text-lg text-primary font-semibold tracking-wide">
                                {fullCode}
                              </span>
                            </div>
                            <button
                              onClick={() => copyCarrierCode(carrier.carrier, fullCode)}
                              className="h-full px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all duration-200 flex items-center gap-2"
                            >
                              {copiedCarrier === carrier.carrier ? (
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
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Silence Unknown Callers */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "silence" ? null : "silence")}
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  steps[1].completed
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {steps[1].completed ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{steps[1].title}</h3>
                <p className="text-sm text-muted-foreground">{steps[1].description}</p>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStep("silence")
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  steps[1].completed
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                }`}
              >
                <Checkbox
                  checked={steps[1].completed}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-xs font-medium whitespace-nowrap">
                  {steps[1].completed ? "Done" : "Mark done"}
                </span>
              </div>
            </button>
            {expandedSection === "silence" && (
              <div className="px-5 pb-5 border-t border-border">
                <div className="pt-5 space-y-5">
                  {/* iOS Instructions */}
                  <div className="bg-secondary/50 border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-semibold text-foreground">iPhone (iOS)</span>
                    </div>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span>
                          Open <span className="text-foreground font-medium">Settings</span>
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          2
                        </span>
                        <span>
                          Tap <span className="text-foreground font-medium">Phone</span>
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          3
                        </span>
                        <span>
                          Toggle on{" "}
                          <span className="text-foreground font-medium">Silence Unknown Callers</span>
                        </span>
                      </li>
                    </ol>
                  </div>

                  {/* Android Instructions */}
                  <div className="bg-secondary/50 border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-semibold text-foreground">Android</span>
                    </div>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span>
                          Open the <span className="text-foreground font-medium">Phone</span> app
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          2
                        </span>
                        <span>
                          Tap <span className="text-foreground font-medium">More options (3 dots)</span> &gt;{" "}
                          <span className="text-foreground font-medium">Settings</span>
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          3
                        </span>
                        <span>
                          Tap <span className="text-foreground font-medium">Blocked numbers</span>
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          4
                        </span>
                        <span>
                          Toggle on <span className="text-foreground font-medium">Unknown</span>
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Rule of Thumb */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === "understand" ? null : "understand")}
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  steps[2].completed
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {steps[2].completed ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{steps[2].title}</h3>
                <p className="text-sm text-muted-foreground">{steps[2].description}</p>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStep("understand")
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  steps[2].completed
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                }`}
              >
                <Checkbox
                  checked={steps[2].completed}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-xs font-medium whitespace-nowrap">
                  {steps[2].completed ? "Done" : "Mark done"}
                </span>
              </div>
            </button>
            {expandedSection === "understand" && (
              <div className="px-5 pb-5 border-t border-border">
                <div className="pt-5">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-bold text-foreground">Rule of Thumb</span>
                      </div>
                      <p className="text-lg text-foreground leading-relaxed">
                        &quot;If you see an <span className="text-primary font-semibold">Unknown Caller</span>,
                        let it ring or hit decline.{" "}
                        <span className="text-primary font-semibold">We will handle the rest.</span>&quot;
                      </p>
                      <p className="text-sm text-muted-foreground mt-4">
                        GuardKall AI will screen all unknown calls and notify you of verified callers. Scammers
                        will be blocked automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            onClick={handleComplete}
            disabled={!allStepsCompleted}
            className={`w-full h-14 rounded-xl font-semibold text-lg transition-all duration-200 group ${
              allStepsCompleted
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            {allStepsCompleted ? (
              <>
                Go to Dashboard
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              "Check all boxes to continue"
            )}
          </Button>
          <Button
            onClick={() => setCurrentScreen("auth")}
            variant="outline"
            className="w-full h-12 rounded-xl border-border text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </div>
      </main>
    </div>
  )
}
