'use client'
import { useState } from 'react'

type Choice = 'E' | 'V' | 'Λ' | 'Ǝ'
type Score = { E: number; V: number; Λ: number; Ǝ: number }

const QUESTION = 'Q. 今日の自分に一番近いのは？'
const OPTIONS: { key: Choice; label: string }[] = [
  { key: 'E', label: '直感で動く（E）' },
  { key: 'V', label: '可能性を広げたい（V）' },
  { key: 'Λ', label: '慎重に選びたい（Λ）' },
  { key: 'Ǝ', label: '一度立ち止まって観察（Ǝ）' },
]

const toScore = (c: Choice): Score =>
  ({ E: 0, V: 0, Λ: 0, Ǝ: 0, [c]: 1 } as Score)

export default function DailyQuestionPage() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState<string | null>(null)
  const [advice, setAdvice] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const theme: 'work' | 'love' | 'future' | 'self' = 'work' // まずは固定（後で連動）

  async function handleDiagnose() {
    if (!choice) return
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/daily/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'guest',
          theme,
          structure_score: toScore(choice),
          choice,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.detail || 'diagnose error')
      setComment(j.comment ?? '')
      setAdvice(j.advice ?? '')
    } catch (e:any) {
      setMsg(`診断に失敗：${e.message ?? e}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!choice) return
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/daily/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'guest',
          theme,
          choice,
          structure_score: toScore(choice),
          comment,
          advice,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.detail || 'save error')
      setMsg('✅ 保存しました')
    } catch (e:any) {
      setMsg(`保存に失敗：${e.message ?? e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Daily 診断</h1>
      <p className="text-sm text-gray-600">テーマ：{theme}</p>

      <div className="space-y-3">
        <p className="font-medium">{QUESTION}</p>
        <div className="grid grid-cols-1 gap-2">
          {OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setChoice(o.key)}
              className={`rounded-lg border px-4 py-2 text-left hover:opacity-90 ${
                choice === o.key ? 'border-black' : 'border-gray-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDiagnose}
          disabled={!choice || loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-40"
        >
          {loading ? '診断中…' : '診断する'}
        </button>
        <button
          onClick={handleSave}
          disabled={!choice || !comment || loading}
          className="rounded-md border px-4 py-2 disabled:opacity-40"
        >
          保存する
        </button>
      </div>

      {comment && (
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold">ルネアからのメッセージ</h2>
          <p className="whitespace-pre-wrap">{comment}</p>
          {advice && (
            <>
              <h3 className="font-semibold mt-2">一言アドバイス</h3>
              <p>{advice}</p>
            </>
          )}
        </div>
      )}

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </div>
  )
}

