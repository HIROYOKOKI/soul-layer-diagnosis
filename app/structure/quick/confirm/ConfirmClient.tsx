'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

type PendingV2 = {
  order: EV[]
  labels: Record<EV, string>
  points: Record<EV, number>
  baseHints: Record<EV, { type: string; comment: string }>
  _meta: {
    ts: number
    v: 'quick-v2'
    presentModel: 'EΛVƎ'
    futureModel: 'EVΛƎ'
    question: string
  }
}

export default function ConfirmClient() {
  const router = useRouter()
  const [data, setData] = useState<PendingV2 | null>(null)

  // 初期ロード：pending 取得
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (!raw) return
      const parsed = JSON.parse(raw) as PendingV2
      // 最低限のバリデーション
      if (!parsed?.order || parsed.order.length !== 4) return
      setData(parsed)
    } catch {
      // 破損時は無視
    }
  }, [])

  const isReady = !!data
  const ranks = useMemo(() => {
    if (!data) return []
    return data.order.map((code, i) => ({
      idx: i + 1,
      code,
      label: data.labels[code],
      point: data.points[code],
      hint: data.baseHints[code],
    }))
  }, [data])

  function goBackToEdit() {
    router.back()
  }

  function resetAndRestart() {
    sessionStorage.removeItem('structure_quick_pending')
    router.push('/structure/quick')
  }

  function goResult() {
    // そのまま result へ
    router.push('/structure/quick/result')
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="max-w-md px-6 text-center">
          <h1 className="text-lg font-bold mb-3">確認ページ</h1>
          <p className="text-sm text-white/70">
            一時データが見つかりませんでした。もう一度はじめからお願いします。
          </p>
          <button
            onClick={() => router.push('/structure/quick')}
            className="mt-5 w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500"
          >
            クイック診断に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto px-5 py-8">
        <h1 className="text-xl font-bold text-center mb-2">確認</h1>
        <p className="text-sm text-white/80 text-center mb-6 leading-relaxed">
          {data?._meta.question}
        </p>

        <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <h2 className="text-sm font-semibold mb-3">あなたが選んだ順番</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            {ranks.map((r) => (
              <li key={r.code} className="flex items-start gap-2">
                <span className="inline-flex shrink-0 rounded-full border border-white/25 px-2 py-0.5 text-[11px] text-white/80">
                  第{r.idx}位
                </span>
                <div className="flex-1">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-xs text-white/70 mt-0.5">
                    {r.hint?.type}／{r.hint?.comment}（{r.point}点）
                  </div>
                </div>
                <span className="text-xs opacity-70">{r.code}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={goBackToEdit}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            修正する（戻る）
          </button>
          <button
            type="button"
            onClick={resetAndRestart}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            リセットしてやり直す
          </button>
        </div>

        <button
          type="button"
          onClick={goResult}
          className="mt-4 w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500"
        >
          この内容で診断
        </button>

        <p className="mt-3 text-center text-[11px] text-white/60">
          ※ このクイック診断は「基礎層（ベース）」として保存され、以後の診断に補正として反映されます。
        </p>
      </div>
    </div>
  )
}
