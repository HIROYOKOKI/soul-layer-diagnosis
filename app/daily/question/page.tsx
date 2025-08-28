// app/daily/question/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/app/components/AppHeader'
import AppSubHeaderTheme from '@/app/components/AppSubHeaderTheme'
import { luneaSpeech, type StructureCode } from '@/app/_data/characters/lunea'

type Choice = { code: StructureCode; label: string; hint?: string }
type Pending = { sel: Choice }

const DEFAULT_CHOICES: Choice[] = [
  { code: 'E', label: '勢いで踏み出す', hint: '衝動・情熱' },
  { code: 'V', label: '可能性を広げる', hint: '夢・直感' },
  { code: 'Λ', label: '一度立ち止まり選ぶ', hint: '選択・臨界' },
  { code: 'Ǝ', label: '観測し整える', hint: '静けさ・記憶' },
]

export default function DailyQuestionPage() {
  const router = useRouter()
  const [question, setQuestion] = useState('今日のあなたに一番近いのは？')
  const [choices, setChoices] = useState<Choice[]>([])
  const [sel, setSel] = useState<Choice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const pending = sessionStorage.getItem('daily_pending')
        if (pending) {
          try { const p = JSON.parse(pending) as Pending; if (p?.sel) setSel(p.sel) } catch {}
        }
        const res = await fetch('/api/daily/question', { method: 'GET' })
        if (!ignore && res.ok) {
          const data = await res.json().catch(() => null)
          if (data?.choices?.length) {
            setQuestion(data.question ?? question)
            setChoices(data.choices as Choice[])
          } else {
            setChoices(DEFAULT_CHOICES)
          }
        } else {
          setChoices(DEFAULT_CHOICES)
        }
      } catch {
        setChoices(DEFAULT_CHOICES)
        setError('ネットワークエラーによりローカル問題を使用します')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onProceed = () => {
    if (!sel) { alert('どれか1つ選んでください'); return }
    const data: Pending = { sel }
    sessionStorage.setItem('daily_pending', JSON.stringify(data))
    router.push('/daily/confirm')
  }

  return (
    <>
      <AppHeader />
      <AppSubHeaderTheme />

      {/* ▼ 外枠カードを排除：素のコンテナでシンプルに */}
      <main className="mx-auto w-full max-w-screen-sm px-4 py-8">
        <header className="mb-4">
          <h1 className="h1">デイリー診断</h1>
          <p className="sub mt-1">{luneaSpeech('beforeQuestion')}</p>
        </header>

        {/* 質問文（枠なし） */}
        <h2 className="h2">{question}</h2>
        {error && <p className="text-xs text-white/60 mt-1">{error}</p>}

        {/* 選択肢：各ボタンのみガラス感を維持（外枠カードはなし） */}
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          {(loading ? DEFAULT_CHOICES : choices).map((c) => (
            <button
              key={c.code}
              onClick={() => setSel(c)}
              className="glass rounded-xl p-4 text-left transition-all"
              style={{
                border: '1px solid',
                borderColor: sel?.code === c.code ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.1)',
              }}
            >
              <div className="text-base font-semibold">{c.label}</div>
              <div className="text-xs text-white/60 mt-1">{c.hint}</div>
            </button>
          ))}
        </div>

        {/* アクション（枠なしで右寄せ） */}
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={onProceed}
            className="btn btn-blue glow-shadow-blue h-12 px-6 rounded-2xl"
            disabled={!sel}
          >
            {sel ? '確認へ進む' : '選択してください'}
          </button>
        </div>
      </main>
    </>
  )
}
