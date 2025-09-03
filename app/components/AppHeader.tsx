// app/components/AppHeader.tsx
"use client"

import { Settings } from "lucide-react"

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-3">
      <div className="text-sm tracking-[0.25em] text-white/70">SOUL LAYER DIAGNOSIS</div>
      <div className="flex items-center gap-2">
        <span className="free-badge px-3 py-1 text-xs rounded-full border border-white/20 bg-white/10 text-white/80">
          FREE
        </span>
        <button
          aria-label="Settings"
          className="rounded-full p-2 hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          {/* 任意プロパティで stroke-width を強制 */}
          <Settings className="w-5 h-5 text-sky-400 [stroke-width:1.05]" strokeWidth={1.05} />
        </button>
      </div>
    </header>
  )
}
