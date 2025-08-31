// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProfileDiagnose, type ProfilePayload } from "../_hooks/useProfileDiagnose"

export default function ConfirmClient() {
  const diagnose = useProfileDiagnose()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(payload: ProfilePayload) {
    try {
      setLoading(true)
      setError(null)
      const res = await diagnose(payload) // { luneaLines: string[] }
      // 受け渡し
      sessionStorage.setItem("profile_result_luneaLines", JSON.stringify(res.luneaLines))
      router.push("/profile/result")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

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
    </div>
  )
}
