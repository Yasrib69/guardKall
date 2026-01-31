"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERSONAS = [
  { id: 0, name: "Confused Grandma", desc: "Classic misdirection tactics", icon: "👵" },
  { id: 1, name: "Curious Student", desc: "Endless stream of questions", icon: "🎓" },
  { id: 2, name: "Tech Support", desc: "Turn tables on the scammer", icon: "💻" },
  { id: 3, name: "Slow Talker", desc: "Maximum time waste mode", icon: "🐢" },
];

// Mini visualizer for the success screen
function MiniVisualizer() {
  const bars = 24;
  const [heights, setHeights] = useState<number[]>(Array(bars).fill(0.3));

  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      t += 0.1;
      setHeights(
        Array(bars)
          .fill(0)
          .map((_, i) => {
            const center = Math.abs(i - bars / 2) / (bars / 2);
            return 0.2 + (1 - center) * 0.4 + Math.sin(t * 2 + i * 0.3) * 0.2;
          })
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn("w-[3px] rounded-full transition-all duration-100", i % 2 === 0 ? "bg-[#0a84ff]" : "bg-[#ff3b30]")}
          style={{ height: `${h * 100}%`, opacity: 0.6 + (1 - Math.abs(i - bars / 2) / (bars / 2)) * 0.4 }}
        />
      ))}
    </div>
  );
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [phone, setPhone] = useState("");
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setPhone("");
      setAnimating(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const goTo = (newStep: number, dir: "forward" | "back") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setTimeout(() => setAnimating(false), 50);
    }, 200);
  };

  const next = () => {
    if (step < 3) goTo(step + 1, "forward");
    else onClose();
  };

  const back = () => {
    if (step > 0) goTo(step - 1, "back");
  };

  if (!isOpen) return null;

  const speeds = [
    { label: "Instant", time: "<0.5s", value: 100 },
    { label: "Quick", time: "<1.2s", value: 70 },
    { label: "Careful", time: "<2.5s", value: 40 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl transition-opacity duration-500"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: step === 3 
            ? "radial-gradient(circle, rgba(52,199,89,0.15) 0%, transparent 60%)"
            : "radial-gradient(circle, rgba(10,132,255,0.2) 0%, transparent 60%)",
        }}
      />

      {/* Modal */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[420px] bg-[#0a0a0c] border border-white/[0.06] rounded-[32px] overflow-hidden"
        style={{
          animation: "modalIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px -20px rgba(0,0,0,0.9), 0 0 120px rgba(10,132,255,0.08)",
        }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/[0.02]">
          <div
            className="h-full bg-gradient-to-r from-[#0a84ff] via-[#5856d6] to-[#ff3b30] transition-all duration-700 ease-out"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200 z-20 group"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/30 group-hover:text-white/50 transition-colors">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Content container */}
        <div className="p-8 pt-16 pb-8 min-h-[520px] flex flex-col">
          {/* Step indicator */}
          <div className="flex gap-2 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => i < step && goTo(i, "back")}
                disabled={i >= step}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500 cursor-default",
                  i === step ? "w-10 bg-white" : i < step ? "w-1.5 bg-white/50 cursor-pointer hover:bg-white/70" : "w-1.5 bg-white/[0.08]"
                )}
              />
            ))}
          </div>

          {/* Step content */}
          <div
            className={cn(
              "flex-1 transition-all duration-300",
              animating ? (direction === "forward" ? "opacity-0 translate-x-8" : "opacity-0 -translate-x-8") : "opacity-100 translate-x-0"
            )}
          >
            {/* Step 0: Phone */}
            {step === 0 && (
              <div>
                <div className="mb-8">
                  <p className="text-[#0a84ff] text-[13px] font-medium tracking-wide mb-3">STEP 1 OF 4</p>
                  <h2 className="text-[36px] sm:text-[40px] font-semibold text-white tracking-tight leading-none mb-3">
                    Connect your phone
                  </h2>
                  <p className="text-white/40 text-[16px] leading-relaxed">
                    Link your number to start intercepting suspicious calls in real-time.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-16 px-6 rounded-2xl bg-white/[0.03] text-white text-xl font-mono tracking-wider placeholder:text-white/15 border border-white/[0.06] focus:border-[#0a84ff]/40 focus:bg-white/[0.05] outline-none transition-all duration-300"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/30">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-white/20 text-[13px] px-1">
                    We{"'"}ll send a one-time verification code
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Persona */}
            {step === 1 && (
              <div>
                <div className="mb-8">
                  <p className="text-[#0a84ff] text-[13px] font-medium tracking-wide mb-3">STEP 2 OF 4</p>
                  <h2 className="text-[36px] sm:text-[40px] font-semibold text-white tracking-tight leading-none mb-3">
                    Choose your shield
                  </h2>
                  <p className="text-white/40 text-[16px] leading-relaxed">
                    Select an AI persona to handle scam calls on your behalf.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p.id)}
                      className={cn(
                        "relative p-5 rounded-2xl text-left transition-all duration-300 group",
                        persona === p.id
                          ? "bg-gradient-to-b from-white/[0.1] to-white/[0.03] border-2 border-[#0a84ff]/50"
                          : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]"
                      )}
                    >
                      {persona === p.id && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#0a84ff] flex items-center justify-center animate-in zoom-in duration-200">
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <span className="text-2xl mb-3 block">{p.icon}</span>
                      <p className="text-white text-[15px] font-medium mb-1">{p.name}</p>
                      <p className="text-white/30 text-[13px] leading-snug">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Speed */}
            {step === 2 && (
              <div>
                <div className="mb-8">
                  <p className="text-[#0a84ff] text-[13px] font-medium tracking-wide mb-3">STEP 3 OF 4</p>
                  <h2 className="text-[36px] sm:text-[40px] font-semibold text-white tracking-tight leading-none mb-3">
                    Set response time
                  </h2>
                  <p className="text-white/40 text-[16px] leading-relaxed">
                    How quickly should your AI intercept suspicious calls?
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Speed visualization */}
                  <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-white/40 text-[14px]">Response latency</span>
                      <span className="text-[#0a84ff] text-[20px] font-mono font-medium">{speeds[speed].time}</span>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0a84ff] to-[#ff3b30] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${speeds[speed].value}%` }}
                      />
                    </div>
                  </div>

                  {/* Speed options */}
                  <div className="grid grid-cols-3 gap-3">
                    {speeds.map((s, i) => (
                      <button
                        key={s.label}
                        onClick={() => setSpeed(i)}
                        className={cn(
                          "h-14 rounded-xl text-[15px] font-medium transition-all duration-300",
                          speed === i
                            ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                            : "bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="text-center flex flex-col items-center justify-center h-full -mt-4">
                {/* Success animation */}
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#34c759] to-[#30d158] opacity-20 blur-2xl animate-pulse" />
                  <div
                    className="relative w-full h-full rounded-full bg-gradient-to-br from-[#34c759] to-[#30d158] flex items-center justify-center"
                    style={{ animation: "successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                  >
                    <svg
                      width="56"
                      height="56"
                      viewBox="0 0 56 56"
                      fill="none"
                      style={{ animation: "checkDraw 0.8s ease-out 0.3s both" }}
                    >
                      <path d="M14 28L24 38L42 18" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-[36px] sm:text-[40px] font-semibold text-white tracking-tight leading-none mb-3">
                  You{"'"}re protected
                </h2>
                <p className="text-white/40 text-[16px] mb-8 max-w-[280px]">
                  Your AI bodyguard is now active and monitoring incoming calls.
                </p>

                {/* Mini visualizer */}
                <div className="w-full max-w-[200px] bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
                  <MiniVisualizer />
                  <p className="text-white/30 text-[11px] mt-3 tracking-wide">MONITORING ACTIVE</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-4">
            {step > 0 && step < 3 && (
              <button
                onClick={back}
                className="flex-1 h-14 rounded-2xl bg-white/[0.03] text-white/50 text-[16px] font-medium hover:bg-white/[0.06] hover:text-white/70 transition-all duration-300 border border-white/[0.04]"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className={cn(
                "h-14 rounded-2xl text-[16px] font-semibold transition-all duration-300 flex items-center justify-center gap-3",
                step === 3
                  ? "bg-gradient-to-r from-[#34c759] to-[#30d158] text-white hover:opacity-90 shadow-[0_0_40px_rgba(52,199,89,0.25)]"
                  : "bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.1)]",
                step === 0 || step === 3 ? "w-full" : "flex-1"
              )}
              style={{ transform: "translateZ(0)" }}
            >
              {step === 3 ? "Done" : "Continue"}
              {step < 3 && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="transition-transform group-hover:translate-x-1">
                  <path d="M7 5L11 9L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes successPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes checkDraw {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
