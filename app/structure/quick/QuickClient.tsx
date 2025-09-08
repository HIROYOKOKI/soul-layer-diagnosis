// app/structure/quick/QuickClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

/* ========================
   Types
======================== */
type EV = "E" | "V" | "Λ" | "Ǝ"

type PendingV2 = {
  order: EV[]                               // 押した順（第1位→第4位）
  labels: Record<EV, string>                // 各コードの表示ラベル
  points: Record<EV, number>                // 1位=3, 2位=2, 3位=1, 4位=0
  baseHints: Record<EV, { type: string; comment: string }>
  _meta: {
    ts: number
    v: "quick-v2"
    presentModel: "EΛVƎ"                    // 確定した現在=顕在
    futureModel: "EVΛƎ"                     // 未確定の未来=潜在
    question: string
  }
}

/* ========================
   Consts
======================== */
// 固定出題（ベース診断）
const QUESTION =
  "Q. あなたが人生で最も大切にしたいものはどれですか？（大切と思う順番に順位をつけてください。）"

// 固定4択（E/V/Λ/Ǝ対応）
const CHOICES: Array<{ code: EV; label: string; desc: string }> = [
  { code: "E", label: "E（衝動・情熱）", desc: "やりたいことを迷わず行動に移す力" },
  { code: "V", label: "V（可能性・夢）", desc: "まだ見ぬ未来や夢を追いかける心" },
  { code: "Λ", label: "Λ（選択・葛藤）", desc: "悩みながらも自分で選び取る自由" },
  { code: "Ǝ", label: "Ǝ（観測・静寂）", desc: "ものごとを見つめ、意味を感じ取る時間" },
]

// ベースヒント（結果ページ側の補助テキストに使用）
const BASE_HINTS: PendingV2["baseHints"] = {
  E: { type: "E主導", comment: "衝動と行動で学びを回収する傾向。まず動いて掴むタイプ。" },
  V: { type: "V主導", comment: "可能性を広げてから意思決定する傾向。夢を具体化していくタイプ。" },
  Λ: { type: "Λ主導", comment: "選択基準を定め最短距離を選ぶ傾向。設計と取捨選択が得意。" },
  Ǝ: { type: "Ǝ主導", comment: "観測→小実験→選び直しの循環。状況把握が得意。" },
}

// 順位→点数（1位3, 2位2, 3位1, 4位0）
const SCORE = [3, 2, 1, 0] as const

function computePoints(order: EV[]): Record<EV, number> {
  const base: Record<EV, number> = { E: 0, V: 0, Λ: 0, Ǝ: 0 }
  return order.reduce((acc, code, idx) => {
    acc[code] = SCORE[idx] ?? 0
    return acc
  }, base)
}

/* ========================
   Component
======================== */
export default function QuickClient() {
  const router = useRouter()
  const [order, setOrder] = useState<EV[]>([])      // 押した順
  const [locking, setLocking] = useState(false)     // 送信中
  const [ready, setReady] = useState(false)
  const [returnTo, setReturnTo] = useState<string>("/mypage")

  // `return` クエリ取得（useSearchParamsは使わず安全に）
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ret = params.get("return") || "/mypage"
      setReturnTo(ret)
    } finally {
      setReady(true)
    }
  }, [])

  const chosen = useMemo(() => new Set(order), [order])
  const isDone = order.length === CHOICES.length

  function handlePick(code: EV) {
    if (locking || chosen.has(code)) return
    setOrder(prev => [...prev, code])
  }

  function undoLast() {
    if (locking || order.length === 0) return
    setOrder(prev => prev.slice(0, -1))
  }

  function resetAll() {
    if (locking || order.length === 0) return
    setOrder([])
  }

  // 完了 → pending保存 → 確認ページへ
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
        v: "quick-v2",
        presentModel: "EΛVƎ",
        futureModel: "EVΛƎ",
        question: QUESTION,
      },
    }

    try {
      sessionStorage.setItem("structure_quick_pending", JSON.stringify(payload))
      router.push("/structure/quick/confirm")
    } catch {
      // 失敗しても落とさず returnTo に退避
      router.replace(returnTo)
    } finally {
      setLocking(false)
    }
  }

  // すぐに戻る（未完了でもクラッシュさせない）
  function backSafe() {
    try {
      // 何も選んでなくても安全に戻す
      router.replace(returnTo)
    } catch {
      router.replace("/mypage")
    }
  }

  if (!ready) return null

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
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

      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-md pt-2 pb-10">
          {/* タイトル */}
          <h2 className="text-center text-lg font-bold mb-2">
            クイック判定（1問・順位付け）
          </h2>

          {/* 出題 */}
          <p className="text-sm text-white/80 mb-5 text-center leading-relaxed">
            {QUESTION}
          </p>
          <div className="h-px bg-white/10 mb-5" />

          {/* 選択肢（押した順で順位表示） */}
          <div className="grid gap-3">
            {CHOICES.map((c) => {
              const rank = order.indexOf(c.code) // -1:未選択
              const picked = rank >= 0
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handlePick(c.code)}
                  disabled={picked || locking}
                  className={`group w-full text-left rounded-2xl border px-4 py-4 transition
                    ${picked
                      ? "bg-blue-600/80 border-white/20 text-white"
                      : "bg-white/5 border-white/12 hover:bg-white/8 hover:border-white/20"
                    } active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/20`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full
                                     border border-white/25 text-xs text-white/80 px-2 py-0.5">
                      {picked ? `第${rank + 1}位` : "未選択"}
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

          {/* 操作 */}
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
                return <li key={`${code}-${i}`}>{i + 1}位：{item.label}</li>
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

            <button
              type="button"
              onClick={backSafe}
              className="mt-3 w-full rounded-lg border border-white/20 py-2 text-sm hover:bg-white/10"
            >
              いまは戻る（保存せず）
            </button>

            {locking && (
              <p className="mt-3 text-center text-xs text-white/60">
                次の画面へ移動中…
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
