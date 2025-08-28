// app/daily/page.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/app/components/AppHeader' // ← これを使う
import {
  LUNEA,
  selectLuneaIntoSession,
  setLuneaMode,
  type LuneaMode,
  DEFAULT_LUNEA_MODE,
} from '@/app/_data/characters/lunea'

type NavigatorMaybeVibrate = Navigator & { vibrate?: (p: VibratePattern) => boolean }

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode] = useState<LuneaMode>(DEFAULT_LUNEA_MODE)
  const busyRef = useRef(false)

  const start = () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      selectLuneaIntoSession()
      setLuneaMode(mode)
      ;(navigator as NavigatorMaybeVibrate).vibrate?.(15)
      router.push('/daily/question')
    } finally {
      setTimeout(() => { busyRef.current = false }, 600)
    }
  }

  return (
    <>
      {/* 共通ヘッダー */}
      <AppHeader />

      {/* 中央寄せコンテナ（左右余白・最大幅・上余白） */}
      <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <header className="mb-4">
          <h1 className="text-xl font-extrabold tracking-tight">{LUNEA.persona.displayName}</h1>
          <p className="text-white/70 text-sm mt-1">{LUNEA.persona.tagline}</p>
        </header>

        <button
          type="button"
          onClick={start}
          className="h-12 px-6 rounded-2xl border border-white/10 bg-black/50 text-sm font-semibold shadow
                     hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          style={{ touchAction: 'manipulation', minWidth: 180 }}
        >
          診断を始める
        </button>
      </main>
    </>
  )
}
