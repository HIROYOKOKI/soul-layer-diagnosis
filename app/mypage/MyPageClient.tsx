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
  const [env, setEnv] = useState<"dev"|"prod">(initialEnv)
// ブラウザの選好を反映（ev-env があればそれを優先）
  useEffect(() => {
    try {
      const v = (localStorage.getItem("ev-env") || initialEnv).toLowerCase()
      const e = v === "prod" ? "prod" : "dev"
      setEnv(e)
      if (e !== initialEnv) refetch(e) // 違う環境なら即再取得
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 再取得（手動更新用にも使える）
 async function refetch(targetEnv = env) {
    setLoading(true)
    setError(null)
    try {
     const res = await fetch(`/api/mypage/daily-latest?env=${targetEnv}`, { cache: "no-store" })
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
    const d = new Date(iso)
    // 画面はJST前提
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mm = String(d.getMinutes()).padStart(2, "0")
    return `${y}/${m}/${day} ${hh}:${mm}`
  }, [daily?.created_at])

  const scores = daily?.scores ?? {}
  const order: EV[] = ["E", "V", "Λ", "Ǝ"]
  const maxScore = Math.max(1, ...order.map(k => Number(scores[k] ?? 0)))

  const badge = (c: EV) => {
    const name =
      c === "E" ? "衝動・情熱" :
      c === "V" ? "可能性・夢" :
      c === "Λ" ? "選択・設計" :
      "観測・静寂"
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
        <span className="font-mono">{c}</span>
        <span className="text-xs text-white/70">{name}</span>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="mx-auto max-w-xl px-5 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-wide">My Page</h1>
          <button
  className="text-xs rounded-lg border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15"
  onClick={()=>{
    const next = env === "dev" ? "prod" : "dev"
    setEnv(next)
    localStorage.setItem("ev-env", next)
    refetch(next)
  }}
>
  env: {env}（切替）
</button>
        </header>

        {/* エラー */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            読み込みに失敗しました（{String(error)}）
          </div>
        )}

        {/* デイリー最新カード */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-white/70">デイリー診断（最新）</h2>
            <div className="text-xs text-white/50">{createdAtJst}</div>
          </div>

          {!daily && !loading && (
            <p className="mt-3 text-sm text-white/60">まだ記録がありません。</p>
          )}

          {loading && (
            <p className="mt-3 text-sm text-white/60">読み込み中…</p>
          )}

          {daily && (
            <>
              {/* コード */}
              <div className="mt-3 flex items-center gap-3">
                <div className="text-sm text-white/60">今日のコード</div>
                {daily.code ? badge(daily.code) : <span className="text-sm text-white/60">—</span>}
              </div>

              {/* 行動ログ（first/final/changes/subset） */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/60 text-xs">初回選択</div>
                  <div className="mt-1 font-mono text-base">
                    {daily.raw_interactions?.first_choice ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/60 text-xs">最終選択</div>
                  <div className="mt-1 font-mono text-base">
                    {daily.raw_interactions?.final_choice ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/60 text-xs">選び直し回数</div>
                  <div className="mt-1 font-mono text-base">
                    {daily.raw_interactions?.changes ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/60 text-xs">出題セット</div>
                  <div className="mt-1 font-mono text-base">
                    {(daily.raw_interactions?.subset && daily.raw_interactions.subset.length > 0)
                      ? daily.raw_interactions.subset.join(" / ")
                      : "—"}
                  </div>
                </div>
              </div>

              {/* βスコア（E,V,Λ,Ǝ） */}
              <div className="mt-5">
                <div className="text-sm text-white/60 mb-2">βスコア</div>
                <div className="space-y-2">
                  {(["E","V","Λ","Ǝ"] as EV[]).map((k) => {
                    const v = Number(scores[k] ?? 0)
                    const w = Math.round((v / maxScore) * 100)
                    return (
                      <div key={k}>
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span className="font-mono">{k}</span>
                          <span>{v.toFixed(2)}</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-white" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* コメント＆名言（任意） */}
              {(daily.comment || daily.quote) && (
                <div className="mt-5 grid gap-3">
                  {!!daily.comment && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 leading-relaxed">
                      {String(daily.comment)}
                    </div>
                  )}
                  {!!daily.quote && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/60">きょうのアファメーション</div>
                      <blockquote className="mt-1">“{String(daily.quote)}”</blockquote>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
