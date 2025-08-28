// app/daily/page.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LUNEA,
  selectLuneaIntoSession,
  setLuneaMode,
  type LuneaMode,
} from '@/app/_data/characters/lunea'

// vibrate を型安全に使うための Navigator 拡張
interface NavigatorWithVibrate extends Navigator {
  vibrate?: (pattern: number | number[]) => boolean
}

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LuneaMode>('friend')
  const [ready, setReady] = useState(false) // デバッグ表示用フラグ
  const busyRef = useRef(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const start = () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      selectLuneaIntoSession()
      setLuneaMode(mode)

      // 触覚フィードバック（対応端末のみ）
      if (typeof window !== 'undefined') {
        const nav = navigator as NavigatorWithVibrate
        try { nav.vibrate?.(15) } catch {}
      }

      router.push('/daily/question')
      console.log('[daily] start clicked', { mode })
    } finally {
      // 画面遷移が走らなかった場合でも再クリック可能にする軽いロック
      setTimeout(() => { busyRef.current = false }, 600)
    }
  }

  // Enter/Space でも押せるように
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      start()
    }
  }

  // ラジオ選択肢（型を固定）
  const options: ReadonlyArray<{ v: LuneaMode; label: string }> = [
    { v: 'friend', label: '友達設定（親しい友人・同僚のように語りかけます）' },
    { v: 'lover',  label: '恋人設定（恋人のように語りかけます）' },
    { v: 'boss',   label: '上司設定（上司・先生のように語りかけます）' },
    { v: 'self',   label: '自分設定（自身の心の声をルネアが代わって語りかけます）' },
  ] as const

  return (
    <div className="container-narrow py-8 relative z-20">
      <h1 className="h1 mb-2">{LUNEA.persona.displayName}</h1>
      <p className="sub mb-4">{LUNEA.persona.tagline}</p>

      {/* 外枠カードなし（ガラスなし・線なし） */}
      <section className="rounded-xl p-0 mb-5">
        <p className="text-sm font-semibold mb-3">スタイルを選んでください</p>

        <div className="flex flex-col gap-3 text-sm">
          {options.map((opt) => (
            <label key={opt.v} className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="radio"
                name="lunea-mode"
                value={opt.v}
                checked={mode === opt.v}
                onChange={() => setMode(opt.v)}
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
          touchAction: 'manipulation', // 300ms遅延回避（モバイル）
          cursor: 'pointer',
        }}
      >
        診断を始める
      </button>

      {/* デバッグ用：必要になったらここに重なり検出ロジックを追加 */}
      {ready && <div className="sr-only">ready</div>}
    </div>
  )
}
