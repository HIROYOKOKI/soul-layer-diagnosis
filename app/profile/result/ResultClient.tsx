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
    luneaLines: string[]       // ← 受け取るが使わない
    detail?: DiagnoseDetail
  }
}
type DiagnoseNg = { ok: false; error: string }
type DiagnoseResp = DiagnoseOk | DiagnoseNg

function initialStep(len: number) {
  if (!Number.isFinite(len) || len <= 0) return 0
  return Math.min(1, Math.max(0, Math.floor(len)))
}

// sessionStorage からクイック基礎層を取得（タイトル＆チップ用）
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

  // ルネアの吹き出しは「短いセリフ」ではなく detail を順に表示
  const bubbles = useMemo(() => {
    const arr: string[] = []
    if (detail?.fortune)     arr.push(detail.fortune.trim())
    if (detail?.personality) arr.push(detail.personality.trim())
    if (detail?.work)        arr.push(detail.work.trim())
    if (detail?.partner)     arr.push(detail.partner.trim())
    return arr.filter(Boolean)
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

      {/* タイトル＋コードチップ */}
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
              <span
                key={k}
                style={{ backgroundColor: bg, color }}
                className="rounded-full px-2.5 py-1 leading-none"
              >
                {k}・{CODE_LABELS[k]}
              </span>
            )
          })}
        </div>
      </section>

      {/* 上部：ルネアの吹き出し（detail を段階表示） */}
      <div className="space-y-4">
        {loading && <div className="text-white/70">…観測中。きみの“いま”を読み解いているよ。</div>}

        {error && (
          <div className="space-y-3">
            <div className="text-sm text-red-300">エラー : {error}</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded border border-white/20 hover:bg-white/10"
                onClick={() => { if (typeof window !== "undefined") window.location.reload() }}
              >
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
            {bubbles.slice(0, step).map((t, i) => (
              <LuneaBubble key={i} text={t} speed={32} />
            ))}
            {step < bubbles.length && (
              <div className="pt-1">
                <GlowButton size="sm" variant="primary" onClick={next} disabled={saving}>
                  次へ
                </GlowButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* 下部：結果カード（読み返し用） */}
      {!loading && !error && detail && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_0_12px_rgba(255,255,255,.04),0_0_0_1px_rgba(255,255,255,.03)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-white/80 text-sm mb-1">総合運勢</h3>
              <p className="text-white/90 leading-relaxed text-[15px]">{detail.fortune || "—"}</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-white/80 text-sm mb-1">性格傾向</h3>
              <p className="text-white/90 leading-relaxed text-[15px]">{detail.personality || "—"}</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-white/80 text-sm mb-1">仕事運</h3>
              <p className="text-white/90 leading-relaxed text-[15px]">{detail.work || "—"}</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-white/80 text-sm mb-1">理想のパートナー像</h3>
              <p className="text-white/90 leading-relaxed text-[15px]">{detail.partner || "—"}</p>
            </article>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={restart} className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10" disabled={saving}>
              もう一度
            </button>
            <GlowButton variant="primary" size="sm" onClick={toMyPage} disabled={saving}>
              マイページへ
            </GlowButton>
          </div>
        </section>
      )}
    </div>
  )
}
