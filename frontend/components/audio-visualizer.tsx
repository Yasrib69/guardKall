"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  className?: string;
}

export function AudioVisualizer({ className }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const barsRef = useRef<{ h: number; target: number; vel: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BAR_COUNT = 64;

    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: BAR_COUNT }, () => ({
        h: 0.3,
        target: 0.3,
        vel: 0,
      }));
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      timeRef.current += 0.035;
      const t = timeRef.current;

      const gap = 4;
      const barW = (w - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      const maxH = h * 0.85;

      for (let i = 0; i < BAR_COUNT; i++) {
        const bar = barsRef.current[i];
        const norm = i / (BAR_COUNT - 1);
        const fromCenter = Math.abs(norm - 0.5) * 2;
        const centerPower = Math.pow(1 - fromCenter, 2);

        // Layered waves
        const w1 = Math.sin(t * 2.5 + i * 0.15) * 0.3;
        const w2 = Math.sin(t * 1.8 + i * 0.1 + 2) * 0.25;
        const w3 = Math.cos(t * 3.2 + i * 0.08) * 0.15;
        const w4 = Math.sin(t * 1.2 + i * 0.2) * 0.2;

        const base = 0.15 + centerPower * 0.4;
        bar.target = Math.max(0.1, Math.min(1, base + (w1 + w2 + w3 + w4) * (0.4 + centerPower * 0.6)));

        // Spring
        const force = (bar.target - bar.h) * 0.12;
        bar.vel = (bar.vel + force) * 0.82;
        bar.h += bar.vel;

        const x = i * (barW + gap);
        const barH = maxH * bar.h;
        const y = (h - barH) / 2;
        const r = barW / 2;

        // Color pattern: alternate blue/red
        const isRed = i % 2 === 1;
        const alpha = 0.85 + centerPower * 0.15;

        // Glow
        ctx.save();
        ctx.shadowBlur = 30 + centerPower * 20;
        ctx.shadowColor = isRed ? `rgba(255, 59, 48, ${0.7 * alpha})` : `rgba(10, 132, 255, ${0.7 * alpha})`;

        // Gradient fill
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        if (isRed) {
          grad.addColorStop(0, `rgba(255, 59, 48, ${0.4 * alpha})`);
          grad.addColorStop(0.2, `rgba(255, 79, 68, ${0.95 * alpha})`);
          grad.addColorStop(0.5, `rgba(255, 110, 100, ${1 * alpha})`);
          grad.addColorStop(0.8, `rgba(255, 79, 68, ${0.95 * alpha})`);
          grad.addColorStop(1, `rgba(255, 59, 48, ${0.4 * alpha})`);
        } else {
          grad.addColorStop(0, `rgba(10, 132, 255, ${0.4 * alpha})`);
          grad.addColorStop(0.2, `rgba(50, 160, 255, ${0.95 * alpha})`);
          grad.addColorStop(0.5, `rgba(90, 185, 255, ${1 * alpha})`);
          grad.addColorStop(0.8, `rgba(50, 160, 255, ${0.95 * alpha})`);
          grad.addColorStop(1, `rgba(10, 132, 255, ${0.4 * alpha})`);
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, r);
        ctx.fill();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-[240px] sm:h-[320px] md:h-[400px]", className)}
    />
  );
}
