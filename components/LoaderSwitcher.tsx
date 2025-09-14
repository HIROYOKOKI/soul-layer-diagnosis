"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * LoaderSwitcher — サイバー／グリッチ系ローディングをランダムに切り替える
 * - MatrixRain: コードの雨
 * - SymbolGlitch: ネオンシンボル崩壊→再構築
 * - CRTNoise: 砂嵐＋スキャンライン
 */

export default function LoaderSwitcher({
  duration = 30000,
  onDone,
  mode = "random",
  showCaption = true,
  theme = "prod",
}: {
  duration?: number;
  onDone?: () => void;
  mode?: "random" | "matrix" | "glitch" | "crt";
  showCaption?: boolean;
  theme?: "dev" | "prod";
}) {
  const index = useMemo(() => {
    if (mode === "matrix") return 0;
    if (mode === "glitch") return 1;
    if (mode === "crt") return 2;
    if (theme === "dev") return 0;
    return Math.floor(Math.random() * 3);
  }, [mode, theme]);

  if (index === 0) return <MatrixRain duration={duration} onDone={onDone} showCaption={showCaption} theme={theme} />;
  if (index === 1) return <SymbolGlitch duration={duration} onDone={onDone} showCaption={showCaption} theme={theme} />;
  return <CRTNoise duration={duration} onDone={onDone} showCaption={showCaption} theme={theme} />;
}

// ============================================================
// MatrixRain — コードの雨
// ============================================================
function MatrixRain({ duration, onDone, showCaption, theme }: CommonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initColumns();
    };
    window.addEventListener("resize", onResize);

    const charset = "01EVΛƎΣΩλνμπγδεζηθκξστυφχψωABCDEFGHIJKLMNOP";
    const fontSize = 18;
    let columns = Math.floor(w / fontSize);
    let drops = new Array(columns).fill(0).map(() => Math.random() * -50);

    function initColumns() {
      columns = Math.floor(w / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    }

    function draw(t: number) {
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / (duration ?? 30000));
      setProgress(p);
      if (p >= 1) onDone?.();

      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const ch = charset[Math.floor(Math.random() * charset.length)];
        ctx.fillStyle = "rgba(120, 255, 170, 0.95)";
        ctx.shadowColor = "rgba(120,255,170,0.8)";
        ctx.shadowBlur = 8;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.985 - p * 0.01) drops[i] = 0;
        drops[i] += 1 + Math.random() * 0.8;
      }

      if (p > 0.66) {
        ctx.save();
        const alpha = (p - 0.66) / 0.34;
        ctx.globalAlpha = 0.6 * alpha;
        ctx.fillStyle = "rgba(20, 240, 160, 0.2)";
        ctx.font = `${Math.max(w, h) * 0.18}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("EVΛƎ", w / 2, h / 2);
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, onDone]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient( to bottom, rgba(0,255,150,0.06) 0, rgba(0,255,150,0.06) 1px, transparent 2px )",
        }}
      />
      <Caption visible={showCaption} textByProgress={["コードを展開中…", "構造を解析中…", "観測を確定します…"]} progress={progress} colorClass="text-emerald-200" />
      {theme === "dev" && <ProgressBar progress={progress} />}
    </div>
  );
}

// ============================================================
// SymbolGlitch — ネオンシンボル崩壊→再構築
// ============================================================
function SymbolGlitch({ duration, onDone, showCaption, theme }: CommonProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / (duration ?? 30000));
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else onDone?.();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [duration, onDone]);

  const glitchAmt = Math.sin(progress * Math.PI * 6) * (1 - progress) * 16;

  return (
    <div className="relative grid h-dvh w-full place-items-center overflow-hidden bg-black text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative select-none">
        {(["#0ff", "#f0f", "#fff"] as const).map((c, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ filter: `drop-shadow(0 0 12px ${c})` }}
            animate={{
              x: (i - 1) * glitchAmt,
              y: (1 - i) * glitchAmt,
              rotate: (i - 1) * glitchAmt * 0.1,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            <div className="font-extrabold tracking-[0.3em]" style={{ fontSize: "min(22vw, 180px)" }}>
              EVΛƎ
            </div>
          </motion.div>
        ))}
      </div>
      <NoiseOverlay variant="glitch" />
      <Caption visible={showCaption} textByProgress={["シンボルを展開…", "断片から再構成…", "同調完了…"]} progress={progress} colorClass="text-fuchsia-200" />
      {theme === "dev" && <ProgressBar progress={progress} />}
    </div>
  );
}

// ============================================================
// CRTNoise — 砂嵐＋スキャンライン
// ============================================================
function CRTNoise({ duration, onDone, showCaption, theme }: CommonProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / (duration ?? 30000));
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else onDone?.();
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [duration, onDone]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-emerald-100">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.06) 0deg 2deg, transparent 2deg 4deg)",
          animation: "noiseSpin 6s linear infinite",
        }}
      />
      <style>{`@keyframes noiseSpin {to {transform: rotate(1turn)}}`}</style>
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,255,150,0.08) 0 1px, transparent 2px 4px)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 w-[90%] max-w-3xl -translate-x-1/2 -translate-y-1/2 font-mono">
        <TypeLine text=":RUN OBSERVATION.PROTOCOL — EVΛƎ" speed={28} progress={progress} />
        <TypeLine text="> decrypting soul-structure …" speed={34} progress={progress} delay={400} />
        <TypeLine text="> aligning vectors [E,V,Λ,Ǝ] …" speed={30} progress={progress} delay={1200} />
        <TypeLine text="> generating advisory …" speed={26} progress={progress} delay={2200} />
      </div>
      <NoiseOverlay variant="crt" />
      <Caption visible={showCaption} textByProgress={["信号を取得…", "同期中…", "観測プロトコル準備完了…"]} progress={progress} colorClass="text-emerald-200" />
      {theme === "dev" && <ProgressBar progress={progress} />}
    </div>
  );
}

// ============================================================
// 共通部品
// ============================================================
type CommonProps = {
  duration?: number;
  onDone?: () => void;
  showCaption?: boolean;
  theme?: "dev" | "prod";
};

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="absolute bottom-4 left-1/2 w-[70%] -translate-x-1/2 rounded-full bg-white/10">
      <div className="h-1 rounded-full bg-white/60" style={{ width: `${Math.round(progress * 100)}%` }} />
    </div>
  );
}

function Caption({ visible, textByProgress, progress, colorClass = "" }: { visible?: boolean; textByProgress: [string, string, string] | string[]; progress: number; colorClass?: string }) {
  const idx = progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2;
  if (!visible) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        className="absolute left-1/2 top-[78%] w-[92%] max-w-2xl -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5 }}
      >
        <p className={`text-balance text-sm md:text-base leading-relaxed ${colorClass}`}>{textByProgress[idx]}</p>
      </motion.div>
    </AnimatePresence>
  );
}

function NoiseOverlay({ variant }: { variant: "glitch" | "crt" }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 2px 6px)",
          mixBlendMode: "screen",
          animation: variant === "glitch" ? "glitchShift 1.2s steps(2) infinite" : undefined,
        }}
      />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "6px 6px",
          mixBlendMode: "screen",
          animation: "noiseJitter 0.9s steps(3) infinite",
        }}
      />
      <style>{`
        @keyframes glitchShift { 50% { transform: translateX(2px) } }
        @keyframes noiseJitter { 50% { transform: translateY(1px) } }
      `}</style>
    </div>
  );
}

function TypeLine({ text, speed, progress, delay = 0 }: { text: string; speed: number; progress: number; delay?: number }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow((n) => (n + 1) % 1e9), speed);
    return () => clearInterval(id);
  }, [speed]);
  const enabled = performance.now?.() > delay;
  const length = Math.floor(((progress * 3) % 1) * text.length);
  const visible = enabled ? Math.min(text.length, length) : 0;
  return (
    <div className="mb-2 whitespace-pre text-sm md:text-base">
      <span>{text.slice(0, visible)}</span>
      <span className="animate-pulse">▌</span>
    </div>
  );
}
