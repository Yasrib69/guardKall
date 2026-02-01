"use client"

import { useState, useEffect } from "react"
import {
  ChevronRight,
  ChevronLeft,
  Phone,
  Search,
  Wifi,
  Battery,
  Signal,
  Check,
  ArrowDown
} from "lucide-react"

type SimulatorScreen = "home" | "settings-main" | "settings-phone" | "silence-toggle"

interface IPhoneSimulatorProps {
  onComplete: () => void
  isActive: boolean
}

export function IPhoneSimulator({ onComplete, isActive }: IPhoneSimulatorProps) {
  const [currentScreen, setCurrentScreen] = useState<SimulatorScreen>("home")
  const [silenceEnabled, setSilenceEnabled] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left")
  const [showHint, setShowHint] = useState(true)
  const [tapAnimation, setTapAnimation] = useState<string | null>(null)

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      setCurrentScreen("home")
      setSilenceEnabled(false)
      setShowHint(true)
    }
  }, [isActive])

  // Auto-advance hint after toggle
  useEffect(() => {
    if (silenceEnabled) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [silenceEnabled, onComplete])

  const navigateTo = (screen: SimulatorScreen, direction: "left" | "right" = "left") => {
    if (isTransitioning) return
    setSlideDirection(direction)
    setIsTransitioning(true)
    setShowHint(false)
    
    setTimeout(() => {
      setCurrentScreen(screen)
      setIsTransitioning(false)
    }, 300)
  }

  const handleTap = (id: string, action: () => void) => {
    setTapAnimation(id)
    setTimeout(() => {
      setTapAnimation(null)
      action()
    }, 150)
  }

  const getHintText = () => {
    switch (currentScreen) {
      case "home":
        return "Step 1 of 4: Tap the Settings app"
      case "settings-main":
        return "Step 2 of 4: Tap on Phone"
      case "settings-phone":
        return "Step 3 of 4: Tap 'Silence Unknown Callers'"
      case "silence-toggle":
        return silenceEnabled ? "Perfect! Done. Now copy these exact steps on your real iPhone." : "Step 4 of 4: Toggle ON"
      default:
        return ""
    }
  }

  const getSlideClass = () => {
    if (!isTransitioning) return "translate-x-0"
    return slideDirection === "left" ? "-translate-x-full" : "translate-x-full"
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      {/* Step Indicator */}
      <div className="mb-6 w-full">
        <div className="flex items-center justify-between mb-2 px-4">
          <span className="text-sm font-semibold text-foreground">
            {currentScreen === "home" ? "1/4" : currentScreen === "settings-main" ? "2/4" : currentScreen === "settings-phone" ? "3/4" : "4/4"}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            silenceEnabled ? "bg-green-500/20 text-green-400" : "bg-primary/20 text-primary"
          }`}>
            {currentScreen === "home" ? "Find Settings" : currentScreen === "settings-main" ? "Open Phone" : currentScreen === "settings-phone" ? "Find Silence Option" : "Enable Toggle"}
          </span>
        </div>
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300"
            style={{
              width: `${
                currentScreen === "home" ? "25%" :
                currentScreen === "settings-main" ? "50%" :
                currentScreen === "settings-phone" ? "75%" : "100%"
              }`
            }}
          />
        </div>
      </div>
      {/* iPhone Frame */}
      <div className="relative">
        {/* Phone outer frame */}
        <div className="relative w-[280px] h-[580px] bg-[#1a1a1a] rounded-[45px] p-[4px] shadow-2xl shadow-black/50">
          {/* Inner bezel */}
          <div className="relative w-full h-full bg-[#0d0d0d] rounded-[41px] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a] mr-6" />
            </div>

            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-12 z-40 px-6 flex items-end justify-between pb-1">
              <span className="text-white text-xs font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <Signal className="w-4 h-4 text-white" />
                <Wifi className="w-4 h-4 text-white" />
                <Battery className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Screen Content */}
            <div className={`absolute inset-0 pt-12 transition-transform duration-300 ease-out ${getSlideClass()}`}>
              {/* Home Screen */}
              {currentScreen === "home" && (
                <div className="h-full bg-gradient-to-b from-[#1c1c1e] to-[#000] p-4 pt-6">
                  {/* App Grid */}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {/* Settings App */}
                    <button
                      onClick={() => handleTap("settings", () => navigateTo("settings-main"))}
                      className={`flex flex-col items-center gap-1 transition-transform relative ${
                        tapAnimation === "settings" ? "scale-90" : ""
                      }`}
                    >
                      <div className="w-14 h-14 rounded-[14px] bg-gradient-to-b from-[#555] to-[#3a3a3a] flex items-center justify-center shadow-lg relative overflow-hidden">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#c4c4c4]" fill="currentColor">
                          <path d="M12 2C11.5 2 11.2 2.3 11.2 2.8L11 4.5C10.3 4.7 9.7 5 9.1 5.4L7.6 4.3C7.3 4.1 6.9 4.2 6.7 4.5L5.3 6.7C5.1 7 5.2 7.4 5.5 7.6L6.8 8.6C6.6 9.4 6.5 10.2 6.5 11C6.5 11.8 6.6 12.6 6.8 13.4L5.5 14.4C5.2 14.6 5.1 15 5.3 15.3L6.7 17.5C6.9 17.8 7.3 17.9 7.6 17.7L9.1 16.6C9.7 17 10.3 17.3 11 17.5L11.2 19.2C11.2 19.7 11.5 20 12 20C12.5 20 12.8 19.7 12.8 19.2L13 17.5C13.7 17.3 14.3 17 14.9 16.6L16.4 17.7C16.7 17.9 17.1 17.8 17.3 17.5L18.7 15.3C18.9 15 18.8 14.6 18.5 14.4L17.2 13.4C17.4 12.6 17.5 11.8 17.5 11C17.5 10.2 17.4 9.4 17.2 8.6L18.5 7.6C18.8 7.4 18.9 7 18.7 6.7L17.3 4.5C17.1 4.2 16.7 4.1 16.4 4.3L14.9 5.4C14.3 5 13.7 4.7 13 4.5L12.8 2.8C12.8 2.3 12.5 2 12 2M12 7C14.2 7 16 8.8 16 11C16 13.2 14.2 15 12 15C9.8 15 8 13.2 8 11C8 8.8 9.8 7 12 7Z"/>
                        </svg>
                      </div>
                      <span className="text-[10px] text-white">Settings</span>
                    </button>

                    {/* Other placeholder apps */}
                    {["Photos", "Camera", "Maps"].map((app) => (
                      <div key={app} className="flex flex-col items-center gap-1">
                        <div className="w-14 h-14 rounded-[14px] bg-gradient-to-b from-[#444] to-[#333] flex items-center justify-center shadow-lg opacity-50">
                          <div className="w-6 h-6 rounded bg-[#666]" />
                        </div>
                        <span className="text-[10px] text-white/50">{app}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dock */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/10 backdrop-blur-xl rounded-[20px] p-2 flex justify-around">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-12 h-12 rounded-[12px] bg-white/10" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Main Screen */}
              {currentScreen === "settings-main" && (
                <div className="h-full bg-[#000]">
                  {/* Navigation Header */}
                  <div className="flex items-center px-4 py-2 pt-3">
                    <button
                      onClick={() => handleTap("back-main", () => navigateTo("home", "right"))}
                      className={`flex items-center text-[#0a84ff] text-sm ${
                        tapAnimation === "back-main" ? "opacity-50" : ""
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="px-4">
                    <h1 className="text-[28px] font-bold text-white mb-4">Settings</h1>

                    {/* Search Bar */}
                    <div className="bg-[#1c1c1e] rounded-xl px-3 py-2 flex items-center gap-2 mb-6">
                      <Search className="w-4 h-4 text-[#8e8e93]" />
                      <span className="text-[#8e8e93] text-sm">Search</span>
                    </div>

                    {/* Settings List */}
                    <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
                      {/* Airplane Mode */}
                      <div className="flex items-center px-4 py-3 border-b border-[#38383a]">
                        <div className="w-7 h-7 rounded-md bg-[#ff9500] flex items-center justify-center mr-3">
                          <span className="text-white text-xs">✈</span>
                        </div>
                        <span className="text-white text-sm flex-1">Airplane Mode</span>
                        <div className="w-12 h-7 bg-[#39393d] rounded-full relative">
                          <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full" />
                        </div>
                      </div>

                      {/* Wi-Fi */}
                      <div className="flex items-center px-4 py-3 border-b border-[#38383a]">
                        <div className="w-7 h-7 rounded-md bg-[#007aff] flex items-center justify-center mr-3">
                          <Wifi className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white text-sm flex-1">Wi-Fi</span>
                        <span className="text-[#8e8e93] text-sm mr-1">Home</span>
                        <ChevronRight className="w-4 h-4 text-[#48484a]" />
                      </div>

                      {/* Phone */}
                      <button
                        onClick={() => handleTap("phone", () => navigateTo("settings-phone"))}
                        className={`w-full flex items-center px-4 py-3 transition-colors relative ${
                          tapAnimation === "phone" ? "bg-[#38383a]" : ""
                        }`}
                      >
                        <div className="w-7 h-7 rounded-md bg-[#34c759] flex items-center justify-center mr-3">
                          <Phone className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white text-sm flex-1 text-left">Phone</span>
                        <ChevronRight className="w-4 h-4 text-[#48484a]" />
                        {showHint && currentScreen === "settings-main" && (
                          <div className="absolute inset-0 border-2 border-primary rounded-none animate-pulse" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Phone Screen */}
              {currentScreen === "settings-phone" && (
                <div className="h-full bg-[#000]">
                  {/* Navigation Header */}
                  <div className="flex items-center px-4 py-2 pt-3">
                    <button
                      onClick={() => handleTap("back-phone", () => navigateTo("settings-main", "right"))}
                      className={`flex items-center text-[#0a84ff] text-sm ${
                        tapAnimation === "back-phone" ? "opacity-50" : ""
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>Settings</span>
                    </button>
                  </div>

                  <div className="px-4">
                    <h1 className="text-[28px] font-bold text-white mb-4">Phone</h1>

                    {/* Phone Settings List */}
                    <div className="bg-[#1c1c1e] rounded-xl overflow-hidden mb-4">
                      <div className="flex items-center px-4 py-3 border-b border-[#38383a]">
                        <span className="text-white text-sm flex-1">My Number</span>
                        <span className="text-[#8e8e93] text-sm">+1 (555) 123-4567</span>
                      </div>
                    </div>

                    {/* Calls Section */}
                    <p className="text-[#8e8e93] text-xs uppercase px-4 mb-2">Calls</p>
                    <div className="bg-[#1c1c1e] rounded-xl overflow-hidden mb-4">
                      <div className="flex items-center px-4 py-3 border-b border-[#38383a]">
                        <span className="text-white text-sm flex-1">Announce Calls</span>
                        <span className="text-[#8e8e93] text-sm mr-1">Always</span>
                        <ChevronRight className="w-4 h-4 text-[#48484a]" />
                      </div>

                      {/* Silence Unknown Callers - Tappable */}
                      <button
                        onClick={() => handleTap("silence", () => navigateTo("silence-toggle"))}
                        className={`w-full flex items-center px-4 py-3 transition-colors relative ${
                          tapAnimation === "silence" ? "bg-[#38383a]" : ""
                        }`}
                      >
                        <span className="text-white text-sm flex-1 text-left">Silence Unknown Callers</span>
                        <span className="text-[#8e8e93] text-sm mr-1">Off</span>
                        <ChevronRight className="w-4 h-4 text-[#48484a]" />
                        {showHint && currentScreen === "settings-phone" && (
                          <div className="absolute inset-0 border-2 border-primary rounded-none animate-pulse" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Silence Unknown Callers Toggle Screen */}
              {currentScreen === "silence-toggle" && (
                <div className="h-full bg-[#000]">
                  {/* Navigation Header */}
                  <div className="flex items-center px-4 py-2 pt-3">
                    <button
                      onClick={() => handleTap("back-toggle", () => navigateTo("settings-phone", "right"))}
                      className={`flex items-center text-[#0a84ff] text-sm ${
                        tapAnimation === "back-toggle" ? "opacity-50" : ""
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>Phone</span>
                    </button>
                  </div>

                  <div className="px-4">
                    <h1 className="text-[28px] font-bold text-white mb-6">Silence Unknown Callers</h1>

                    {/* Toggle Card */}
                    <div className="bg-[#1c1c1e] rounded-xl overflow-hidden mb-4">
                      <div className="flex items-center px-4 py-3 relative">
                        <span className="text-white text-sm flex-1">Silence Unknown Callers</span>
                        <button
                          onClick={() => {
                            if (!silenceEnabled) {
                              setSilenceEnabled(true)
                            }
                          }}
                          className={`relative w-[51px] h-[31px] rounded-full transition-all duration-300 ${
                            silenceEnabled ? "bg-[#34c759]" : "bg-[#39393d]"
                          }`}
                        >
                          <div
                            className={`absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-md transition-all duration-300 ${
                              silenceEnabled ? "left-[22px]" : "left-[2px]"
                            }`}
                          />
                        </button>
                        {!silenceEnabled && showHint && (
                          <div className="absolute inset-0 border-2 border-primary rounded-xl animate-pulse pointer-events-none" />
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#8e8e93] text-xs px-4 leading-relaxed">
                      Calls from unknown numbers will be silenced, sent to voicemail, and displayed on the Recents list.
                      Calls will still be allowed from numbers in your contacts, recent outgoing calls, and Siri Suggestions.
                    </p>

                    {/* Success Indicator */}
                    {silenceEnabled && (
                      <div className="mt-8 flex items-center justify-center gap-2 animate-in fade-in duration-500">
                        <div className="w-12 h-12 rounded-full bg-[#34c759] flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-primary/10 rounded-[60px] blur-2xl -z-10" />
      </div>

      {/* Hint Text */}
      <div className="mt-12 mb-4">
        <style jsx>{`
          @keyframes glow-pulse {
            0%, 100% {
              box-shadow: 0 0 8px rgba(34, 197, 94, 0.4), inset 0 0 8px rgba(34, 197, 94, 0.1);
            }
            50% {
              box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), inset 0 0 12px rgba(34, 197, 94, 0.2);
            }
          }
        `}</style>
        <div className="inline-block px-4 py-2 rounded-lg border border-green-500/60 animate-[glow-pulse_2s_ease-in-out_infinite] mx-auto">
          <p className={`text-sm font-semibold transition-all duration-300 ${
            silenceEnabled ? "text-green-400" : "text-primary"
          }`}>
            {getHintText()}
          </p>
        </div>
      </div>
    </div>
  )
}
