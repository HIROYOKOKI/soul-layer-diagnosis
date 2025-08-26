'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const name = searchParams.get('name') || '—'
  const birthday = searchParams.get('birthday') || '—'
  const blood = searchParams.get('blood') || '—'
  const gender = searchParams.get('gender') || '—'
  const preference = searchParams.get('preference') || '—'

  const handleBack = () => router.back()
  const handleSubmit = () => {
    alert('送信しました！')
    // TODO: 保存処理
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* ===== ヘッダー ===== */}
      <header className="w-full p-4 flex justify-center items-center">
        <img src="/evae-logo.svg" alt="EVΛƎ" className="h-8" />
      </header>

      {/* ===== メイン内容 ===== */}
      <main className="flex flex-1 items-center justify-center">
        <div className="bg-neutral-900/70 rounded-xl p-6 shadow-lg border border-white/10 w-[400px]">
          <h2 className="text-center text-lg font-bold mb-4">入力確認</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>NAME</span><span>{name}</span></li>
            <li className="flex justify-between"><span>DATE OF BIRTH</span><span>{birthday}</span></li>
            <li className="flex justify-between"><span>BLOOD TYPE</span><span>{blood}</span></li>
            <li className="flex justify-between"><span>GENDER</span><span>{gender}</span></li>
            <li className="flex justify-between"><span>PREFERENCE</span><span>{preference}</span></li>
          </ul>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-lg bg-neutral-800"
            >
              戻る
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500"
            >
              送信
            </button>
          </div>
        </div>
      </main>

      {/* ===== フッター ===== */}
      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
