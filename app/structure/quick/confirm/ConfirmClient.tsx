// app/structure/quick/confirm/ConfirmClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
type Choice = 'A'|'B'|'C'|'D'
type StructureLetter = 'E'|'V'|'Λ'|'Ǝ'

type Pending = {
  type: QuickResultType
  weight: number
  comment: string
  advice: string
  choice: Choice
  choiceText: string
  structure: StructureLetter
}

export default function ConfirmClient() {
  const router = useRouter()
  const [pending, setPending] = useState<Pending | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (raw) setPending(JSON.parse(raw) as Pending)
    } catch {}
  }, [])

  async function onSave() {
    if (!pending || saving) return
    setSaving(true); setError(null)
    try {
      const r = await fetch('/api/structure/quick/save', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ type: pending.type, weight: pending.weight, comment: pending.comment }),
      })
      if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`)
      const { id } = (await r.json()) as { id: string }
      try { sessionStorage.removeItem('structure_quick_pending') } catch {}
      router.push(`/structure/quick/result?id=${encodeURIComponent(id)}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown'
      setError(`保存に失敗しました（${msg}）`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto" />
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/80 border border-white/10 rounded-xl p-6">
          {!pending ? (
            <div className="text-center">
              <p className="text-red-400">データが見つかりません。最初からやり直してください。</p>
              <button className="btn mt-4" onPointerUp={() => router.push('/structure/quick')}>クイック判定へ戻る</button>
            </div>
          ) : !revealed ? (
            <>
              <h2 className="text-center text-lg font-bold mb-3">内容の確認</h2>

              {/* ★★★ ここが“選択内容の表示” ★★★ */}
              <div className="rounded-lg border border-white/15 bg-black/40 p-4 mb-5">
                <p className="text-xs text-white/60 mb-1">あなたの選択</p>
                <p className="text-base font-medium">{pending.choiceText}</p>
              </div>

              <p className="text-center text-white/70 text-sm mb-5">
                これから結果を表示します。内容に問題なければ、その後「保存する」を押してください。
              </p>

              <div className="grid gap-3">
                <button className="btn btn-primary btn-pressable" onPointerUp={() => setRevealed(true)}>
                  結果を表示
                </button>
                <button className="btn btn-pressable" onPointerUp={() => router.push('/structure/quick')}>
                  やり直す
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-center text-lg font-bold mb-1">
                {pending.type}（weight {pending.weight.toFixed(1)}）
              </h2>
              <p className="text-center text-white/60 text-sm mb-4">{pending.comment}</p>

              <div className="rounded-lg border border-white/10 p-4 bg-black/30 mb-4">
                <p className="text-sm"><span className="text-white/60">今日の一手：</span>{pending.advice}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-primary btn-pressable" disabled={saving} onPointerUp={onSave}>
                  {saving ? '保存中…' : '保存する'}
                </button>
                <button className="btn btn-pressable" onPointerUp={() => setRevealed(false)}>
                  戻る
                </button>
              </div>

              {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
            </>
          )}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">© 2025 Soul Layer Log</footer>
    </div>
  )
}
