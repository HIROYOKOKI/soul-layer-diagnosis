'use client';
import Image from "next/image"
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

/* ====== 型と定数（any禁止） ====== */
const BLOODS = ['A', 'B', 'O', 'AB', 'Other'] as const;
const GENDERS = ['Male', 'Female', 'Other'] as const;
const PREFS = ['Unset', '男性', '女性', 'どちらも'] as const;

type Blood = typeof BLOODS[number];
type Gender = typeof GENDERS[number];
type Preference = typeof PREFS[number];

const isBlood = (v: string): v is Blood => (BLOODS as readonly string[]).includes(v);
const isGender = (v: string): v is Gender => (GENDERS as readonly string[]).includes(v);
const isPreference = (v: string): v is Preference => (PREFS as readonly string[]).includes(v);

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState(''); // ISO yyyy-mm-dd
  const [blood, setBlood] = useState<Blood>('A');
  const [gender, setGender] = useState<Gender>('Other');
  const [preference, setPreference] = useState<Preference>('Unset');

  const handleConfirm = (e: FormEvent) => {
    e.preventDefault();
    const pending = { name, birthday, blood, gender, preference };
    sessionStorage.setItem('profile_pending', JSON.stringify(pending));
    router.push('/profile/confirm');
  };

  // セレクトの安全な onChange
  const onBloodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (isBlood(v)) setBlood(v);
  };
  const onGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (isGender(v)) setGender(v);
  };
  const onPrefChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (isPreference(v)) setPreference(v);
  };

  return (
    <main className="min-h-[100dvh] relative text-white">
      {/* 背景（ヒーローと同系の控えめな光） */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_50%_0%,rgba(60,120,255,0.15),transparent)]" />
        <div className="absolute inset-x-0 bottom-[40%] h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
      </div>

      {/* ヘッダー（ロゴ） */}
      <header className="py-6">
        <div className="mx-auto max-w-5xl px-5 flex items-center">
          <Image
  src="/evae-logo.svg"
  alt="EVΛƎ"
  width={120}   // 適切な実寸に調整
  height={28}
  className="inline-block"
/>
        </div>
      </header>

      {/* コンテンツ（外枠カードなし） */}
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
                onChange={(e) => setName(e.target.value)}
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
                  onChange={(e) => setBirthday(e.target.value)}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs tracking-wide opacity-80">BLOOD TYPE</span>
                <select
                  value={blood}
                  onChange={onBloodChange}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                >
                  {BLOODS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* GENDER / PREFERENCE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="grid gap-2">
                <span className="text-xs tracking-wide opacity-80">GENDER</span>
                <select
                  value={gender}
                  onChange={onGenderChange}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs tracking-wide opacity-80">PREFERENCE</span>
                <select
                  value={preference}
                  onChange={onPrefChange}
                  className="h-12 w-full rounded-md bg-white/5 px-4 outline-none border border-white/10 focus:border-white/30"
                >
                  {PREFS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* 確認ボタン（グラデのみ） */}
            <button
              type="submit"
              className="mt-2 h-12 rounded-full bg-gradient-to-r from-sky-500 to-fuchsia-500 font-semibold tracking-wider hover:opacity-95 active:opacity-90"
            >
              確認
            </button>
          </form>

          <div className="mt-10 text-center text-[11px] tracking-[0.2em] opacity-60">
            † SOUL LAYER DIAGNOSIS
          </div>
        </div>
      </div>
    </main>
  );
}
