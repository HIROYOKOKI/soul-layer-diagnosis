// app/mypage/MyPageClient.tsx
"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  RadarChart,
  TimeSeriesChart,
  type EVAEVector,
  type SeriesPoint,
} from "@/components/charts/Charts"

type EV = "E" | "V" | "Λ" | "Ǝ"

type ProfileLatest = {
  fortune?: string | null
  personality?: string | null
  partner?: string | null
  created_at?: string | null
  base_model?: "EΛVƎ" | "EVΛƎ" | null
  base_order?: EV[] | null
}

type DailyLatest = {
  code?: string | null
  comment?: string | null
  quote?: string | null
  theme?: string | null
  env?: "dev" | "prod" | null
  created_at?: string | null
  updated_at?: string | null
}

type EVAEVectorLocal = EVAEVector
type SeriesPointLocal = SeriesPoint

const FALLBACK_USER = { name: "Hiro", idNo: "0001", avatar: "/icon-512.png" }

const clamp01 = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0
}

function normalizeModel(s?: string | null): "EΛVƎ" | "EVΛƎ" | null {
  if (!s) return null
  const t = String(s).replace(/\s+/g, "")
  if (t.includes("EΛVƎ")) return "EΛVƎ"
  if (t.includes("EVΛƎ")) return "EVΛƎ"
  return null
}
function decideModelFromCode(code?: string | null): "EΛVƎ" | "EVΛƎ" | null {
  const c = (code || "").trim()
  if (!c) return null
  return c === "E" || c === "Λ" ? "EΛVƎ" : c === "V" || c === "Ǝ" ? "EVΛƎ" : null
}
function decideModelFromOrder(order?: EV[] | null): "EΛVƎ" | "EVΛƎ" | null {
  if (!order?.length) return null
  const top = order[0]
  return top === "E" || top === "Λ" ? "EΛVƎ" : top === "V" || top === "Ǝ" ? "EVΛƎ" : null
}

function fmt(dt?: string | null) {
  try {
    const d = dt ? new Date(dt) : new Date()
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  } catch {
    return ""
  }
}

function normalizeToday(v: any): EVAEVectorLocal {
  const L = typeof v?.L === "number" ? v.L : (typeof v?.["Λ"] === "number" ? v["Λ"] : 0)
  return { E: clamp01(v?.E), V: clamp01(v?.V), L: clamp01(L), Eexists: clamp01(v?.Eexists ?? v?.["Ǝ"]) }
}

function normalizeSeries(list: any[]): SeriesPointLocal[] {
  return (list ?? []).map((d) => {
    const L = typeof d?.L === "number" ? d.L : (typeof d?.["Λ"] === "number" ? d["Λ"] : 0)
    return {
      date: String(d?.date ?? "").slice(0, 10),
      E: clamp01(d?.E),
      V: clamp01(d?.V),
      L: clamp01(L),
      Eexists: clamp01(d?.Eexists ?? d?.["Ǝ"]),
    }
  })
}

/* ====== 型バッジ用 ====== */
function modelMeta(model: "EΛVƎ" | "EVΛƎ" | null) {
  if (model === "EΛVƎ") return { color: "#B833F5", label: "EΛVƎ:現実思考型" } // 紫
  if (model === "EVΛƎ") return { color: "#FF4500", label: "EVΛƎ:未来志向型" } // オレンジ
  return { color: "#888888", label: "" }
}
/** #RRGGBB → rgba(r,g,b,alpha) */
function hexToRgba(hex: string, alpha = 0.15) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(255,255,255,${alpha})`
  const r = parseInt(m[1], 16),
    g = parseInt(m[2], 16),
    b = parseInt(m[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ============== ブランドヘッダー ============== */
function AppHeader() {
  return null;
}

export default function MyPageClient() {
  const router = useRouter()
  const search = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileLatest | null>(null)
  const [daily, setDaily] = useState<DailyLatest | null>(null)

  const [range, setRange] = useState<7 | 30 | 90>(30)
  const [today, setToday] = useState<EVAEVectorLocal | null>(null)
  const [series, setSeries] = useState<SeriesPointLocal[] | null>(null)
  const [chartsErr, setChartsErr] = useState<string | null>(null)

  // env（dev/prod）
  const [env, setEnv] = useState<"dev" | "prod">("prod")

  // 初回：localStorage から env 復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ev-env")
      if (saved === "dev" || saved === "prod") {
        setEnv(saved)
      } else {
        localStorage.setItem("ev-env", "prod")
      }
    } catch {}
  }, [])

  // URLクエリ ?env=dev|prod で上書き
  useEffect(() => {
    const p = search?.get("env")
    if (p === "dev" || p === "prod") {
      setEnv(p)
      try {
        localStorage.setItem("ev-env", p)
      } catch {}
    }
  }, [search])

  // 取得：今の env が空なら反対 env を自動フォールバック（双方向）
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setError(null)
        setLoading(true)

        const qs = `?env=${encodeURIComponent(env)}`
        const [pRes, dRes] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }),
          fetch(`/api/mypage/daily-latest${qs}`, { cache: "no-store" }),
        ])
        if (!pRes.ok) throw new Error("profile_latest_failed")
        if (!dRes.ok) throw new Error("daily_latest_failed")

        const p = await pRes.json()
        let d = await dRes.json()

        // どちらのenvでも、itemが空なら反対envを試す
        if (!d?.item) {
          const other = env === "prod" ? "dev" : "prod"
          try {
            const dOther = await fetch(`/api/mypage/daily-latest?env=${other}`, { cache: "no-store" }).then((r) => r.json())
            if (dOther?.ok && dOther?.item) {
              d = dOther
              // 実際に表示した環境をこの端末の既定に
              setEnv(other)
              try { localStorage.setItem("ev-env", other) } catch {}
            }
          } catch {}
        }

        if (!alive) return
        if (!p?.ok) throw new Error(p?.error || "profile_latest_failed")
        if (!d?.ok) throw new Error(d?.error || "daily_latest_failed")

        setProfile(p.item ?? null)
        setDaily(d.item ?? null)
      } catch (e: any) {
        if (alive) setError(e?.message || "failed")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [env])

  // チャート系
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setChartsErr(null)
        const [tRes, sRes] = await Promise.all([
          fetch("/api/today", { cache: "no-store" }),
          fetch(`/api/series?days=${range}`, { cache: "no-store" }),
        ])
        if (!tRes.ok) throw new Error("/api/today failed")
        if (!sRes.ok) throw new Error("/api/series failed")
        const tJson = await tRes.json()
        const sJson = await sRes.json()
        if (!alive) return
        setToday(tJson?.scores ? normalizeToday(tJson.scores) : normalizeToday(tJson))
        setSeries(normalizeSeries(sJson))
      } catch (e: any) {
        if (!alive) return
        setChartsErr(e?.message ?? "charts fetch error")
      }
    })()
    return () => { alive = false }
  }, [range])

  // 型推定：base_model → daily.code → base_order(top)
  const normalizedModel =
    normalizeModel(profile?.base_model) ||
    decideModelFromCode(daily?.code) ||
    decideModelFromOrder(profile?.base_order)
  const meta = modelMeta(normalizedModel)
  const nowStr = fmt()

  const goDaily = () => router.push("/daily/question")
  const goSettings = () => router.push("/settings")

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>
  if (error) return <div className="p-6 text-red-400">エラー: {error}</div>

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ブランドヘッダー */}
      <AppHeader />

      <main className="mx-auto max-w-md px-5 pb-10 space-y-6">
        {/* H1＋サブコピー */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[32px] font-extrabold tracking-tight uppercase">MY PAGE</h1>
            <p className="mt-1 text-sm text-white/60">あなたの軌跡と、いまを映す</p>

            {/* 型バッジ（テキストのみ表示） */}
            {meta.label && (
              <div
                className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  border: `1px solid ${meta.color}`,
                  color: meta.color,
                  backgroundColor: hexToRgba(meta.color, 0.12),
                  boxShadow: `0 0 0.25rem ${hexToRgba(meta.color, 0.4)}`,
                }}
                aria-label={meta.label}
              >
                {meta.label}
              </div>
            )}
          </div>

          {/* envトグル（暫定：常時表示） */}
          <button
            onClick={() => {
              const next = env === "prod" ? "dev" : "prod"
              setEnv(next)
              try { localStorage.setItem("ev-env", next) } catch {}
            }}
            className="mt-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
          >
            env: {env}（切替）
          </button>
        </div>

        {/* プロフィール */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={FALLBACK_USER.avatar}
              alt="Profile Icon"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border border-white/20 bg-black/20"
            />
            <div>
              <div className="text-xl font-semibold">{FALLBACK_USER.name}</div>
              <div className="text-sm text-white/70">ID: {FALLBACK_USER.idNo}</div>
            </div>
          </div>
          <button
            onClick={goSettings}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <span>⚙️</span>設定
          </button>
        </div>

        {/* テーマ＆日時（DB値） */}
        <div className="text-[13px] text-white/60">
          現在のテーマ{" "}
          <span className="mx-1 text-white/80 font-medium">{daily?.theme ?? "—"}</span>
          <span className="opacity-40 mx-1">•</span>
          {nowStr}
          <span className="opacity-40 mx-1"> • </span>
          {/* 実際に表示中のレコードのenvを優先表示 */}
          <span className="text-white/50">env: {daily?.env ?? env}</span>
        </div>

        {/* 直近メッセージ（daily最優先） */}
        <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <h2 className="text-base font-semibold mb-1">直近のメッセージ</h2>
          <p className="text-sm text-white/90">
            {daily?.comment || daily?.quote || profile?.fortune || "まだメッセージはありません。"}
          </p>
          {(daily?.updated_at || daily?.created_at) && (
            <div className="mt-1 text-[11px] text-white/50">
              更新: {fmt(daily?.updated_at || daily?.created_at)}
              {daily?.env ? `（env: ${daily.env}）` : ""}
            </div>
          )}
        </section>

        {/* 構造チャート */}
        <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <h2 className="text-base font-semibold mb-2">構造バランス</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            <div className="min-w-full snap-center flex justify-center">
              <div className="w-full max-w-xs">
                {today ? <RadarChart values={today} size={260} /> : <div className="text-xs text-white/50">No Data</div>}
              </div>
            </div>
            <div className="min-w-full snap-center">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-white/80">Line（{range}日推移）</div>
                <div className="flex gap-2 text-xs">
                  {[7, 30, 90].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRange(n as 7 | 30 | 90)}
                      className={`px-3 py-1 rounded border ${
                        range === n ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {n}日
                    </button>
                  ))}
                </div>
              </div>
              {series ? (
                <TimeSeriesChart data={series} />
              ) : (
                <div className="h-56 grid place-items-center text-white/60">読み込み中…</div>
              )}
              {chartsErr && <div className="mt-2 text-xs text-red-300">[{chartsErr}] フォールバック表示中</div>}
            </div>
          </div>
        </section>

        {/* 次の一歩（デイリー診断CTA） */}
        <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
          <h2 className="text-base font-semibold mb-3">次の一歩</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={goDaily}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 hover:bg-white/15"
              aria-label="デイリー診断を始める"
            >
              デイリー診断
              <div className="text-[11px] text-white/60 mt-1">1問 / 今日のゆらぎ</div>
            </button>

            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white/50 cursor-not-allowed"
              title="近日公開"
              disabled
            >
              診断タイプを選ぶ
              <div className="text-[11px] text-white/40 mt-1">Weekly / Monthly（予定）</div>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
