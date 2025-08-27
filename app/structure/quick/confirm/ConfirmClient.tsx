// app/structure/quick/confirm/ConfirmClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/** QuickClient が sessionStorage に入れている形（v1） */
type PendingV1 = {
  choiceText: string
  code: 'E' | 'V' | 'Λ' | 'Ǝ'
  result: { type: string; weight: number; comment: string; advice?: string }
  _meta?: { ts: number; v: 'quick-v1' }
}

/** ゲストID（ローカル固定）を生成・保持 */
function getGuestId(): string {
  // SSR安全ガード
  if (typeof window === 'undefined') return 'guest-server'
  try {
    let id = localStorage.getItem('guest_id')
    if (!id) {
      const gen =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `g_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
      id = gen
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
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (raw) setPending(JSON.parse(raw) as PendingV1)
    } catch {
      /* noop */
    }
  }, [])

  // app/structure/quick/confirm/ConfirmClient.tsx
// …省略…
import { useRouter } from 'next/navigation'
// …省略…

const handleSave = async () => {
  if (!pending || saving) return
  setSaving(true); setMsg(null)

  try {
    const res = await fetch('/api/structure/quick/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: pending.code,
        type_label: pending.result.type,
        comment: pending.result.comment,
        user_id: getGuestId(),
      }),
    })
    const json = (await res.json()) as { ok: boolean; error?: string; record?: { id: number } }
    if (!json.ok || !json.record?.id) throw new Error(json.error || 'SAVE_FAILED')

    // ✅ 結果ページへ遷移（保存IDを渡す）
    router.push(`/structure/quick/result?rid=${json.record.id}`)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    setMsg('保存に失敗：' + message)
  } finally {
    setSaving(false)
  }
}


  return (
    <div className="space-y-4">
      {/* あなたの選択 */}
      <div className="rounded-xl bg-white/5 p-4 border border-white/10">
        <div className="text-sm text-white/60">あなたの選択</div>
        <div className="mt-1">{pending?.choiceText ?? '—'}</div>
        <div className="mt-2 text-xs text-white/40">コード: {pending?.code ?? '—'}</div>
      </div>

      {/* 判定タイプ */}
      <div className="rounded-xl bg-white/5 p-4 border border-white/10">
        <div className="text-sm text-white/60">判定タイプ</div>
        <div className="mt-1 text-xl tracking-widest">{pending?.result.type ?? '—'}</div>
      </div>

      {/* コメント */}
      <div className="rounded-xl bg-white/5 p-4 border border-white/10">
        <div className="text-sm text-white/60">コメント</div>
        <div className="mt-1">{pending?.result.comment ?? '—'}</div>
      </div>

      {msg && (
        <div className="rounded-lg bg-white/10 border border-white/20 p-3 text-sm">{msg}</div>
      )}

      <div className="flex gap-3">
        {/* 履歴依存の戻りをやめ、明示的に quick へ戻す */}
        <button
          className="px-4 py-3 rounded-xl bg-white/10"
          onClick={() => router.push('/structure/quick')}
        >
          やり直す
        </button>
        <button
          className="px-5 py-3 rounded-xl bg-white text-black disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中…' : '保存する'}
        </button>
      </div>
    </div>
  )
}
