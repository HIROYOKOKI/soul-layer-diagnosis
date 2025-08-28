// app/daily/page.tsx
'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LUNEA, selectLuneaIntoSession, setLuneaMode, type LuneaMode,
} from '@/app/_data/characters/lunea'

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LuneaMode>('friend')
  const [ready, setReady] = useState(false)       // DOM準備完了フラグ
  const busyRef = useRef(false)

  useEffect(() => {
    // 上に被ってる透明要素があれば pointer-events を落とすためのデバッグ
    setReady(true)
  }, [])

  const start = () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      selectLuneaIntoSession()
      setLuneaMode(mode)
      // 触覚フィードバック（対応端末）
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { (navigator as any).vibrate?.(15) } catch {}
      }
      router.push('/daily/question')
      // ログ（開発用）
      console.log('[daily] start clicked', { mode })
    } finally {
      setTimeout(() => (busyRef.current = false), 600)
    }
  }

  // Enter/Space でも押せるように
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); start()
    }
  }

  return (
    <div className="container-narrow py-8 relative z-20"> {/* ← z-20 で前面に */}
      <h1 className="h1 mb-2">{LUNEA.persona.displayName}</h1>
      <p className="sub mb-4">{LUNEA.persona.tagline}</p>

      {/* 外枠カードなし → ガラス枠を外し、余白だけにする */}
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
                checked={mode === opt.v}
                onChange={() => setMode(opt.v as LuneaMode)}
                className="accent-white/90 w-4 h-4"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={start}
        onKeyDown={onKey}
        aria-pressed="false"
        className="tap btn btn-blue glow-shadow-blue relative z-30"
        style={{
          minWidth: 180,
          touchAction: 'manipulation',   // 300ms遅延回避
          cursor: 'pointer',
        }}
      >
        診断を始める
      </button>

      {/* デバッグ: クリックブロッカーがあれば警告（開発時のみ目視用） */}
      {ready && (
        <div className="sr-only">
          {/* ここに将来、重なり要素検出が必要なら入れる */}
        </div>
      )}
    </div>
  )
}
