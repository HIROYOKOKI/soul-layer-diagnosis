// app/structure/quick/result/result-client.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type EV = 'E'|'V'|'Λ'|'Ǝ'
type PendingV1 = {
  choiceText: string
  code: EV
  result: { type:string; weight:number; comment:string; advice?:string }
  _meta?: { ts:number; v:'quick-v1' }
}

function getGuestId(): string {
  if (typeof window === 'undefined') return 'guest-server'
  try {
    let id = localStorage.getItem('guest_id')
    if (!id) {
      id = crypto.randomUUID?.() ?? `g_${Math.random().toString(36).slice(2,8)}${Date.now().toString(36)}`
      localStorage.setItem('guest_id', id)
    }
    return id
  } catch { return 'guest-fallback' }
}

export default function ResultClient() {
  const router = useRouter()
  const [p, setP] = useState<PendingV1 | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('structure_quick_pending')
    if (!raw) { router.replace('/structure/quick'); return }
    try { setP(JSON.parse(raw) as PendingV1) } catch { router.replace('/structure/quick') }
  }, [router])

  const save = async () => {
    if (!p || saving) return
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/structure/quick/save', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          code: p.code,
          type_label: p.result.type,
          comment: p.result.comment,
          user_id: getGuestId(),
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'SAVE_FAILED')

      // ✅ 保存成功後にテーマ選択ページへ
      sessionStorage.removeItem('structure_quick_pending')
      router.push('/theme')
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e)
      setMsg('保存に失敗：' + m)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-5 py-8">
      <h1 className="text-xl font-bold mb-4">診断結果</h1>

      <div className="grid gap-4 max-w-md">
        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="text-sm text-white/60">判定タイプ</div>
          <div className="mt-1 text-2xl tracking-widest">{p?.result.type ?? '—'}</div>
        </div>

        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="text-sm text-white/60">コメント</div>
          <div className="mt-1">{p?.result.comment ?? '—'}</div>
        </div>

        {msg && <div className="rounded-lg bg-white/10 border border-white/20 p-3 text-sm">{msg}</div>}

        <div className="flex gap-3">
          <button className="px-4 py-3 rounded-xl bg-white/10" onClick={() => router.push('/structure/quick/confirm')}>
            戻って修正
          </button>
          <button
            className="px-5 py-3 rounded-xl bg-white text-black disabled:opacity-50"
            onClick={save}
            disabled={!p || saving}
          >
            {saving ? '保存中…' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
