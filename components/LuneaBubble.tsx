// components/LuneaBubble.tsx
"use client"

import React, { useEffect, useState } from "react"

const PRIMARY_AVATAR = "/lunea.png"   // 任意差し替え
const FALLBACK_AVATAR = "/icon-512.png"      // 青い発光アイコンをフォールバックに

export type LuneaBubbleProps = {
  text: string
  /** 1文字あたりのms（小さいほど速い） */
  speed?: number
}

export default function LuneaBubble({ text, speed = 18 }: LuneaBubbleProps) {
  const [out, setOut] // components/LuneaBubble.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  tone?: "normal" | "accent";
  onDone?: () => void;
  speed?: number; // ms/char
};

export default function LuneaBubble({ text, tone = "normal", onDone, speed = 18 }: Props) {
  const [shown, setShown] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // 文字列が変わったら最初から
    setShown("");
    let i = 0;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        onDone?.();
      }
    }, Math.max(1, speed));
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [text, speed, onDone]);

  return (
    <div className="relative max-w-prose">
      {/* avatar */}
      <div className="absolute -left-12 top-0 size-10 rounded-full bg-[#000814] ring-2 ring-[#0033ff]/60 shadow-[0_0_24px_#0033ff66]" />
      {/* bubble */}
      <div
        className={[
          "rounded-2xl px-4 py-3 leading-7",
          "backdrop-blur-sm border border-white/10",
          "bg-black/60 text-white",
          tone === "accent" ? "shadow-[0_0_24px_#0033ff66] ring-1 ring-[#0033ff]/50" : "shadow-none",
        ].join(" ")}
      >
        <span className="whitespace-pre-wrap">{shown}</span>
      </div>
      {/* tail */}
      <div className="absolute left-2 top-full h-3 w-3 rotate-45 bg-black/60 border-b border-r border-white/10" />
    </div>
  );
}
= useState("")
  const [src, setSrc] = useState(PRIMARY_AVATAR)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setOut("")
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // 1回目の失敗はフォールバックに差し替え、2回目以降は非表示
    if (src !== FALLBACK_AVATAR) {
      setSrc(FALLBACK_AVATAR)
    } else {
      setHidden(true)
    }
  }

  return (
    <div className="flex items-start gap-3 max-w-2xl" aria-live="polite">
      {!hidden && (
        <img
          src={src}
          alt="Lunea"
          className="shrink-0 w-10 h-10 rounded-full ring-1 ring-white/15 object-cover"
          onError={onImgError}
        />
      )}
      <div className="relative max-w-[680px] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shadow-[inset_0_0_12px_rgba(255,255,255,.06)]">
        {/* 尾っぽ（左） */}
        <span className="absolute -left-2 top-5 h-3 w-3 rotate-45 bg-white/5 border-l border-t border-white/10 rounded-sm" />
        <p className="leading-relaxed text-[15px] text-white/90">{out || "…"}</p>
      </div>
    </div>
  )
}
