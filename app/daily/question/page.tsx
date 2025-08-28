// app/daily/question/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { luneaSpeech, type StructureCode } from '@/app/_data/characters/lunea'

type Choice = { code: StructureCode; label: string; hint?: string }
type Pending = { sel: Choice }

// フォールバック（/api/daily/question が未実装でも動くように）
const DEFAULT_CHOICES: Choice[] = [
  { code: 'E', label: '勢いで踏み出す', hint: '衝動・情熱' },
  { code: 'V', label: '可能性を広げる', hint: '夢・直感' },
  { code: 'Λ', label: '一度立ち止まり選ぶ', hint: '選択・臨界' },
  { code: 'Ǝ', label: '観測し整える', hint: '静けさ・記憶' },
]

export default function DailyQuestionPage() {
  const router = useRouter()
  const [question, setQuestion] = useState<string>('今日のあなたに一番近いのは？')
  const [choices, setChoices] = useState<Choice[]>([])
  const [sel, setSel] = useState<Choice | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 初期化：サーバ質問取得 or フォールバック、前回の選択復元
  useEffect(() => {
    let ignore = false

    async function init() {
      setLoading(true)
      setError(null)
      try {
        // 1) 進行中データの復元
        const pending = sessionStorage.getItem('daily_pending')
        if (pending) {
          try {
            const parsed = JSON.parse(pending) as Pending
            if (parsed?.sel) setSel(parsed.sel)
          } catch {}
        }

        // 2) サーバから質問取得（任意実装）
        const res = await fetch('/api/daily/question', { method: 'GET' })
        if (!ignore && res.ok) {
          const data = await res.json().catch(() => null)
          // 期待形: { question: string, choices: Choice[] }
          if (data?.choices?.length) {
            setQuestion(data.question ?? question)
            setChoices(data.choices as Choice[])
          } else {
            setChoices(DEFAULT_CHOICES)
          }
        } else {
          // APIなし or 失敗 → フォールバック
          setChoices(DEFAULT_CHOICES)
        }
      } catch {
        setChoices(DEFAULT_CHOICES)
        setError('ネットワークエラーによりローカル問題を使用します')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    init()
    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onProceed = () => {
    if (!sel) {
      alert('どれか1つ選んでください')
      return
    }
    const data: Pending = { sel }
    sessionStorage.setItem('daily_pending', JSON.stringify(data))
    router.push('/daily/confirm')
  }

  return (
    <div className="container-narrow py-6 sm:py-8">
      {/* タイトル */}
      <header className="mb-4">
        <h1 className="h1">デイリー診断</h1>
        {/* ✅ ユーザー要望: 質問ページでルネアのセリフを常に表示 */}
        <p className="sub mt-1">{luneaSpeech('beforeQuestion')}</p>
      </header>

      {/* 質問文 */}
      <section className="glass rounded-2xl p-4 sm:p-6 border border-white/10 shadow-[var(--shadow-card)]">
        <h2 className="h2">{question}</h2>
        {error && <p className="text-xs text-white/60 mt-1">{error}</p>}

        {/* 選択肢 */}
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

        {/* アクション */}
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={onProceed}
            className="btn btn-blue glow-shadow-blue tap"
            style={{ minWidth: 140 }}
            disabled={!sel}
          >
            {sel ? '確認へ進む' : '選択してください'}
          </button>
        </div>
      </section>
    </div>
  )
}
