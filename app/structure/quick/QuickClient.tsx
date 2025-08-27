// app/structure/quick/confirm/ConfirmClient.tsx
'use client'

import { useEffect, useState } from 'react'

type PendingV1 = {
  choiceText: string
  code: 'E' | 'V' | 'Λ' | 'Ǝ'
  result: { type: string; weight: number; comment: string; advice?: string }
  _meta?: { ts: number; v: 'quick-v1' }
}

export default function ConfirmClient() {
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

  const handleSave = async () => {
    if (!pending || saving) return
    setSaving(true); setMsg(null)

    try {
      // 👇 APIが期待しているフィールド名に合わせる
      const res = await fetch('/api/structure/quick/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pending.code,                     // 必須
          type_label: pending.result.type,        // ← ここが重要（result.type → type_label）
          comment: pending.result.comment,        // 任意
          // scores は任意。未指定なら API 側で code に1点入る仕様
        }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string }
      if (!json.ok) throw new Error(json.error || 'SAVE_FAILED')

      setMsg('保存しました。')
      sessionStorage.removeItem('structure_quick_pending')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setMsg('保存に失敗：' + message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 表示部分（必要に応じて） */}
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
