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

// 先頭コードで型を決定（→ 現実思考型 / 未来志向型）
function decideModel(top: EV) {
  if (top === 'E' || top === 'Λ') {
    return {
      key: 'EΛVƎ',
      title: '現実思考型',
      note: '「確定した現在」を基準に考えるタイプ。今あるものを重視して行動します。',
    }
  }
  return {
    key: 'EVΛƎ',
    title: '未来志向型',
    note: '「未確定の未来」を基準に考えるタイプ。可能性やこれからの変化を重視します。',
  }
}

export default function ResultClient() {
  const router = useRouter()
  const [data, setData] = useState<PendingV2 | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (!raw) {
        router.replace('/structure/quick')
        return
      }
      const parsed = JSON.parse(raw) as PendingV2
      if (!parsed?.order || parsed.order.length !== 4) {
        router.replace('/structure/quick')
        return
      }
      setData(parsed)
    } catch {
      router.replace('/structure/quick')
    }
  }, [router])

  const top = useMemo<EV | null>(() => (data ? data.order[0] : null), [data])
  const model = useMemo(() => (top ? decideModel(top) : null), [top])

  if (!data || !top || !model) {
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
          {/* ルネア最小セリフ */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">
            <p className="text-sm leading-relaxed">
              観測が終わったよ。きみの<strong className="mx-1">基礎層タイプ</strong>は──
            </p>
          </div>

          {/* 型だけ表示 */}
          <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
            <div className="text-xs text-white/60">TYPE</div>
            <div className="mt-1 text-2xl font-extrabold tracking-wider">
              {model.title}
            </div>
            <div className="mt-1 text-sm text-white/80">({model.key})</div>
            <p className="mt-2 text-xs text-white/70">{model.note}</p>

            <div className="mt-4 text-xs text-white/60">
              主導コード：<span className="font-semibold">{top}</span>
            </div>
          </div>

          {/* 導線 */}
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
