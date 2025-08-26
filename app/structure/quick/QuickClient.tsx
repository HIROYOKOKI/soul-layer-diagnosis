// app/structure/quick/QuickClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Choice = 'A'|'B'|'C'|'D'
type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
type StructureLetter = 'E'|'V'|'Λ'|'Ǝ'

type Result = { type: QuickResultType; weight: number; comment: string; advice: string }
type Pending = Result & { choice: Choice; choiceText: string; structure: StructureLetter }

const TEXT: Record<Choice,string> = {
  A: 'A. とりあえず動く。やりながら整える。',
  B: 'B. 目的と制約を先に決め、最短の選択肢を絞る。',
  C: 'C. まず観測して小さく試し、次に要点を選び直す。',
  D: 'D. どちらとも言えない／状況により変える。',
}

function mapChoice(choice: Choice): Pending {
  switch (choice) {
    case 'A': return { choice, choiceText: TEXT.A, structure:'E', type:'EVΛƎ型', weight:0.8, comment:'衝動と行動で流れを作る傾向。まず動いて学びを回収するタイプ。', advice:'小さく始めて10分だけ着手。後で整える前提で前へ。' }
    case 'B': return { choice, choiceText: TEXT.B, structure:'Λ', type:'ΛƎEΛ型', weight:0.8, comment:'制約と目的から最短を選ぶ傾向。判断の速さが強み。', advice:'目的→制約→手順の3点をメモに落としてからGO。' }
    case 'C': return { choice, choiceText: TEXT.C, structure:'Ǝ', type:'EΛVƎ型', weight:0.8, comment:'観測→小実験→選び直しの循環。状況把握が得意。', advice:'まず1回だけ試す。結果を観て次の一手を更新。' }
    default : return { choice:'D', choiceText: TEXT.D, structure:'V', type:'中立', weight:0.3, comment:'状況適応型。どの構造にも寄り過ぎない柔軟さ。', advice:'今は「やらない」も選択。時間を区切って再判断。' }
  }
}

export default function QuickClient() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string|null>(null)

  function onPick(choice: Choice) {
    if (sending) return
    setSending(true); setError(null)
    try {
      const pending = mapChoice(choice)
      sessionStorage.setItem('structure_quick_pending', JSON.stringify(pending))
      router.push('/structure/quick/confirm')
    } catch {
      setError('内部エラーが発生しました。')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto"/>
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/80 border border-white/10 rounded-xl p-6">
          <h2 className="text-center text-lg font-bold mb-4">クイック判定（1問）</h2>
          <p className="text-sm text-white/70 mb-5">新しい環境に入った直後、あなたの最初の一手は？</p>

          <div className="grid gap-3">
            <button className="btn btn-pressable" disabled={sending} onPointerUp={() => onPick('A')}>{TEXT.A}</button>
            <button className="btn btn-pressable" disabled={sending} onPointerUp={() => onPick('B')}>{TEXT.B}</button>
            <button className="btn btn-pressable" disabled={sending} onPointerUp={() => onPick('C')}>{TEXT.C}</button>
            <button className="btn btn-pressable" disabled={sending} onPointerUp={() => onPick('D')}>{TEXT.D}</button>
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
