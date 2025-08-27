// app/structure/quick/result/result-client.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
    case 'EVΛƎ型': return '小さく始めて10分だけ着手。後で整える前提で前へ。'
    case 'EΛVƎ型': return 'まず1回だけ試す。結果を観て次の一手を更新。'
    case 'ΛEƎV型': return '目的→制約→手順の3点をメモに落としてからGO。'
    case 'ƎVΛE型': return '今日は観測者でいこう。気づきを1つだけメモする。'
    default:        return '今は「やらない」も選択。時間を区切って再判断。'
  }
}

export default function ResultClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const idParam = sp.get('rid') ?? sp.get('id')

  const [row, setRow] = useState<Row | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!idParam) { setError('無効なリンクです'); return }
        const res = await fetch(`/api/structure/get?id=${encodeURIComponent(idParam)}`, { cache: 'no-store' })
        const json = await res.json()
        if (!json.ok) throw new Error(json.error || 'FETCH_FAILED')
        if (mounted) setRow(json.record as Row)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (mounted) setError(`取得に失敗しました（${msg}）`)
      }
    })()
    return () => { mounted = false }
  }, [idParam])

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button className="mt-4 px-4 py-2 rounded-lg bg-white text-black" onClick={() => router.push('/structure/quick')}>
            クイック判定に戻る
          </button>
        </div>
      </div>
    )
  }

  if (!row) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">読み込み中…</div>
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8">
      <h1 className="text-xl font-bold mb-4">保存済み結果</h1>

      <div className="grid gap-4 max-w-md">
        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="text-sm text-white/60">判定タイプ</div>
          <div className="mt-1 text-2xl tracking-widest">{row.type_label}</div>
        </div>

        {row.comment && (
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <div className="text-sm text-white/60">コメント</div>
            <div className="mt-1">{row.comment}</div>
          </div>
        )}

        <div className="rounded-xl bg-white/5 p-4 border border-white/10 text-xs text-white/60">
          <div>E: {row.e_score}／V: {row.v_score}／Λ: {row.lambda_score}／Ǝ: {row.e_rev_score}</div>
          <div className="mt-1">保存日時: {new Date(row.created_at).toLocaleString()}</div>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-3 rounded-xl bg-white text-black" onClick={() => router.push('/structure')}>
            構造診断を始める
          </button>
          <button className="px-4 py-3 rounded-xl bg-white/10 border border-white/20" onClick={() => router.push('/log')}>
            履歴を見る
          </button>
        </div>
      </div>
    </div>
  )
}
