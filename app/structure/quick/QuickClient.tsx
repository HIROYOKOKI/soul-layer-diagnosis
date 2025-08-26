// app/structure/quick/QuickClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Choice = 'A'|'B'|'C'|'D'
type Result = {
  id: string
  type: 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
  weight: number
  comment: string
  advice: string
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
        <img src="/evae-logo.svg" alt="EVΛƎ" className="h-8" />
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 rounded-xl p-6">
          {!res ? (
            <>
              <h2 className="text-center text-lg font-bold mb-4">クイック判定（1問）</h2>
              <p className="text-sm text-white/70 mb-5">
                新しい環境に入った直後、あなたの最初の一手は？
              </p>
              <div className="grid gap-3">
                <button disabled={sending} onClick={() => onPick('A')}
                        className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-3 text-left">
                  A. とりあえず動く。やりながら整える。
                </button>
                <button disabled={sending} onClick={() => onPick('B')}
                        className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-3 text-left">
                  B. 目的と制約を先に決め、最短の選択肢を絞る。
                </button>
                <button disabled={sending} onClick={() => onPick('C')}
                        className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-3 text-left">
                  C. まず観測して小さく試し、次に要点を選び直す。
                </button>
                <button disabled={sending} onClick={() => onPick('D')}
                        className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-3 text-left">
                  D. どちらとも言えない／状況により変える。
                </button>
              </div>
              {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
            </>
          ) : (
            <>
              <h2 className="text-center text-lg font-bold mb-1">{res.type}（weight {res.weight.toFixed(1)}）</h2>
              <p className="text-center text-white/60 text-sm mb-4">{res.comment}</p>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <p className="text-sm"><span className="text-white/60">今日の一手：</span>{res.advice}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={() => router.push('/structure')}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 hover:opacity-90">
                  構造診断を始める
                </button>
                <button onClick={() => { setRes(null); setError(null) }}
                        className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700">
                  もう一度
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
