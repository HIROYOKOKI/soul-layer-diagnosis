// app/mypage/MyPageClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"

type EV = "E" | "V" | "Λ" | "Ǝ"
type DailyLatest = {
  code?: EV | null
  comment?: string | null
  quote?: string | null
  scores?: Partial<Record<EV, number>> | null
  raw_interactions?: {
    first_choice?: EV | null
    final_choice?: EV | null
    changes?: number
    subset?: EV[] | null
  } | null
  created_at?: string | null
}

export default function MyPageClient({
  initialDailyLatest = null,
  initialEnv = "dev",
}: {
  initialDailyLatest?: DailyLatest | null
  initialEnv?: "dev" | "prod"
}) {
  const [daily, setDaily] = useState<DailyLatest | null>(initialDailyLatest)
  const [loading, setLoading] = useState(!initialDailyLatest)
  const [error, setError] = useState<string | null>(null)
  const [env, setEnv] = useState<"dev" | "prod">(initialEnv)

  // === env を復元（ローカル優先） & 差分あれば即再取得 ===
  useEffect(() => {
    try {
      const v = (localStorage.getItem("ev-env") || initialEnv).toLowerCase()
      const e = v === "prod" ? "prod" : "dev"
      setEnv(e)
      if (e !== initialEnv) refetch(e)
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 手動再取得にも使う共通関数
  async function refetch(targetEnv = env) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/mypage/daily-latest?env=${targetEnv}`, {
        cache: "no-store",
      })
      const json = await res.json()
      setDaily(json?.item ?? null)
    } catch (e: any) {
      setError(e?.message ?? "fetch_failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialDailyLatest) refetch(env)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createdAtJst = useMemo(() => {
    const iso = daily?.created_at
    if (!iso) return ""
    const d = new Date(iso) // 画面はJST前提でそのまま表示
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${y}/${m}/${day} ${hh}:${mm}`
  }, [daily?.created_at])

  const scores = daily?.scores ?? {}
  const order: EV[] = ["E", "V", "Λ", "Ǝ"]
  const maxScore = Math.max(1, ...order.map((k) => Number(scores[k] ?? 0)))

  const badge = (c: EV) => {
    const name =
      c === "E"
        ? "衝動・情熱"
        : c === "V"
        ? "可能性・夢"
        : c === "Λ"
        ? "選択・設計"
        : "観測・静寂"
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
        <span className="font-mono">{c}</span>
        <span className="text-xs text-white/70">{name}</span>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-black text-white">
      {/* === 固定ヘッダー（元デザイン復元：見出し＋envバッジ） === */}
      <header className="sticky top-0 z-20 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50">
        <div className="mx-auto max-w-xl px-5 pt-5 pb-3 flex items-center justify-between">
          <h1 className="text-[28px] font-extrabold tracking-tight">My Page</h1>
          <button
            className="text-xs rounded-full border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/15"
            onClick={() => {
              const next = env === "dev" ? "prod" : "dev"
              setEnv(next)
              localStorage.setItem("ev-env", next)
              refetch(next)
            }}
            aria-label="環境を切り替え"
            title="環境切替"
          >
            env: {env}（切替）
          </button>
        </div>
      </header>

      {/* === ページ本体 === */}
      <main className="mx-auto max-w-xl px-5 py-5">
        {/* 大きなラウンド枠（スクショ準拠） */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
          {/* エラー */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
              読み込みに失敗しました（{String(error)}）
            </div>
          )}

          {/* デイリー最新カード */}
          <section className="rounded-2xl border border-white/12 bg-black/20 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/80">
                デイリー診断（最新）
              </h2>
              <div className="text-xs text-white/50">{createdAtJst}</div>
            </div>

            {/* 空／ローディング */}
            {!daily && !loa
