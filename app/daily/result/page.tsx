'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSubHeaderTheme from '@/app/components/AppSubHeaderTheme'
import {
  getLuneaMode,
  type StructureCode,
} from '@/app/_data/characters/lunea'

type Choice = { code: StructureCode; label: string; hint?: string }
type Pending = { sel: Choice }

type DiagnoseResponse = {
  comment: string
  advice: string
  quote: string
}

export default function DailyResultPage() {
  const router = useRouter()
  const [data, setData] = useState<Pending | null>(null)
  const [diag, setDiag] = useState<DiagnoseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // pending 復元 → 診断API
  useEffect(() => {
    let aborted = false
    const run = async () => {
      try {
        const raw = sessionStorage.getItem('daily_pending')
        if (!raw) { setData(null); setLoading(false); return }
        const p = JSON.parse(raw) as Pending
        setData(p)

        // 既存の /api/daily/diagnose を想定（なければ FALLBACK に書き換え）
        const res = await fetch('/api/daily/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: p.sel.code,
            mode: getLuneaMode(),
          }),
        })
        if (!aborted) {
          if (res.ok) {
            const d = (await res.json()) as DiagnoseResponse
            setDiag(d)
          } else {
            // フォールバック（最小限）：API未実装でも崩れない
            setDiag({
              comment: '観測結果：今日は内なる可能性に光が当たっています。',
              advice: '小さな仮説を1つ立てて、30分だけ動いてみよう。',
              quote: '「想像力は知識よりも重要だ。」— アインシュタイン',
            })
          }
        }
      } catch (e: unknown) {
        if (!aborted) {
          setDiag({
            comment: '通信に問題がありましたが、仮の結果を表示しています。',
            advice: '焦らず、できる範囲で一歩だけ進めてみて。',
            quote: '「どこから来て、どこへ行くのか。」— カール・セーガン',
          })
        }
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    run()
    return () => { aborted = true }
  }, [])

  const onBack = () => router.push('/daily/confirm')

  const onSave = async () => {
    if (!data) return
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/daily/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.sel.code,
          navigator: 'lunea',
          mode: getLuneaMode(),
          meta: { label: data.sel.label, hint: data.sel.hint ?? null }, // 任意で保存
        }),
      })
      if (!res.ok) throw new Error(`save failed: ${res.status}`)
      sessionStorage.removeItem('daily_pending')
      router.push('/mypage')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'unknown'
      console.error('[daily/save] error:', msg)
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AppHeader />
      <AppSubHeaderTheme />

      <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <header className="mb-4">
          <h1 className="h1">診断結果</h1>
          <p className="sub mt-1">確認後に保存できます</p>
        </header>

        {!data ? (
          <p className="text-white/70">選択が見つかりません。最初からやり直してください。</p>
        ) : loading ? (
          <p className="text-white/70">診断中…</p>
        ) : (
          <>
            {/* 結果表示：枠は軽め */}
            <section className="rounded-xl p-4 mb-6 border border-white/10">
              <div className="text-sm">コード</div>
              <div className="text-2xl font-extrabold tracking-tight mt-1">{data.sel.code}</div>
              <div className="text-xs text-white/60 mt-1">
                {data.sel.label}{data.sel.hint ? ` — ${data.sel.hint}` : ''}
              </div>

              {diag && (
                <div className="mt-4 space-y-3 text-white/85">
                  <p>{diag.comment}</p>
                  <p className="text-white/80">💡 {diag.advice}</p>
                  <p className="text-white/70 text-sm">{diag.quote}</p>
                </div>
              )}
            </section>

            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

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
                onClick={onSave}
                disabled={saving}
                className="btn h-12 px-6 rounded-2xl font-semibold border border-white/10 bg-black/50 glow-shadow-pink"
              >
                {saving ? '保存中…' : '保存する'}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  )
}
