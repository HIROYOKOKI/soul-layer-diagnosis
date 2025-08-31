// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProfileDiagnose, type ProfilePayload } from "../_hooks/useProfileDiagnose"

type Pending = ProfilePayload

export default function ConfirmClient() {
  const router = useRouter()
  const diagnose = useProfileDiagnose()

  const [p, setP] = useState<Pending | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 入力一時保存を読み込み。無ければ入力画面へ戻す
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("profile_pending")
      if (!raw) {
        router.replace("/profile")
        return
      }
      setP(JSON.parse(raw) as Pending)
    } catch {
      router.replace("/profile")
    }
  }, [router])

  async function handleConfirm() {
    if (!p) return
    try {
      setLoading(true)
      setError(null)

      // 1) 診断（共通フック経由）
      const res = await diagnose(p) // => { luneaLines: string[] }

      // 2) 結果をセッションへ保存（結果ページで使用）
      sessionStorage.removeItem("profile_pending")
      sessionStorage.setItem(
        "profile_result_luneaLines",
        JSON.stringify(res.luneaLines)
      )

      // 3) 保存API（存在しない/失敗でも遷移は続行）
      try {
        const save = await fetch("/api/profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ luneaLines: res.luneaLines, theme: "dev" }),
          cache: "no-store",
        })
        if (!save.ok) {
          // 失敗はUI表示のみ（/mypage 反映が遅れる可能性あり）
          setError(`save_failed_${save.status}`)
        }
      } catch {
        setError("save_failed_network")
      }

      // 4) 結果ページへ
      router.push("/profile/result")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  if (!p) return null

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">入力内容の確認</h1>

      <ul className="text-sm grid gap-1 opacity-90">
        <li>名前：{p.name}</li>
        <li>誕生日：{p.birthday}</li>
        <li>血液型：{p.blood}</li>
        <li>性別：{p.gender}</li>
        {p.preference ? <li>恋愛対象：{p.preference}</li> : null}
      </ul>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.push("/profile")}
          className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
        >
          修正する
        </button>
        <button
          disabled={loading}
          onClick={handleConfirm}
          className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10"
        >
          {loading ? "診断中…" : "この内容で診断"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">エラー：{error}</p>}
    </div>
  )
}
