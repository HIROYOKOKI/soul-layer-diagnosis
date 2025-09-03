// app/mypage/MyPageClient.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import {
  EVAEPolarChart,
  EVAETrendChart,
  EVAEChartSquares,
  EVAEColorBadges,
} from "@/app/_components/EVAECharts"

type ProfileItem = { fortune?: string; personality?: string; partner?: string; created_at?: string | null }
type DailyItem   = { code?: string; comment?: string; quote?: string; created_at?: string | null }
type ApiResp<T>  = { ok: boolean; item: T | null; error?: string }

// ダミー（0..1）
const DUMMY_VALS = { E: 0.62, V: 0.78, L: 0.45, Eexists: 0.68 }

function nudgeFromCode(code?: string) {
  const x = (code || "").trim()
  const k = x === "∃" || x === "ヨ" ? "Eexists" : x === "A" ? "L" : x
  const base = { ...DUMMY_VALS }
  if (k === "E") base.E = Math.min(1, base.E + 0.10)
  else if (k === "V") base.V = Math.min(1, base.V + 0.10)
  else if (k === "L") base.L = Math.min(1, base.L + 0.10)
  else if (k === "Eexists") base.Eexists = Math.min(1, base.Eexists + 0.10)
  return base
}

export default function MyPageClient() {
  const [prof,  setProf]  = useState<ProfileItem | null>(null)
  const [daily, setDaily] = useState<DailyItem   | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setError(null); setLoading(true)
        const [p, d] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache:"no-store" })
            .then(r=>r.json() as Promise<ApiResp<ProfileItem>>),
          fetch("/api/mypage/daily-latest",   { cache:"no-store" })
            .then(r=>r.json() as Promise<ApiResp<DailyItem>>),
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

  // 中央レーダー値（ダミー＋codeの軽い反映）
  const radarVals = useMemo(() => nudgeFromCode(daily?.code), [daily?.code])

  return (
    <main className="min-h-[100dvh] px-5 py-8 text-white">
      {/* ヘッダー下レイアウト */}
      <section className="rounded-3xl bg-white/5 border border-white/10 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* 左：プロフィール塊 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[radial-gradient(circle_at_center,#1fb6ff_0%,#05070a_70%)] ring-1 ring-white/15" />
            <div className="leading-tight">
              <div className="text-lg font-semibold">Hiro</div>
              <div className="text-xs text-white/60">ID: 0001</div>
            </div>
          </div>

          {/* 中央：現在のテーマ（ダミー表記） */}
          <div className="text-center md:text-left">
            <div className="text-xs tracking-wide text-white/60">現在のテーマ</div>
            <div className="text-2xl font-bold">self</div>
            <div className="text-xs text-white/50">2025-08-30</div>
          </div>

          {/* 右：バッジ群 */}
          <div className="flex md:justify-end gap-3">
            <span className="px-3 py-1 rounded-full border border-white/20 bg-white/10 text-xs">FREE</span>
            <button aria-label="settings"
              className="w-9 h-9 rounded-full border border-white/20 bg-white/10 grid place-items-center">
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </div>

        {/* 直近メッセージカード */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-white/80">直近のメッセージ</h3>
            <button className="text-xs text-cyan-300/90 hover:underline">Premiumで解放 →</button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full grid place-items-center text-sm font-bold"
                 style={{ background: "radial-gradient(circle at center,#7E22CE, #281337 70%)" }}>
              Ǝ
            </div>
            <div>
              <div className="text-sm">{daily?.comment || "静かに観察したい"}</div>
              <div className="text-xs text-white/50 mt-0.5">
                {daily?.created_at ? new Date(daily.created_at).toLocaleDateString() : "2025-08-30"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 中央：レーダーチャート */}
      <section className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-6">
        <div className="flex flex-col items-center gap-4">
          <EVAEColorBadges values={radarVals} />
          <EVAEPolarChart values={radarVals} />
          <EVAEChartSquares />
        </div>
      </section>

      {/* 下段：時系列（ダミー） */}
      <section className="mt-8 rounded-3xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-sm uppercase tracking-wide opacity-70 mb-3">時系列（7 / 30 / 90日・ダミー）</h2>
        <EVAETrendChart />
      </section>

      {/* 既存エラーハンドリング */}
      {loading && <p className="opacity-70 mt-4">読み込み中…</p>}
      {error && (
        <div className="mt-4 text-sm text-red-300">
          取得に失敗しました（{error}） <button onClick={reload} className="underline">再読み込み</button>
        </div>
      )}
    </main>
  )
}
