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
  const [out, setOut] = useState("")
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
