// app/structure/quick/QuickClient.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Choice = 'A'|'B'|'C'|'D'
type Result = {
  id: string
  type: 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
  weight: number
  comment: string
  advice: string
}

/* ======== モバイル安定＆押下エフェクト付きボタン ======== */
function RippleButton({
  disabled,
  onPress,
  children,
  className = '',
}: {
  disabled?: boolean
  onPress: () => void
  children: React.ReactNode
  className?: string
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])
  const nextId = useRef(0)

  function createRipple(e: React.PointerEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const newRipple = { x, y, id: nextId.current++ }
    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600) // ripple duration
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerUp={(e) => {
        if (disabled) return
        createRipple(e)
        onPress()
      }}
      className={[
        'relative overflow-hidden rounded-lg px-4 py-3 text-left',
        'bg-neutral-800 enabled:hover:bg-neutral-700 transition duration-200',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {children}

      {/* Ripple layer */}
      <span className="absolute inset-0 pointer-events-none">
        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute rounded-full bg-white/30 animate-ripple"
            style={{
              left: r.x,
              top: r.y,
              width: Math.max(200, r.x * 2),
              height: Math.max(200, r.y * 2),
            }}
          />
        ))}
      </span>
    </button>
  )
}


export default function QuickClient() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [res, setRes] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onPick(choice: Choice) {
    if (sending) return
    setSending(true)
    setError(null)
    try {
      const r = await fetch('/api/structure/quick/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      })
      if (!r.ok) throw new Error('failed')
      const data: Result = await r.json()
      setRes(data)
    } catch {
      setError('保存に失敗しました。通信環境をご確認ください。')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="w-full p-4 flex justify-center">
        <div className="h-8">
          <Image
            src="/evae-logo.svg"
            alt="EVΛƎ"
            width={96}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 touch-manipulation">
        <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 rounded-xl p-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          {!res ? (
            <>
              <h2 className="text-center text-lg font-bold mb-4">クイック判定（1問）</h2>
              <p className="text-sm text-white/70 mb-5">
                新しい環境に入った直後、あなたの最初の一手は？
              </p>

              <div className="grid gap-3">
                <PressButton disabled={sending} onPress={() => onPick('A')}>
                  <span className="block">A. とりあえず動く。やりながら整える。</span>
                </PressButton>

                <PressButton disabled={sending} onPress={() => onPick('B')}>
                  <span className="block">B. 目的と制約を先に決め、最短の選択肢を絞る。</span>
                </PressButton>

                <PressButton disabled={sending} onPress={() => onPick('C')}>
                  <span className="block">C. まず観測して小さく試し、次に要点を選び直す。</span>
                </PressButton>

                <PressButton disabled={sending} onPress={() => onPick('D')}>
                  <span className="block">D. どちらとも言えない／状況により変える。</span>
                </PressButton>
              </div>

              {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
            </>
          ) : (
            <>
              <h2 className="text-center text-lg font-bold mb-1">
                {res.type}（weight {res.weight.toFixed(1)}）
              </h2>
              <p className="text-center text-white/60 text-sm mb-4">{res.comment}</p>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <p className="text-sm">
                  <span className="text-white/60">今日の一手：</span>{res.advice}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <PressButton onPress={() => router.push('/structure')} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:opacity-90 border-0 text-center">
                  構造診断を始める
                </PressButton>
                <PressButton onPress={() => { setRes(null); setError(null) }} className="bg-neutral-800 enabled:hover:bg-neutral-700">
                  もう一度
                </PressButton>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
