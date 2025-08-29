'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [blood, setBlood] = useState<'A'|'B'|'O'|'AB'|'Other'>('A')
  const [gender, setGender] = useState('Other')
  const [preference, setPreference] = useState('Unset')

  const handleConfirm = (e: FormEvent) => {
    e.preventDefault()
    const pending = { name, birthday, blood, gender, preference }
    sessionStorage.setItem('profile_pending', JSON.stringify(pending))
    router.push('/profile/confirm')
  }

  return (
    <main className="min-h-[100dvh] relative text-white">
      {/* 背景（ヒーローと同系の闇＋光筋） */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-x-0 top-0 h-[40%] bg-[radial-gradient(600px_400px_at_50%_0%,rgba(60,120,255,0.15),transparent)]" />
        <div className="absolute inset-x-0 bottom-[40%] h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
      </div>

      {/* ヘッダー（ロゴ） */}
      <header className="py-6">
        <div className="mx-auto max-w-5xl px-5 flex items-center">
          <img src="/evae-logo.svg" alt="EVΛƎ" className="h-6 opacity-90" />
        </div>
      </header>

      {/* コンテンツ：カードなし・フォームだけ */}
      <div className="mx-auto max-w-5xl px-5">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="mb-6 text-center text-2xl font-extrabold tracking-[0.15em] text-white/90">
            PROFILE
          </h1>

          <form onSubmit={handleConfirm} className="grid gap-5">
            {/* NAME */}
            <label className="grid gap-2">
              <span className="text-xs tracking-wide opacity-80">NAME</span>
              <input
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Your name"
                className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
              />
            </label>

            {/* DATE / BLOOD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="grid gap-2">
                <span className="text-xs tracking-wide opacity-80">DATE OF BIRTH</span>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e)=>setBirthday(e.target.value)}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs tracking-wide opacity-80">BLOOD TYPE</span>
                <select
                  value={blood}
                  onChange={(e)=>setBlood(e.target.value as any)}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="O">O</option>
                  <option value="AB">AB</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            {/* GENDER / PREFERENCE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="grid gap-2">
                <span className="text-xs tracking-wide opacity-80">GENDER</span>
                <select
                  value={gender}
                  onChange={(e)=>setGender(e.target.value)}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs tracking-wide opacity-80">PREFERENCE</span>
                <select
                  value={preference}
                  onChange={(e)=>setPreference(e.target.value)}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                >
                  <option value="Unset">Unset</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="どちらも">どちらも</option>
                </select>
              </label>
            </div>

            {/* 確認ボタン（グラデのみ・外枠なし） */}
            <button
              type="submit"
              className="mt-2 h-12 rounded-full bg-gradient-to-r from-sky-500 to-fuchsia-500 font-semibold tracking-wider hover:opacity-95 active:opacity-90"
            >
              確認
            </button>
          </form>

          {/* フッタラベル（薄く） */}
          <div className="mt-10 text-center text-[11px] tracking-[0.2em] opacity-60">
            † SOUL LAYER DIAGNOSIS
          </div>
        </div>
      </div>
    </main>
  )
}
