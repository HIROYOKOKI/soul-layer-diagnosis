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

type ApiOk<T> = { ok: true; item: T | null }
type ApiErr   = { ok: false; error: string }
type ApiResp<T> = ApiOk<T> | ApiErr

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
        if (!id) {
          setError("Invalid link")
          setLoading(false)
          return
        }
        const res = await fetch(`/api/profile/diagnose?id=${encodeURIComponent(id)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as ApiResp<Profile>

        if ("ok" in json && json.ok) {
          setProfile(json.item ?? null)
        } else if ("error" in json) {
          setError(json.error)
        } else {
          setError("unexpected_response")
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    fetchById()
  }, [id])

  if (loading) return <p>Loading...</p>
  if (error)   return <p className="text-red-500">Error: {error}</p>

  return (
    <div className="p-6">
      {/* TODO: 吹き出しUIに差し替え可 */}
      <pre className="text-sm leading-relaxed whitespace-pre-wrap">
        {JSON.stringify(profile, null, 2)}
      </pre>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => router.push("/profile")}
          className="px-4 py-2 rounded bg-black text-white"
        >
          最初から
        </button>
        <button
          onClick={() => router.push("/mypage")}
          className="px-4 py-2 rounded bg-neutral-800 text-white"
        >
          MyPageへ
        </button>
      </div>
    </div>
  )
}
