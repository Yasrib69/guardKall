"use client"

import { useState } from "react"
import { useApp, type CallLog } from "@/lib/app-context"
import {
  Phone,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  LogOut,
  Settings,
  FileText,
  Sun,
  Moon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GuardKallLogo } from "@/components/guardkall-logo"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function CallLogItem({ call, onClick }: { call: CallLog; onClick: () => void }) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const isPotentialScammer = call.status === "potential_scammer"

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`w-full p-4 rounded-xl border transition-all duration-200 text-left group ${isPotentialScammer
              ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40 hover:bg-destructive/10"
              : "bg-card border-border hover:border-primary/40 hover:bg-secondary/30"
              }`}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isPotentialScammer
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
                  }`}
              >
                {isPotentialScammer ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>

              {/* Call Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground font-mono">{call.phoneNumber}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${isPotentialScammer
                      ? "bg-destructive/20 text-destructive"
                      : "bg-primary/20 text-primary"
                      }`}
                  >
                    {isPotentialScammer ? "Potential Scammer" : "Verified"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(call.timestamp)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {call.duration}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          className="max-w-sm p-4 bg-popover border border-border shadow-xl"
          sideOffset={8}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FileText className="w-3.5 h-3.5" />
              <span>Call Transcript Preview</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{call.shortTranscript}</p>
            <p className="text-xs text-primary mt-2">Click to view full transcript</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function RecentCallsDashboard() {
  const { user, callLogs, setSelectedCall, setCurrentScreen, theme, setTheme } = useApp()
  const [filter, setFilter] = useState<"all" | "verified" | "scammer">("all")

  const filteredCalls = callLogs.filter((call) => {
    if (filter === "all") return true
    if (filter === "verified") return call.status === "verified"
    if (filter === "scammer") return call.status === "potential_scammer"
    return true
  })

  const scammerCount = callLogs.filter((c) => c.status === "potential_scammer").length
  const verifiedCount = callLogs.filter((c) => c.status === "verified").length

  const handleCallClick = (call: CallLog) => {
    setSelectedCall(call)
    setCurrentScreen("transcript")
  }

  const handleLogout = () => {
    setCurrentScreen("auth")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GuardKallLogo size="md" showGlow={false} variant="minimal" />
              <div>
                <h1 className="font-bold text-foreground">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-sm text-muted-foreground">{user?.phoneNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrentScreen("setup")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Setup Instructions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="w-4 h-4 mr-2" />
                    Light Mode
                    {theme === "light" && <span className="ml-auto text-primary">Active</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark Mode
                    {theme === "dark" && <span className="ml-auto text-primary">Active</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold text-foreground">{callLogs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-primary">{verifiedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blocked Scammers</p>
                <p className="text-2xl font-bold text-destructive">{scammerCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "all"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
          >
            All Calls ({callLogs.length})
          </button>
          <button
            onClick={() => setFilter("verified")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "verified"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setFilter("scammer")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "scammer"
              ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25"
              : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
          >
            Potential Scammers ({scammerCount})
          </button>
        </div>

        {/* Call List */}
        <div className="space-y-3">
          {filteredCalls.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No calls found</h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "Your recent calls will appear here"
                  : `No ${filter === "verified" ? "verified" : "potential scammer"} calls`}
              </p>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <CallLogItem key={call.id} call={call} onClick={() => handleCallClick(call)} />
            ))
          )}
        </div>
      </main>
    </div>
  )
}
