// app/mypage/MyPageClient.tsx
"use client"

import { useEffect, useState } from "react"
import { Settings } from "lucide-react" // ← 追加（細線ギア）

type ProfileItem = { fortune?: string; personality?: string; partner?: string; created_at?: string | null }
type DailyItem   = { code?: string; comment?: string; quote?: string; created_at?: string | null }
type ApiResp<T> = { ok: boolean; item: T | null; error?: string }

export default function MyPageClient() {
  const [prof, setProf] = useState<ProfileItem | null>(null)
  const [daily, setDaily] = useState<DailyItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setError(null); setLoading(true)
        const [p, d] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache:"no-store" }).then(r=>r.json() as Promise<ApiResp<ProfileItem>>),
          fetch("/api/mypage/daily-latest",   { cache:"no-store" }).then(r=>r.json() as Promise<ApiResp<DailyItem>>),
        ])
        if (!cancelled) {
          if (!p.ok) throw new Error(p.error || "profile_latest_failed")
          if (!d.ok) throw new Error(d.error || "daily_latest_failed")
          setProf(p.item ?? null)
          setDaily(d.item ?? null)
        }
      } catch (e:any) {
        if (!cancelled) setError(e?.message || "fetch_failed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  const reload = () => location.reload()

  return (
    <main className="min-h-[100dvh] px-5 py-6 text-white">
      {/* ヘッダー（タイトル＋FREEバッジ＋設定ボタン） */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">MyPage</h1>
        <div className="flex items-center gap-2">
          {/* FREEバッジ（任意） */}
          <span className="select-none rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
            FREE
          </span>
          {/* 設定ボタン：線を細く＆ホバーでうっすらリング */}
          <button
            aria-label="Settings"
            className="rounded-full p-2 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <Settings
              className="text-white"
              size={20}          // アイコンサイズ
              strokeWidth={1.25} // 線の太さ（細くしてシャープに）
            />
          </button>
        </div>
      </div>

      {loading && <p className="opacity-70">読み込み中…</p>}
      {error && (
        <div className="mb-4 text-sm text-red-300">
          取得に失敗しました（{error}） <button onClick={reload} className="underline">再読み込み</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-2 text-sm uppercase tracking-wide opacity-70">最新プロフィール診断</h2>
          {!prof ? (
            <p className="text-sm opacity-70">まだありません。</p>
          ) : (
            <div className="grid gap-1 text-sm">
              <div><span className="opacity-70">Fortune：</span>{prof.fortune || "—"}</div>
              <div><span className="opacity-70">Personality：</span>{prof.personality || "—"}</div>
              <div><span className="opacity-70">Partner：</span>{prof.partner || "—"}</div>
              <div className="mt-1 text-xs opacity-60">{prof.created_at ? new Date(prof.created_at).toLocaleString() : ""}</div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-2 text-sm uppercase tracking-wide opacity-70">最新デイリー診断</h2>
          {!daily ? (
            <p className="text-sm opacity-70">まだありません。</p>
          ) : (
            <div className="grid gap-1 text-sm">
              <div><span className="opacity-70">Code：</span>{daily.code || "—"}</div>
              <div><span className="opacity-70">Comment：</span>{daily.comment || "—"}</div>
              <div className="opacity-70">Quote：<span className="italic">{daily.quote || "—"}</span></div>
              <div className="mt-1 text-xs opacity-60">{daily.created_at ? new Date(daily.created_at).toLocaleString() : ""}</div>
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-6 text-center opacity-70">
        レーダーチャート（E/V/Λ/Ǝ）準備中…
      </div>
    </main>
  )
}
