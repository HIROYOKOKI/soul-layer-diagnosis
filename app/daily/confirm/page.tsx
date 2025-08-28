'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/app/components/AppHeader'
import AppSubHeaderTheme from '@/app/components/AppSubHeaderTheme'
import type { StructureCode } from '@/app/_data/characters/lunea'

type Choice = { code: StructureCode; label: string; hint?: string }
type Pending = { sel: Choice }

export default function DailyConfirmPage() {
  const router = useRouter()
  const [data, setData] = useState<Pending | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('daily_pending')
      if (raw) setData(JSON.parse(raw) as Pending)
    } catch { setData(null) }
  }, [])

  const onBack = () => router.push('/daily/question')
  const onDiagnose = () => router.push('/daily/result') // ← 保存せず、結果ページへ

  return (
    <>
      <AppHeader />
      <AppSubHeaderTheme />

      <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <header className="mb-4">
          <h1 className="h1">確認</h1>
          <p className="sub mt-1">この内容で診断します</p>
        </header>

        {!data ? (
          <p className="text-white/70">選択が見つかりません。最初からやり直してください。</p>
        ) : (
          // 枠は軽め：モバイル前提なので外枠カードは使わずコンパクトに
          <div className="rounded-xl p-4 mb-6 border border-white/10">
            <p className="text-sm">選んだ回答</p>
            <p className="text-2xl font-extrabold tracking-tight mt-1">{data.sel.code}</p>
            <p className="text-xs text-white/60 mt-1">
              {data.sel.label}{data.sel.hint ? ` — ${data.sel.hint}` : ''}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="btn h-12 px-6 rounded-2xl border border-white/20"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={onDiagnose}
            disabled={!data}
            className="btn h-12 px-6 rounded-2xl font-semibold border border-white/10 bg-black/50 glow-shadow-blue"
          >
            診断する
          </button>
        </div>
      </main>
    </>
  )
}
