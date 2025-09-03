// app/components/AppHeader.tsx
"use client"

import { Settings } from "lucide-react"

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-3">
      {/* 左：ブランド1行のみ */}
      <div className="text-sm tracking-[0.25em] text-white/70">
        SOUL LAYER DIAGNOSIS
      </div>

      {/* 右：FREEピル + 設定ギア（FREEはここだけ） */}
      <div className="flex items-center gap-2">
        <span className="free-badge px-3 py-1 text-xs rounded-full border border-white/20 bg-white/10 text-white/80">
          FREE
        </span>
        <button
          aria-label="Settings"
          className="rounded-full p-2 hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          {/* 線を細く（JSX + 任意プロパティで確実に） */}
          <Settings className="w-5 h-5 text-sky-400 [stroke-width:1.1]" strokeWidth={1.1} />
        </button>
      </div>
    </header>
  )
}
