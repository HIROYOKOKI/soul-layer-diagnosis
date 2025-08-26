'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

type Result = {
  id: string
  type: 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
  weight: number
  comment: string
  advice: string
}

export default function ConfirmClient() {
  const sp = useSearchParams()
  const id = sp.get('id')
  const router = useRouter()
  const [data, setData] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const cacheKey = useMemo(() => 'structure_quick_last', [])

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!id) { setError('無効なリンクです'); setLoading(false); return }

      // 1) まず sessionStorage から即座に表示（あれば）
      try {
        const raw = sessionStorage.getItem(cacheKey)
        if (raw) {
          const cached: Result = JSON.parse(raw)
          if (cached?.id === id) {
            if (mounted) setData(cached)
          }
        }
      } catch { /* ignore */ }

      // 2) サーバから最新を取得
      try {
        const ac = new AbortController()
        const t = setTimeout(() => ac.abort(), 15000)
        const r = await fetch(`/api/structure/quick/result?id=${encodeURIComponent(id)}`, { signal: ac.signal })
        clearTimeout(t)
        if (!r.ok) throw new Error('fetch failed')
        const fresh: Result = await r.json()
        if (mounted) setData(fresh)
        try { sessionStorage.setItem(cacheKey, JSON.stringify(fresh)) } catch {}
      } catch {
        if (!data) setError('結果の取得に失敗しました。時間をおいて再度お試しください。')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id, cacheKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
            <p className="text-center text-red-400 text-sm">{error}</p>
          ) : data ? (
            <>
              <h2 className="text-center text-lg font-bold mb-1">
                {data.type}（weight {data.weight.toFixed(1)}）
              </h2>
              <p className="text-center text-white/60 text-sm mb-4">{data.comment}</p>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <p className="text-sm"><span className="text-white/60">今日の一手：</span>{data.advice}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="btn btn-pressable btn-ripple touch-manipulation"
                  onPointerUp={() => router.push('/structure')}
                >
                  構造診断を始める
                </button>
                <button
                  type="button"
                  className="btn btn-pressable btn-ripple touch-manipulation"
                  onPointerUp={() => router.push('/structure/quick')}
                >
                  もう一度
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
