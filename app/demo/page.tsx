// app/demo/page.tsx
"use client"

import { useState, useEffect } from "react"

type Line = { label: string; text: string }

// タイプライターフック
function useTypewriter(text: string, speed = 40) {
  const [display, setDisplay] = useState("")
  useEffect(() => {
    setDisplay("")
    let i = 0
    const timer = setInterval(() => {
      setDisplay((prev) => prev + (text[i] ?? ""))
      i++
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])
  return display
}

export default function DemoPage() {
  const [lines, setLines] = useState<Line[] | null>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  async function runDemo() {
    setLoading(true); setStep(0)
    try {
      const res = await fetch("/api/profile/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name:"Hiro", birthday:"1985-05-05", blood:"A", gender:"Male", theme:"dev" }),
        cache:"no-store",
      })
      const j = await res.json()
      if (!j.ok) throw new Error("api_failed")
      setLines(j.result.luneaLines)
    } catch {
      // フォールバック
      setLines([
        { label:"観測", text:"今日は観測が強い日。静かに全体像を見るほど、答えは輪郭を表す。" },
        { label:"運勢", text:"焦らず一歩ずつ。昨日の選択が今日の追い風になっている。" },
        { label:"性格", text:"あなたの核はやさしさと粘り強さ。小さな配慮が場を変える。" },
        { label:"理想", text:"『丁寧さ』と『スピード』の両立。今日は“手放す”勇気も選択肢。" },
        { label:"締め", text:"観測→選択→行動。波を起こすのは、あなたの一呼吸。" },
      ])
    } finally { setLoading(false) }
  }

  const visible = lines ? lines.slice(0, step + 1) : []

  return (
    <main className="min-h-[100dvh] bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4">ルネア診断デモ</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runDemo}
          disabled={loading}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold"
        >
          {loading ? "診断中…" : "診断を生成"}
        </button>
        {lines && (
          <button
            onClick={() => { setLines(null); setStep(0) }}
            className="px-6 py-2 rounded-full border border-white/30"
          >
            リセット
          </button>
        )}
      </div>

      {lines && (
        <section className="space-y-4">
          {visible.map((l, i) => {
            const typed = i === step ? useTypewriter(l.text, 40) : l.text
            return (
              <div key={i} className="p-4 border border-white/20 rounded-2xl bg-white/5">
                <div className="text-xs opacity-60">{l.label}</div>
                <div className="mt-1">{typed}</div>
              </div>
            )
          })}
          <div className="flex gap-4 mt-4">
            {step < (lines.length - 1) ? (
              <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 border border-white/20 rounded-xl">次へ</button>
            ) : (
              <a href="/mypage" className="px-4 py-2 border border-white/20 rounded-xl">MyPageへ</a>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
