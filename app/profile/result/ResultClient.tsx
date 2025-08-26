// app/profile/result/ResultClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type Profile = {
  id: string
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string | null
  created_at?: string
}

export default function ResultClient() {
  const sp = useSearchParams()
  const id = sp.get('id')
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchById() {
      try {
        if (!id) {
          setError('Invalid link')
          return
        }
        const res = await fetch(`/api/profile/${id}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch profile')
        setProfile(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchById()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="w-full p-4 flex justify-center">
        <img src="/evae-logo.svg" alt="EVΛƎ" className="h-8" />
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="bg-neutral-900/70 rounded-xl p-6 shadow-lg border border-white/10 w-full max-w-md">
          <h2 className="text-center text-lg font-bold mb-4">保存完了</h2>

          {profile ? (
            <>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>NAME</span><span>{profile.name}</span>
                </li>
                <li className="flex justify-between">
                  <span>DATE OF BIRTH</span><span>{profile.birthday}</span>
                </li>
                <li className="flex justify-between">
                  <span>BLOOD TYPE</span><span>{profile.blood}</span>
                </li>
                <li className="flex justify-between">
                  <span>GENDER</span><span>{profile.gender}</span>
                </li>
                <li className="flex justify-between">
                  <span>PREFERENCE</span><span>{profile.preference ?? '—'}</span>
                </li>
              </ul>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/structure/quick')}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 hover:opacity-90 transition"
                >
                  クイック判定へ
                </button>
                <button
                  onClick={() => router.push('/structure')}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
                >
                  構造診断へ
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400">データがありません</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
