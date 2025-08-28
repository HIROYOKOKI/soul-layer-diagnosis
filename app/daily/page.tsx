// app/daily/page.tsx
'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/_components/AppShell'        // ← 追加
import {
  LUNEA, selectLuneaIntoSession, setLuneaMode,
  type LuneaMode, DEFAULT_LUNEA_MODE,
} from '@/app/_data/characters/lunea'

type NavigatorMaybeVibrate = Navigator & { vibrate?: (p: VibratePattern) => boolean }

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode] = useState<LuneaMode>(DEFAULT_LUNEA_MODE)
  const busy = useRef(false)

  const start = () => {
    if (busy.current) return
    busy.current = true
    selectLuneaIntoSession()
    setLuneaMode(mode)
    ;(navigator as NavigatorMaybeVibrate).vibrate?.(15)
    router.push('/daily/question')
    setTimeout(()=>busy.current=false, 600)
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <header className="mb-4">
          <h1 className="text-xl font-extrabold tracking-tight">ルネア（Lunea）</h1>
          <p className="text-white/70 text-sm mt-1">
            あなたのソウルレイヤーを静かに照らす案内人
          </p>
        </header>

        <button
          type="button"
          onClick={start}
          className="h-12 px-6 rounded-2xl border border-white/10 bg-black/50 text-sm font-semibold shadow
                     hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          診断を始める
        </button>
      </div>
    </AppShell>
  )
}
