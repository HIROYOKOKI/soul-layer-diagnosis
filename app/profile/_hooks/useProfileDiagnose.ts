// app/profile/_hooks/useProfileDiagnose.ts
"use client"

import { useCallback, useState } from "react"

export type ProfileInput = {
  name: string                // 必須（ニックネーム可）
  birthday: string            // 必須 "YYYY-MM-DD"
  birthTime?: string | null   // 任意 "HH:mm"（わからなければ null）
  birthPlace?: string | null  // 任意 例: "Tokyo, JP"
  sex?: "Male" | "Female" | "Other" | null         // 任意（性別）
  preference?: "Male" | "Female" | "Both" | "None" | "Other" | null // 任意（恋愛対象）
  theme?: "dev" | "prod"      // 既存運用に合わせて（デフォルト dev）
}

export type DiagnoseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | {
      status: "done"
      result: {
        // APIの戻りに合わせて適宜
        luneaLines: string[]
        detail?: Record<string, unknown>
      }
    }

export function useProfileDiagnose() {
  const [state, setState] = useState<DiagnoseState>({ status: "idle" })

  const diagnose = useCallback(async (input: ProfileInput) => {
    setState({ status: "loading" })

    try {
      // 任意項目は null に正規化（空文字が来てもOKにする）
      const payload = {
        name: input.name,
        birthday: input.birthday,
        birthTime: input.birthTime ? input.birthTime : null,
        birthPlace: input.birthPlace ? input.birthPlace : null,
        sex: input.sex ?? null,
        preference: input.preference ?? null,
        theme: input.theme ?? "dev",
      }

      const res = await fetch("/api/profile/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const t = await res.text()
        throw new Error(`HTTP ${res.status} ${t}`)
      }

      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error ?? "unknown_error")

      setState({ status: "done", result: json.result })
      return json.result
    } catch (e: any) {
      setState({ status: "error", error: e?.message ?? String(e) })
      return null
    }
  }, [])

  return { state, diagnose }
}
