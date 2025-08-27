// app/structure/quick/confirm/ConfirmClient.tsx
'use client'
import { useEffect, useState } from 'react'

type Pending = {
  choiceLabel: string
  code: 'E'|'V'|'Λ'|'Ǝ'
  type_label: string
  comment: string
  scores?: { E?:number; V?:number; 'Λ'?:number; 'Ǝ'?:number }
}

export default function ConfirmClient() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (raw) setPending(JSON.parse(raw) as Pending)
    } catch {
      /* noop */
    }
  }, [])

  const handleSave = async () => {
    if (!pending) return
    setSaving(true); setMsg(null)

    try {
      const res = await fetch('/api/structure/quick/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pending.code,
          type_label: pending.type_label,
          comment: pending.comment,
          scores: pending.scores,
           user_id: getGuestId(),
        }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string }
      if (!json.ok) throw new Error(json.error || 'SAVE_FAILED')
      setMsg('保存しました。')
      sessionStorage.removeItem('structure_quick_pending')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setMsg('保存に失敗：' + msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* …UIはそのまま… */}
      <div className="flex gap-3">
        <button className="px-4 py-3 rounded-xl bg-white/10" onClick={() => history.back()}>
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
      {msg && <div className="rounded-lg bg-white/10 border border-white/20 p-3 text-sm">{msg}</div>}
    </div>
  )
}
