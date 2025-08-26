'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

type QuickType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
type Result = { id: string; type: QuickType; weight: number; comment: string }

function adviceByType(t: QuickType): string {
  switch (t) {
    case 'EVΛƎ型': return '小さく始めて10分だけ着手。後で整える前提で前へ。'
    case 'ΛƎEΛ型': return '目的→制約→手順の3点をメモに落としてからGO。'
    case 'EΛVƎ型': return 'まず1回だけ試す。結果を観て次の一手を更新。'
    default:        return '今は「やらない」も選択。時間を区切って再判断。'
  }
}

export default function ResultClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const id = sp.get('id')

  const [data, setData] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!id) { setError('無効なリンクです'); setLoading(false); return }
      try {
        const r = await fetch(`/api/structure/quick/result?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        if (!r.ok) throw new Error(await r.text())
        const res = await r.json() as Result
        if (mounted) setData(res)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown'
        if (mounted) setError(`取得に失敗しました（${msg}）`)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id])

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="w-full p-4 flex justify-center">
        <div className="h-8">
          <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 rounded-xl p-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          {loading ? (
            <p className="text-center text-white/60">読み込み中…</p>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button className="btn mt-4" onPointerUp={() => router.push('/structure/quick')}>クイック判定に戻る</button>
            </div>
          ) : data ? (
            <>
              <h2 className="text-center text-lg font-bold mb-1">
                {data.type}（weight {data.weight.toFixed(1)}）
              </h2>
              <p className="text-center text-white/60 text-sm mb-4">{data.comment}</p>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <p className="text-sm">
                  <span className="text-white/60">今日の一手：</span>{adviceByType(data.type)}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="btn btn-primary btn-pressable btn-ripple touch-manipulation"
                  onPointerUp={() => router.push('/structure')}
                >
                  構造診断を始める
                </button>
                <button
                  type="button"
                  className="btn btn-pressable btn-ripple touch-manipulation"
                  onPointerUp={() => router.push('/log')}
                >
                  履歴を見る
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-white/60">データが見つかりません。</p>
          )}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
