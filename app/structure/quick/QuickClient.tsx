'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Choice = 'A'|'B'|'C'|'D'
type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
type Result = { type: QuickResultType; weight: number; comment: string; advice: string }
type StructureLetter = 'E'|'V'|'Λ'|'Ǝ'

/* 押下波紋ボタン（簡略） */
function PressButton({
  disabled, onPress, children, structure,
}: {
  disabled?: boolean
  onPress: () => void
  children: React.ReactNode
  structure?: StructureLetter
}) {
  const ref = useRef<HTMLButtonElement|null>(null)
  const rippleClass = () =>
    structure==='E'?'ripple-e':structure==='V'?'ripple-v':structure==='Λ'?'ripple-l':structure==='Ǝ'?'ripple-eps':'ripple-accent'

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      data-structure={structure ?? ''}
      className={[
        'btn-ripple btn-pressable touch-manipulation no-tap-highlight',
        'relative rounded-lg border border-white/10 px-4 py-3 text-left',
        'bg-neutral-800 enabled:hover:bg-neutral-700 transition',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
      onPointerUp={(e) => {
        if (disabled) return
        const el = ref.current
        if (el) {
          const rect = el.getBoundingClientRect()
          const x = e.clientX - rect.left, y = e.clientY - rect.top
          const span = document.createElement('span')
          span.className = `ripple ${rippleClass()}`
          const max = Math.max(rect.width, rect.height) * 1.2
          Object.assign(span.style, { left: `${x}px`, top: `${y}px`, width: `${max}px`, height: `${max}px` })
          el.appendChild(span)
          span.addEventListener('animationend', () => span.remove())
        }
        onPress()
        if ('vibrate' in navigator) try { navigator.vibrate?.(8) } catch {}
      }}
    >
      {children}
    </button>
  )
}

/* ローカルの固定マッピング（AI診断なし） */
function mapChoice(choice: Choice): Result & { structure: StructureLetter } {
  switch (choice) {
    case 'A': return { structure:'E', type:'EVΛƎ型', weight:0.8, comment:'衝動と行動で流れを作る傾向。まず動いて学びを回収するタイプ。', advice:'小さく始めて10分だけ着手。後で整える前提で前へ。' }
    case 'B': return { structure:'Λ', type:'ΛƎEΛ型', weight:0.8, comment:'制約と目的から最短を選ぶ傾向。判断の速さが強み。', advice:'目的→制約→手順の3点をメモに落としてからGO。' }
    case 'C': return { structure:'Ǝ', type:'EΛVƎ型', weight:0.8, comment:'観測→小実験→選び直しの循環。状況把握が得意。', advice:'まず1回だけ試す。結果を観て次の一手を更新。' }
    case 'D': default:
      return { structure:'V', type:'中立', weight:0.3, comment:'状況適応型。どの構造にも寄り過ぎない柔軟さ。', advice:'今は「やらない」も選択。時間を区切って再判断。' }
  }
}

export default function QuickClient() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function onPick(choice: Choice) {
    if (sending) return
    setSending(true); setError(null)
    try {
      const result = mapChoice(choice)
      // 確認ページ用に一時保存
      sessionStorage.setItem('structure_quick_pending', JSON.stringify(result))
      router.push('/structure/quick/confirm')
    } catch (e) {
      setError('内部エラーが発生しました。もう一度お試しください。')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <div className="h-8">
          <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto"/>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 touch-manipulation">
        <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 rounded-xl p-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          <h2 className="text-center text-lg font-bold mb-4">クイック判定（1問）</h2>
          <p className="text-sm text-white/70 mb-5">新しい環境に入った直後、あなたの最初の一手は？</p>

          <div className="grid gap-3">
            <PressButton structure="E"  disabled={sending} onPress={() => onPick('A')}><span className="block">A. とりあえず動く。やりながら整える。</span></PressButton>
            <PressButton structure="Λ"  disabled={sending} onPress={() => onPick('B')}><span className="block">B. 目的と制約を先に決め、最短の選択肢を絞る。</span></PressButton>
            <PressButton structure="Ǝ"  disabled={sending} onPress={() => onPick('C')}><span className="block">C. まず観測して小さく試し、次に要点を選び直す。</span></PressButton>
            <PressButton structure="V"  disabled={sending} onPress={() => onPick('D')}><span className="block">D. どちらとも言えない／状況により変える。</span></PressButton>
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
