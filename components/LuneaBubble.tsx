// components/LuneaBubble.tsx
"use client"

import React, { useEffect, useState } from "react"

const AVATAR_SRC = "/lunea-avatar.png" // 画像が無ければ自動で非表示

export type LuneaBubbleProps = {
  text: string
  /** 1 文字あたりのミリ秒（小さいほど速い） */
  speed?: number
}

export default function LuneaBubble({ text, speed = 30 }: LuneaBubbleProps) {
  const [out, setOut] = useState("")

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

  return (
    <div className="flex items-start gap-3 max-w-2xl" aria-live="polite">
      <img
        src={AVATAR_SRC}
        alt="Lunea"
        className="w-10 h-10 rounded-full ring-1 ring-white/15 object-cover"
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.display = "none"
        }}
      />
      <div className="relative max-w-[680px] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shadow-[inset_0_0_12px_rgba(255,255,255,.06)]">
        {/* 尾っぽ（左） */}
        <span className="absolute -left-2 top-5 h-3 w-3 rotate-45 bg-white/5 border-l border-t border-white/10 rounded-sm" />
        <p className="leading-relaxed text-[15px] text-white/90">{out || "…"}</p>
      </div>
    </div>
  )
}
