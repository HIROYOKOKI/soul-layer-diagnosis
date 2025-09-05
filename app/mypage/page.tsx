// app/mypage/page.tsx
'use client'
import { useEffect, useState } from 'react'

export default function MyPage() {
  const [profile, setProfile] = useState<any>(null)
  const [daily, setDaily] = useState<any>(null)

  useEffect(() => {
    fetch('/api/mypage/profile-latest').then(r=>r.json()).then(j=>setProfile(j.item ?? null))
    fetch('/api/mypage/daily-latest').then(r=>r.json()).then(j=>setDaily(j.item ?? null))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-5">マイページ</h1>

      <section className="mb-5 rounded-2xl border border-white/12 bg-white/5 p-4">
        <h2 className="text-sm font-bold mb-2">基礎層（クイック診断）</h2>
        {profile ? (
          <div className="text-sm">
            <div>型：<span className="font-semibold">{profile.base_model ?? '—'}</span></div>
            {Array.isArray(profile.base_order) && (
              <div className="mt-1 opacity-80 text-xs">順番：{profile.base_order.join(' → ')}</div>
            )}
          </div>
        ) : <div className="text-sm text-white/60">まだ結果がありません。</div>}
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
        <h2 className="text-sm font-bold mb-2">最新デイリー</h2>
        {daily ? (
          <div className="text-sm">
            <div>コード：<span className="font-semibold">{daily.code}</span></div>
            <p className="mt-1 text-white/80">{daily.comment}</p>
            {daily.quote && <p className="mt-2 text-xs text-white/60">“{daily.quote}”</p>}
          </div>
        ) : <div className="text-sm text-white/60">まだ記録がありません。</div>}
      </section>
    </div>
  )
}
