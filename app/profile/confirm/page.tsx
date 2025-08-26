'use client'

import { useSearchParams, useRouter } from 'next/navigation'
export const dynamic = 'force-dynamic'     // ← 追加

export default function ConfirmPage() {
  const sp = useSearchParams()
  const router = useRouter()

  const name = sp.get('name') || '—'
  const birthday = sp.get('birthday') || '—'
  const blood = sp.get('blood') || '—'
  const gender = sp.get('gender') || '—'
  const preference = sp.get('preference') || '—'

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* header */}
      <header className="w-full p-4 flex justify-center">
        <img src="/evae-logo.svg" alt="EVΛƎ" className="h-8" />
      </header>

      {/* main */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="bg-neutral-900/70 rounded-xl p-6 shadow-lg border border-white/10 w-full max-w-md">
          <h2 className="text-center text-lg font-bold mb-4">入力確認</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>NAME</span><span>{name}</span></li>
            <li className="flex justify-between"><span>DATE OF BIRTH</span><span>{birthday}</span></li>
            <li className="flex justify-between"><span>BLOOD TYPE</span><span>{blood}</span></li>
            <li className="flex justify-between"><span>GENDER</span><span>{gender}</span></li>
            <li className="flex justify-between"><span>PREFERENCE</span><span>{preference}</span></li>
          </ul>
          <div className="mt-6 flex justify-between">
            <button onClick={() => router.back()} className="px-4 py-2 rounded-lg bg-neutral-800">戻る</button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500">送信</button>
          </div>
        </div>
      </main>

      {/* footer */}
      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
