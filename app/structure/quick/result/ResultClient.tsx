'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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

export default function ResultClient() {
  const router = useRouter()
  const [data, setData] = useState<PendingV2 | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (!raw) {
        router.replace('/structure/quick') // データなければ戻す
        return
      }
      const parsed = JSON.parse(raw) as PendingV2
      // 最低限のバリデーション
      if (!parsed?.order || parsed.order.length !== 4) {
        router.replace('/structure/quick')
        return
      }
      setData(parsed)
    } catch {
      router.replace('/structure/quick')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orderList = useMemo(() => {
    if (!data) return []
    return data.order.map((code, i) => ({
      rank: i + 1,
      code,
      label: data.labels[code],
      hint: data.baseHints[code]?.comment,
      point: data.points[code],
    }))
  }, [data])

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white">
        <p className="text-sm text-white/70">観測結果を読み込んでいます…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto" />
      </header>

      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-md pt-2 pb-10">
          {/* ルネア演出（最小） */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">
            <p className="text-sm leading-relaxed">
              観測が終わったよ。これが、きみの<strong className="mx-1">基礎層</strong>だね。
            </p>
            <p className="text-xs text-white/60 mt-1">
              （モデル整理：<span className="font-mono">EΛVƎ</span>=確定した現在/顕在、
              <span className="font-mono ml-1">EVΛƎ</span>=未確定の未来/潜在）
            </p>
          </div>

          {/* 基礎層：順位表示 */}
          <h2 className="text-lg font-bold mb-3">基礎層（あなたの優先順位）</h2>
          <ol className="space-y-2">
            {orderList.map(({ rank, label, hint, point, code }) => (
              <li key={code} className="rounded-xl border border-white/12 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {rank}位：{label}
                  </div>
                  <div className="text-xs text-white/70">+{point}pt</div>
                </div>
                {hint && <p className="text-xs text-white/70 mt-1">{hint}</p>}
              </li>
            ))}
          </ol>

          {/* 次への導線（ここでプロフィール診断UIと統合表示してもOK） */}
          <div className="mt-6 grid gap-3">
            <button
              className="w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500"
              onClick={() => router.push('/profile/result')}
            >
              プロフィール診断の結果と一緒に見る
            </button>
            <button
              className="w-full rounded-lg border border-white/20 py-2 text-white/90 hover:bg-white/10"
              onClick={() => router.push('/mypage')}
            >
              マイページへ
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
