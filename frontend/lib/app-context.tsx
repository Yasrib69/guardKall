"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Theme = "light" | "dark"

export type CallStatus = "verified" | "potential_scammer" | "unknown"

export interface CallLog {
  id: string
  phoneNumber: string
  callerName?: string
  timestamp: Date
  duration: string
  status: CallStatus
  shortTranscript: string
  fullTranscript: string
  isBlocked: boolean
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email?: string
  phoneNumber: string
  guardKallNumber: string
  isNewUser: boolean
  setupComplete: boolean
}

type Screen = "landing" | "auth" | "onboarding" | "setup" | "dashboard" | "transcript"

interface AppContextType {
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  user: User | null
  setUser: (user: User | null) => void
  callLogs: CallLog[]
  setCallLogs: (logs: CallLog[]) => void
  selectedCall: CallLog | null
  setSelectedCall: (call: CallLog | null) => void
  unblockNumber: (callId: string) => void
  theme: Theme
  setTheme: (theme: Theme) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Mock call logs data
const mockCallLogs: CallLog[] = [
  {
    id: "1",
    phoneNumber: "+1 (555) 123-4567",
    callerName: "Unknown",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    duration: "2:34",
    status: "verified",
    shortTranscript: "Hi, this is Dr. Smith's office calling to confirm your appointment tomorrow at 3 PM...",
    fullTranscript: `Caller: Hi, this is Dr. Smith's office calling to confirm your appointment tomorrow at 3 PM.

GuardKall AI: Hello, I'm an AI assistant screening calls for this number. Can you please verify your identity?

Caller: Of course. This is Sarah from Dr. Michael Smith's Family Practice. We're located at 1234 Medical Center Drive.

GuardKall AI: Thank you for that information. What is the purpose of your call?

Caller: We're calling to confirm a scheduled appointment for tomorrow, January 30th at 3:00 PM with Dr. Smith.

GuardKall AI: I've verified this call. I'll let the recipient know about the appointment confirmation. Is there anything else?

Caller: No, that's all. Thank you!`,
    isBlocked: false,
  },
  {
    id: "2",
    phoneNumber: "+1 (800) 555-0199",
    callerName: "Unknown",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    duration: "1:47",
    status: "potential_scammer",
    shortTranscript: "URGENT: Your social security number has been compromised. Press 1 immediately to...",
    fullTranscript: `Caller: URGENT: Your social security number has been compromised. Press 1 immediately to speak with a federal agent.

GuardKall AI: Hello, I'm an AI assistant screening calls. Can you please identify yourself and your organization?

Caller: This is Agent Williams from the Social Security Administration. Your social security number has been used in criminal activity.

GuardKall AI: Can you provide your official badge number and callback verification number?

Caller: Ma'am, there's no time. You need to act now or you'll be arrested. We need your social security number to verify your identity.

GuardKall AI: The Social Security Administration does not make threatening calls or request personal information over the phone. This call appears to be fraudulent.

Caller: Listen, if you don't cooperate, the police will be at your door in 30 minutes!

GuardKall AI: This call has been flagged as a potential scam. The real SSA can be reached at 1-800-772-1213. Ending this call.`,
    isBlocked: true,
  },
  {
    id: "3",
    phoneNumber: "+1 (555) 987-6543",
    callerName: "Unknown",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    duration: "0:58",
    status: "verified",
    shortTranscript: "Hello, this is Amazon delivery confirming your package will arrive between 2-4 PM...",
    fullTranscript: `Caller: Hello, this is Amazon delivery services. We're confirming your package delivery today.

GuardKall AI: Hello, I'm an AI assistant. Can you verify the delivery details?

Caller: Sure! We have a package for delivery today between 2-4 PM. Order ending in 7832.

GuardKall AI: Thank you. I've verified this as a legitimate Amazon delivery notification.

Caller: Great, have a nice day!`,
    isBlocked: false,
  },
  {
    id: "4",
    phoneNumber: "+1 (888) 555-0147",
    callerName: "Unknown",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    duration: "3:12",
    status: "potential_scammer",
    shortTranscript: "Congratulations! You've been selected for a free cruise vacation. Just provide your credit card...",
    fullTranscript: `Caller: Congratulations! You've been selected for a free 7-day Caribbean cruise vacation!

GuardKall AI: Hello, I'm an AI assistant screening calls. Can you tell me more about this offer?

Caller: You've won a completely free cruise! All we need is a small processing fee of $199.

GuardKall AI: What company are you calling from and can you provide a registration number?

Caller: We're from Premium Vacation Rewards. This is a limited time offer that expires today!

GuardKall AI: Can you send written documentation of this offer instead?

Caller: No, you must act now! Just give me your credit card number and we'll process everything.

GuardKall AI: Legitimate vacation companies don't pressure for immediate credit card information. This call has been flagged as a potential scam.

Caller: Fine, you're missing out on a great opportunity! *click*`,
    isBlocked: true,
  },
  {
    id: "5",
    phoneNumber: "+1 (555) 246-8135",
    callerName: "Unknown",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    duration: "1:23",
    status: "verified",
    shortTranscript: "Hi, this is your pharmacy. Your prescription is ready for pickup at...",
    fullTranscript: `Caller: Hi, this is CVS Pharmacy calling about a prescription.

GuardKall AI: Hello, I'm an AI assistant. Can you provide verification details?

Caller: This is CVS Pharmacy at 456 Main Street. We're calling to let you know prescription number 847291 is ready for pickup.

GuardKall AI: Thank you, I've verified this is a legitimate pharmacy call.

Caller: Great! The prescription will be held for 7 days. Thank you!`,
    isBlocked: false,
  },
  {
    id: "6",
    phoneNumber: "+1 (877) 555-0888",
    callerName: "Unknown",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
    duration: "2:01",
    status: "potential_scammer",
    shortTranscript: "This is Microsoft technical support. We've detected a virus on your computer and need remote access...",
    fullTranscript: `Caller: Hello, this is Microsoft technical support. We've detected a dangerous virus on your computer.

GuardKall AI: Hello, I'm an AI assistant. Microsoft does not make unsolicited technical support calls. Can you verify your identity?

Caller: Ma'am, your computer is sending us error messages. We need to connect remotely to fix it immediately.

GuardKall AI: What specific error messages are you referring to? Microsoft cannot see individual computer diagnostics without consent.

Caller: The error code is... uh... ZX7749. It's very serious. Just go to this website and download our remote access tool.

GuardKall AI: This is a known tech support scam. Microsoft never initiates unsolicited calls about computer problems. This call has been flagged.

Caller: No wait, this is legitimate! Your computer will crash if you don't—

GuardKall AI: Ending this fraudulent call. If you have computer concerns, contact Microsoft directly at support.microsoft.com.`,
    isBlocked: true,
  },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")
  const [user, setUser] = useState<User | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>(mockCallLogs)
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [theme, setThemeState] = useState<Theme>("dark")

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    if (typeof window !== "undefined") {
      localStorage.setItem("guardkall-theme", newTheme)
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }

  useEffect(() => {
    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem("guardkall-theme") as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Default to dark mode
      setTheme("dark")
    }
  }, [])

  const unblockNumber = (callId: string) => {
    setCallLogs((prev) =>
      prev.map((log) =>
        log.id === callId ? { ...log, isBlocked: false, status: "unknown" as CallStatus } : log
      )
    )
  }

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        user,
        setUser,
        callLogs,
        setCallLogs,
        selectedCall,
        setSelectedCall,
        unblockNumber,
        theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
