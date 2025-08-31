<<<<<<< HEAD
// app/profile/_hooks/useProfileDiagnose.ts
"use client"

export type ProfilePayload = {
  name: string
  birthday: string
=======
'use client'

import { useRouter } from 'next/navigation'

export type ProfilePayload = {
  name: string
  birthday: string      // YYYY-MM-DD
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)
  blood: string
  gender: string
  preference?: string | null
}

<<<<<<< HEAD
type DiagnoseOk = { ok: true; result: { luneaLines: string[] } }
type DiagnoseErr = { ok: false; error: string }
type DiagnoseResp = DiagnoseOk | DiagnoseErr

export function useProfileDiagnose() {
  return async function diagnose(payload: ProfilePayload): Promise<{ luneaLines: string[] }> {
    const res = await fetch("/api/profile/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as DiagnoseResp
    if ("ok" in json && json.ok) return json.result
    throw new Error("profile_diagnose_failed")
=======
type LuneaLine = { type: string; label: string; text: string }
type DiagnoseResp = { ok: boolean; result?: { luneaLines: LuneaLine[] }; error?: string }

export function useProfileDiagnose() {
  const router = useRouter()
  return async function onSubmit(payload: ProfilePayload) {
    const res = await fetch('/api/profile/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: DiagnoseResp = await res.json()
    if (!json?.ok || !json.result) {
      throw new Error(json?.error || '診断に失敗しました')
    }
    // ルネア吹き出し用の配列を保存 → 結果へ
    sessionStorage.setItem('lunea_profile_result', JSON.stringify(json.result.luneaLines))
    router.push('/profile/result')
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)
  }
}
