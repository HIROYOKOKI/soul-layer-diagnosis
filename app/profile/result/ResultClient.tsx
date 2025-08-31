// app/profile/result/ResultClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Line = { type: string; label: string; text: string }

export default function ResultClient() {
  const router = useRouter()
  const [lines, setLines] = useState<Line[] | null>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // セッションキー両対応
    const raw =
      sessionStorage.getItem("profile_result_luneaLines") ??
      sessionStorage.getItem("lunea_profile_result")
    if (raw) {
      try {
        setLines(JSON.parse(raw) as Line[])
      } catch {
        setLines(null)
      }
    }
  }, [])

  if (!lines || lines.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold tracking-wide">診断結果</h1>
        <p className="mt-3 text-sm opacity-70">
          直前の診断結果が見つかりませんでした。もう一度診断してください。
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => router.push("/profile")}
            className="px-5 py-2 rounded-2xl bg-black text-white"
          >
            プロフィールへ戻る
          </button>
        </div>
      </div>
    )
  }

  const visible = lines.slice(0, step + 1)

  return (
    <div className="max-w-2xl mx-auto p-6 grid gap-4">
      <h1 className="text-lg font-bold">プロフィール診断結果</h1>

      {visible.map((l, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 border border-white/10 bg-white/5 space-y-1"
        >
          <div className="text-[11px] uppercase tracking-wide opacity-60">
            {l.label}
          </div>
          <div className="leading-relaxed">{l.text || "—"}</div>
        </div>
      ))}

      {step < lines.length - 1 ? (
        <button
          onClick={() => setStep((s) => s + 1)}
          className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
        >
          次へ
        </button>
      ) : (
        <div className="flex gap-3">
          <a
            href="/mypage"
            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 w-max"
          >
            MyPageへ
          </a>
          <button
            onClick={() => router.push("/profile")}
            className="px-4 py-2 rounded-2xl bg-black text-white"
          >
            最初からやり直す
          </button>
        </div>
      )}
    </div>
  )
}
