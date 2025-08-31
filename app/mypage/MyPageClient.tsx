// app/mypage/MyPageClient.tsx
"use client"

import { useEffect, useState } from "react"

type ProfileItem = {
  fortune: string
  personality: string
  partner: string
  created_at: string
}

type DailyItem = {
  code: string
  comment: string
  quote: string
  created_at: string
}

export default function MyPageClient() {
  const [profile, setProfile] = useState<ProfileItem | null>(null)
  const [daily, setDaily] = useState<DailyItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const p = await fetch("/api/mypage/profile-latest").then(r => r.json())
        if (p.ok) setProfile(p.item)

        const d = await fetch("/api/mypage/daily-latest").then(r => r.json())
        if (d.ok) setDaily(d.item)
      } catch (e: any) {
        setError(e.message)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Page</h1>
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold text-lg mb-2">最新プロフィール診断</h2>
        {profile ? (
          <div className="text-sm leading-relaxed">
            <p><strong>運勢:</strong> {profile.fortune}</p>
            <p><strong>性格:</strong> {profile.personality}</p>
            <p><strong>理想の相手:</strong> {profile.partner}</p>
            <p className="text-gray-400 text-xs mt-1">{new Date(profile.created_at).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">まだ診断結果がありません。</p>
        )}
      </div>

      <div className="p-4 rounded-2xl shadow bg-white">
        <h2 className="font-semibold text-lg mb-2">最新デイリー診断</h2>
        {daily ? (
          <div className="text-sm leading-relaxed">
            <p><strong>タイプ:</strong> {daily.code}</p>
            <p><strong>コメント:</strong> {daily.comment}</p>
            <p><strong>格言:</strong> {daily.quote}</p>
            <p className="text-gray-400 text-xs mt-1">{new Date(daily.created_at).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">まだ診断結果がありません。</p>
        )}
      </div>
    </div>
  )
}
