// app/profile/_hooks/useProfileDiagnose.ts
"use client"

export type ProfilePayload = {
  name: string
  birthday: string      // YYYY-MM-DD
  blood: string
  gender: string
  preference?: string | null
  theme?: string | null
}

type DiagnoseOk  = { ok: true;  result: { luneaLines: string[] } }
type DiagnoseErr = { ok: false; error: string }
type DiagnoseResp = DiagnoseOk | DiagnoseErr

export function useProfileDiagnose() {
  // フックは“診断して結果を返すだけ”。画面遷移は呼び出し側で行う。
  return async function diagnose(payload: ProfilePayload): Promise<{ luneaLines: string[] }> {
    const res = await fetch("/api/profile/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 本番DB汚し防止：theme が未指定なら dev を付与
      body: JSON.stringify({ theme: "dev", ...payload }),
      cache: "no-store",
    })

    if (!res.ok) throw new Error(`HTTP_${res.status}`)

    const json = (await res.json()) as DiagnoseResp
    if ("ok" in json && json.ok && json.result) {
      return { luneaLines: json.result.luneaLines }
    }
    throw new Error((json as DiagnoseErr)?.error || "profile_diagnose_failed")
  }
}
