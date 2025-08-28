// app/daily/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LUNEA, selectLuneaIntoSession, setLuneaMode, type LuneaMode } from '@/app/_data/characters/lunea'

export default function DailyCharacterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LuneaMode>('friend')

  const start = () => {
    selectLuneaIntoSession()
    setLuneaMode(mode)
    router.push('/daily/question')
  }

  return (
    <div className="container-narrow py-8">
      <h1 className="h1 mb-2">{LUNEA.persona.displayName}</h1>
      <p className="sub mb-4">{LUNEA.persona.tagline}</p>

      <section className="glass rounded-xl p-4 mb-5 border border-white/10">
        <p className="text-sm font-semibold mb-3">口調スタイルを選んでください</p>
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="friend" checked={mode==='friend'} onChange={()=>setMode('friend')} />
            <span>友達設定（親しい友人・同僚のような口調）</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="lover" checked={mode==='lover'} onChange={()=>setMode('lover')} />
            <span>恋人設定（恋人のような口調）</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="boss" checked={mode==='boss'} onChange={()=>setMode('boss')} />
            <span>上司設定（上司/先生のような口調）</span>
          </label>
        </div>
      </section>

      <button className="btn btn-blue glow-shadow-blue" onClick={start}>
        診断を始める
      </button>
    </div>
  )
}
