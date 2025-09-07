// app/profile/result/ResultClient.tsx
"use client"

import React, { useEffect, useState } from "react"
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
  fortune?: string      // 総合運勢 150-200文字
  personality?: string  // 性格傾向 150-200文字
  work?: string         // 仕事運 80-100文字（DBには保存しない）
  partner?: string      // 理想のパートナー像 80-100文字
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

// ---------- helpers ----------
function chooseCardTexts(lines: string[]) {
  const xs = (lines || [])
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0)

  let mainLine = ""
  if (xs.length >= 3) mainLine = xs[2]
  else if (xs.length === 2) mainLine = xs[1]
  else if (xs.length === 1) mainLine = xs[0]

  const quote = xs.length > 0 ? xs[xs.length - 1] : ""
  return { mainLine, quote }
}

function initialStep(len: number) {
  if (!Number.isFinite(len) || len <= 0) return 0
  return Math.min(2, Math.max(0, Math.floor(len)))
}

const FALLBACK_MAIN =
  "行動の火種が灯っているね。小さく始めるほど、軌道は早く整うよ。"

// クイック基礎層（sessionStorage から取り出し → 型を決定）
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
    return {
      base_model,
      base_order: p.order,
      base_points: p.points ?? { E: 0, V: 0, Λ: 0, Ǝ: 0 },
    }
  } catch {
    return null
  }
}

export default function ResultClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [detail, setDetail] = useState<DiagnoseDetail | null>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    async function run() {
      try {
        setError(null)
        setLoading(true)

        const raw =
          typeof window !== "undefined"
            ? sessionStorage.getItem("profile_pending")
            : null
        if (!raw) throw new Error("no_profile_pending")

        const pending = JSON.parse(raw) as Pending

        const resp = await fetch("/api/profile/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending),
          cache: "no-store",
        })
        const json = (await resp.json()) as DiagnoseResp
        if (!("ok" in json) || !json.ok) {
          throw new Error((json as any)?.error || "diagnose_failed")
        }

        const ls = (json.result.luneaLines ?? []).filter(Boolean)
        setLines(ls)
        setDetail(json.result.detail ?? null)
        setStep(initialStep(ls.length))

        // ▼ 保存（プロフィール＋基礎層）を1行で
        const quick = getQuickBase()
        setSaving(true)
        const saveRes = await fetch("/api/profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: null, // 認証導入後に置換
            fortune: json.result.detail?.fortune ?? null,
            personality: json.result.detail?.personality ?? null,
            partner: json.result.detail?.partner ?? null,
            ...(quick ?? {}), // base_model / base_order / base_points
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

  const next = () => setStep((s) => Math.min(lines.length, s + 1))
  const restart = () => setStep(initialStep(lines.length))
  const toProfile = () => router.push("/profile")
  const toMyPage = () => router.push("/mypage")

  // 仮タイトル（後でスコア連動へ差し替え）
  const resultTitle = "結果：E が高め"
  const { mainLine, quote } = chooseCardTexts(lines)

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="sr-only">プロフィール診断結果</h1>

      {/* 上部：ルネアの吹き出し（段階表示） */}
      <div className="space-y-4">
        {loading && (
          <div className="text-white/70">
            …観測中。きみの“いま”を読み解いているよ。
          </div>
        )}
        {error && (
          <div className="space-y-3">
            <div className="text-sm text-red-300">エラー : {error}</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded border border-white/20 hover:bg-white/10"
                onClick={() => {
                  if (typeof window !== "undefined") window.location.reload()
                }}
              >
                再試行
              </button>
              <button
                className="px-3 py-2 rounded border border-white/20 hover:bg-white/10"
                onClick={toProfile}
              >
                入力へ戻る
              </button>
            </div>
          </div>
        )}
        {!loading && !error && (
          <>
            {lines.slice(0, step).map((t, i) => (
              <LuneaBubble key={i} text={t} speed={32} />
            ))}

            {step < lines.length && (
              <div className="pt-1">
                <GlowButton size="sm" variant="primary" onClick={next} disabled={saving}>
                  次へ
                </GlowButton>
              </div>
            )}
          </>
        )}
      </div>

      {/* 下部：デモ調の“結果カード” */}
      {!loading && !error && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[inset_0_0_12px_rgba(255,255,255,.04),0_0_0_1px_rgba(255,255,255,.03)]">
          <div className="text-cyan-300 font-semibold mb-2">
            {resultTitle} {saving && <span className="text-white/60 text-xs ml-2">保存中…</span>}
          </div>

          {detail ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-white/80 text-sm mb-1">総合運勢</h3>
                <p className="text-white/90 leading-relaxed text-[15px]">
                  {detail.fortune || "—"}
                </p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-white/80 text-sm mb-1">性格傾向</h3>
                <p className="text-white/90 leading-relaxed text-[15px]">
                  {detail.personality || "—"}
                </p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-white/80 text-sm mb-1">仕事運</h3>
                <p className="text-white/90 leading-relaxed text-[15px]">
                  {detail.work || "—"}
                </p>
              </article>
              <article className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-white/80 text-sm mb-1">理想のパートナー像</h3>
                <p className="text-white/90 leading-relaxed text-[15px]">
                  {detail.partner || "—"}
                </p>
              </article>
            </div>
          ) : (
            <>
              <p className="text-white/90 leading-relaxed mb-2">
                {mainLine || FALLBACK_MAIN}
              </p>
              {quote && (
                <p className="text-white/60 italic text-sm">「{quote}」</p>
              )}
            </>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={restart}
              className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
              disabled={saving}
            >
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
