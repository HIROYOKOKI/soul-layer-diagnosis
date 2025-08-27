// app/structure/quick/QuickClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'
type PendingV1 = {
  choiceText: string
  code: EV
  result: { type: string; weight: number; comment: string; advice?: string }
  _meta: { ts: number; v: 'quick-v1' }
}

function makeResultFrom(code: EV): PendingV1['result'] {
  switch (code) {
    case 'E': return { type:'EVΛƎ型', weight:0.8, comment:'衝動と行動で流れを作る傾向。まず動いて学びを回収するタイプ。' }
    case 'V': return { type:'EΛVƎ型', weight:0.7, comment:'可能性を広げてから意思決定する傾向。夢を具体化していくタイプ。' }
    case 'Λ': return { type:'ΛEƎV型', weight:0.75, comment:'選択基準を定めて最短距離を選ぶ傾向。設計と取捨選択が得意。' }
    default : return { type:'ƎVΛE型', weight:0.7, comment:'観測→小実験→選び直しの循環。状況把握が得意。' }
  }
}

export default function QuickClient() {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  const choices: Array<{ label:string; code:EV }> = [
    { label:'A. とりあえず動く。やりながら整える。', code:'E' },
    { label:'B. 目的と制約を先に決め、最短の選択肢を絞る。', code:'Λ' },
    { label:'C. まず観測して小さく試し、次に要点を選び直す。', code:'Ǝ' },
    { label:'D. どちらとも言えない／状況により変える。', code:'V' },
  ]

  const handleSelect = (choiceText:string, code:EV) => {
    if (sending) return
    setSending(true)
    const payload: PendingV1 = { choiceText, code, result: makeResultFrom(code), _meta:{ ts:Date.now(), v:'quick-v1' } }
    sessionStorage.setItem('structure_quick_pending', JSON.stringify(payload))
    router.push('/structure/quick/confirm')            // ← 確認ページへ（保存はしない）
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-4 text-center">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} className="inline-block" />
      </header>

      <main className="max-w-md mx-auto px-5 space-y-3">
        <h2 className="text-center text-lg font-bold">クイック判定（1問）</h2>
        {choices.map(c => (
          <button
            key={c.label}
            className="w-full rounded-2xl bg-white/5 border border-white/12 px-4 py-4 text-left"
            onClick={() => handleSelect(c.label, c.code)}
            disabled={sending}
          >{c.label}</button>
        ))}
      </main>
    </div>
  )
}
