// app/daily/question/page.tsx
'use client'
import { useState } from 'react'

export default function DailyQuestion() {
  const [choice, setChoice] = useState<'E'|'V'|'Λ'|'Ǝ'|null>(null)
  return (
    <div className="space-y-4 text-white">
      <h1 className="text-xl font-semibold">Daily 診断</h1>
      <div className="grid gap-2">
        {(['E','V','Λ','Ǝ'] as const).map(k => (
          <button key={k} onClick={()=>setChoice(k)}
            className={`rounded border px-4 py-2 ${choice===k?'border-white':'border-white/30'}`}>
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
