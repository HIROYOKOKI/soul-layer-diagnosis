// app/structure/quick/result/result-client.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

type Row = {
  id: number
  type_label: string
  comment: string | null
  e_score: number
  v_score: number
  lambda_score: number
  e_rev_score: number
  created_at: string
}

function adviceByType(t: string): string {
  switch (t) {
    case 'EVΛƎ型':
      return '小さく始めて10分だけ着手。後で整える前提で前へ。'
    case 'EΛVƎ型':
      return 'まず1回だけ試す。結果を観て次の一手を更新。'
    case 'ΛEƎV型':
      return '目的→制約→手順の3点をメモに落としてからGO。'
    case 'ƎVΛE型':
      return '今日は観測者でいこう。気づきを1つだけメモする。'
    default:
      return '今は「やらない」も選択。時間を区切って再判断。'
  }
}

export default function ResultClient() {
  const sp = useSearchParams()
  const router = useRouter()

  // rid でも id でも受け取れるように
  const idParam = sp.get('rid') ?? sp.get('id')

  const [row, setRow] = useState<Row | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!idParam) {
        setError('無効なリンクです')
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/structure/get?id=${encodeURIComponent(idParam)}`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.error || 'FETCH_FAILED')
        if (mounted) setRow(json.record as Row)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (mounted) setError(`取得に失敗しました（${msg}）`)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [idParam])

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="w-full p-4 flex justify-center">
        <Image
          src="/evae-logo.svg"
          alt="EVΛƎ"
          width={96}
          height={32}
          priority
          className="h-8 w-auto"
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 rounded-xl p-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          {loading ? (
            <p className="text-center text-white/60">読み込み中…</p>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                className="mt-4 px-4 py-2 rounded-lg bg-white text-black"
                onClick={() => router.push('/structure/quick')}
              >
                クイック判定に戻る
              </button>
            </div>
          ) : row ? (
            <>
              <h2 className="text-center text-lg font-bold mb-1 tracking-widest">
                {row.type_label}
              </h2>

              {row.comment && (
                <p className="text-center text-white/70 text-sm mb-4">{row.comment}</p>
              )}

              <div className="rounded-lg border border-white/10 p-4 bg-black/30">
                <p className="text-sm">
                  <span className="text-white/60">今日の一手：</span>
                  {adviceByType(row.type_label)}
                </p>
              </div>

              {/* 参考：保存した加重スコアの簡易表示 */}
              <div className="mt-4 text-xs text-white/50">
                <div>
                  E: {row.e_score}／V: {row.v_score}／Λ: {row.lambda_score}／Ǝ:{' '}
                  {row.e_rev_score}
                </div>
                <div className="mt-1">
                  保存日時: {new Date(row.created_at).toLocaleString()}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="px-4 py-3 rounded-xl bg-white text-black"
                  onClick={() => router.push('/structure')}
                >
                  構造診断を始める
                </button>
                <button
                  type="button"
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/20"
                  onClick={() => router.push('/log')}
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

      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
