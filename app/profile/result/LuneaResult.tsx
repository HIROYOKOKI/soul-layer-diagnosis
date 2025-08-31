// app/profile/result/LuneaResult.tsx
"use client"

import { useEffect, useRef, useState } from "react"

type Speed = "slow" | "normal" | "fast"

const SPEED_MS: Record<Speed, number> = {
  slow: 28,     // 遅い
  normal: 18,   // 普通（推奨）
  fast: 10,     // 速い
}

const SEGMENT_LABELS = ["観測", "運勢", "性格", "理想", "余韻"] as const

export default function LuneaResult({ lines }: { lines: string[] }) {
  const [idx, setIdx] = useState(0)                // 何行目か
  const [shown, setShown] = useState("")           // 表示中の文字
  const [typing, setTyping] = useState(true)       // タイピング中か
  const [speed, setSpeed] = useState<Speed>(() => {
    if (typeof window === "undefined") return "normal"
    const saved = window.localStorage.getItem("lunea_speed") as Speed | null
    return saved ?? "normal"
  })

  const timer = useRef<number | null>(null)

  // ユーザーが「簡易表示」を好む場合は全文表示（アクセシビリティ配慮）
  const prefersReduced = typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // 1行ずつタイプライター
  useEffect(() => {
    if (!lines.length) return
    const text = lines[idx] ?? ""
    setShown(prefersReduced ? text : "")
    setTyping(!prefersReduced)

    if (prefersReduced) return

    let i = 0
    timer.current = window.setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) {
        if (timer.current) window.clearInterval(timer.current)
        setTyping(false)
      }
    }, SPEED_MS[speed])

    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
    // speed 変更or idx 変更で再実行
  }, [idx, lines, speed, prefersReduced])

  const isLast = idx >= lines.length - 1

  const next = () => {
    if (typing) {
      // タイピング中なら全文表示でスキップ
      if (timer.current) window.clearInterval(timer.current)
      setShown(lines[idx] ?? "")
      setTyping(false)
      return
    }
    if (!isLast) setIdx(idx + 1)
  }

  const restart = () => {
    if (timer.current) window.clearInterval(timer.current)
    setIdx(0)
    setShown("")
    setTyping(true)
  }

  const onSpeedChange = (v: Speed) => {
    setSpeed(v)
    try { window.localStorage.setItem("lunea_speed", v) } catch {}
  }

  // キーボード操作：Enter/Space=次へ, S=スキップ, R=最初から
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === "enter" || k === " ") { e.preventDefault(); next() }
      if (k === "s") { e.preventDefault(); if (typing) next() }
      if (k === "r") { e.preventDefault(); restart() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [typing, idx, lines])

  // 小ラベル（最大5種類）。不足分は「メッセージ n」
  const label = (i: number) =>
    SEGMENT_LABELS[i as 0|1|2|3|4] ?? `メッセージ ${i + 1}`

  return (
    <div className="space-y-4">
      {/* ヘッダー：アイコン＋タイトル＋速度切替 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 grid place-items-center text-white font-semibold">L</div>
          <div className="leading-tight">
            <div className="text-sm text-gray-500">LUNEA</div>
            <div className="text-base font-semibold tracking-wide">診断ガイダンス</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-gray-500 mr-1">速度</span>
          {(["slow","normal","fast"] as Speed[]).map(v => (
            <button
              key={v}
              onClick={() => onSpeedChange(v)}
              className={`px-2 py-1 rounded-full border transition
                ${speed===v ? "border-black bg-black text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              aria-pressed={speed===v}
            >
              {v==="slow"?"遅い":v==="normal"?"普通":"速い"}
            </button>
          ))}
        </div>
      </div>

      {/* ラベル */}
      <div className="text-xs text-gray-500 tracking-wide">{label(idx)}</div>

      {/* 吹き出し */}
      <div
        className="max-w-[760px] rounded-2xl bg-white p-5 shadow leading-8 tracking-[0.02em] text-[15px] border border-black/10"
        aria-live="polite"
      >
        {shown}
      </div>

      {/* 進捗ドット */}
      <div className="flex items-center gap-2">
        {lines.map((_, i) => (
          <span
            key={i}
            className={`inline-block rounded-full transition-all
              ${i===idx ? "w-3 h-3 bg-black" : "w-2 h-2 bg-gray-300"}`}
            aria-label={`進捗 ${i+1}/${lines.length}`}
          />
        ))}
      </div>

      {/* 操作ボタン */}
      <div className="flex flex-wrap gap-3">
        {!isLast ? (
          <button
            onClick={next}
            className="px-5 py-2 rounded-2xl bg-black text-white"
          >
            {typing ? "スキップ" : "次へ"}
          </button>
        ) : (
          <button
            onClick={restart}
            className="px-5 py-2 rounded-2xl bg-neutral-800 text-white"
          >
            最初から
          </button>
        )}

        <CopyAllButton lines={lines} />
      </div>
    </div>
  )
}

/** 全文コピー（luneaLinesを1クリックで） */
function CopyAllButton({ lines }: { lines: string[] }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(lines.join("\n"))
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        } catch {}
      }}
      className={`px-4 py-2 rounded-2xl border ${ok ? "border-emerald-500 text-emerald-600" : "border-gray-300 text-gray-700 hover:bg-gray-100"}`}
    >
      {ok ? "コピーしました" : "全文コピー"}
    </button>
  )
}
