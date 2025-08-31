// app/profile/result/LuneaResult.tsx
"use client"

import { useEffect, useRef, useState } from "react"

export default function LuneaResult({ lines }: { lines: string[] }) {
  const [idx, setIdx] = useState(0)           // 何行目か
  const [shown, setShown] = useState("")      // 表示中の文字
  const [typing, setTyping] = useState(true)  // タイピング中か
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!lines.length) return
    setShown("")
    setTyping(true)
    const text = lines[idx] ?? ""
    let i = 0
    timer.current = window.setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) {
        if (timer.current) window.clearInterval(timer.current)
        setTyping(false)
      }
    }, 18) // 速度（ms/文字）: 好みで 14〜30
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [idx, lines])

  const next = () => {
    if (typing) {
      // タイピングスキップして全文表示
      if (timer.current) window.clearInterval(timer.current)
      setShown(lines[idx] ?? "")
      setTyping(false)
      return
    }
    if (idx < lines.length - 1) setIdx(idx + 1)
  }

  const restart = () => {
    setIdx(0)
    setShown("")
    setTyping(true)
  }

  const isLast = idx >= lines.length - 1

  return (
    <div className="space-y-4">
      {/* ルネア吹き出し */}
      <div className="max-w-[680px] rounded-2xl bg-white p-5 shadow leading-relaxed text-[15px]">
        {shown}
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-3">
        {!isLast ? (
          <button
            onClick={next}
            className="px-4 py-2 rounded-2xl bg-black text-white"
          >
            {typing ? "スキップ" : "次へ"}
          </button>
        ) : (
          <button
            onClick={restart}
            className="px-4 py-2 rounded-2xl bg-neutral-800 text-white"
          >
            最初から
          </button>
        )}
      </div>
    </div>
  )
}
