// app/structure/quick/confirm/ConfirmClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
type Pending = {
  type: QuickResultType
  weight: number
  comment: string
  advice: string
  choice: 'A'|'B'|'C'|'D'
  choiceText: string
  structure: 'E'|'V'|'Λ'|'Ǝ'
}

export default function ConfirmClient() {
  const router = useRouter()
  const [pending, setPending] = useState<Pending | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (raw) setPending(JSON.parse(raw) as Pending)
    } catch {}
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <div className="h-8">
          <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto"/>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 rounded-xl p-6">
          {!pending ? (
            <div className="text-center">
              <p className="text-red-400">データが見つかりません。最初からやり直してください。</p>
              <button className="btn mt-4" onPointerUp={() => router.push('/structure/quick')}>クイック判定へ戻る</button>
            </div>
          ) : !revealed ? (
            <>
              <h2 className="text-center text-lg font-bold mb-3">内容の確認</h2>
              {/* ★ 選択内容をここに表示 */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-4 mb-4">
                <p className="text-xs text-white/60 mb-1">あなたの選択</p>
                <p className="text-sm">{pending.choiceText}</p>
              </div>
              <p className="text-center text-white/70 text-sm mb-5">
                これから結果を表示します。問題なければ「結果を表示」を押してください。
              </p>
              <div className="grid gap-3">
                <button className="btn btn-primary" onPointerUp={() => setRevealed(true)}>結果を表示</button>
                <button className="btn" onPointerUp={() => router.push('/structure/quick')}>やり直す</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-center text-lg font-bold mb-1">{pending.type}（weight {pending.weight.toFixed(1)}）</h2>
              <p className="text-center text-white/60 text-sm mb-4">{pending.comment}</p>
              <div className="rounded-lg border border-white/10 p-4 bg-black/30 mb-4">
                <p className="text-sm"><span className="text-white/60">今日の一手：</span>{pending.advice}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-primary" onPointerUp={() => router.push('/structure/quick/result?id=temp')}>
                  保存する
                </button>
                <button className="btn" onPointerUp={() => setRevealed(false)}>戻る</button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
