// app/structure/quick/confirm/ConfirmClient.tsx
'use client'
import { useEffect, useState } from 'react'

type Pending = {
  choiceLabel: string      // 「B. 目的と…」など表示用
  code: 'E'|'V'|'Λ'|'Ǝ'
  type_label: string       // 例: 'ΛEƎV型'
  comment: string
  scores?: { E?:number; V?:number; 'Λ'?:number; 'Ǝ'?:number } // 任意
}

export default function ConfirmClient() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      if (raw) setPending(JSON.parse(raw))
    } catch {}
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
          scores: pending.scores, // 無ければAPI側で code に1点
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'SAVE_FAILED')
      setMsg('保存しました。')
      sessionStorage.removeItem('structure_quick_pending')
    } catch (e: any) {
      setMsg('保存に失敗：' + (e?.message ?? 'unknown'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 選択内容の表示（スクショのUIに対応） */}
      <div className="rounded-xl bg-white/5 p-4 border border-white/10">
        <div className="text-sm text-white/60">あなたの選択</div>
        <div className="mt-1">{pending?.choiceLabel ?? '—'}</div>
        <div className="mt-2 text-xs text-white/40">コード: {pending?.code ?? '—'}</div>
      </div>

      <div className="rounded-xl bg-white/5 p-4 border border-white/10">
        <div className="text-sm text-white/60">判定タイプ</div>
        <div className="mt-1 text-xl tracking-widest">{pending?.type_label ?? '—'}</div>
      </div>

      <div className="rounded-xl bg-white/5 p-4 border border-white/10">
        <div className="text-sm text-white/60">コメント</div>
        <div className="mt-1">{pending?.comment ?? '—'}</div>
      </div>

      {msg && (
        <div className="rounded-lg bg-white/10 border border-white/20 p-3 text-sm">{msg}</div>
      )}

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
    </div>
  )
}
