'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { selectLuneaIntoSession } from '@/app/_data/characters/lunea'

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'friend' | 'lover' | 'boss'>('friend')

  const start = () => {
    selectLuneaIntoSession()
    sessionStorage.setItem('daily_character_mode', mode)
    router.push('/daily/question')
  }

  return (
    <div className="container-narrow py-8">
      <h1 className="h1 mb-2">ルネアを選択</h1>
      <p className="sub mb-4">診断を案内するナビゲーターです</p>

      <div className="glass rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold mb-2">口調スタイルを選んでください</p>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="friend"
              checked={mode === 'friend'}
              onChange={() => setMode('friend')}
            />
            <span>友達設定（親しい友人・同僚のような口調）</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="lover"
              checked={mode === 'lover'}
              onChange={() => setMode('lover')}
            />
            <span>恋人設定（恋人のような口調）</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="boss"
              checked={mode === 'boss'}
              onChange={() => setMode('boss')}
            />
            <span>上司設定（上司や先生のような口調）</span>
          </label>
        </div>
      </div>

      <button
        className="btn btn-blue glow-shadow-blue"
        onClick={start}
      >
        診断を始める
      </button>
    </div>
  )
}
