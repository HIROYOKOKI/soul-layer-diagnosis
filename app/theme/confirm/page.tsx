// app/theme/confirm/page.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export default function ThemeConfirmPage() {
  const router = useRouter()
  const qs = useSearchParams()
  // ?to=dev|prod|free など、テーマ名をクエリでもらう想定（なければ "dev"）
  const nextTheme = (qs.get("to") || "dev").trim()
  // 適用後の遷移先（指定なければ /mypage）
  const redirect = qs.get("redirect") || "/mypage"

  const handleApply = useCallback(() => {
    try {
      // ここでテーマを保存（アプリで参照しているキー名に合わせてください）
      localStorage.setItem("ev-theme", nextTheme)
      // 必要なら sessionStorage や cookie もここで
      // 例: document.cookie = `ev-theme=${nextTheme}; path=/; max-age=31536000`

      // 反映のための画面遷移
      router.push(redirect)
      router.refresh()
    } catch {
      // 失敗時はテーマ選択画面へ戻す
      router.push("/theme")
    }
  }, [nextTheme, redirect, router])

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-3">テーマを変更しますか？</h1>
      <p className="text-sm text-white/70 mb-8">
        テーマを変更すると、保存済みの一部履歴がリセットされる場合があります。
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 bg-neutral-700/60 hover:bg-neutral-600"
        >
          いいえ（戻る）
        </button>
        <button
          onClick={handleApply}
          className="rounded-lg px-4 py-2 bg-sky-600 hover:bg-sky-500"
        >
          はい、変更する
        </button>
      </div>

      <div className="mt-6 text-xs text-white/50">
        適用テーマ：<span className="font-mono">{nextTheme}</span> ／ 遷移先：{" "}
        <span className="font-mono">{redirect}</span>
      </div>
    </div>
  )
}
