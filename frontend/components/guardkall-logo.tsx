"use client"

import { cn } from "@/lib/utils"

interface GuardKallLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  showGlow?: boolean
  variant?: "default" | "minimal"
}

export function GuardKallLogo({
  className,
  size = "md",
  showText = false,
  showGlow = true,
  variant = "default",
}: GuardKallLogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-[14px]", gap: "gap-2" },
    md: { icon: 40, text: "text-[16px]", gap: "gap-2.5" },
    lg: { icon: 56, text: "text-[20px]", gap: "gap-3" },
    xl: { icon: 80, text: "text-[26px]", gap: "gap-4" },
  }

  const s = sizes[size]

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      {/* Logo Container with Glow */}
      <div className="relative">
        {/* Glow Effect */}
        {showGlow && (
          <>
            <div
              className="absolute inset-0 rounded-xl blur-xl animate-pulse"
              style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.3))",
              }}
            />
            <div
              className="absolute -inset-1 rounded-xl blur-lg opacity-60"
              style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))",
              }}
            />
          </>
        )}

        {/* Logo Mark - Shield with audio wave cutout */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative flex-shrink-0"
        >
          {/* Gradient definitions - Bright Green Theme */}
          <defs>
            <linearGradient id="logoGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="logoGradientGreenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
            <linearGradient id="outlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Mask for the audio wave cutout */}
            <mask id="waveMaskGreen">
              <rect width="60" height="60" fill="white" />
              {/* Audio wave bars cut out from center - adjusted for new viewBox */}
              <rect x="21" y="24" width="2.5" height="12" rx="1.25" fill="black" />
              <rect x="26" y="20" width="2.5" height="20" rx="1.25" fill="black" />
              <rect x="31" y="22" width="2.5" height="16" rx="1.25" fill="black" />
              <rect x="36" y="25" width="2.5" height="10" rx="1.25" fill="black" />
            </mask>
            {/* Drop shadow filter */}
            <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.3" />
            </filter>
            {/* Glow filter for animated outline */}
            <filter id="outlineGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Animated glowing shield outline */}
          <path
            d="M30 4L8 12v18c0 14 22 24 22 24s22-10 22-24V12L30 4z"
            fill="none"
            stroke="url(#outlineGradient)"
            strokeWidth="1.5"
            strokeDasharray="120 180"
            filter="url(#outlineGlow)"
            opacity="0.9"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;300"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>

          {/* Static subtle outline for structure */}
          <path
            d="M30 4L8 12v18c0 14 22 24 22 24s22-10 22-24V12L30 4z"
            fill="none"
            stroke="#22c55e"
            strokeWidth="0.5"
            opacity="0.3"
          />

          {/* Inner shield shape with wave cutout - with gap from outline */}
          <path
            d="M30 10L12 16v14c0 11.5 18 20 18 20s18-8.5 18-20V16L30 10z"
            fill="url(#logoGradientGreen)"
            mask="url(#waveMaskGreen)"
            filter={showGlow ? "url(#logoShadow)" : undefined}
          />

          {/* Subtle inner highlight for depth */}
          <path
            d="M30 12L14 17.5v12c0 10 16 17.5 16 17.5s16-7.5 16-17.5v-12L30 12z"
            fill="none"
            stroke="url(#logoGradientGreenGlow)"
            strokeWidth="0.5"
            opacity="0.5"
            mask="url(#waveMaskGreen)"
          />
        </svg>
      </div>

      {/* Wordmark */}
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
          GuardKall
        </span>
      )}
    </div>
  )
}

// Icon only version for favicons, app icons etc
export function GuardKallLogoIcon({
  size = 32,
  className,
  showGlow = false,
}: {
  size?: number
  className?: string
  showGlow?: boolean
}) {
  return (
    <div className={cn("relative", className)}>
      {showGlow && (
        <div
          className="absolute inset-0 rounded-lg blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.3))",
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
      >
        <defs>
          <linearGradient id="logoIconGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <mask id="waveIconMaskGreen">
            <rect width="48" height="48" fill="white" />
            <rect x="15" y="18" width="2.5" height="12" rx="1.25" fill="black" />
            <rect x="20" y="14" width="2.5" height="20" rx="1.25" fill="black" />
            <rect x="25" y="16" width="2.5" height="16" rx="1.25" fill="black" />
            <rect x="30" y="19" width="2.5" height="10" rx="1.25" fill="black" />
          </mask>
        </defs>
        <path
          d="M24 4L6 10v14c0 11.5 18 20 18 20s18-8.5 18-20V10L24 4z"
          fill="url(#logoIconGradientGreen)"
          mask="url(#waveIconMaskGreen)"
        />
      </svg>
    </div>
  )
}
