// app/mypage/MyPageClient.tsx
"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  RadarChart,
  TimeSeriesChart,
  type EVAEVector,
  type SeriesPoint,
} from "@/components/charts/Charts"

/* =============================================================
   MyPage 完全版（本番）
   - レーダー：完全表示（size=260）/ ラベル色 / 面＝最大色 / 縁＝Ǝ紫
   - ライン：7/30/90 切替・0..1正規化・横スクロール対応
   - 追加：base_model の正規化 & フォールバック表示
   - 追加：未来志向型/現実思考型の吹き出し + 詳しく見るリンク
   ============================================================= */

type EV = "E" | "V" | "Λ" | "Ǝ"

type ProfileLatest = {
  fortune?: string | null
  personality?: string | null
  partner?: string | null
  created_at?: string
  base_model?: "EΛVƎ" | "EVΛƎ" | null
  base_order?: EV[] | null
}
type DailyLatest = {
  code?: string | null
  comment?: string | null
  quote?: string | null
  created_at?: string
}

// alias
type EVAEVectorLocal = EVAEVector
type SeriesPointLocal = SeriesPoint

/* ============== Utils ============== */
const FALLBACK_USER = { name: "Hiro", idNo: "0001", avatar: "/icon-512.png" }
const CURRENT_THEME = "self"

const clamp01 = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0
}

// 入力の取りこぼしを防ぐ（空白・重複・余計な文字に耐性）
function normalizeModel(s?: string | null): "EΛVƎ" | "EVΛƎ" | null {
  if (!s) return null
  const t = String(s).replace(/\s+/g, "")
  if (t.includes("EΛVƎ")) return "EΛVƎ"
  if (t.includes("EVΛƎ")) return "EVΛƎ"
  return null
}

function toTypeLabel(model?: string | null) {
  const m = normalizeModel(model)
  if (m === "EΛVƎ") return "現実思考型"
  if (m === "EVΛƎ") return "未来志向型"
  return null
}

function fmt(dt?: string) {
  try {
    const d = dt ? new Date(dt) : new Date()
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    }).format(d)
  } catch { return "" }
}

// Ǝ は Eexists、Λ と L はどちらでも可に揃える
function normalizeToday(v: any): EVAEVectorLocal {
  const L = typeof v?.L === "number" ? v.L : (typeof v?.["Λ"] === "number" ? v["Λ"] : 0)
  return { E: clamp01(v?.E), V: clamp01(v?.V), L: clamp01(L), Eexists: clamp01(v?.Eexists ?? v?.["Ǝ"]) }
}
function normalizeSeries(list: any[]): SeriesPointLocal[] {
  return (list ?? []).map((d) => {
    const L = typeof d?.L === "number" ? d.L : (typeof d?.["Λ"] === "number" ? d["Λ"] : 0)
    return {
      date: String(d?.date ?? "").slice(0, 10),
      E: clamp01(d?.E), V: clamp01(d?.V), L: clamp01(L), Eexists: clamp01(d?.Eexists ?? d?.["Ǝ"]),
    }
  })
}

/* ============== Subcomponent：タイプ吹き出し ============== */
function OrientationTip({ baseModel }: { baseModel: "EΛVƎ" | "EVΛƎ" | null | undefined }) {
  const router = useRouter()
  const isFuture = baseModel === "EVΛƎ"
  const isReal   = baseModel === "EΛVƎ"
  const label = isFuture ? "未来志向型 (EVΛƎ)" : isReal ? "現実思考型 (EΛVƎ)" : "タイプ未設定"
  const message = isFuture
    ? "まだ形になっていない未来を強く意識し、夢や選択肢を広げようとする傾向があります。"
    : isReal
      ? "確定した現在を重視し、現実的な判断と秩序だった進め方を好む傾向があります。"
      : "まずはクイック診断を完了すると、あなたのタイプが表示されます。"

  const accentStyle = isFuture
    ? { color: "#B833F5" } // Ǝ紫
    : isReal
      ? { color: "#FF4500" } // E系のアクセント寄せ（視認性）
      : { color: "rgba(255,255,255,0.6)" }

  return (
    <div className="rounded-xl bg-white/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none">🧭</span>
        <p className="text-white/90 leading-relaxed">
          あなたは <strong style={accentStyle}>「{label}」</strong><br />
          <span className="text-white/80">{message}</span>
        </p>
      </div>
      <button
        onClick={() => router.push("/guide/future-vs-realistic")}
        className="text-sm text-cyan-400 hover:underline"
      >
        もっと詳しく知る →
      </button>
    </div>
  )
}

/* ============== Component ============== */
export default function MyPageClient() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<ProfileLatest | null>(null)
  const [daily, setDaily] = useState<DailyLatest | null>(null)

  // charts states
  const [range, setRange] = useState<7 | 30 | 90>(30)               // 初期30日
  const [today, setToday] = useState<EVAEVectorLocal | null>(null)
  const [series, setSeries] = useState<SeriesPointLocal[] | null>(null)
  const [chartsErr, setChartsErr] = useState<string | null>(null)

  // プロフィール/デイリー
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setError(null); setLoading(true)
        const [p, d] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/mypage/daily-latest",  { cache: "no-store" }).then((r) => r.json()),
        ])
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
  }, [])

  // チャートデータ
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
        // fallback（常に描ける安全値）
        const d = new Date()
        const mock = Array.from({ length: range }, (_, i) => {
          const dt = new Date(d); dt.setDate(dt.getDate() - (range - 1 - i))
          return { date: dt.toISOString().slice(0,10), E: 0.6, V: 0.6, L: 0.6, Eexists: 0.6 }
        })
        setToday({ E: 0.6, V: 0.6, L: 0.6, Eexists: 0.6 })
        setSeries(mock)
      }
    })()
    return () => { alive = false }
  }, [range])

  const normalizedModel = normalizeModel(profile?.base_model)
  const typeLabel = toTypeLabel(profile?.base_model)
  const nowStr = fmt()

  const goDaily = () => router.push("/daily/question")
  const goSettings = () => router.push("/settings")

  if (loading) return <div className="p-6 text-white/70">読み込み中…</div>
  if (error)   return <div className="p-6 text-red-400">エラー: {error}</div>

  return (
    <div className="min-h-screen bg-black text-white px-5 py-6 max-w-md mx-auto">
      {/* 1) クイック診断の型（バッジ＝ボタン） */}
+  <div className="flex justify-center mb-4">
+    {typeLabel ? (
+      <button
+        onClick={() =>
+          router.push(`/guide/future-vs-realistic?model=${encodeURIComponent(normalizedModel!)}`)
+        }
+        className="inline-block rounded-xl px-4 py-2 text-sm border transition
+                   hover:brightness-110 active:scale-[0.99]"
+        style={{
+          borderColor: normalizedModel === "EΛVƎ" ? "#B833F5" : "#FF4500",
+          backgroundColor: normalizedModel === "EΛVƎ" ? "#B833F51A" : "#FF45001A",
+          color: normalizedModel === "EΛVƎ" ? "#B833F5" : "#FF4500",
+        }}
+        aria-label={`${typeLabel}（${normalizedModel}）の解説へ`}
+      >
+        {typeLabel}（{normalizedModel}）
+      </button>
+    ) : (
+      <span className="inline-block rounded-xl px-3 py-2 text-xs border border-white/15 text-white/60 bg-white/5">
+        クイック診断はまだありません
+      </span>
+    )}
+  </div>

      {/* 2) プロフィール行 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <Image src={FALLBACK_USER.avatar} alt="Profile Icon" width={48} height={48}
                 className="h-12 w-12 rounded-full border border-white/20 bg-black/20" />
          <div className="flex flex-col justify-center">
            <div className="text-base font-semibold leading-tight">{FALLBACK_USER.name}</div>
            <div className="text-xs text-white/60 leading-tight">ID: {FALLBACK_USER.idNo}</div>
          </div>
        </div>
        <button
          onClick={goSettings}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
          title="設定"
        >
          <span>⚙️</span>設定
        </button>
      </div>

      {/* 3) テーマ＆日時 */}
      <div className="mb-4 text-[11px] text-white/50">
        テーマ: {CURRENT_THEME}<span className="opacity-40 mx-1">•</span>{nowStr}
      </div>

      {/* 4) 直近メッセージ */}
      <section className="mb-4 rounded-2xl border border-white/12 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold">直近のメッセージ</h2>
          <span className="text-[11px] text-white/50">{fmt(daily?.created_at || profile?.created_at || "")}</span>
        </div>
        <p className="text-sm text-white/90">
          {daily?.comment || profile?.fortune || "まだメッセージはありません。"}
        </p>
      </section>

      {/* 5) 構造チャート（横スライド：初期Radar） */}
      <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">構造バランス</h2>
          <div className="text-[11px] text-white/60">Radar / Line（横スワイプ）</div>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Slide 1: Radar */}
          <div className="min-w-full snap-center flex justify-center">
            <div className="w-full max-w-xs">
              {today ? <RadarChart values={today} size={260} /> : <div className="text-xs text-white/50">No Data</div>}
            </div>
          </div>

          {/* Slide 2: Line */}
          <div className="min-w-full snap-center">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-white/80">Line（{range}日推移）</div>
              <div className="flex items-center gap-2 text-xs">
                {[7, 30, 90].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRange(n as 7 | 30 | 90)}
                    className={`px-3 py-1 rounded border ${range === n ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  >
                    {n}日
                  </button>
                ))}
              </div>
            </div>

            {/* 横スクロールで広く見せるラッパー */}
            <div className="rounded-xl bg-black/25 border border-white/10">
              <div className="overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent_0,black_16px,black_calc(100%-16px),transparent_100%)] overscroll-x-contain">
                <div className="inline-block pr-4">
                  {series ? (
                    <TimeSeriesChart data={series} />
                  ) : (
                    <div className="h-56 grid place-items-center text-white/60 text-sm">読み込み中…</div>
                  )}
                </div>
              </div>
            </div>

            {chartsErr && <div className="mt-2 text-[11px] text-red-300/80">[{chartsErr}] フォールバック表示中</div>}
          </div>
        </div>
      </section>

      {/* 6) 次の一歩 */}
      <section className="mt-4 rounded-2xl border border-white/12 bg-white/5 p-4">
        <h2 className="text-sm font-bold mb-3">次の一歩を選んでください</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={goDaily} className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 hover:bg-white/15">
            デイリー診断
            <div className="text-[11px] text-white/60 mt-1">1問 / 今日のゆらぎ</div>
          </button>
          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white/50 cursor-not-allowed" title="近日公開">
            診断タイプを選ぶ
            <div className="text-[11px] text-white/40 mt-1">Weekly / Monthly（予定）</div>
          </button>
        </div>
      </section>
    </div>
  )
}
