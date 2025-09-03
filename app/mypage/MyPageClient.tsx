// app/mypage/MyPageClient.tsx
"use client"

import React, { useEffect, useState } from "react"

type ProfileLatest = {
  fortune?: string | null
  personality?: string | null
  work?: string | null
  partner?: string | null
  created_at?: string
}
type DailyLatest = {
  code?: string | null
  comment?: string | null
  quote?: string | null
  created_at?: string
}

function normalizeCode(raw?: string | null): "E" | "V" | "Λ" | "Ǝ" | "" {
  const x = (raw || "").trim()
  if (x === "∃" || x === "ヨ") return "Ǝ"
  if (x === "A") return "Λ"
  return (["E", "V", "Λ", "Ǝ"].includes(x) ? x : "") as any
}

export default function MyPageClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileLatest | null>(null)
  const [daily, setDaily] = useState<DailyLatest | null>(null)

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

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold text-white">マイページ</h1>

      {loading && <div className="text-white/70">…読込中</div>}

      {error && (
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

      {!loading && !error && (
        <>
          {/* プロフィール最新（4ブロック） */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_0_12px_rgba(255,255,255,.04)]">
            <div className="text-cyan-300 font-semibold mb-3">プロフィール診断（最新）</div>
            {profile ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-white/80 text-sm mb-1">総合運勢</h3>
                  <p className="text-white/90 leading-relaxed text-[15px]">{profile.fortune || "—"}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-white/80 text-sm mb-1">性格傾向</h3>
                  <p className="text-white/90 leading-relaxed text-[15px]">{profile.personality || "—"}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-white/80 text-sm mb-1">仕事運</h3>
                  <p className="text-white/90 leading-relaxed text-[15px]">{profile.work || "—"}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-white/80 text-sm mb-1">理想のパートナー像</h3>
                  <p className="text-white/90 leading-relaxed text-[15px]">{profile.partner || "—"}</p>
                </article>
              </div>
            ) : (
              <p className="text-white/70 text-sm">まだプロフィール診断の結果がありません。</p>
            )}
          </section>

          {/* デイリー最新 */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_0_12px_rgba(255,255,255,.04)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-pink-300 font-semibold">デイリー診断（最新）</div>
              <div className="text-white/60 text-sm">{c ? `構造コード：${c}` : ""}</div>
            </div>
            {daily ? (
              <>
                <p className="text-white/90 leading-relaxed mb-2">{daily.comment || "—"}</p>
                {daily.quote && <p className="text-white/60 italic text-sm">「{daily.quote}」</p>}
              </>
            ) : (
              <p className="text-white/70 text-sm">まだデイリー診断の結果がありません。</p>
            )}
          </section>

          {/* 将来のレーダー用スペース（空のダミー） */}
          <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5">
            <div className="text-white/60 text-sm">（予備）構造バランス可視化スペース</div>
          </section>
        </>
      )}
    </div>
  )
}
