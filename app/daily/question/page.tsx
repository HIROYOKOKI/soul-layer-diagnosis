'use client'
import { useState } from 'react'

type Choice = 'E'|'V'|'Λ'|'Ǝ'
const OPTIONS: Choice[] = ['E','V','Λ','Ǝ']

export default function DailyQuestion() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [comment, setComment] = useState(''); const [advice, setAdvice] = useState('')

  async function diagnose() {
    if (!choice) return
    const r = await fetch('/api/daily/diagnose', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        userId:'guest',
        theme:'work',
        structure_score:{E:0,V:0,Λ:0,Ǝ:0,[choice]:1},
        choice
      })
    })
    const j = await r.json()
    setComment(j.comment ?? ''); setAdvice(j.advice ?? '')
  }

  return (
    <div className="space-y-4 text-white">
      <h1 className="text-xl font-semibold">Daily 診断</h1>
      <div className="grid gap-2">
        {OPTIONS.map(k=>(
          <button key={k} onClick={()=>setChoice(k)}
            className={`rounded border px-4 py-2 ${choice===k?'border-white':'border-white/30'}`}>
            {k}
          </button>
        ))}
      </div>
      <button disabled={!choice} onClick={diagnose}
        className="rounded bg-white/10 px-4 py-2 disabled:opacity-40">
        診断する
      </button>

      {comment && (
        <div className="rounded border border-white/20 p-3 space-y-2">
          <div className="font-semibold">ルネアからのメッセージ</div>
          <p className="whitespace-pre-wrap">{comment}</p>
          {advice && <p className="text-sm text-white/80">一言：{advice}</p>}
        </div>
      )}
    </div>
  )
}
