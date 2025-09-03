// app/profile/result/ResultClient.tsx
"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LuneaBubble from "@/components/LuneaBubble"
// 既に GlowButton がある想定。無ければ一旦 <button> で代用してください
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
  work?: string         // 仕事運 80-100文字
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

// ---------- helpers (安全に取り出す) ----------
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

export default function ResultClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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
        setStep(initialStep(ls.length)) // まず 0〜2 行表示
      } catch (e: any) {
        setError(e?.message || "failed")
      } finally {
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
              <LuneaBubble key={i} text={t} speed={16} />
            ))}

            {step < lines.length && (
              <div className="pt-1">
                <GlowButton size="sm" variant="primary" onClick={next}>
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
          <div className="text-cyan-300 font-semibold mb-2">{resultTitle}</div>

          {/* detail があれば4ブロック、無ければフォールバック */}
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
            >
              もう一度
            </button>
            <GlowButton variant="primary" size="sm" onClick={toMyPage}>
              マイページへ
            </GlowButton>
          </div>
        </section>
      )}
    </div>
  )
}
