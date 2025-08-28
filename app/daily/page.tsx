// app/daily/page.tsx
'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LUNEA,
  selectLuneaIntoSession,
  setLuneaMode,
  type LuneaMode,
} from '@/app/_data/characters/lunea'

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LuneaMode>('friend')
  const busyRef = useRef(false)

  const start = () => {
    if (busyRef.current) return
    busyRef.current = true
    try {
      selectLuneaIntoSession()
      setLuneaMode(mode)
      router.push('/daily/question')
    } finally {
      // 画面遷移が走らないケースでも再クリック可に
      setTimeout(() => (busyRef.current = false), 600)
    }
  }

  return (
    <div className="container-narrow py-8 relative z-10">
      <h1 className="h1 mb-2">{LUNEA.persona.displayName}</h1>
      <p className="sub mb-4">{LUNEA.persona.tagline}</p>

      <section className="glass rounded-xl p-4 mb-5 border border-white/10">
        <p className="text-sm font-semibold mb-3">スタイルを選んでください</p>
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="lunea-mode"
              value="friend"
              checked={mode === 'friend'}
              onChange={() => setMode('friend')}
            />
            <span>友達設定（親しい友人・同僚のようにルネアが語りかけます）</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="lunea-mode"
              value="lover"
              checked={mode === 'lover'}
              onChange={() => setMode('lover')}
            />
            <span>恋人設定（恋人のようにルネアが語りかけます）</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="lunea-mode"
              value="boss"
              checked={mode === 'boss'}
              onChange={() => setMode('boss')}
            />
            <span>上司設定（上司・先生のようにルネアが語りかけます）</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="lunea-mode"
              value="self"
              checked={mode === 'self'}
              onChange={() => setMode('self')}
            />
            <span>自分設定（自身の心の声をルネアが代わって語りかけます）</span>
          </label>
        </div>
      </section>

      <button
        type="button"                         // ← フォーム送信抑止
        className="btn btn-blue glow-shadow-blue tap relative z-10"
        onClick={start}
        style={{ minWidth: 160 }}
      >
        診断を始める
      </button>
    </div>
  )
}
