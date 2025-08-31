// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useState } from "react"
import { useProfileDiagnose, type ProfilePayload } from "../_hooks/useProfileDiagnose" // ← 修正

export default function ConfirmClient() {
  const diagnose = useProfileDiagnose()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ luneaLines: string[] } | null>(null)

  async function onSubmit(payload: ProfilePayload) {
    try {
      setLoading(true)
      setError(null)
      const r = await diagnose(payload)
      setResult(r)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // ここはHiroさんのUIに合わせて。例としてボタンだけ配置。
  return (
    <div className="p-6">
      <button
        onClick={() =>
          onSubmit({
            name: "Hiro",
            birthday: "1985-05-05",
            blood: "A",
            gender: "Male",
            preference: "Unset",
          })
        }
        className="px-4 py-2 rounded bg-black text-white"
        disabled={loading}
      >
        この内容で診断
      </button>

      {loading && <p className="mt-3">診断中…</p>}
      {error && <p className="mt-3 text-red-500">Error: {error}</p>}
      {result && (
        <div className="mt-4 space-y-2">
          {result.luneaLines.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed">● {line}</p>
          ))}
        </div>
      )}
    </div>
  )
}
