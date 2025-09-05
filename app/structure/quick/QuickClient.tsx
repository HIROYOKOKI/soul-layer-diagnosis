'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

type PendingV2 = {
  // 押した順（= 第1位→第4位）
  order: EV[]
  // 選択肢の文言（UI表示・確認用）
  labels: Record<EV, string>
  // スコア（1位=4, 2位=3, 3位=2, 4位=1）
  points: Record<EV, number>
  // 集計の解釈に使う基本コメント
  baseHints: Record<EV, { type: string; comment: string }>
  // 監査用メタ
  _meta: {
    ts: number
    v: 'quick-v2'
    // 概念モデル名（仕様メモ用）
    presentModel: 'EΛVƎ' // 確定した現在=顕在
    futureModel: 'EVΛƎ'  // 未確定の未来=潜在
    question: string
  }
}

const QUESTION = '新しい環境に入った直後、あなたの最初の一手は？' // ← 固定出題

const CHOICES: Array<{ code: EV; label: string; desc: string }> = [
  { code: 'E', label: 'とりあえず動く。やりながら整える。', desc: '衝動・行動で流れを作る' },
  { code: 'Λ', label: '目的と制約を先に決め、最短の選択肢を絞る。', desc: '選択基準と設計を先に固める' },
  { code: 'Ǝ', label: 'まず観測して小さく試し、次に要点を選び直す。', desc: '観測→小実験→再選択の循環' },
  { code: 'V', label: 'どちらとも言えない／状況により変える。', desc: '可能性を広げつつ柔軟に進む' },
]

// E/V/Λ/Ǝのベースヒント（型名は便宜。EΛVƎ/EVΛƎの概念は結果側で解釈）
const BASE_HINTS: PendingV2['baseHints'] = {
  E: { type: 'E主導', comment: '衝動と行動で学びを回収する傾向。まず動いて掴むタイプ。' },
  V: { type: 'V主導', comment: '可能性を広げてから意思決定する傾向。夢を具体化していくタイプ。' },
  Λ: { type: 'Λ主導', comment: '選択基準を定め最短距離を選ぶ傾向。設計と取捨選択が得意。' },
  Ǝ: { type: 'Ǝ主導', comment: '観測→小実験→選び直しの循環。状況把握が得意。' },
}

export default function QuickClient() {
  const router = useRouter()
  const [order, setOrder] = useState<EV[]>([])     // 押した順
  const [locking, setLocking] = useState(false)     // 送信中フラグ

  const chosen = useMemo(() => new Set(order), [order])
  const isDone = order.length === CHOICES.length

  function handlePick(code: EV) {
    if (locking) return
    if (chosen.has(code)) return
    setOrder((prev) => [...prev, code])
  }

  function undoLast() {
    if (locking) return
    setOrder((prev) => prev.slice(0, -1))
  }

  function resetAll() {
    if (locking) return
    setOrder([])
  }

  function computePoints(ord: EV[]): Record<EV, number> {
    // 1位=4, 2位=3, 3位=2, 4位=1
    const base = 5
    const pts: Record<EV, number> = { E: 0, V: 0, Λ: 0, Ǝ: 0 }
    ord.forEach((code, idx) => {
      pts[code] = base - (idx + 1)
    })
    return pts
  }

  function toConfirm() {
    if (!isDone || locking) return
    setLocking(true)

    const labels = CHOICES.reduce((acc, c) => {
      acc[c.code] = c.label
      return acc
    }, {} as Record<EV, string>)

    const payload: PendingV2 = {
      order,
      labels,
      points: computePoints(order),
      baseHints: BASE_HINTS,
      _meta: {
        ts: Date.now(),
        v: 'quick-v2',
        presentModel: 'EΛVƎ',
        futureModel: 'EVΛƎ',
        question: QUESTION,
      },
    }

    sessionStorage.setItem('structure_quick_pending', JSON.stringify(payload))
    router.push('/structure/quick/confirm')
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto" />
      </header>

      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-md pt-2 pb-10">
          {/* タイトル */}
          <h2 className="text-center text-lg font-bold mb-2">クイック判定（1問・順位付け）</h2>

          {/* 出題 */}
          <p className="text-sm text-white/80 mb-5 text-center leading-relaxed">{QUESTION}</p>
          <div className="h-px bg-white/10 mb-5" />

          {/* 選択肢（押した順に順位を付与） */}
          <div className="grid gap-3">
            {CHOICES.map((c) => {
              const rank = order.indexOf(c.code) // -1 = 未選択
              const picked = rank >= 0
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handlePick(c.code)}
                  disabled={picked || locking}
                  className={`group w-full text-left rounded-2xl border px-4 py-4 transition
                    ${picked
                      ? 'bg-blue-600/80 border-white/20 text-white'
                      : 'bg-white/5 border-white/12 hover:bg-white/8 hover:border-white/20'
                    } active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/20`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full
                                     border border-white/25 text-xs text-white/80 px-2 py-0.5">
                      {picked ? `第${rank + 1}位` : '未選択'}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold">{c.label}</div>
                      <div className="text-xs opacity-80 mt-0.5">{c.desc}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 操作行 */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={undoLast}
              disabled={order.length === 0 || locking}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              ひとつ戻す
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={order.length === 0 || locking}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              リセット
            </button>
          </div>

          {/* 確認ブロック */}
          <div className="mt-6">
            <h3 className="text-sm font-bold mb-2">現在の順位</h3>
            <ol className="list-decimal list-inside text-left text-sm space-y-1">
              {order.map((code, i) => {
                const item = CHOICES.find((x) => x.code === code)!
                return <li key={code}>{i + 1}位：{item.label}</li>
              })}
            </ol>

            <button
              type="button"
              onClick={toConfirm}
              disabled={!isDone || locking}
              className="mt-4 w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500 disabled:opacity-40"
            >
              この内容で確認へ
            </button>

            {locking && (
              <p className="mt-3 text-center text-xs text-white/60">次の画面へ移動中…</p>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
