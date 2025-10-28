// app/profile/result/ResultClient.tsx
"use client"
import React, { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import LuneaBubble from "@/components/LuneaBubble"
import GlowButton from "@/components/GlowButton"

/* ========== Types ========== */
type EV = "E" | "V" | "Λ" | "Ǝ"
type BaseModel = "EΛVƎ" | "EVΛƎ"
type DiagnoseDetail = { fortune?: string; personality?: string; work?: string; partner?: string }
type DiagnoseResult = { name?: string; summary?: string; luneaLines?: string[]; detail?: DiagnoseDetail }

/* ========== Helpers ========== */
const CODE_LABELS: Record<EV, string> = { E:"衝動・情熱", V:"可能性・夢", Λ:"選択・葛藤", Ǝ:"観測・静寂" }
const CODE_COLORS: Record<EV, string> = { E:"#FF4500", V:"#1E3A8A", Λ:"#84CC16", Ǝ:"#B833F5" }

function toEV(x: unknown): EV | null {
  const s = String(x ?? "").trim()
  if (s === "E") return "E"
  if (s === "V") return "V"
  if (s === "Λ" || s.toUpperCase() === "L") return "Λ"
  if (s === "Ǝ" || s.toUpperCase() === "EEXISTS") return "Ǝ"
  return null
}
function num(n: unknown, f = 0): number {
  const v = typeof n === "number" ? n : Number(n)
  return Number.isFinite(v) ? v : f
}

/** Quick結果（sessionStorage.structure_quick_pending）を読み取り→正規化 */
function getQuickBase(): {
  base_model: BaseModel; base_order: EV[]; base_points: Record<EV, number>;
} | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem("structure_quick_pending")
    if (!raw) return null
    const p = JSON.parse(raw) as { order?: unknown[]; points?: Record<string, unknown> }
    const ord: EV[] = (Array.isArray(p.order) ? p.order : []).map(toEV).filter(Boolean) as EV[]
    const uniq = Array.from(new Set(ord))
    const full: EV[] = ["E", "V", "Λ", "Ǝ"]
    const complete = uniq.length === 4 && full.every(k => uniq.includes(k))
    if (!complete) return null

    const src = p.points ?? {}
    const pts: Record<EV, number> = {
      E: num(src["E"]), V: num(src["V"]),
      Λ: num(src["Λ"] ?? src["L"]),
      Ǝ: num(src["Ǝ"] ?? src["Eexists"]),
    }
    const top = uniq[0]
    const base_model: BaseModel = top === "E" || top === "Λ" ? "EΛVƎ" : "EVΛƎ"
    return { base_model, base_order: uniq, base_points: pts }
  } catch { return null }
}

export default function ProfileResultClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<DiagnoseDetail | null>(null)
  const [step, setStep] = useState(0)
  const [quickBase, setQuickBaseState] = useState<ReturnType<typeof getQuickBase> | null>(null)

  /** 保存処理だけ関数化（存在しないAPIでもUIは継続） */
  const saveProfileSafely = useCallback(async (d?: DiagnoseDetail | null) => {
    try {
      setSaving(true)
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: null,
          fortune: d?.fortune ?? null,
          personality: d?.personality ?? null,
          work: d?.work ?? null,
          partner: d?.partner ?? null,
          ...(getQuickBase() ?? {}),
        }),
      }).catch(() => null)

      if (res && !res.ok && res.status !== 409) {
        const j = await res.json().catch(() => ({} as any))
        console.warn("profile/save failed:", j?.error ?? res.statusText)
      } else {
        try { sessionStorage.removeItem("structure_quick_pending") } catch {}
      }
    } finally {
      setSaving(false)
    }
  }, [])

  /* ==== load from sessionStorage + フォールバック ==== */
  useEffect(() => {
    (async () => {
      try {
        const raw = typeof window !== "undefined" ? sessionStorage.getItem("profile_diagnose_pending") : null

        if (raw) {
          const result = JSON.parse(raw) as DiagnoseResult
          const d = result?.detail ?? null
          setDetail(d)
          setQuickBaseState(getQuickBase())
          await saveProfileSafely(d)
          return
        }

        // ★ フォールバック：最新1件をAPIから
        const r = await fetch("/api/mypage/profile-latest", { cache: "no-store" }).catch(() => null)
        const j = await r?.json().catch(() => null)
        const d = j?.item ?? null // { fortune, personality, work?, partner, created_at }
        if (d) {
          setDetail({
            fortune: d.fortune ?? null,
            personality: d.personality ?? null,
            work: d.work ?? null,
            partner: d.partner ?? null,
          })
          setQuickBaseState(getQuickBase())
          return
        }

        setError("結果データが見つかりません（もう一度診断してください）")
      } catch {
        setError("結果データの読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    })()
  }, [saveProfileSafely])

  /* ==== bubbles ==== */
  const bubbles = useMemo(() => {
    const arr: Array<{ label: string; text: string }> = []
    if (detail?.fortune)     arr.push({ label: "総合運勢（ホロスコープ）",  text: detail.fortune.trim() })
    if (detail?.personality) arr.push({ label: "性格傾向（数秘術）",        text: detail.personality.trim() })
    if (detail?.work)        arr.push({ label: "仕事運（数秘術）",          text: detail.work.trim() })
    if (detail?.partner)     arr.push({ label: "理想のパートナー像（ホロスコープ）", text: detail.partner.trim() })
    return arr
  }, [detail])

  // 初期表示：1個目から / 吹き出し0ならすぐ finished
  useEffect(() => {
    if (bubbles.length <= 0) setStep(0)
    else setStep(1)
  }, [bubbles.length])

  const finished = step >= bubbles.length && bubbles.length > 0

  const next = useCallback(() => {
    setStep(s => Math.min(bubbles.length, s + 1))
  }, [bubbles.length])

  const restart = () => setStep(bubbles.length > 0 ? 1 : 0)
  const toProfile = () => router.push("/profile")

  const goQuick = useCallback(() => {
    try {
      sessionStorage.setItem("onboarding_step", "profile_done")
      sessionStorage.removeItem("profile_diagnose_pending")
    } catch {}
    router.push("/structure/quick")
  }, [router])

  // Enterキーで前進／最後はCTAへ
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return
      if (!finished) next()
      else goQuick()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [finished, next, goQuick])

  // 終了後に自動遷移（1.2s）
  useEffect(() => {
    if (!finished) return
    const t = setTimeout(goQuick, 1200)
    return () => clearTimeout(t)
  }, [finished, goQuick])

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
              <span key={k} style={{ backgroundColor: bg, color }} className="rounded-full px-2.5 py-1 leading-none">
                {k}・{CODE_LABELS[k]}
              </span>
            )
          })}
        </div>
      </section>

      {/* ルネア吹き出し */}
      <div className="space-y-4">
        {loading && <div className="text-white/80">…観測中。きみの“いま”を読み解いているよ。</div>}

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
              <button className="px-3 py-2 rounded border border-white/20 hover:bg白/10" onClick={toProfile}>
                入力へ戻る
              </button>
            </div>
          </div>
        )}

        {!loading && !error && bubbles.length > 0 && (
          <>
            {bubbles.slice(0, step).map((b, i) => (
              <LuneaBubble key={i} text={`${b.label}：${b.text}`} speed={80} />
            ))}
          </>
        )}
      </div>

      {/* CTA群 */}
      {!loading && !error && (
        <div className="space-y-3">
          {!finished && bubbles.length > 0 && (
            <button
              onClick={next}
              disabled={saving}
              className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium shadow-lg transition"
            >
              次へ
            </button>
          )}

          {/* いつでもスキップ可能 */}
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={goQuick}
            disabled={saving}
            className="w-full h-12"
          >
            スキップしてクイック診断へ →
          </GlowButton>

          <button
            onClick={restart}
            className="w-full px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10"
            disabled={saving}
          >
            もう一度
          </button>
        </div>
      )}
    </div>
  )
}
