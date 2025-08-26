// app/profile/confirm/ConfirmClient.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ConfirmClient() {
  const sp = useSearchParams()
  const router = useRouter()

  // URL パラメータ
  const name = sp.get('name') || '—'
  const birthday = sp.get('birthday') || '—'
  const blood = sp.get('blood') || '—'
  const gender = sp.get('gender') || '—'
  const preference = sp.get('preference') || '—'

  // 直リンク対策（全部—なら入力へ）
  const allEmpty = useMemo(
    () => [name, birthday, blood, gender, preference].every(v => v === '—'),
    [name, birthday, blood, gender, preference]
  )
  useEffect(() => {
    if (allEmpty) router.replace('/profile')
  }, [allEmpty, router])

  // 送信制御
  const [submitting, setSubmitting] = useState(false)
  const isValid = useMemo(() => {
    return name !== '—' && birthday !== '—' && blood !== '—' && gender !== '—'
  }, [name, birthday, blood, gender])

  async function handleSubmit() {
    if (!isValid || submitting) return

    setSubmitting(true)
    try {
      const payload = { name, birthday, blood, gender, preference }
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('save failed')

      // 結果ページでそのまま表示できるようURLとsessionStorageに残す
      sessionStorage.setItem('profile:last', JSON.stringify(payload))
      const q = new URLSearchParams(payload as Record<string, string>).toString()
      router.push(`/profile/result?${q}`)
    } catch (_err) {
      alert('保存に失敗しました。通信環境をご確認ください。')
    } finally {
      setSubmitting(false)
    }
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
          <h2 className="text-center text-lg font-bold mb-4">入力確認</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>NAME</span><span>{name}</span></li>
            <li className="flex justify-between"><span>DATE OF BIRTH</span><span>{birthday}</span></li>
            <li className="flex justify-between"><span>BLOOD TYPE</span><span>{blood}</span></li>
            <li className="flex justify-between"><span>GENDER</span><span>{gender}</span></li>
            <li className="flex justify-between"><span>PREFERENCE</span><span>{preference}</span></li>
          </ul>

          <div className="mt-6 flex justify-between gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
            >
              戻る
            </button>

            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              aria-disabled={!isValid || submitting}
              className={`px-4 py-2 rounded-lg transition
                ${(!isValid || submitting)
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-pink-500 hover:opacity-90'}`}
            >
              {submitting ? '送信中…' : '送信'}
            </button>
          </div>

          {!isValid && (
            <p className="mt-3 text-xs text-red-400">
              必須項目（NAME / DATE OF BIRTH / BLOOD TYPE / GENDER）が未入力です。
            </p>
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
