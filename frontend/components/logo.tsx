"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-[14px]", gap: "gap-2" },
    md: { icon: 32, text: "text-[16px]", gap: "gap-2.5" },
    lg: { icon: 48, text: "text-[22px]", gap: "gap-3" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      {/* Logo Mark - Abstract shield with audio wave cutout */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a84ff" />
            <stop offset="100%" stopColor="#ff3b30" />
          </linearGradient>
          <linearGradient id="logoGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3ba0ff" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#ff6b5b" />
          </linearGradient>
          {/* Mask for the audio wave cutout */}
          <mask id="waveMask">
            <rect width="48" height="48" fill="white" />
            {/* Audio wave bars cut out from center */}
            <rect x="15" y="18" width="2.5" height="12" rx="1.25" fill="black" />
            <rect x="20" y="14" width="2.5" height="20" rx="1.25" fill="black" />
            <rect x="25" y="16" width="2.5" height="16" rx="1.25" fill="black" />
            <rect x="30" y="19" width="2.5" height="10" rx="1.25" fill="black" />
          </mask>
        </defs>
        
        {/* Shield shape with wave cutout */}
        <path
          d="M24 4L6 10v14c0 11.5 18 20 18 20s18-8.5 18-20V10L24 4z"
          fill="url(#logoGradient)"
          mask="url(#waveMask)"
        />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span className={cn("font-semibold tracking-tight text-white", s.text)}>
          Guardkall
        </span>
      )}
    </div>
  );
}

// Icon only version for favicons, app icons etc
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a84ff" />
          <stop offset="100%" stopColor="#ff3b30" />
        </linearGradient>
        <mask id="waveIconMask">
          <rect width="48" height="48" fill="white" />
          <rect x="15" y="18" width="2.5" height="12" rx="1.25" fill="black" />
          <rect x="20" y="14" width="2.5" height="20" rx="1.25" fill="black" />
          <rect x="25" y="16" width="2.5" height="16" rx="1.25" fill="black" />
          <rect x="30" y="19" width="2.5" height="10" rx="1.25" fill="black" />
        </mask>
      </defs>
      <path
        d="M24 4L6 10v14c0 11.5 18 20 18 20s18-8.5 18-20V10L24 4z"
        fill="url(#logoIconGradient)"
        mask="url(#waveIconMask)"
      />
    </svg>
  );
}
