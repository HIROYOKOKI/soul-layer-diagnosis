'use client'
import { useState } from 'react'

type Choice = 'E'|'V'|'Λ'|'Ǝ'
const OPTIONS: Choice[] = ['E','V','Λ','Ǝ']

type Score = { E:number; V:number; 'Λ':number; 'Ǝ':number }
const scoreFrom = (c: Choice): Score => ({
  E: c==='E'?1:0, V: c==='V'?1:0, 'Λ': c==='Λ'?1:0, 'Ǝ': c==='Ǝ'?1:0
})

export default function DailyQuestion() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [comment, setComment] = useState(''); const [advice, setAdvice] = useState('')
  const [err, setErr] = useState('')

  async function diagnose() {
    setErr('')
    try {
      if (!choice) return
      const r = await fetch('/api/daily/diagnose', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          userId:'guest',
          theme:'work',
          structure_score: scoreFrom(choice),
          choice
        })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.detail || 'diagnose error')
      setComment(j.comment ?? ''); setAdvice(j.advice ?? '')
    } catch (e:any) {
      setErr(e?.message ?? String(e))
    }
  }

  return (
    <div className="space-y-4 text-white" style={{padding:'24px'}}>
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

      {err && <p className="text-red-400 text-sm">Error: {err}</p>}

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
