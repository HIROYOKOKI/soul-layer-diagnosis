// app/profile/result/ResultClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

type Profile = {
  id: string
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string | null
  created_at?: string
}

export default function ResultClient({ initialId }: { initialId?: string }) {
  const sp = useSearchParams()
  const router = useRouter()

  const id = initialId ?? sp.get("id") ?? undefined

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchById() {
      try {
        if (!id) { setError("Invalid link"); setLoading(false); return }
        const res = await fetch(`/api/profile/diagnose?id=${encodeURIComponent(id)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setProfile(json.item ?? null)
      } catch (e: any) {
        setError(e.message || "failed")
      } finally {
        setLoading(false)
      }
    }
    fetchById()
  }, [id])

  // onSubmit などルーティング操作もここで
  async function onSubmit(payload: any) {
    // ...処理...
    router.push("/mypage")
  }

  if (loading) return <p>Loading...</p>
  if (error)   return <p className="text-red-500">Error: {error}</p>

  return (
    <div className="p-6">
      {/* ここに結果UI */}
      <pre className="text-sm">{JSON.stringify(profile, null, 2)}</pre>
      <button onClick={() => router.push("/profile")} className="mt-4 px-4 py-2 rounded bg-black text-white">
        最初から
      </button>
    </div>
  )
}
