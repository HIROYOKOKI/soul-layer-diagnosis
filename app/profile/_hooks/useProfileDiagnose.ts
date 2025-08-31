// app/profile/_hooks/useProfileDiagnose.ts
"use client"

export type ProfilePayload = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string | null
}

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
  }
}
