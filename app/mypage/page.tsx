'use client'

import { useEffect, useState } from "react"
import Image from "next/image"

type ProfileBlock = { fortune:string; personality:string; partner:string; created_at:string }
type DailyBlock = { code:string; comment:string; quote:string; created_at:string }

export default function MyPage() {
  const [me,setMe] = useState<any>(null)
  const [profile,setProfile] = useState<ProfileBlock|null>(null)
  const [daily,setDaily] = useState<DailyBlock|null>(null)

  useEffect(() => {
    (async () => {
      const m = await fetch("/api/me").then(r=>r.json())
      setMe(m.user)

      const pr = await fetch("/api/mypage/profile-latest")
        .then(r=>r.json())
        .catch(() => null)
      if (pr?.ok) setProfile(pr.item)

      const dr = await fetch("/api/mypage/daily-latest")
        .then(r=>r.json())
        .catch(() => null)
      if (dr?.ok) setDaily(dr.item)
    })()
  },[])

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Image
          src={me?.avatarUrl ?? "/lunea.png"}
          alt="Lunea"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <div className="text-sm text-white/60">{me?.plan?.toUpperCase()}</div>
          <h1 className="text-xl font-bold">{me?.name}</h1>
        </div>
      </header>

      <section className="p-4 rounded-2xl border border-white/10">
        <h2 className="font-semibold mb-2">最新プロフィール診断</h2>
        {profile ? (
          <ul className="text-sm space-y-1">
            <li>総合運勢：{profile.fortune}</li>
            <li>性格傾向：{profile.personality}</li>
            <li>理想のパートナー：{profile.partner}</li>
          </ul>
        ) : <p className="text-white/60 text-sm">まだ診断がありません。</p>}
      </section>

      <section className="p-4 rounded-2xl border border-white/10">
        <h2 className="font-semibold mb-2">今日のルネア</h2>
        {daily ? (
          <div className="text-sm space-y-1">
            <div>構造コード：{daily.code}</div>
            <div className="opacity-80">「{daily.comment}」</div>
            <div className="opacity-60">{daily.quote}</div>
          </div>
        ) : <p className="text-white/60 text-sm">まだ記録がありません。</p>}
      </section>
    </div>
  )
}
