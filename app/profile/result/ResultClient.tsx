// app/profile/result/ResultClient.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Profile = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string
}

const dash = '—'

export default function ResultClient() {
  const sp = useSearchParams()
  const router = useRouter()

  // URLから取得
  const urlProfile: Profile = useMemo(() => ({
    name: sp.get('name') || dash,
    birthday: sp.get('birthday') || dash,
    blood: sp.get('blood') || dash,
    gender: sp.get('gender') || dash,
    preference: sp.get('preference') || dash,
  }), [sp])

  // 予備: sessionStorage から復元（直リンク対策）
  const [stored, setStored] = useState<Profile | null>(null)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('profile:last')
      if (raw) setStored(JSON.parse(raw))
    } catch {}
  }, [])

  const p = ((): Profile => {
    const allDash = Object.values(urlProfile).every(v => v === dash)
    return allDash && stored ? stored : urlProfile
  })()

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="w-full p-4 flex justify-center">
        <img src="/evae-logo.svg" alt="EVΛƎ" className="h-8" />
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="bg-neutral-900/70 rounded-xl p-6 shadow-lg border border-white/10 w-full max-w-md">
          <h2 className="text-center text-lg font-bold mb-2">プロフィール保存完了</h2>
          <p className="text-center text-white/60 text-sm mb-4">以下の内容で保存しました。</p>

          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>NAME</span><span>{p.name}</span></li>
            <li className="flex justify-between"><span>DATE OF BIRTH</span><span>{p.birthday}</span></li>
            <li className="flex justify-between"><span>BLOOD TYPE</span><span>{p.blood}</span></li>
            <li className="flex justify-between"><span>GENDER</span><span>{p.gender}</span></li>
            <li className="flex justify-between"><span>PREFERENCE</span><span>{p.preference || dash}</span></li>
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
            >
              修正する
            </button>
            <button
              onClick={() => router.push('/structure')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 hover:opacity-90 transition"
            >
              次へ（構造診断）
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
