'use client'

import { useRouter } from 'next/navigation'

export type ProfilePayload = {
  name: string
  birthday: string      // YYYY-MM-DD
  blood: string
  gender: string
  preference?: string | null
}

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
    if (!json?.ok || !json.result) throw new Error(json?.error || '診断に失敗しました')

    sessionStorage.setItem('lunea_profile_result', JSON.stringify(json.result.luneaLines))
    router.push('/profile/result')
  }
}
