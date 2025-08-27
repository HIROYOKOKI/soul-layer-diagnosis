// app/structure/quick/confirm/ConfirmClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type EV = 'E'|'V'|'Λ'|'Ǝ'
type PendingV1 = {
  choiceText: string
  code: EV
  // result は保持していてOK（Resultで使う）が、ここでは表示しない
  result: { type: string; weight: number; comment: string; advice?: string }
  _meta?: { ts: number; v: 'quick-v1' }
}

export default function ConfirmClient() {
  const router = useRouter()
  const [p, setP] = useState<PendingV1 | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('structure_quick_pending')
    if (!raw) { router.replace('/structure/quick'); return }
    try {
      setP(JSON.parse(raw) as PendingV1)
    } catch {
      router.replace('/structure/quick')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8">
      {/* ✅ タイトルは「選択の確認」 */}
      <h1 className="text-xl font-bold mb-4">選択の確認</h1>

      <div className="grid gap-4 max-w-md">
        {/* あなたの選択（これだけ表示） */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="text-sm text-white/60">あなたの選択</div>
          <div className="mt-1">{p?.choiceText ?? '—'}</div>
          <div className="mt-2 text-xs text-white/40">コード: {p?.code ?? '—'}</div>
        </div>

        {/* 余計な診断情報は出さない */}

        <div className="flex gap-3">
          <button
            className="px-4 py-3 rounded-xl bg-white/10"
            onClick={() => router.push('/structure/quick')}
          >
            やり直す
          </button>
          <button
            className="px-5 py-3 rounded-xl bg-white text-black"
            onClick={() => router.push('/structure/quick/result')}  // ← 次へ（診断結果へ）
            disabled={!p}
          >
            確認して次へ
          </button>
        </div>
      </div>
    </div>
  )
}
