app/profile/confirm/page.tsx — 

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Pending = { name: string; birthday: string; blood: string; gender: string; preference: string }
type DiagnoseResp = { ok: true; fortune: string; personality: string; ideal_partner: string } | { ok: false; error: string }
type SaveResp = { ok: true; id: string } | { ok: false; error: string }

export default function ProfileConfirmPage() {
const router = useRouter()
const [p, setP] = useState<Pending | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
try { const raw = sessionStorage.getItem('profile_pending'); if (raw) setP(JSON.parse(raw) as Pending) } catch {}
}, [])

const goBack = () => router.push('/profile')

const runDiagnose = async () => {
if (!p) return
setLoading(true); setError(null)
try {
const res1 = await fetch('/api/profile/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
const j1 = await res1.json() as DiagnoseResp
if (!j1.ok) throw new Error(j1.error)

const res2 = await fetch('/api/profile/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, ...j1 }) })
const j2 = await res2.json() as SaveResp
if (!j2.ok) throw new Error(j2.error)

sessionStorage.removeItem('profile_pending')
router.push(`/profile/result?id=${encodeURIComponent(j2.id)}`)
} catch (e) { setError(e instanceof Error ? e.message : String(e)) }
finally { setLoading(false) }
}

return (
<div className="mx-auto max-w-md grid gap-4 p-4">
<h1 className="text-lg font-bold">入力内容の確認</h1>
{!p ? (
<div className="text-sm opacity-75">入力内容が見つかりません。<a href="/profile" className="underline">プロフィールに戻る</a></div>
) : (
<>
<ul className="text-sm grid gap-1">
<li>名前：{p.name}</li>
<li>生年月日：{p.birthday}</li>
<li>血液型：{p.blood}</li>
<li>性別：{p.gender}</li>
<li>恋愛対象：{p.preference}</li>
</ul>
{error && <p className="text-red-400 text-sm">エラー：{error}</p>}
<div className="flex gap-8">
<button onClick={goBack} className="underline">修正する</button>
<button onClick={runDiagnose} disabled={loading} className="rounded bg-white/10 px-4 py-2 disabled:opacity-50">{loading ? '診断中…' : '診断する'}</button>
</div>
</>
)}
</div>
)
}
