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
}
