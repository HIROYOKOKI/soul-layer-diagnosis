'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type QuickResultType = 'EVΛƎ型' | 'EΛVƎ型' | 'ΛƎEΛ型' | '中立'
type Result = { type: QuickResultType; weight: number; comment: string; advice: string }

export default function ConfirmClient() {
  const router = useRouter()
  const [pending, setPending] = useState<Result | null>(null)
  const [revealed, setRevealed] = useState(false) // ← 確認ボタン後に結果を表示
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (raw) setPending(JSON.parse(raw) as Result)
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
      const data = await r.json() as { id: string }
      sessionStorage.removeItem('structure_quick_pending')
      router.push(`/structure/quick/result?id=${encodeURIComponent(data.id)}`)
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
        <div className="h-8">
          <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={32} priority className="h-8 w-auto"/>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 rounded-xl p-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          {!pending ? (
            <div className="text-center">
              <p className="text-red-400">クイック判定データがありません。</p>
              <button className="btn mt-4" onPointerUp={() => router.push('/structure/quick')}>クイック判定に戻る</button>
            </div>
          ) : !revealed ? (
            <>
              <h2 className="text-center text-lg font-bold mb-3">内容の確認</h2>
              <p className="text-center text-white/70 text-sm mb-5">
                これから結果を表示します。内容に問題なければ、その後「保存する」を押してください。
              </p>
              <div className="grid gap-3">
                <button className="btn btn-primary btn-pressable btn-ripple touch-manipulation" onPointerUp={() => setRevealed(true)}>
                  結果を表示
                </button>
                <button className="btn btn-pressable btn-ripple touch-manipulation" onPointerUp={() => router.push('/structure/quick')}>
                  やり直す
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-center text-lg font-bold mb-1">{pending.type}（weight {pending.weight.toFixed(1)}）</h2>
              <p className="text-center text-white/60 text-sm mb-4">{pending.comment}</p>
              <div className="rounded-lg border border-white/10 p-4 bg-black/30 mb-4">
                <p className="text-sm"><span className="text-white/60">今日の一手：</span>{pending.advice}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-primary btn-pressable btn-ripple touch-manipulation" disabled={saving} onPointerUp={onSave}>
                  {saving ? '保存中…' : '保存する'}
                </button>
                <button className="btn btn-pressable btn-ripple touch-manipulation" onPointerUp={() => setRevealed(false)}>
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
