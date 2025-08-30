"use client"

import { useEffect, useState } from "react";
import HeaderIcon from "./ui/HeaderIcon";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

type Me = { plan: "free" | "premium" } | null

export default function AppHeader() {
  const [me, setMe] = useState<Me>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" })
        const j = await r.json()
        if (alive) setMe(j)
      } catch {
        if (alive) setMe({ plan: "free" })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return (
    <header className="flex items-center justify-between px-4 py-3">
      {/* 左：ロゴアイコン＋タイトル */}
      <div className="flex items-center gap-2">
        <HeaderIcon src="/icon-512.png" /> 
        <span className="text-xs text-white/60">SOUL LAYER DIAGNOSIS</span>
      </div>

      {/* 右：設定ボタン */}
      <div className="h-8 w-8">
        {loading ? (
          <div className="h-8 w-8 rounded-full bg-white/6 animate-pulse" />
        ) : me?.plan === "premium" ? (
          <button
            aria-label="Settings"
            className="h-8 w-8 rounded-full grid place-items-center
                       bg-white/6 hover:bg-white/10 transition"
          >
            <Cog6ToothIcon className="h-4 w-4 text-white/80" />   {/* ✅ */}
          </button>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>
    </header>
  )
}
