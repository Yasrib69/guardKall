"use client";

import { useState, useEffect, useRef } from "react";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { OnboardingModal } from "@/components/onboarding-modal";
import { Logo, LogoIcon } from "@/components/logo";

const PERSONAS = [
  "Confused Grandma",
  "Slow Talker",
  "Curious Student",
  "Forgetful Senior",
];

// Animated counter that ticks up
function LiveCounter({ base, suffix = "", prefix = "" }: { base: number; suffix?: string; prefix?: string }) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setValue((v) => v + 1);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="tabular-nums">
      {prefix}{value}{suffix}
    </span>
  );
}

// Animated time counter
function LiveTime() {
  const [seconds, setSeconds] = useState(42);
  const [minutes, setMinutes] = useState(11);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s >= 59) {
          setMinutes((m) => m + 1);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="tabular-nums">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

// Typewriter with cursor
function Typewriter() {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = PERSONAS[idx];
    const speed = deleting ? 35 : 70;

    const timeout = setTimeout(() => {
      if (!deleting) {
        if (text.length < current.length) {
          setText(current.slice(0, text.length + 1));
        } else {
          setTimeout(() => setDeleting(true), 2000);
        }
      } else {
        if (text.length > 0) {
          setText(text.slice(0, -1));
        } else {
          setDeleting(false);
          setIdx((i) => (i + 1) % PERSONAS.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, deleting, idx]);

  return (
    <span className="inline-flex items-center">
      <span>{text}</span>
      <span className="w-[2px] h-[1.1em] bg-white/70 ml-[2px] animate-[blink_1s_step-end_infinite]" />
    </span>
  );
}

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#000] overflow-hidden relative">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px]"
          style={{ background: "radial-gradient(ellipse, rgba(10,132,255,0.12) 0%, transparent 60%)" }}
        />
        <div
          className="absolute top-[45%] left-[40%] w-[600px] h-[600px]"
          style={{ background: "radial-gradient(circle, rgba(255,59,48,0.08) 0%, transparent 60%)" }}
        />
        <div
          className="absolute top-[45%] right-[35%] w-[600px] h-[600px]"
          style={{ background: "radial-gradient(circle, rgba(10,132,255,0.06) 0%, transparent 60%)" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 min-h-[100dvh] flex flex-col"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? "none" : "translateY(10px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 sm:px-8 md:px-12 py-5 md:py-6">
          <Logo size="md" />
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff3b30] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3b30] shadow-[0_0_8px_rgba(255,59,48,0.8)]" />
            </span>
            <span className="text-white/50 text-[11px] font-medium tracking-[0.15em] uppercase">Live</span>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          {/* Visualizer */}
          <div
            className="w-full max-w-5xl"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "none" : "scale(0.95)",
              transition: "opacity 1s ease-out 0.2s, transform 1s ease-out 0.2s",
            }}
          >
            <AudioVisualizer />
          </div>

          {/* Typewriter */}
          <div
            className="mt-8 md:mt-12 text-center"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "none" : "translateY(10px)",
              transition: "opacity 0.8s ease-out 0.5s, transform 0.8s ease-out 0.5s",
            }}
          >
            <p className="text-[15px] md:text-[17px] font-light tracking-wide">
              <span className="text-white/40">Deploying </span>
              <span className="text-white">
                <Typewriter />
              </span>
            </p>
          </div>

          {/* CTA Button */}
          <div
            className="mt-12 md:mt-16"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "none" : "translateY(15px)",
              transition: "opacity 0.8s ease-out 0.7s, transform 0.8s ease-out 0.7s",
            }}
          >
            <button
              ref={buttonRef}
              onClick={() => setShowModal(true)}
              className="group relative cursor-pointer"
            >
              {/* Glow on hover */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#0a84ff] via-[#5856d6] to-[#ff3b30] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-60" />
              {/* Button */}
              <div className="relative h-14 px-10 rounded-full bg-white text-[#000] text-[15px] font-semibold tracking-wide flex items-center gap-3 transition-all duration-300 group-hover:scale-[1.03] group-active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_30px_rgba(0,0,0,0.3)]">
                <LogoIcon size={20} />
                Get Protected
              </div>
            </button>
          </div>
        </main>

        {/* Footer Stats */}
        <footer className="px-5 sm:px-8 md:px-12 py-6 md:py-8">
          <div
            className="flex items-center justify-center gap-6 sm:gap-10 md:gap-16"
            style={{
              opacity: loaded ? 1 : 0,
              transition: "opacity 0.8s ease-out 0.9s",
            }}
          >
            <div className="text-center">
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-light">
                <LiveTime />
              </p>
              <p className="text-white/30 text-[10px] sm:text-[11px] tracking-[0.1em] mt-1.5 uppercase">Time Wasted</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-light">
                <LiveCounter base={38} suffix="+" />
              </p>
              <p className="text-white/30 text-[10px] sm:text-[11px] tracking-[0.1em] mt-1.5 uppercase">Intercepted</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-light">
                <LiveCounter base={847} prefix="" />
              </p>
              <p className="text-white/30 text-[10px] sm:text-[11px] tracking-[0.1em] mt-1.5 uppercase">Protected</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Blink keyframe */}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Modal */}
      <OnboardingModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
