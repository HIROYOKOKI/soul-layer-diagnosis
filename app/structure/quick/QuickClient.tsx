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

const QUESTION = '新しい環境に入った直後、あなたの最初の一手は？' // ← 出題セリフ

function makeResultFrom(code: EV): PendingV1['result'] {
  switch (code) {
    case 'E': return { type: 'EVΛƎ型', weight: 0.8, comment: '衝動と行動で流れを作る傾向。まず動いて学びを回収するタイプ。' }
    case 'V': return { type: 'EΛVƎ型', weight: 0.7, comment: '可能性を広げてから意思決定する傾向。夢を具体化していくタイプ。' }
    case 'Λ': return { type: 'ΛEƎV型', weight: 0.75, comment: '選択基準を定めて最短距離を選ぶ傾向。設計と取捨選択が得意。' }
    default : return { type: 'ƎVΛE型', weight: 0.7, comment: '観測→小実験→選び直しの循環。状況把握が得意。' }
  }
}

function CardOption({
  label, onClick, disabled,
}: { label: string; onClick: () => void; disabled?: boolean }) {
  const badge = label.substring(0, 2).replace('.', '')
  const text = label.slice(3)
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group w-full text-left rounded-2xl bg-white/5 border border-white/12
                 px-4 py-4 transition hover:bg-white/8 hover:border-white/20
                 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/30
                 disabled:opacity-50"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center
                         rounded-full border border-white/25 text-xs text-white/80 px-2 py-0.5">
          {badge}
        </span>
        <span className="text-[15px] leading-relaxed text-white">{text}</span>
      </div>
    </button>
  )
}

export default function QuickClient() {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  const choices: Array<{ label: string; code: EV }> = [
    { label: 'A. とりあえず動く。やりながら整える。', code: 'E' },
    { label: 'B. 目的と制約を先に決め、最短の選択肢を絞る。', code: 'Λ' },
    { label: 'C. まず観測して小さく試し、次に要点を選び直す。', code: 'Ǝ' },
    { label: 'D. どちらとも言えない／状況により変える。', code: 'V' },
  ]

  const handleSelect = (choiceText: string, code: EV) => {
    if (sending) return
    setSending(true)
    const payload: PendingV1 = {
      choiceText, code, result: makeResultFrom(code),
      _meta: { ts: Date.now(), v: 'quick-v1' },
    }
    sessionStorage.setItem('structure_quick_pending', JSON.stringify(payload))
    router.push('/structure/quick/confirm')
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto" />
      </header>

      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-md pt-2 pb-10">
          {/* タイトル */}
          <h2 className="text-center text-lg font-bold mb-2">クイック判定（1問）</h2>

          {/* ✅ 出題セリフ */}
          <p className="text-sm text-white/80 mb-5 text-center leading-relaxed">
            {QUESTION}
          </p>

          <div className="h-px bg-white/10 mb-5" />

          {/* 選択肢 */}
          <div className="grid gap-3">
            {choices.map((c) => (
              <CardOption
                key={c.label}
                label={c.label}
                disabled={sending}
                onClick={() => handleSelect(c.label, c.code)}
              />
            ))}
          </div>

          {sending && (
            <p className="mt-4 text-center text-xs text-white/60">次の画面へ移動中…</p>
          )}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
