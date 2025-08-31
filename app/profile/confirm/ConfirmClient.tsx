<<<<<<< HEAD
// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"                      // ← 追加
import { useProfileDiagnose, type ProfilePayload } from "../_hooks/useProfileDiagnose"

export default function ConfirmClient() {
  const diagnose = useProfileDiagnose()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(payload: ProfilePayload) {
    try {
      setLoading(true)
      setError(null)

      // 1) 診断
      const res = await diagnose(payload)                      // { luneaLines: string[] }

      // 2) 結果をセッションへ
      sessionStorage.setItem("profile_result_luneaLines", JSON.stringify(res.luneaLines))

      // 3) 保存（待ってから遷移すると /mypage 反映が確実）
      const save = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ luneaLines: res.luneaLines }),
        cache: "no-store",
      })
      if (!save.ok) throw new Error(`save_failed_${save.status}`)

      // 4) 結果ページへ
      router.push("/profile/result")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // ・・・UIはそのまま（ボタンで onSubmit(...) を呼ぶ）
=======
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
type Payload = { name:string; birthday:string; blood:string; gender:string; preference?:string|null }
export default function ConfirmClient() {
  const router = useRouter()
  const [p, setP] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  useEffect(() => {
    const raw = sessionStorage.getItem('profile_pending')
    if (!raw) { router.replace('/profile'); return }
    setP(JSON.parse(raw) as Payload)
  }, [router])
  async function handleConfirm() {
    if (!p) return
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/profile/diagnose', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(p)
      })
      const j = await res.json()
      if (!j?.ok) throw new Error(j?.error || '診断に失敗しました')
      sessionStorage.removeItem('profile_pending')
      sessionStorage.setItem('lunea_profile_result', JSON.stringify(j.result.luneaLines))
      router.push('/profile/result')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }
  if (!p) return null
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">入力内容の確認</h1>
      <ul className="text-sm grid gap-1 opacity-90">
        <li>名前：{p.name}</li><li>誕生日：{p.birthday}</li>
        <li>血液型：{p.blood}</li><li>性別：{p.gender}</li>
        {p.preference ? <li>恋愛対象：{p.preference}</li> : null}
      </ul>
      <div className="flex gap-3 pt-2">
        <button onClick={() => router.push('/profile')} className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">修正する</button>
        <button disabled={loading} onClick={handleConfirm} className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">
          {loading ? '診断中…' : 'この内容で診断'}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">エラー：{error}</p>}
    </div>
  )
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)
}
