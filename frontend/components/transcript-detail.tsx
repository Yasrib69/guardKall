"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import {
  ArrowLeft,
  Phone,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Unlock,
  AlertTriangle,
  X,
  CheckCircle2,
  Bot,
  Shield, // Import Shield component
} from "lucide-react"
import { GuardKallLogo } from "@/components/guardkall-logo"

export function TranscriptDetail() {
  const { selectedCall, setCurrentScreen, unblockNumber } = useApp()
  const [showUnblockModal, setShowUnblockModal] = useState(false)
  const [unblockSuccess, setUnblockSuccess] = useState(false)

  if (!selectedCall) {
    setCurrentScreen("dashboard")
    return null
  }

  const isPotentialScammer = selectedCall.status === "potential_scammer"

  const formatTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleUnblock = () => {
    unblockNumber(selectedCall.id)
    setShowUnblockModal(false)
    setUnblockSuccess(true)
    setTimeout(() => {
      setUnblockSuccess(false)
    }, 3000)
  }

  const transcriptLines = selectedCall.fullTranscript.split("\n\n")

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentScreen("dashboard")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <GuardKallLogo size="md" showGlow={false} variant="minimal" />
              <div>
                <h1 className="font-bold text-foreground">Call Transcript</h1>
                <p className="text-sm text-muted-foreground">{selectedCall.phoneNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Success Message */}
        {unblockSuccess && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <p className="text-foreground">Number has been unblocked successfully.</p>
          </div>
        )}

        {/* Call Info Card */}
        <div
          className={`rounded-2xl border p-6 mb-8 ${
            isPotentialScammer
              ? "bg-destructive/5 border-destructive/20"
              : "bg-primary/5 border-primary/20"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  isPotentialScammer
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {isPotentialScammer ? (
                  <ShieldAlert className="w-7 h-7" />
                ) : (
                  <ShieldCheck className="w-7 h-7" />
                )}
              </div>
              <div>
                <span className="font-mono text-xl font-bold text-foreground">{selectedCall.phoneNumber}</span>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(selectedCall.timestamp)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {selectedCall.duration}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`px-4 py-2 text-sm font-semibold rounded-xl self-start md:self-center ${
                isPotentialScammer
                  ? "bg-destructive/20 text-destructive"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {isPotentialScammer ? "Potential Scammer" : "Verified Caller"}
            </span>
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30">
            <h2 className="font-semibold text-foreground">Full Transcript</h2>
            <p className="text-sm text-muted-foreground">AI-screened conversation</p>
          </div>
          <div className="p-6 space-y-6">
            {transcriptLines.map((line, index) => {
              const isAI = line.startsWith("GuardKall AI:")
              const isCaller = line.startsWith("Caller:")
              const speaker = isAI ? "GuardKall AI" : isCaller ? "Caller" : ""
              const content = line.replace(/^(GuardKall AI:|Caller:)\s*/, "")

              if (!speaker) return null

              return (
                <div
                  key={index}
                  className={`flex gap-4 ${isAI ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isAI ? "bg-primary/10" : "bg-secondary"
                    }`}
                  >
                    {isAI ? (
                      <Bot className="w-5 h-5 text-primary" />
                    ) : (
                      <Phone className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[85%] ${isAI ? "" : "text-right"}`}
                  >
                    <span className={`text-xs font-medium mb-1 block ${isAI ? "text-primary" : "text-muted-foreground"}`}>
                      {speaker}
                    </span>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isAI
                          ? "bg-primary/10 text-foreground rounded-tl-sm"
                          : "bg-secondary text-foreground rounded-tr-sm"
                      }`}
                    >
                      {content}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Unblock Button - Only show for blocked scammers */}
        {isPotentialScammer && selectedCall.isBlocked && (
          <div className="mt-8">
            <Button
              onClick={() => setShowUnblockModal(true)}
              variant="outline"
              className="w-full h-14 rounded-xl border-border hover:border-destructive/50 hover:bg-destructive/5 text-foreground group"
            >
              <Unlock className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-destructive" />
              Unblock This Number
            </Button>
          </div>
        )}
      </main>

      {/* Unblock Confirmation Modal */}
      {showUnblockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowUnblockModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowUnblockModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="p-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>

              <h2 className="text-xl font-bold text-foreground text-center mb-2">
                Unblock This Number?
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                This number was flagged as a potential scammer. Are you sure you want to unblock it?
                You may receive calls from this number again.
              </p>

              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Warning:</span>{" "}
                    <span className="text-muted-foreground">
                      This caller exhibited suspicious behavior during AI screening.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowUnblockModal(false)}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-border text-foreground hover:bg-secondary"
                >
                  No, Keep Blocked
                </Button>
                <Button
                  onClick={handleUnblock}
                  className="flex-1 h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Yes, Unblock
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
