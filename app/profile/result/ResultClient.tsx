// app/profile/result/ResultClient.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type Result = {
  id: string
  name: string
  birthday: string
  blood: string
  gender: string
  preference: string | null
  fortune: string
  personality: string
  ideal_partner?: string | null   // APIにより項目名が違う場合の両対応
  partner?: string | null
  created_at: string
}

type Line = { type: 'opening' | 'fortune' | 'personality' | 'partner' | 'closing'; label: string; text: string }

export default function ResultClient() {
  const sp = useSearchParams()
  const id = sp.get('id')

  const [data, setData] = useState<Result | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)                   // 「次へ」で進む用
  const [mode, setMode] = useState<'bubble' | 'cards'>('bubble') // ルネア吹き出し or カード表示

  useEffect(() => {
    const run = async () => {
      try {
        if (!id) throw new Error('リンクが無効です')
        const res = await fetch(`/api/profile/get?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const j = await res.json()
        if (!j.ok) throw new Error(j.error || 'failed')
        setData(j.data as Result)
        setStep(0) // 新しいデータを取得したら最初の吹き出しから
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  const partnerText = useMemo(() => {
    if (!data) return ''
    return (data.ideal_partner ?? data.partner ?? '').toString()
  }, [data])

  const lines: Line[] = useMemo(() => {
    if (!data) return []
    const opening = '観測しました──あなたの魂の輪郭をお伝えします。'
    const closing = '──以上が今、この瞬間の観測結果です。必要なとき、また私を呼んでください。'
    return [
      { type: 'opening',     label: '観測',           text: opening },
      { type: 'fortune',     label: '総合運勢',       text: data.fortune },
      { type: 'personality', label: '性格傾向',       text: data.personality },
      { type: 'partner',     label: '理想のパートナー', text: partnerText },
      { type: 'closing',     label: '締め',           text: closing },
    ]
  }, [data, partnerText])

  const visible = lines.slice(0, step + 1)

  if (loading) return <div className="p-6 text-sm opacity-75">読み込み中…</div>
  if (err) return <div className="p-6 text-sm text-red-400">エラー：{err}</div>
  if (!data) return null

  return (
    <div className="mx-auto max-w-2xl p-4 grid gap-5">
      {/* ヘッダー */}
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">プロフィール診断結果</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode(m => (m === 'bubble' ? 'cards' : 'bubble'))}
            className="text-xs rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10"
            aria-label="表示モード切替"
          >
            {mode === 'bubble' ? 'カード表示に切替' : 'ルネア表示に戻す'}
          </button>
          <Link href="/profile" className="text-xs underline opacity-90">編集</Link>
        </div>
      </header>

      {/* ルネア吹き出し表示 */}
      {mode === 'bubble' && (
        <section className="grid gap-3">
          {visible.map((l, i) => (
            <div key={`${l.type}-${i}`} className="flex items-start gap-3">
              <Image
                src="/lunea.png"
                alt="Lunea"
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
              <div className="rounded-2xl p-3 border border-white/10 bg-white/5 flex-1">
                <div className="text-[11px] uppercase tracking-wide opacity-60">{l.label}</div>
                <div className="mt-1 leading-relaxed">{l.text || '—'}</div>
              </div>
            </div>
          ))}

          {step < lines.length - 1 ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setStep(s => Math.min(s + 1, lines.length - 1))}
                className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
              >
                次へ
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/mypage" className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">
                マイページへ
              </Link>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
              >
                最初から
              </button>
            </div>
          )}
        </section>
      )}

      {/* カード表示 */}
      {mode === 'cards' && (
        <section className="grid md:grid-cols-3 gap-3">
          <article className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold mb-2 text-sm">総合運勢</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.fortune || '—'}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold mb-2 text-sm">性格傾向</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.personality || '—'}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold mb-2 text-sm">理想のパートナー像</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{partnerText || '—'}</p>
          </article>
        </section>
      )}

      <footer className="text-xs opacity-70">
        保存日時：{formatJPDate(data.created_at)}
      </footer>
    </div>
  )
}

function formatJPDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
