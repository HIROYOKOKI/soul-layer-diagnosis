// app/profile/result/LuneaResult.tsx
'use client'
import { useState } from 'react'

type Line = { type: string; label: string; text: string }
export default function LuneaResult({ lines }: { lines: Line[] }) {
  const [step, setStep] = useState(0)
  const visible = lines.slice(0, step + 1)
  return (
    <div className="space-y-3">
      {visible.map((l, i) => (
        <div key={i} className="rounded-2xl p-3 border border-white/10 bg-white/5">
          <div className="text-xs opacity-60">{l.label}</div>
          <div className="mt-1">{l.text}</div>
        </div>
      ))}
      {step < lines.length - 1 ? (
        <button onClick={() => setStep(s => s + 1)}
          className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">
          次へ
        </button>
      ) : (
        <div className="flex gap-2">
          <a href="/mypage" className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">マイページへ</a>
        </div>
      )}
    </div>
  )
}
