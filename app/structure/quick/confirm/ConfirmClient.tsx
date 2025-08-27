// app/structure/quick/confirm/ConfirmClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'
type PendingV1 = {
  choiceText: string
  code: EV
  result: { type: string; weight: number; comment: string; advice?: string }
  _meta?: { ts: number; v: 'quick-v1' }
}

function getGuestId(): string {
  if (typeof window === 'undefined') return 'guest-server'
  try {
    let id = localStorage.getItem('guest_id')
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `g_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`
      localStorage.setItem('guest_id', id)
    }
    return id
  } catch {
    return 'guest-fallback'
  }
}

export default function ConfirmClient() {
  const router = useRouter()
  const [pending, setPending] = useState<PendingV1 | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    // Quick で保存した内容を復元
    const raw = sessionStorage.getItem('structure_quick_pending')
    // デバッグ表示（必要なければ消してOK）
    console.debug('[Confirm] raw pending =', raw)
    if (!raw) {
      // 直リンク・別タブなどでセッションが無い時はQuickへ戻す
      router.replace('/structure/quick')
      return
    }
    try {
      setPending(JSON.parse(raw) as PendingV1)
    } catch {
      router.replace('/structure/quick')
    }
  }, [router])

  const handleSave = async () => {
    if (!pending || saving) return
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/structure/quick/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pending.code,                  // 必須
          type_label: pending.result.type,     // 必須（API仕様）
          comment: pending.result.comment,     // 任意
          user_id: getGuestId(),               // 任意
        }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string; record?: { id: number } }
      if (!json.ok) throw new Error(json.error || 'SAVE_FAILED')

      sessionStorage.removeItem('structure_quick_pending')
      if (json.record?.id) router.push(`/structure/quick/result?rid=${json.record.id}`)
      else setMsg('保存しました（IDなし）')
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setMsg('保存に失敗：' + m)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8">
      <h1 className="text-xl font-bold mb-4">診断結果の確認</h1>

      <div className="grid gap-4 max-w-md">
        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="text-sm text-white/60">あなたの選択</div>
          <div className="mt-1">{pending?.choiceText ?? '—'}</div>
          <div className="mt-2 text-xs text-white/40">コード: {pending?.code ?? '—'}</div>
        </div>

        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="text-sm text-white/60">判定タイプ</div>
          <div className="mt-1 text-xl tracking-widest">{pending?.result.type ?? '—'}</div>
        </div>

        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="text-sm text-white/60">コメント</div>
          <div className="mt-1">{pending?.result.comment ?? '—'}</div>
        </div>

        {msg && <div className="rounded-lg bg-white/10 border border-white/20 p-3 text-sm">{msg}</div>}

        <div className="flex gap-3">
          <button className="px-4 py-3 rounded-xl bg-white/10" onClick={() => router.push('/structure/quick')}>
            やり直す
          </button>
          <button
            className="px-5 py-3 rounded-xl bg-white text-black disabled:opacity-50"
            onClick={handleSave}
            disabled={saving || !pending}
          >
            {saving ? '保存中…' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
