// components/result/ProfileResultClient.tsx
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
    luneaLines: string[]
    detail?: DiagnoseDetail
  }
}
type DiagnoseNg = { ok: false; error: string }
type DiagnoseResp = DiagnoseOk | DiagnoseNg

const CODE_LABELS = { E: "衝動・情熱", V: "可能性・夢", "Λ": "選択・葛藤", "Ǝ": "観測・静寂" } as const
const CODE_COLORS = { E: "#FF4500", V: "#1E3A8A", "Λ": "#84CC16", "Ǝ": "#B833F5" } as const

function getQuickBase() {
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("structure_quick_pending") : null
    if (!raw) return null
    const p = JSON.parse(raw) as { order: Array<"E"|"V"|"Λ"|"Ǝ">; points?: Record<"E"|"V"|"Λ"|"Ǝ", number> }
    if (!p?.order || p.order.length !== 4) return null
    const top = p.order[0]
    const base_model = top === "E" || top === "Λ" ? "EΛVƎ" : "EVΛƎ"
    return { base_model, base_order: p.order, base_points: p.points ?? { E:0,V:0,Λ:0,Ǝ:0 } }
  } catch { return null }
}

export default function ProfileResultClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<DiagnoseDetail | null>(null)
  const [step, setStep] = useState(0)
  const [quickBase, setQuickBase] = useState<ReturnType<typeof getQuickBase> | null>(null)

  useEffect(() => { setQuickBase(getQuickBase()) }, [])

  // プロフィール診断を実行（Quick の有無に関係なく）
  useEffect(() => {
    (async () => {
      try {
        setError(null); setLoading(true)
        const raw = sessionStorage.getItem("profile_pending")
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

        // 保存（Quick があれば一緒に meta も保存、無ければプロフィールのみ）
        setSaving(true)
        await fetch("/api/profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: null,
            fortune: d?.fortune ?? null,
            personality: d?.personality ?? null,
            partner: d?.partner ?? null,
            ...(quickBase ?? {}), // 無ければ空展開
          }),
        }).catch(() => {})
      } catch (e: any) {
        setError(e?.message || "failed")
      } finally {
        setSaving(false)
        setLoading(false)
      }
    })()
  }, [quickBase])

  // ルネアの連続セリフ（短文は使わない）
  const bubbles = useMemo(() => {
    const arr: Array<{label: string; text: string}> = []
    if (detail?.fortune)     arr.push({ label: "総合運勢",           text: detail.fortune.trim() })
    if (detail?.personality) arr.push({ label: "性格傾向",           text: detail.personality.trim() })
    if (detail?.work)        arr.push({ label: "仕事運",             text: detail.work.trim() })
    if (detail?.partner)     arr.push({ label: "理想のパートナー像", text: detail.partner.trim() })
    return arr
  }, [detail])

  useEffect(() => {
    const len = bubbles.length
    setStep(len > 0 ? 1 : 0)
  }, [bubbles.length])

  const next = () => setStep((s) => Math.min(bubbles.length, s + 1))
  const toQuick = () => router.push("/structure/quick?return=/mypage")
  const toMyPage = () => router.push("/mypage")

  const top = quickBase?.base_order?.[0]
  const titleText = top ? `傾向：${top}（${CODE_LABELS[top]}）が強め` : "診断結果"

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="sr-only">プロフィール診断結果</h1>

      {/* タイトル＋カラーラベル（Quick 済みの時だけ強調） */}
      <section className="space-y-2">
        <div className="text-cyan-300 font-semibold">
          {titleText} {saving && <span className="text-white/60 text-xs ml-2">保存中…</span>}
        </div>
        {top && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {(["E","V","Λ","Ǝ"] as const).map((k) => {
              const active = k === top
              const bg = active ? CODE_COLORS[k] : "rgba(255,255,255,0.08)"
              const color = active ? "#fff" : "rgba(255,255,255,0.7)"
              return (
                <span key={k} style={{ backgroundColor: bg, color }} className="rounded-full px-2.5 py-1 leading-none">
                  {k}・{CODE_LABELS[k]}
                </span>
              )
            })}
          </div>
        )}
      </section>

      {/* ルネアの連続セリフ */}
      <div className="space-y-4">
        {loading && <div className="text-white/80">…観測中。きみの“いま”を読み解いているよ。</div>}
        {error && <div className="text-sm text-red-300">エラー : {error}</div>}
        {!loading && !error && bubbles.slice(0, step).map((b, i) => (
          <LuneaBubble key={i} text={`${b.label}：${b.text}`} speed={62} />
        ))}
        {!loading && !error && step < bubbles.length && (
          <div className="pt-1">
            <GlowButton size="sm" variant="primary" onClick={next} disabled={saving}>
              次へ
            </GlowButton>
          </div>
        )}
      </div>

      {/* フッターCTA：Quick 未実施なら Quick へ、済みならマイページ */}
      {!loading && !error && (
        <div className="space-y-3">
          {!quickBase ? (
            <button
              onClick={toQuick}
              className="w-full h-12 rounded-xl bg-[#B833F5] text-white font-medium shadow-[0_0_18px_rgba(184,51,245,0.35)] transition hover:shadow-[0_0_28px_rgba(184,51,245,0.5)] active:scale-[0.99]"
            >
              クイック診断へ（30秒）
            </button>
          ) : (
            <GlowButton variant="primary" size="sm" onClick={toMyPage} className="w-full h-12">
              マイページへ
            </GlowButton>
          )}
        </div>
      )}
    </div>
  )
}
