// app/daily/confirm/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  luneaSpeech,
  getLuneaMode,
  type StructureCode,
} from '@/app/_data/characters/lunea'

type Choice = { code: StructureCode; label: string; hint?: string }
type Pending = { sel: Choice }

export default function DailyConfirmPage() {
  const router = useRouter()
  const [data, setData] = useState<Pending | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // pendingを復元
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('daily_pending')
      if (raw) setData(JSON.parse(raw) as Pending)
    } catch {
      setData(null)
    }
  }, [])

  const onBack = () => router.push('/daily/question')

  const onSave = async () => {
    if (!data) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/daily/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.sel.code,
          navigator: 'lunea',
          mode: getLuneaMode(),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      sessionStorage.removeItem('daily_pending')
      router.push('/mypage')
    } catch (err: any) {
      console.error(err)
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
      <header className="mb-4">
        <h1 className="h1">確認</h1>
        <p className="sub mt-1">この内容で保存します</p>
      </header>

      {!data ? (
        <p className="text-white/70">選択が見つかりません。最初からやり直してください。</p>
      ) : (
        <section className="glass rounded-xl p-4 mb-5 border border-white/10">
          <p className="text-sm">コード</p>
          <p className="text-2xl font-extrabold tracking-tight mt-1">{data.sel.code}</p>
          <p className="text-xs text-white/60 mt-1">
            {data.sel.label} — {data.sel.hint}
          </p>

          {/* ✅ ルネアのセリフ（励まし＋名言） */}
          <div className="mt-4 whitespace-pre-line text-sm text-white/80">
            {luneaSpeech('afterResult', data.sel.code)}
          </div>
        </section>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-ghost h-12 px-6 rounded-2xl border border-white/20"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !data}
          className="btn btn-pink glow-shadow-pink h-12 px-6 rounded-2xl font-semibold"
        >
          {saving ? '保存中…' : '保存して進む'}
        </button>
      </div>
    </main>
  )
}
