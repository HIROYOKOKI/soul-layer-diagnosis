// app/daily/page.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LUNEA,
  selectLuneaIntoSession,
  setLuneaMode,
  type LuneaMode,
  DEFAULT_LUNEA_MODE,
} from '@/app/_data/characters/lunea'

// フラグ: スタイル選択UIを出すかどうか
const enableStyleSelector =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_LUNEA_STYLE_SELECTOR === 'on'

type NavigatorMaybeVibrate = Navigator & { vibrate?: (p: VibratePattern) => boolean }

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LuneaMode>(DEFAULT_LUNEA_MODE)
  const busyRef = useRef(false)

  const start = () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      selectLuneaIntoSession()
      setLuneaMode(mode)
      if (typeof window !== 'undefined') {
        const nav = navigator as NavigatorMaybeVibrate
        try { nav.vibrate?.(15) } catch {}
      }
      router.push('/daily/question')
    } finally {
      setTimeout(() => { busyRef.current = false }, 600)
    }
  }

  return (
    <div className="container-narrow py-8 relative z-20">
      <h1 className="h1 mb-2">{LUNEA.persona.displayName}</h1>
      <p className="sub mb-4">{LUNEA.persona.tagline}</p>

      {/* ▼ フラグONのときだけ “スタイル選択” を表示 */}
      {enableStyleSelector ? (
        <section className="rounded-xl p-0 mb-5">
          <p className="text-sm font-semibold mb-3">スタイルを選んでください</p>
          <div className="flex flex-col gap-3 text-sm">
            {[
              { v:'friend', label:'友達設定（親しい友人・同僚のように語りかけます）' },
              { v:'lover',  label:'恋人設定（恋人のように語りかけます）' },
              { v:'boss',   label:'上司設定（上司・先生のように語りかけます）' },
              { v:'self',   label:'自分設定（自身の心の声をルネアが代わって語りかけます）' },
            ].map(opt => (
              <label key={opt.v} className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="radio"
                  name="lunea-mode"
                  value={opt.v}
                  checked={mode === (opt.v as LuneaMode)}
                  onChange={() => setMode(opt.v as LuneaMode)}
                  className="accent-white/90 w-4 h-4"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {/* ▼ 常に表示：診断スタート */}
      <button
        type="button"
        onClick={start}
        className="tap btn btn-blue glow-shadow-blue relative z-30"
        style={{ minWidth: 180, touchAction: 'manipulation', cursor: 'pointer' }}
      >
        診断を始める
      </button>
    </div>
  )
}
