"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type EV = "E" | "V" | "Λ" | "Ǝ"

type ProfileLatest = {
  fortune?: string | null
  personality?: string | null
  partner?: string | null
  created_at?: string
  // クイック基礎層
  base_model?: "EΛVƎ" | "EVΛƎ" | null
  base_order?: EV[] | null
  base_points?: Record<EV, number> | null
}

type DailyLatest = {
  code?: string | null
  comment?: string | null
  quote?: string | null
  created_at?: string
}

function normalizeCode(raw?: string | null): EV | "" {
  const x = (raw || "").trim()
  if (x === "∃" || x === "ヨ") return "Ǝ"
  if (x === "A") return "Λ"
  return (["E", "V", "Λ", "Ǝ"].includes(x) ? x : "") as any
}

function toTypeLabel(model?: string | null) {
  if (model === "EΛVƎ") return "現実思考型"
  if (model === "EVΛƎ") return "未来志向型"
  return null
}

export default function MyPageClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileLatest | null>(null)
  const [daily, setDaily] = useState<DailyLatest | null>(null)

  const goProfile = () => router.push("/profile")
  const goDaily = () => router.push("/daily/question")

  useEffect(() => {
    async function run() {
      try {
        setError(null)
        setLoading(true)
        const [p, d] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/mypage/daily-latest", { cache: "no-store" }).then((r) => r.json()),
        ])
        if (!p?.ok) throw new Error(p?.error || "profile_latest_failed")
        if (!d?.ok) throw new Error(d?.error || "daily_latest_failed")
        setProfile(p.item ?? null)
        setDaily(d.item ?? null)
      } catch (e: any) {
        setError(e?.message || "failed")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const c = normalizeCode(daily?.code)
  const typeLabel = toTypeLabel(profile?.base_model)

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-5">マイページ</h1>

      {/* ローディング */}
      {loading && (
        <div className="space-y-4">
          <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 h-28" />
          <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 h-40" />
        </div>
      )}

      {/* エラー */}
      {error && !loading && (
        <div className="space-y-3">
          <div className="text-sm text-red-300">エラー: {error}</div>
          <button
            className="px-3 py-2 rounded border border-white/20 hover:bg-white/10"
            onClick={() => location.reload()}
          >
            再試行
          </button>
        </div>
      )}

      {/* 本体 */}
      {!loading && !error && (
        <>
          {/* 基礎層（クイック診断） */}
          <section className="mb-5 rounded-2xl border border-white/12 bg-white/5 p-4">
            <h2 className="text-sm font-bold mb-2">基礎層（クイック診断）</h2>

            {profile && typeLabel ? (
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs">
                    {typeLabel}
                  </span>
                  <span className="text-xs text-white/60">（{profile.base_model}）</span>
                </div>
                {Array.isArray(profile.base_order) && profile.base_order.length === 4 && (
                  <div className="mt-2 text-xs text-white/80">
                    順番：{profile.base_order.join(" → ")}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-white/60">
                まだクイック診断が登録されていません。
                <button
                  onClick={goProfile}
                  className="ml-2 underline decoration-white/30 hover:decoration-white/60"
                >
                  いますぐ診断する
                </button>
              </div>
            )}
          </section>

          {/* 最新デイリー */}
          <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
            <h2 className="text-sm font-bold mb-2">最新デイリー</h2>
            {daily ? (
              <div className="text-sm">
                <div>コード：<span className="font-semibold">{c || "—"}</span></div>
                {daily.comment && <p className="mt-1 text-white/80">{daily.comment}</p>}
                {daily.quote && <p className="mt-2 text-xs text-white/60">“{daily.quote}”</p>}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={goDaily}
                    className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
                  >
                    デイリー診断へ
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/60">
                まだ記録がありません。
                <button
                  onClick={goDaily}
                  className="ml-2 underline decoration-white/30 hover:decoration-white/60"
                >
                  今日の1問へ
                </button>
              </div>
            )}
          </section>

          {/* 予備スペース */}
          <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 mt-5">
            <div className="text-white/60 text-sm">（予備）構造バランス可視化スペース</div>
          </section>
        </>
      )}
    </div>
  )
}
