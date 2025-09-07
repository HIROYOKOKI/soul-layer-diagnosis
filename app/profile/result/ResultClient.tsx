// app/profile/result/ResultClient.tsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import LuneaBubble from "@/components/LuneaBubble"
import GlowButton from "@/components/GlowButton"

type Pending = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference: string | null
}

type DiagnoseDetail = {
  fortune?: string
  personality?: string
  work?: string
  partner?: string
}

type DiagnoseOk = {
  ok: true
  result: {
    name: string
    summary?: string
    luneaLines: string[] // 受け取るが使わない
    detail?: DiagnoseDetail
  }
}
type DiagnoseNg = { ok: false; error: string }
type DiagnoseResp = DiagnoseOk | DiagnoseNg

function initialStep(len: number) {
  if (!Number.isFinite(len) || len <= 0) return 0
  return Math.min(1, Math.max(0, Math.floor(len)))
}

// タイトル＆チップ用：クイック基礎層（sessionStorage）
function getQuickBase() {
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("structure_quick_pending") : null
    if (!raw) return null
    const p = JSON.parse(raw) as {
      order: Array<"E" | "V" | "Λ" | "Ǝ">
      points?: Record<"E" | "V" | "Λ" | "Ǝ", number>
    }
    if (!p?.order || p.order.length !== 4) return null
    const top = p.order[0]
    const base_model = top === "E" || top === "Λ" ? "EΛVƎ" : "EVΛƎ"
    return { base_model, base_order: p.order, base_points: p.points ?? { E:0, V:0, Λ:0, Ǝ:0 } }
  } catch { return null }
}

const CODE_LABELS = { E: "衝動・情熱", V: "可能性・夢", "Λ": "選択・葛藤", "Ǝ": "観測・静寂" } as const
const CODE_COLORS = { E: "#FF4500", V: "#1E3A8A", "Λ": "#84CC16", "Ǝ": "#B833F5" } as const

export default function ResultClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<DiagnoseDetail | null>(null)
  const [step, setStep] = useState(0)
  const [quickBase, setQuickBase] = useState<ReturnType<typeof getQuickBase> | null>(null)

  useEffect(() => {
    async function run() {
      try {
        setError(null)
        setLoading(true)

        const raw = typeof window !== "undefined" ? sessionStorage.getItem("profile_pending") : null
        if (!raw) throw new Error("no_profile_pending")
        const pending = JSON.parse(raw) as Pending

        const resp = await fetch("/api/profile/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
          cache: "no-store",
        })
        const json = (await resp.json()) as DiagnoseResp
        if (!("ok" in json) || !json.ok) throw new Error((json as any)?.error || "diagnose_failed")

        const d = json.result.detail ?? null
        setDetail(d)

        const qb = getQuickBase()
        setQuickBase(qb)

        setSaving(true)
        const saveRes = await fetch("/api/profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: null,
            fortune: d?.fortune ?? null,
            personality: d?.personality ?? null,
            partner: d?.partner ?? null,
            ...(qb ?? {}),
          }),
        })
        if (!saveRes.ok && saveRes.status !== 409) {
          const j = await saveRes.json().catch(() => ({}))
          console.warn("profile/save failed:", j?.error ?? saveRes.statusText)
        } else {
          try { sessionStorage.removeItem("structure_quick_pending") } catch {}
        }
      } catch (e: any) {
        setError(e?.message || "failed")
      } finally {
        setSaving(false)
        setLoading(false)
      }
    }
    run()
  }, [])

  // 吹き出しは detail を順に表示
  const bubbles = useMemo(() => {
    const arr: Array<{label: string; text: string}> = []
    if (detail?.fortune)     arr.push({ label: "総合運勢",           text: detail.fortune.trim() })
    if (detail?.personality) arr.push({ label: "性格傾向",           text: detail.personality.trim() })
    if (detail?.work)        arr.push({ label: "仕事運",             text: detail.work.trim() })
    if (detail?.partner)     arr.push({ label: "理想のパートナー像", text: detail.partner.trim() })
    return arr
  }, [detail])

  useEffect(() => {
    setStep(initialStep(bubbles.length))
  }, [bubbles.length])

  const next = () => setStep((s) => Math.min(bubbles.length, s + 1))
  const restart = () => setStep(initialStep(bubbles.length))
  const toProfile = () => router.push("/profile")
  const toMyPage = () => router.push("/mypage")

  const topCode = quickBase?.base_order?.[0]
  const titleText = topCode ? `傾向：${topCode}（${CODE_LABELS[topCode]}）が強め` : "診断結果"

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="sr-only">プロフィール診断結果</h1>

      {/* タイトル＋カラー付きコードチップ */}
      <section className="space-y-2">
        <div className="text-cyan-300 font-semibold">
          {titleText} {saving && <span className="text-white/60 text-xs ml-2">保存中…</span>}
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {(["E","V","Λ","Ǝ"] as const).map((k) => {
            const active = k === topCode
            const bg = active ? CODE_COLORS[k] : "rgba(255,255,255,0.08)"
            const color = active ? "#fff" : "rgba(255,255,255,0.7)"
            return (
              <span key={k} style={{ backgroundColor: bg, color }} className="rounded-full px-2.5 py-1 leading-none">
                {k}・{CODE_LABELS[k]}
              </span>
            )
          })}
        </div>
      </section>

      {/* ルネアの連続セリフ */}
      <div className="space-y-4">
        {loading && <div className="text-white/80">…観測中。きみの“いま”を読み解いているよ。</div>}

        {error && (
          <div className="space-y-3">
            <div className="text-sm text-red-300">エラー : {error}</div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded border border-white/20 hover:bg-white/10" onClick={() => { if (typeof window !== "undefined") window.location.reload() }}>
                再試行
              </button>
              <button className="px-3 py-2 rounded border border-white/20 hover:bg-white/10" onClick={toProfile}>
                入力へ戻る
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {bubbles.slice(0, step).map((b, i) => (
              <LuneaBubble key={i} text={`${b.label}：${b.text}`} speed={64} />
            ))}
          </>
        )}
      </div>

      {/* ボタン群：縦並び */}
      {!loading && !error && (
        <div className="space-y-3">
          {step < bubbles.length && (
            <button
              onClick={next}
              disabled={saving}
              className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium shadow-lg transition"
            >
              次へ
            </button>
          )}
          <button
            onClick={restart}
            className="w-full px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10"
            disabled={saving}
          >
            もう一度
          </button>
          <GlowButton
            variant="primary"
            size="sm"
            onClick={toMyPage}
            disabled={saving}
            className="w-full h-12"
          >
            マイページへ
          </GlowButton>
        </div>
      )}
    </div>
  )
}
